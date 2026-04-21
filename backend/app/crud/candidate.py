from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateCreate, CandidateUpdate


async def get_all(
    db: AsyncSession,
    election_type: str | None = None,
    active_only: bool = False,
) -> list[Candidate]:
    q = select(Candidate)
    if election_type:
        q = q.where(Candidate.election_type == election_type)
    if active_only:
        q = q.where(Candidate.is_active == True)
    result = await db.execute(q.order_by(Candidate.name))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, candidate_id: int) -> Candidate | None:
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, data: CandidateCreate) -> Candidate:
    candidate = Candidate(**data.model_dump())
    db.add(candidate)
    await db.flush()
    await db.refresh(candidate)
    return candidate


async def update_candidate(
    db: AsyncSession, candidate_id: int, data: CandidateUpdate
) -> Candidate | None:
    cand = await get_by_id(db, candidate_id)
    if not cand:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cand, field, value)
    await db.flush()
    await db.refresh(cand)
    return cand
