from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.institute import Institute
from app.schemas.institute import InstituteCreate, InstituteUpdate


async def get_all(db: AsyncSession, active_only: bool = False) -> list[Institute]:
    q = select(Institute)
    if active_only:
        q = q.where(Institute.is_active == True)
    result = await db.execute(q.order_by(Institute.name))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, institute_id: int) -> Institute | None:
    result = await db.execute(select(Institute).where(Institute.id == institute_id))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, data: InstituteCreate) -> Institute:
    institute = Institute(**data.model_dump())
    db.add(institute)
    await db.flush()
    await db.refresh(institute)
    return institute


async def update_institute(
    db: AsyncSession, institute_id: int, data: InstituteUpdate
) -> Institute | None:
    inst = await get_by_id(db, institute_id)
    if not inst:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(inst, field, value)
    await db.flush()
    await db.refresh(inst)
    return inst
