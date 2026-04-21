"""
Abstract base class for all poll scrapers.

Each concrete scraper must implement:
  - fetch_raw() -> bytes | str
  - parse(raw) -> list[RawPollData]

The orchestration (validate → push_to_api → log) is handled by run().
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from typing import Any

import httpx

logger = logging.getLogger(__name__)


@dataclass
class RawPollData:
    """Unvalidated poll data as extracted from source."""
    institute_id: int
    election_type: str
    round: int
    poll_date: str  # ISO string yyyy-mm-dd
    sample_size: int | None
    margin_of_error: float | None
    methodology: str | None
    source_url: str | None
    results: list[dict]  # [{"candidate_id": int, "percentage": float, "is_spontaneous": bool}]
    tse_registered: str | None = None
    fieldwork_start: str | None = None
    fieldwork_end: str | None = None
    published_date: str | None = None
    notes: str | None = None


@dataclass
class ScraperRunSummary:
    institute_id: int | None
    polls_found: int = 0
    polls_imported: int = 0
    errors: list[str] = field(default_factory=list)
    log_lines: list[str] = field(default_factory=list)

    def log(self, msg: str) -> None:
        self.log_lines.append(msg)
        logger.info(msg)

    def error(self, msg: str) -> None:
        self.errors.append(msg)
        logger.error(msg)


class BaseScraper(ABC):
    def __init__(
        self,
        institute_id: int,
        api_base_url: str,
        admin_api_key: str,
        source_urls: list[str] | None = None,
        scraper_config: dict[str, Any] | None = None,
    ):
        self.institute_id = institute_id
        self.api_base_url = api_base_url.rstrip("/")
        self.admin_api_key = admin_api_key
        self.source_urls = source_urls or []
        self.scraper_config = scraper_config or {}
        self.client = httpx.Client(timeout=30, follow_redirects=True)

    @abstractmethod
    def fetch_raw(self, url: str) -> bytes | str:
        """Fetch raw content from source URL."""
        ...

    @abstractmethod
    def parse(self, raw: bytes | str, url: str) -> list[RawPollData]:
        """Parse raw content into RawPollData objects."""
        ...

    def validate(self, raw_polls: list[RawPollData]) -> list[RawPollData]:
        """Validate raw poll data. Raises ValueError for critical failures."""
        from validators.poll_validator import PollValidator
        validator = PollValidator()
        return [p for p in raw_polls if validator.is_valid(p)]

    def push_to_api(self, poll: RawPollData) -> bool:
        """POST a single clean poll to the backend API. Returns True if imported."""
        payload = {
            "institute_id": poll.institute_id,
            "election_type": poll.election_type,
            "round": poll.round,
            "poll_date": poll.poll_date,
            "sample_size": poll.sample_size,
            "margin_of_error": poll.margin_of_error,
            "methodology": poll.methodology,
            "source_url": poll.source_url,
            "tse_registered": poll.tse_registered,
            "fieldwork_start": poll.fieldwork_start,
            "fieldwork_end": poll.fieldwork_end,
            "published_date": poll.published_date,
            "notes": poll.notes,
            "results": poll.results,
        }
        try:
            resp = self.client.post(
                f"{self.api_base_url}/api/v1/admin/polls",
                json=payload,
                headers={"X-Admin-Key": self.admin_api_key},
            )
            if resp.status_code == 200:
                return True
            if resp.status_code == 409:
                logger.info("Poll already exists (duplicate), skipping.")
                return False
            logger.warning(f"API returned {resp.status_code}: {resp.text[:200]}")
            return False
        except httpx.RequestError as e:
            logger.error(f"Request error pushing poll: {e}")
            return False

    def run(self) -> ScraperRunSummary:
        """Orchestrate fetch → parse → validate → push for all source URLs."""
        summary = ScraperRunSummary(institute_id=self.institute_id)

        for url in self.source_urls:
            summary.log(f"Fetching: {url}")
            try:
                raw = self.fetch_raw(url)
            except Exception as e:
                summary.error(f"Failed to fetch {url}: {e}")
                continue

            try:
                raw_polls = self.parse(raw, url)
            except Exception as e:
                summary.error(f"Failed to parse {url}: {e}")
                continue

            summary.polls_found += len(raw_polls)
            summary.log(f"Found {len(raw_polls)} polls from {url}")

            valid_polls = self.validate(raw_polls)
            summary.log(f"Valid polls: {len(valid_polls)}/{len(raw_polls)}")

            for poll in valid_polls:
                if self.push_to_api(poll):
                    summary.polls_imported += 1

        summary.log(
            f"Done. Found={summary.polls_found}, Imported={summary.polls_imported}, "
            f"Errors={len(summary.errors)}"
        )
        return summary

    def __del__(self):
        try:
            self.client.close()
        except Exception:
            pass
