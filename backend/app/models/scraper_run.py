from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime


class ScraperRun(Base):
    __tablename__ = "scraper_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    institute_id: Mapped[int | None] = mapped_column(
        ForeignKey("institutes.id", ondelete="SET NULL")
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="running"
    )  # running, success, error
    polls_found: Mapped[int] = mapped_column(Integer, default=0)
    polls_imported: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    raw_log: Mapped[str | None] = mapped_column(Text)

    institute: Mapped["Institute | None"] = relationship(
        "Institute", back_populates="scraper_runs"
    )
