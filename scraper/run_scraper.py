"""
CLI entry point for manual scraper runs.

Usage:
  python run_scraper.py               # Run all institutes
  python run_scraper.py --id 3        # Run only institute with ID 3
  python run_scraper.py --list        # List configured institutes

Environment variables (or .env file):
  API_BASE_URL   (default: http://localhost:8000)
  ADMIN_API_KEY
"""

import argparse
import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY", "")


def main():
    parser = argparse.ArgumentParser(description="Agregador de Pesquisas — Manual Scraper")
    parser.add_argument("--id", type=int, help="Run only this institute ID")
    parser.add_argument("--list", action="store_true", help="List institutes and exit")
    args = parser.parse_args()

    from scrapers.sources.registry import build_scrapers, load_institutes

    if args.list:
        institutes = load_institutes(API_BASE_URL, ADMIN_API_KEY)
        print(f"{'ID':<5} {'Name':<40} {'Type':<10} {'Active'}")
        print("-" * 65)
        for inst in institutes:
            print(
                f"{inst['id']:<5} {inst['name']:<40} "
                f"{inst['scraper_type']:<10} {inst['is_active']}"
            )
        return

    scrapers = build_scrapers(API_BASE_URL, ADMIN_API_KEY)
    if args.id:
        scrapers = [s for s in scrapers if s.institute_id == args.id]
        if not scrapers:
            logger.error(f"No scraper found for institute ID {args.id}")
            sys.exit(1)

    if not scrapers:
        logger.warning("No active scrapers configured.")
        return

    total_found = 0
    total_imported = 0

    for scraper in scrapers:
        logger.info(f"Running scraper for institute ID {scraper.institute_id}...")
        summary = scraper.run()
        total_found += summary.polls_found
        total_imported += summary.polls_imported
        if summary.errors:
            for err in summary.errors:
                logger.error(f"  Error: {err}")

    print(f"\nDone. Total polls found: {total_found}, imported: {total_imported}")


if __name__ == "__main__":
    main()
