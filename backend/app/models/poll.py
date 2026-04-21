from sqlalchemy import (
    String, SmallInteger, Integer, Numeric, Boolean, Date, DateTime,
    ForeignKey, UniqueConstraint, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime, date


class Poll(Base):
    __tablename__ = "polls"
    __table_args__ = (
        UniqueConstraint(
            "institute_id", "poll_date", "election_type", "round",
            name="uq_poll_institute_date_type_round"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    institute_id: Mapped[int] = mapped_column(
        ForeignKey("institutes.id", ondelete="RESTRICT"), nullable=False
    )
    election_type: Mapped[str] = mapped_column(String(50), nullable=False)
    round: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    poll_date: Mapped[date] = mapped_column(Date, nullable=False)
    fieldwork_start: Mapped[date | None] = mapped_column(Date)
    fieldwork_end: Mapped[date | None] = mapped_column(Date)
    published_date: Mapped[date | None] = mapped_column(Date)
    sample_size: Mapped[int | None] = mapped_column(Integer)
    margin_of_error: Mapped[float | None] = mapped_column(Numeric(5, 2))
    confidence_level: Mapped[float | None] = mapped_column(Numeric(5, 2), default=95.0)
    methodology: Mapped[str | None] = mapped_column(String(100))
    source_url: Mapped[str | None] = mapped_column(String(1000))
    raw_data_url: Mapped[str | None] = mapped_column(String(1000))
    tse_registered: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    institute: Mapped["Institute"] = relationship("Institute", back_populates="polls")
    results: Mapped[list["PollResult"]] = relationship(
        "PollResult", back_populates="poll", cascade="all, delete-orphan"
    )
