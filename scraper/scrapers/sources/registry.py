"""
Scraper registry: maps scraper_type strings to scraper classes,
and loads institute configurations from the backend API.
"""

from __future__ import annotations
import logging
import httpx
from typing import TYPE_CHECKING

from scrapers.html_scraper import HtmlScraper
from scrapers.pdf_scraper import PdfScraper
from scrapers.dynamic_scraper import DynamicScraper
from scrapers.base_scraper import BaseScraper

logger = logging.getLogger(__name__)

SCRAPER_MAP = {
    "html": HtmlScraper,
    "pdf": PdfScraper,
    "dynamic": DynamicScraper,
}


def load_institutes(api_base_url: str, admin_api_key: str) -> list[dict]:
    """Fetch active institutes from the backend API."""
    try:
        resp = httpx.get(
            f"{api_base_url}/api/v1/institutes",
            params={"active_only": True},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Failed to load institutes from API: {e}")
        return []


def build_scrapers(
    api_base_url: str,
    admin_api_key: str,
) -> list[BaseScraper]:
    """Load all active, non-manual institutes and build scraper instances."""
    institutes = load_institutes(api_base_url, admin_api_key)
    scrapers = []
    for inst in institutes:
        scraper_type = inst.get("scraper_type", "manual")
        if scraper_type == "manual":
            continue
        scraper_class = SCRAPER_MAP.get(scraper_type)
        if not scraper_class:
            logger.warning(f"Unknown scraper type {scraper_type!r} for {inst['name']}")
            continue
        scraper = scraper_class(
            institute_id=inst["id"],
            api_base_url=api_base_url,
            admin_api_key=admin_api_key,
            source_urls=inst.get("source_urls") or [],
            scraper_config=inst.get("scraper_config") or {},
        )
        scrapers.append(scraper)
        logger.info(f"Loaded scraper: {inst['name']} ({scraper_type})")
    return scrapers
