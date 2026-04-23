from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app import crud
from app.schemas.institute import InstituteCreate, InstituteUpdate, InstituteOut
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateOut
from app.schemas.poll import PollCreate, PollUpdate, PollOut
from app.schemas.aggregation import ScraperRunOut
from app.models.scraper_run import ScraperRun
from app.models.aggregation_cache import AggregationCache
from app.services.aggregation import refresh_aggregation_cache
from app.config import settings
from datetime import datetime, timezone

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin_key(x_admin_key: str = Header(...)):
    if x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin key")


# --- Institutes ---

@router.post("/institutes", response_model=InstituteOut, dependencies=[Depends(_require_admin_key)])
async def create_institute(data: InstituteCreate, db: AsyncSession = Depends(get_db)):
    return await crud.institute.create(db, data)


@router.put("/institutes/{institute_id}", response_model=InstituteOut, dependencies=[Depends(_require_admin_key)])
async def update_institute(
    institute_id: int, data: InstituteUpdate, db: AsyncSession = Depends(get_db)
):
    inst = await crud.institute.update_institute(db, institute_id, data)
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")
    return inst


@router.delete("/institutes/{institute_id}", status_code=204, dependencies=[Depends(_require_admin_key)])
async def delete_institute(institute_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.institute import Institute
    inst = await db.get(Institute, institute_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")
    await db.delete(inst)
    await db.commit()


# --- Candidates ---

@router.post("/candidates", response_model=CandidateOut, dependencies=[Depends(_require_admin_key)])
async def create_candidate(data: CandidateCreate, db: AsyncSession = Depends(get_db)):
    return await crud.candidate.create(db, data)


@router.put("/candidates/{candidate_id}", response_model=CandidateOut, dependencies=[Depends(_require_admin_key)])
async def update_candidate(
    candidate_id: int, data: CandidateUpdate, db: AsyncSession = Depends(get_db)
):
    cand = await crud.candidate.update_candidate(db, candidate_id, data)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand


# --- Polls ---

@router.post("/polls", response_model=PollOut, dependencies=[Depends(_require_admin_key)])
async def create_poll(data: PollCreate, db: AsyncSession = Depends(get_db)):
    poll = await crud.poll.create(db, data)
    # Trigger aggregation cache refresh for this election_type+round
    await refresh_aggregation_cache(db, poll.election_type, poll.round)
    return PollOut(
        **{c: getattr(poll, c) for c in poll.__table__.columns.keys()},
        results=poll.results,
        institute_name=poll.institute.name if poll.institute else None,
    )


@router.put("/polls/{poll_id}", response_model=PollOut, dependencies=[Depends(_require_admin_key)])
async def update_poll(
    poll_id: int, data: PollUpdate, db: AsyncSession = Depends(get_db)
):
    poll = await crud.poll.update_poll(db, poll_id, data)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    await refresh_aggregation_cache(db, poll.election_type, poll.round)
    return PollOut(
        **{c: getattr(poll, c) for c in poll.__table__.columns.keys()},
        results=poll.results,
        institute_name=poll.institute.name if poll.institute else None,
    )


@router.delete("/polls/{poll_id}", status_code=204, dependencies=[Depends(_require_admin_key)])
async def delete_poll(poll_id: int, db: AsyncSession = Depends(get_db)):
    poll = await crud.poll.get_by_id(db, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    election_type, round_ = poll.election_type, poll.round
    await crud.poll.delete_poll(db, poll_id)
    await refresh_aggregation_cache(db, election_type, round_)


# --- Aggregation ---

@router.post("/aggregation/recompute", dependencies=[Depends(_require_admin_key)])
async def recompute_aggregation(
    election_type: str,
    round: int = 1,
    db: AsyncSession = Depends(get_db),
):
    updated = await refresh_aggregation_cache(db, election_type, round)
    return {"message": f"Recomputed {len(updated)} cache entries", "election_type": election_type, "round": round}


# --- Scraper runs ---

@router.post("/scraper/run", dependencies=[Depends(_require_admin_key)])
async def trigger_scraper_run(
    institute_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a pending scraper run record.
    The actual scraping is done by the external Python scraper process.
    This endpoint is called by the scraper itself to register runs,
    or by admin to signal the scraper to run (via a flag in DB).
    """
    run = ScraperRun(
        institute_id=institute_id,
        status="pending",
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)
    await db.flush()
    await db.refresh(run)
    return {"run_id": run.id, "message": "Scraper run queued"}


@router.patch("/scraper/runs/{run_id}", dependencies=[Depends(_require_admin_key)])
async def update_scraper_run(
    run_id: int,
    status: str,
    polls_found: int = 0,
    polls_imported: int = 0,
    error_message: str | None = None,
    raw_log: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ScraperRun).where(ScraperRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run.status = status
    run.polls_found = polls_found
    run.polls_imported = polls_imported
    run.error_message = error_message
    run.raw_log = raw_log
    run.finished_at = datetime.now(timezone.utc)
    await db.flush()
    return {"run_id": run.id, "status": run.status}


@router.get("/scraper/runs", response_model=list[ScraperRunOut], dependencies=[Depends(_require_admin_key)])
async def list_scraper_runs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(ScraperRun)
        .options(selectinload(ScraperRun.institute))
        .order_by(ScraperRun.started_at.desc())
        .limit(limit)
    )
    runs = result.scalars().all()
    return [
        ScraperRunOut(
            id=r.id,
            institute_id=r.institute_id,
            institute_name=r.institute.name if r.institute else None,
            started_at=r.started_at,
            finished_at=r.finished_at,
            status=r.status,
            polls_found=r.polls_found or 0,
            polls_imported=r.polls_imported or 0,
            error_message=r.error_message,
        )
        for r in runs
    ]


@router.get("/scraper/runs/{run_id}", response_model=ScraperRunOut, dependencies=[Depends(_require_admin_key)])
async def get_scraper_run(run_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(ScraperRun)
        .options(selectinload(ScraperRun.institute))
        .where(ScraperRun.id == run_id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return ScraperRunOut(
        id=run.id,
        institute_id=run.institute_id,
        institute_name=run.institute.name if run.institute else None,
        started_at=run.started_at,
        finished_at=run.finished_at,
        status=run.status,
        polls_found=run.polls_found or 0,
        polls_imported=run.polls_imported or 0,
        error_message=run.error_message,
    )
