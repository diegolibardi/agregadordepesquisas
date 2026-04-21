from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import crud
from app.schemas.poll import PollOut
from datetime import date
import csv
import io
import json

router = APIRouter(prefix="/polls", tags=["polls"])


@router.get("/", response_model=list[PollOut])
async def list_polls(
    election_type: str | None = None,
    round: int | None = None,
    institute_id: int | None = None,
    candidate_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    polls, total = await crud.poll.get_polls(
        db,
        election_type=election_type,
        round=round,
        institute_id=institute_id,
        candidate_id=candidate_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    out = []
    for p in polls:
        poll_dict = {
            "id": p.id,
            "institute_id": p.institute_id,
            "election_type": p.election_type,
            "round": p.round,
            "poll_date": p.poll_date,
            "fieldwork_start": p.fieldwork_start,
            "fieldwork_end": p.fieldwork_end,
            "published_date": p.published_date,
            "sample_size": p.sample_size,
            "margin_of_error": float(p.margin_of_error) if p.margin_of_error else None,
            "confidence_level": float(p.confidence_level) if p.confidence_level else None,
            "methodology": p.methodology,
            "source_url": p.source_url,
            "raw_data_url": p.raw_data_url,
            "tse_registered": p.tse_registered,
            "notes": p.notes,
            "is_verified": p.is_verified,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "results": p.results,
            "institute_name": p.institute.name if p.institute else None,
        }
        out.append(PollOut(**poll_dict))
    return out


@router.get("/{poll_id}", response_model=PollOut)
async def get_poll(poll_id: int, db: AsyncSession = Depends(get_db)):
    poll = await crud.poll.get_by_id(db, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return PollOut(
        **{
            **{c: getattr(poll, c) for c in poll.__table__.columns.keys()},
            "results": poll.results,
            "institute_name": poll.institute.name if poll.institute else None,
        }
    )
