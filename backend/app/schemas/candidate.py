from pydantic import BaseModel, field_validator
from datetime import datetime


ELECTION_TYPES = {"governor", "senator", "federal_deputy", "state_deputy"}


class CandidateBase(BaseModel):
    name: str
    slug: str
    party: str
    party_number: int | None = None
    election_type: str
    photo_url: str | None = None
    color_hex: str | None = None
    is_active: bool = True

    @field_validator("election_type")
    @classmethod
    def validate_election_type(cls, v: str) -> str:
        if v not in ELECTION_TYPES:
            raise ValueError(f"election_type must be one of {ELECTION_TYPES}")
        return v

    @field_validator("color_hex")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and (not v.startswith("#") or len(v) != 7):
            raise ValueError("color_hex must be a 7-char hex string like #FF0000")
        return v


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    name: str | None = None
    party: str | None = None
    party_number: int | None = None
    election_type: str | None = None
    photo_url: str | None = None
    color_hex: str | None = None
    is_active: bool | None = None


class CandidateOut(CandidateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
