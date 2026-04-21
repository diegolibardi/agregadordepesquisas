"""
APScheduler daemon that runs all scrapers daily at 06:00 BRT.

Run: python scheduler.py
"""

import logging
import os
import sys
from datetime import datetime, timezone

import httpx
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY", "")
SCRAPER_HOUR = int(os.environ.get("SCRAPER_HOUR", "6"))
SCRAPER_MINUTE = int(os.environ.get("SCRAPER_MINUTE", "0"))


def scrape_all_sources() -> None:
    logger.info("=== Starting scheduled scraper run ===")
    from scrapers.sources.registry import build_scrapers

    scrapers = build_scrapers(API_BASE_URL, ADMIN_API_KEY)
    if not scrapers:
        logger.warning("No active scrapers found. Check institutes configuration.")
        return

    total_found = 0
    total_imported = 0
    total_errors = 0

    for scraper in scrapers:
        # Register run start
        run_id = _register_run_start(scraper.institute_id)
        try:
            summary = scraper.run()
            total_found += summary.polls_found
            total_imported += summary.polls_imported
            total_errors += len(summary.errors)
            _register_run_end(
                run_id=run_id,
                status="success" if not summary.errors else "error",
                polls_found=summary.polls_found,
                polls_imported=summary.polls_imported,
                error_message="\n".join(summary.errors) if summary.errors else None,
                raw_log="\n".join(summary.log_lines),
            )
        except Exception as e:
            logger.exception(f"Unhandled error in scraper for institute {scraper.institute_id}: {e}")
            _register_run_end(run_id=run_id, status="error", error_message=str(e))

    logger.info(
        f"=== Scraper run complete: found={total_found}, "
        f"imported={total_imported}, errors={total_errors} ==="
    )


def _register_run_start(institute_id: int | None) -> int | None:
    try:
        resp = httpx.post(
            f"{API_BASE_URL}/api/v1/admin/scraper/run",
            params={"institute_id": institute_id},
            headers={"X-Admin-Key": ADMIN_API_KEY},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json().get("run_id")
    except Exception as e:
        logger.warning(f"Could not register run start: {e}")
    return None


def _register_run_end(
    run_id: int | None,
    status: str,
    polls_found: int = 0,
    polls_imported: int = 0,
    error_message: str | None = None,
    raw_log: str | None = None,
) -> None:
    if run_id is None:
        return
    try:
        httpx.patch(
            f"{API_BASE_URL}/api/v1/admin/scraper/runs/{run_id}",
            params={
                "status": status,
                "polls_found": polls_found,
                "polls_imported": polls_imported,
                "error_message": error_message or "",
                "raw_log": (raw_log or "")[:10000],  # cap log size
            },
            headers={"X-Admin-Key": ADMIN_API_KEY},
            timeout=10,
        )
    except Exception as e:
        logger.warning(f"Could not update run {run_id}: {e}")


if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="America/Sao_Paulo")
    scheduler.add_job(
        scrape_all_sources,
        trigger=CronTrigger(hour=SCRAPER_HOUR, minute=SCRAPER_MINUTE),
        id="daily_scrape",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    logger.info(
        f"Scheduler started. Will run daily at {SCRAPER_HOUR:02d}:{SCRAPER_MINUTE:02d} BRT."
    )
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")
