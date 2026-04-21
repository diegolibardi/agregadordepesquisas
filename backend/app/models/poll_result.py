from sqlalchemy import Integer, Numeric, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime


class PollResult(Base):
    __tablename__ = "poll_results"
    __table_args__ = (
        UniqueConstraint(
            "poll_id", "candidate_id", "is_spontaneous",
            name="uq_result_poll_candidate_spontaneous"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    poll_id: Mapped[int] = mapped_column(
        ForeignKey("polls.id", ondelete="CASCADE"), nullable=False
    )
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="RESTRICT"), nullable=False
    )
    percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    margin_of_error: Mapped[float | None] = mapped_column(Numeric(5, 2))
    is_spontaneous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    poll: Mapped["Poll"] = relationship("Poll", back_populates="results")
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="poll_results")
