from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app import crud
from app.models.aggregation_cache import AggregationCache
from app.models.poll import Poll
from app.schemas.aggregation import (
    AggregationResponse,
    AggregatedStanding,
    HistoryResponse,
    CandidateTrend,
    TrendPoint,
)
from app.services.aggregation import get_candidate_trend, compute_aggregation
from datetime import date

router = APIRouter(prefix="/aggregation", tags=["aggregation"])


@router.get("/{election_type}", response_model=AggregationResponse)
async def get_aggregation(
    election_type: str,
    round: int = 1,
    db: AsyncSession = Depends(get_db),
):
    # Try cache first
    cache_rows = await db.execute(
        select(AggregationCache)
        .options(selectinload(AggregationCache.candidate))
        .where(
            and_(
                AggregationCache.election_type == election_type,
                AggregationCache.round == round,
            )
        )
        .order_by(AggregationCache.aggregated_pct.desc())
    )
    cache_entries = list(cache_rows.scalars().all())

    if not cache_entries:
        # Compute on demand if cache is empty
        agg_map = await compute_aggregation(db, election_type, round)
        if not agg_map:
            return AggregationResponse(
                election_type=election_type,
                round=round,
                standings=[],
                last_poll_date=None,
            )
        # Load candidates for the computed IDs
        standings = []
        for cid, data in sorted(
            agg_map.items(), key=lambda x: x[1]["aggregated_pct"], reverse=True
        ):
            cand = await crud.candidate.get_by_id(db, cid)
            if cand:
                standings.append(
                    AggregatedStanding(
                        candidate_id=cid,
                        candidate_name=cand.name,
                        party=cand.party,
                        color_hex=cand.color_hex,
                        aggregated_pct=data["aggregated_pct"],
                        poll_count=data["poll_count"],
                        computed_at=__import__("datetime").datetime.now(
                            __import__("datetime").timezone.utc
                        ),
                    )
                )
    else:
        standings = [
            AggregatedStanding(
                candidate_id=entry.candidate_id,
                candidate_name=entry.candidate.name,
                party=entry.candidate.party,
                color_hex=entry.candidate.color_hex,
                aggregated_pct=float(entry.aggregated_pct),
                poll_count=entry.poll_count,
                computed_at=entry.computed_at,
            )
            for entry in cache_entries
        ]

    # Get latest poll date
    latest_poll = await db.execute(
        select(Poll.poll_date)
        .where(and_(Poll.election_type == election_type, Poll.round == round))
        .order_by(Poll.poll_date.desc())
        .limit(1)
    )
    last_date = latest_poll.scalar_one_or_none()

    return AggregationResponse(
        election_type=election_type,
        round=round,
        standings=standings,
        last_poll_date=last_date,
    )


@router.get("/{election_type}/history", response_model=HistoryResponse)
async def get_aggregation_history(
    election_type: str,
    round: int = 1,
    db: AsyncSession = Depends(get_db),
):
    candidates = await crud.candidate.get_all(
        db, election_type=election_type, active_only=True
    )
    candidate_trends = []
    for cand in candidates:
        points = await get_candidate_trend(db, cand.id, election_type, round)
        if points:
            candidate_trends.append(
                CandidateTrend(
                    candidate_id=cand.id,
                    candidate_name=cand.name,
                    party=cand.party,
                    color_hex=cand.color_hex,
                    data_points=[TrendPoint(**p) for p in points],
                )
            )
    return HistoryResponse(
        election_type=election_type,
        round=round,
        candidates=candidate_trends,
    )
