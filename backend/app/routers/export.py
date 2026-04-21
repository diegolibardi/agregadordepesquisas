from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import crud
from datetime import date
import csv
import io
import json

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/polls.csv")
async def export_polls_csv(
    election_type: str | None = None,
    round: int | None = None,
    institute_id: int | None = None,
    candidate_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    polls, _ = await crud.poll.get_polls(
        db,
        election_type=election_type,
        round=round,
        institute_id=institute_id,
        candidate_id=candidate_id,
        date_from=date_from,
        date_to=date_to,
        page=1,
        page_size=10000,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "institute", "election_type", "round", "poll_date",
        "sample_size", "margin_of_error", "methodology",
        "candidate_id", "percentage", "is_spontaneous", "source_url",
    ])
    for poll in polls:
        inst_name = poll.institute.name if poll.institute else ""
        for result in poll.results:
            writer.writerow([
                poll.id, inst_name, poll.election_type, poll.round, poll.poll_date,
                poll.sample_size, poll.margin_of_error, poll.methodology,
                result.candidate_id, result.percentage, result.is_spontaneous,
                poll.source_url,
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pesquisas.csv"},
    )


@router.get("/polls.json")
async def export_polls_json(
    election_type: str | None = None,
    round: int | None = None,
    institute_id: int | None = None,
    candidate_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    polls, _ = await crud.poll.get_polls(
        db,
        election_type=election_type,
        round=round,
        institute_id=institute_id,
        candidate_id=candidate_id,
        date_from=date_from,
        date_to=date_to,
        page=1,
        page_size=10000,
    )

    data = []
    for poll in polls:
        data.append({
            "id": poll.id,
            "institute": poll.institute.name if poll.institute else None,
            "election_type": poll.election_type,
            "round": poll.round,
            "poll_date": str(poll.poll_date),
            "sample_size": poll.sample_size,
            "margin_of_error": float(poll.margin_of_error) if poll.margin_of_error else None,
            "methodology": poll.methodology,
            "source_url": poll.source_url,
            "tse_registered": poll.tse_registered,
            "results": [
                {
                    "candidate_id": r.candidate_id,
                    "percentage": float(r.percentage),
                    "is_spontaneous": r.is_spontaneous,
                }
                for r in poll.results
            ],
        })

    return StreamingResponse(
        iter([json.dumps(data, ensure_ascii=False, indent=2)]),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=pesquisas.json"},
    )
