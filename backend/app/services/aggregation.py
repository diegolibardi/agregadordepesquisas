"""
Weighted poll aggregation engine.

Weight formula:
    weight_i = credibility_score × sample_size_factor × recency_factor
    recency_factor = e^(-λ × days_old)    (λ ≈ 0.05 → ~14-day half-life)
    sample_size_factor = min(sample_size / 1000, 1.0)

aggregated_pct = Σ(pct_i × weight_i) / Σ(weight_i)
"""

import math
from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.poll import Poll
from app.models.poll_result import PollResult
from app.models.candidate import Candidate
from app.models.institute import Institute
from app.models.aggregation_cache import AggregationCache
from app.config import settings


def _recency_factor(poll_date: date, reference: date, lam: float) -> float:
    days_old = (reference - poll_date).days
    return math.exp(-lam * max(days_old, 0))


def _sample_size_factor(sample_size: int | None) -> float:
    if sample_size is None:
        return 0.5  # default when unknown
    return min(sample_size / 1000.0, 1.0)


async def compute_aggregation(
    db: AsyncSession,
    election_type: str,
    round: int = 1,
    reference_date: date | None = None,
    lam: float | None = None,
) -> dict[int, dict]:
    """
    Returns a mapping of candidate_id -> {aggregated_pct, poll_count, candidate}
    """
    if lam is None:
        lam = settings.AGGREGATION_LAMBDA

    # Load polls with results and institute credibility
    polls = await db.execute(
        select(Poll)
        .options(
            selectinload(Poll.results),
            selectinload(Poll.institute),
        )
        .where(
            and_(
                Poll.election_type == election_type,
                Poll.round == round,
            )
        )
        .order_by(Poll.poll_date.desc())
    )
    polls_list = list(polls.scalars().all())

    # Use latest poll date as reference (not today) so weights don't drift over time
    if reference_date is None:
        if polls_list:
            reference_date = max(p.poll_date for p in polls_list)
        else:
            reference_date = date.today()

    # candidate_id -> weighted sum + total weight + count
    weighted: dict[int, dict] = {}

    for poll in polls_list:
        if poll.institute is None:
            continue
        credibility = float(poll.institute.credibility_score)
        sf = _sample_size_factor(poll.sample_size)
        rf = _recency_factor(poll.poll_date, reference_date, lam)
        weight = credibility * sf * rf

        for result in poll.results:
            if result.is_spontaneous:
                continue  # use stimulated only for main aggregation
            cid = result.candidate_id
            if cid not in weighted:
                weighted[cid] = {"weighted_sum": 0.0, "total_weight": 0.0, "poll_ids": set()}
            weighted[cid]["weighted_sum"] += float(result.percentage) * weight
            weighted[cid]["total_weight"] += weight
            weighted[cid]["poll_ids"].add(poll.id)

    # Compute final percentages
    result_map: dict[int, dict] = {}
    for cid, data in weighted.items():
        if data["total_weight"] > 0:
            agg_pct = data["weighted_sum"] / data["total_weight"]
        else:
            agg_pct = 0.0
        result_map[cid] = {
            "aggregated_pct": int(agg_pct * 100 + 0.5) / 100,  # round to 2dp (avoids shadowed builtin)
            "poll_count": len(data["poll_ids"]),
        }

    return result_map


async def refresh_aggregation_cache(
    db: AsyncSession,
    election_type: str,
    round: int = 1,
) -> list[AggregationCache]:
    """Recompute and replace aggregation cache for a given election + round."""
    agg_map = await compute_aggregation(db, election_type, round)
    now = datetime.now(timezone.utc)

    # Delete ALL existing entries for this election+round to avoid stale data
    old_entries = await db.execute(
        select(AggregationCache).where(
            and_(
                AggregationCache.election_type == election_type,
                AggregationCache.round == round,
            )
        )
    )
    for entry in old_entries.scalars().all():
        await db.delete(entry)
    await db.flush()

    # Insert fresh entries for all candidates in the new computation
    updated = []
    for candidate_id, data in agg_map.items():
        cache_entry = AggregationCache(
            election_type=election_type,
            round=round,
            candidate_id=candidate_id,
            aggregated_pct=data["aggregated_pct"],
            poll_count=data["poll_count"],
            computed_at=now,
        )
        db.add(cache_entry)
        updated.append(cache_entry)

    await db.flush()
    return updated


async def get_candidate_trend(
    db: AsyncSession,
    candidate_id: int,
    election_type: str,
    round: int = 1,
) -> list[dict]:
    """Return time-series of raw poll results for a candidate."""
    rows = await db.execute(
        select(PollResult, Poll, Institute)
        .join(Poll, PollResult.poll_id == Poll.id)
        .join(Institute, Poll.institute_id == Institute.id)
        .where(
            and_(
                PollResult.candidate_id == candidate_id,
                Poll.election_type == election_type,
                Poll.round == round,
                PollResult.is_spontaneous == False,
            )
        )
        .order_by(Poll.poll_date.asc())
    )
    points = []
    for pr, poll, institute in rows.all():
        points.append(
            {
                "poll_date": poll.poll_date,
                "percentage": float(pr.percentage),
                "poll_id": poll.id,
                "institute_name": institute.name,
                "sample_size": poll.sample_size,
            }
        )
    return points
