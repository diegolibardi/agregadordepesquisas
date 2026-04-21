from pydantic import BaseModel
from datetime import datetime, date


class AggregatedStanding(BaseModel):
    candidate_id: int
    candidate_name: str
    party: str
    color_hex: str | None
    aggregated_pct: float
    poll_count: int
    computed_at: datetime

    model_config = {"from_attributes": True}


class AggregationResponse(BaseModel):
    election_type: str
    round: int
    standings: list[AggregatedStanding]
    last_poll_date: date | None


class TrendPoint(BaseModel):
    poll_date: date
    percentage: float
    poll_id: int
    institute_name: str
    sample_size: int | None


class CandidateTrend(BaseModel):
    candidate_id: int
    candidate_name: str
    party: str
    color_hex: str | None
    data_points: list[TrendPoint]


class HistoryResponse(BaseModel):
    election_type: str
    round: int
    candidates: list[CandidateTrend]


class ScraperRunOut(BaseModel):
    id: int
    institute_id: int | None
    institute_name: str | None
    started_at: datetime
    finished_at: datetime | None
    status: str
    polls_found: int
    polls_imported: int
    error_message: str | None

    model_config = {"from_attributes": True}
