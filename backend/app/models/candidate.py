from sqlalchemy import String, SmallInteger, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    party: Mapped[str] = mapped_column(String(50), nullable=False)
    party_number: Mapped[int | None] = mapped_column(SmallInteger)
    election_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # governor, senator, federal_deputy
    photo_url: Mapped[str | None] = mapped_column(String(500))
    color_hex: Mapped[str | None] = mapped_column(String(7))  # e.g. "#FF0000"
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    poll_results: Mapped[list["PollResult"]] = relationship(
        "PollResult", back_populates="candidate"
    )
    aggregation_cache: Mapped[list["AggregationCache"]] = relationship(
        "AggregationCache", back_populates="candidate"
    )
