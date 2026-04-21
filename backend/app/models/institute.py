from sqlalchemy import String, Numeric, Boolean, ARRAY, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime


class Institute(Base):
    __tablename__ = "institutes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    credibility_score: Mapped[float] = mapped_column(
        Numeric(4, 3), nullable=False, default=1.0
    )
    website_url: Mapped[str | None] = mapped_column(String(500))
    source_urls: Mapped[list | None] = mapped_column(ARRAY(String))
    scraper_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="html"
    )  # html, pdf, dynamic, manual
    scraper_config: Mapped[dict | None] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    polls: Mapped[list["Poll"]] = relationship("Poll", back_populates="institute")
    scraper_runs: Mapped[list["ScraperRun"]] = relationship(
        "ScraperRun", back_populates="institute"
    )
