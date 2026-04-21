from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import crud
from app.schemas.institute import InstituteOut

router = APIRouter(prefix="/institutes", tags=["institutes"])


@router.get("/", response_model=list[InstituteOut])
async def list_institutes(
    active_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    return await crud.institute.get_all(db, active_only=active_only)


@router.get("/{institute_id}", response_model=InstituteOut)
async def get_institute(institute_id: int, db: AsyncSession = Depends(get_db)):
    inst = await crud.institute.get_by_id(db, institute_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")
    return inst
