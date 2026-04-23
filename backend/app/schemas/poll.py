from pydantic import BaseModel, field_validator
from datetime import datetime, date
from typing import Any


class PollResultIn(BaseModel):
    candidate_id: int
    percentage: float
    margin_of_error: float | None = None
    is_spontaneous: bool = False

    @field_validator("percentage")
    @classmethod
    def validate_pct(cls, v: float) -> float:
        if not 0.0 <= v <= 100.0:
            raise ValueError("percentage must be between 0 and 100")
        return v


class PollResultOut(BaseModel):
    id: int
    candidate_id: int
    percentage: float
    margin_of_error: float | None
    is_spontaneous: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PollBase(BaseModel):
    institute_id: int
    election_type: str
    round: int = 1
    poll_date: date
    fieldwork_start: date | None = None
    fieldwork_end: date | None = None
    published_date: date | None = None
    sample_size: int | None = None
    margin_of_error: float | None = None
    confidence_level: float | None = 95.0
    methodology: str | None = None
    source_url: str | None = None
    raw_data_url: str | None = None
    tse_registered: str | None = None
    notes: str | None = None

    @field_validator("round")
    @classmethod
    def validate_round(cls, v: int) -> int:
        if v not in (1, 2):
            raise ValueError("round must be 1 or 2")
        return v

    @field_validator("sample_size")
    @classmethod
    def validate_sample_size(cls, v: int | None) -> int | None:
        if v is not None and v < 100:
            raise ValueError("sample_size must be >= 100")
        return v


class PollCreate(PollBase):
    results: list[PollResultIn]


class PollUpdate(BaseModel):
    institute_id: int | None = None
    election_type: str | None = None
    round: int | None = None
    poll_date: date | None = None
    fieldwork_start: date | None = None
    fieldwork_end: date | None = None
    published_date: date | None = None
    sample_size: int | None = None
    margin_of_error: float | None = None
    methodology: str | None = None
    source_url: str | None = None
    raw_data_url: str | None = None
    tse_registered: str | None = None
    notes: str | None = None
    is_verified: bool | None = None
    results: list[PollResultIn] | None = None


class PollOut(PollBase):
    id: int
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    results: list[PollResultOut] = []
    institute_name: str | None = None

    model_config = {"from_attributes": True}
