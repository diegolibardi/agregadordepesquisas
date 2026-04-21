from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import crud
from app.schemas.candidate import CandidateOut
from app.schemas.aggregation import CandidateTrend, TrendPoint
from app.services.aggregation import get_candidate_trend

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("/", response_model=list[CandidateOut])
async def list_candidates(
    election_type: str | None = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    return await crud.candidate.get_all(db, election_type=election_type, active_only=active_only)


@router.get("/{candidate_id}", response_model=CandidateOut)
async def get_candidate(candidate_id: int, db: AsyncSession = Depends(get_db)):
    cand = await crud.candidate.get_by_id(db, candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand


@router.get("/{candidate_id}/trend", response_model=CandidateTrend)
async def candidate_trend(
    candidate_id: int,
    election_type: str = "governor",
    round: int = 1,
    db: AsyncSession = Depends(get_db),
):
    cand = await crud.candidate.get_by_id(db, candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    points = await get_candidate_trend(db, candidate_id, election_type, round)
    return CandidateTrend(
        candidate_id=cand.id,
        candidate_name=cand.name,
        party=cand.party,
        color_hex=cand.color_hex,
        data_points=[TrendPoint(**p) for p in points],
    )
