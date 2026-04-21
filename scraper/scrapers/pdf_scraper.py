"""
PDF scraper using pdfplumber.

Downloads a PDF from a URL and extracts poll tables.

scraper_config expected keys:
  - election_type: str
  - round: int (default 1)
  - methodology: str (optional)
  - candidate_mapping: dict mapping name string -> candidate_id
  - name_column: column header containing candidate name (default "Candidato")
  - pct_column: column header containing percentage (default "%")
  - date_pattern: regex to find date in PDF text (optional)
"""

from __future__ import annotations
import re
import io
import logging
from scrapers.base_scraper import BaseScraper, RawPollData

logger = logging.getLogger(__name__)


class PdfScraper(BaseScraper):
    def fetch_raw(self, url: str) -> bytes:
        response = self.client.get(url)
        response.raise_for_status()
        return response.content

    def parse(self, raw: bytes, url: str) -> list[RawPollData]:
        try:
            import pdfplumber
        except ImportError:
            logger.error("pdfplumber not installed. Run: pip install pdfplumber")
            return []

        cfg = self.scraper_config
        candidate_mapping: dict[str, int] = cfg.get("candidate_mapping", {})
        election_type: str = cfg.get("election_type", "governor")
        round_: int = cfg.get("round", 1)
        methodology: str | None = cfg.get("methodology")
        name_col: str = cfg.get("name_column", "Candidato")
        pct_col: str = cfg.get("pct_column", "%")

        poll_date = None
        sample_size = None
        results = []
        full_text = ""

        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"

                tables = page.extract_tables()
                for table in tables:
                    if not table:
                        continue
                    header = [str(c).strip() if c else "" for c in table[0]]
                    name_idx = self._find_col(header, name_col)
                    pct_idx = self._find_col(header, pct_col)
                    if name_idx is None or pct_idx is None:
                        continue
                    for row in table[1:]:
                        if not row or len(row) <= max(name_idx, pct_idx):
                            continue
                        name = str(row[name_idx] or "").strip()
                        pct_raw = str(row[pct_idx] or "").strip()
                        candidate_id = candidate_mapping.get(name)
                        if candidate_id is None:
                            logger.debug(f"No mapping for: {name!r}")
                            continue
                        try:
                            pct = float(pct_raw.replace(",", ".").replace("%", "").strip())
                        except ValueError:
                            continue
                        results.append({
                            "candidate_id": candidate_id,
                            "percentage": pct,
                            "is_spontaneous": False,
                        })

        # Extract date from text
        poll_date = self._find_date(full_text, cfg.get("date_pattern"))

        # Extract sample size from text
        m = re.search(r"n\s*[=:]\s*([\d\.]+)", full_text, re.IGNORECASE)
        if m:
            sample_size = int(m.group(1).replace(".", ""))
        else:
            m = re.search(r"([\d\.]+)\s*entrevistas", full_text, re.IGNORECASE)
            if m:
                sample_size = int(m.group(1).replace(".", ""))

        if not results or not poll_date:
            logger.warning(f"PDF from {url}: no results or date found")
            return []

        return [
            RawPollData(
                institute_id=self.institute_id,
                election_type=election_type,
                round=round_,
                poll_date=poll_date,
                sample_size=sample_size,
                margin_of_error=None,
                methodology=methodology,
                source_url=url,
                results=results,
            )
        ]

    def _find_col(self, header: list[str], target: str) -> int | None:
        target_lower = target.lower()
        for i, h in enumerate(header):
            if target_lower in h.lower():
                return i
        return None

    def _find_date(self, text: str, pattern: str | None) -> str | None:
        if pattern:
            m = re.search(pattern, text)
            if m:
                return m.group(1)
        # Generic Brazilian date
        m = re.search(r"(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})", text)
        if m:
            d, mo, y = m.groups()
            return f"{y}-{int(mo):02d}-{int(d):02d}"
        return None
