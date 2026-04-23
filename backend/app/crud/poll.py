from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.models.poll import Poll
from app.models.poll_result import PollResult
from app.schemas.poll import PollCreate, PollUpdate
from datetime import date


async def get_polls(
    db: AsyncSession,
    election_type: str | None = None,
    round: int | None = None,
    institute_id: int | None = None,
    candidate_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[Poll], int]:
    q = (
        select(Poll)
        .options(selectinload(Poll.results), selectinload(Poll.institute))
    )
    filters = []
    if election_type:
        filters.append(Poll.election_type == election_type)
    if round is not None:
        filters.append(Poll.round == round)
    if institute_id:
        filters.append(Poll.institute_id == institute_id)
    if date_from:
        filters.append(Poll.poll_date >= date_from)
    if date_to:
        filters.append(Poll.poll_date <= date_to)
    if candidate_id:
        subq = select(PollResult.poll_id).where(PollResult.candidate_id == candidate_id)
        filters.append(Poll.id.in_(subq))
    if filters:
        q = q.where(and_(*filters))

    count_q = select(Poll.id)
    if filters:
        count_q = count_q.where(and_(*filters))
    count_result = await db.execute(count_q)
    total = len(count_result.all())

    q = q.order_by(Poll.poll_date.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().unique().all()), total


async def get_by_id(db: AsyncSession, poll_id: int) -> Poll | None:
    result = await db.execute(
        select(Poll)
        .options(selectinload(Poll.results), selectinload(Poll.institute))
        .where(Poll.id == poll_id)
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, data: PollCreate) -> Poll:
    poll_data = data.model_dump(exclude={"results"})
    poll = Poll(**poll_data)
    db.add(poll)
    await db.flush()
    for r in data.results:
        result = PollResult(poll_id=poll.id, **r.model_dump())
        db.add(result)
    await db.flush()
    await db.refresh(poll)
    return poll


async def update_poll(
    db: AsyncSession, poll_id: int, data: PollUpdate
) -> Poll | None:
    poll = await get_by_id(db, poll_id)
    if not poll:
        return None
    update_data = data.model_dump(exclude_unset=True)
    results_data = update_data.pop("results", None)
    for field, value in update_data.items():
        setattr(poll, field, value)
    if results_data is not None:
        # Delete existing results and insert new ones
        for existing in list(poll.results):
            await db.delete(existing)
        await db.flush()
        for r in results_data:
            new_result = PollResult(poll_id=poll.id, **r)
            db.add(new_result)
    await db.flush()
    await db.refresh(poll)
    return poll


async def delete_poll(db: AsyncSession, poll_id: int) -> bool:
    poll = await get_by_id(db, poll_id)
    if not poll:
        return False
    await db.delete(poll)
    return True
