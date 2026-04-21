"""
Poll data validation rules.

Checks performed:
  1. All percentages are between 0 and 100
  2. Sum of candidate percentages is between 90% and 105% (allows blanks/others)
  3. sample_size >= 100 (if provided)
  4. poll_date is not in the future
  5. Results list is non-empty
  6. poll_date is a valid ISO date string
"""

from __future__ import annotations
import logging
from datetime import date, datetime

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    pass


class PollValidator:
    MIN_SAMPLE_SIZE = 100
    MIN_PCT_SUM = 90.0
    MAX_PCT_SUM = 105.0

    def is_valid(self, poll) -> bool:
        """Return True if poll passes all checks, False otherwise (logs reason)."""
        try:
            self._validate(poll)
            return True
        except ValidationError as e:
            logger.warning(f"Invalid poll skipped: {e}")
            return False

    def _validate(self, poll) -> None:
        # Validate poll_date
        try:
            pd = datetime.strptime(poll.poll_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid poll_date format: {poll.poll_date!r}")

        if pd > date.today():
            raise ValidationError(f"poll_date {pd} is in the future")

        # Validate results
        if not poll.results:
            raise ValidationError("No results provided")

        stimulated_results = [r for r in poll.results if not r.get("is_spontaneous", False)]
        if not stimulated_results:
            stimulated_results = poll.results  # fallback: validate all

        for r in poll.results:
            pct = r.get("percentage")
            if pct is None or not isinstance(pct, (int, float)):
                raise ValidationError(f"Invalid percentage: {pct!r}")
            if not 0.0 <= float(pct) <= 100.0:
                raise ValidationError(f"Percentage out of range: {pct}")

        pct_sum = sum(float(r["percentage"]) for r in stimulated_results)
        if not (self.MIN_PCT_SUM <= pct_sum <= self.MAX_PCT_SUM):
            raise ValidationError(
                f"Sum of stimulated percentages ({pct_sum:.1f}%) out of valid range "
                f"[{self.MIN_PCT_SUM}, {self.MAX_PCT_SUM}]"
            )

        # Validate sample_size
        if poll.sample_size is not None:
            if poll.sample_size < self.MIN_SAMPLE_SIZE:
                raise ValidationError(
                    f"sample_size {poll.sample_size} < minimum {self.MIN_SAMPLE_SIZE}"
                )

        # Validate candidate_ids are present
        for r in poll.results:
            if not r.get("candidate_id"):
                raise ValidationError(f"Missing candidate_id in result: {r}")
