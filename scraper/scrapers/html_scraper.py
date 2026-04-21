"""
HTML scraper using httpx + BeautifulSoup4.

scraper_config expected keys:
  - results_selector: CSS selector for rows containing candidate results
  - candidate_name_selector: CSS selector within row for candidate name
  - percentage_selector: CSS selector within row for percentage value
  - date_selector: CSS selector for poll date on page
  - sample_size_selector: CSS selector for sample size
  - candidate_mapping: dict mapping scraped name -> candidate_id
  - election_type: str
  - round: int (default 1)
  - methodology: str (optional)
"""

from __future__ import annotations
import re
import logging
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, RawPollData

logger = logging.getLogger(__name__)


class HtmlScraper(BaseScraper):
    def fetch_raw(self, url: str) -> str:
        response = self.client.get(url)
        response.raise_for_status()
        return response.text

    def parse(self, raw: str, url: str) -> list[RawPollData]:
        soup = BeautifulSoup(raw, "lxml")
        cfg = self.scraper_config
        candidate_mapping: dict[str, int] = cfg.get("candidate_mapping", {})
        election_type: str = cfg.get("election_type", "governor")
        round_: int = cfg.get("round", 1)
        methodology: str | None = cfg.get("methodology")

        # Extract poll date
        poll_date = self._extract_date(soup, cfg.get("date_selector"))

        # Extract sample size
        sample_size = self._extract_int(soup, cfg.get("sample_size_selector"))

        # Extract margin of error
        margin_of_error = self._extract_float(soup, cfg.get("margin_selector"))

        # Extract results rows
        results_sel = cfg.get("results_selector", "tr")
        rows = soup.select(results_sel)

        results = []
        for row in rows:
            name_sel = cfg.get("candidate_name_selector", "td:first-child")
            pct_sel = cfg.get("percentage_selector", "td:last-child")

            name_el = row.select_one(name_sel)
            pct_el = row.select_one(pct_sel)
            if not name_el or not pct_el:
                continue

            candidate_name = name_el.get_text(strip=True)
            pct_text = pct_el.get_text(strip=True)

            candidate_id = candidate_mapping.get(candidate_name)
            if candidate_id is None:
                logger.debug(f"No mapping for candidate name: {candidate_name!r}")
                continue

            try:
                pct_clean = re.sub(r"[^\d,\.]", "", pct_text).replace(",", ".")
                percentage = float(pct_clean)
            except ValueError:
                logger.debug(f"Could not parse percentage: {pct_text!r}")
                continue

            results.append({
                "candidate_id": candidate_id,
                "percentage": percentage,
                "is_spontaneous": False,
            })

        if not results or not poll_date:
            return []

        return [
            RawPollData(
                institute_id=self.institute_id,
                election_type=election_type,
                round=round_,
                poll_date=poll_date,
                sample_size=sample_size,
                margin_of_error=margin_of_error,
                methodology=methodology,
                source_url=url,
                results=results,
            )
        ]

    def _extract_date(self, soup: BeautifulSoup, selector: str | None) -> str | None:
        if not selector:
            return None
        el = soup.select_one(selector)
        if not el:
            return None
        text = el.get_text(strip=True)
        # Try common Brazilian date patterns
        m = re.search(r"(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2,4})", text)
        if m:
            d, mo, y = m.groups()
            year = y if len(y) == 4 else f"20{y}"
            return f"{year}-{int(mo):02d}-{int(d):02d}"
        return None

    def _extract_int(self, soup: BeautifulSoup, selector: str | None) -> int | None:
        if not selector:
            return None
        el = soup.select_one(selector)
        if not el:
            return None
        m = re.search(r"[\d\.]+", el.get_text(strip=True).replace(".", ""))
        return int(m.group()) if m else None

    def _extract_float(self, soup: BeautifulSoup, selector: str | None) -> float | None:
        if not selector:
            return None
        el = soup.select_one(selector)
        if not el:
            return None
        m = re.search(r"[\d,\.]+", el.get_text(strip=True))
        if m:
            return float(m.group().replace(",", "."))
        return None
