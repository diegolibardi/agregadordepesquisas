from pydantic import BaseModel, HttpUrl, field_validator
from datetime import datetime
from typing import Any


class InstituteBase(BaseModel):
    name: str
    slug: str
    credibility_score: float = 1.0
    website_url: str | None = None
    source_urls: list[str] | None = None
    scraper_type: str = "html"
    scraper_config: dict[str, Any] | None = None
    is_active: bool = True

    @field_validator("credibility_score")
    @classmethod
    def validate_score(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError("credibility_score must be between 0.0 and 1.0")
        return v

    @field_validator("scraper_type")
    @classmethod
    def validate_scraper_type(cls, v: str) -> str:
        allowed = {"html", "pdf", "dynamic", "manual"}
        if v not in allowed:
            raise ValueError(f"scraper_type must be one of {allowed}")
        return v


class InstituteCreate(InstituteBase):
    pass


class InstituteUpdate(BaseModel):
    name: str | None = None
    credibility_score: float | None = None
    website_url: str | None = None
    source_urls: list[str] | None = None
    scraper_type: str | None = None
    scraper_config: dict[str, Any] | None = None
    is_active: bool | None = None


class InstituteOut(InstituteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
