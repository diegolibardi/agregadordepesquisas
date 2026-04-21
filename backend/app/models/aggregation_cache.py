from sqlalchemy import String, SmallInteger, Integer, Numeric, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime


class AggregationCache(Base):
    __tablename__ = "aggregation_cache"
    __table_args__ = (
        UniqueConstraint(
            "election_type", "round", "candidate_id",
            name="uq_agg_election_round_candidate"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    election_type: Mapped[str] = mapped_column(String(50), nullable=False)
    round: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False
    )
    aggregated_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    poll_count: Mapped[int] = mapped_column(Integer, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    candidate: Mapped["Candidate"] = relationship(
        "Candidate", back_populates="aggregation_cache"
    )
