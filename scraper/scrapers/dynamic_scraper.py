"""
Dynamic scraper for JavaScript-rendered pages using Selenium.

Requires:
  pip install selenium webdriver-manager
  Chrome browser installed.

scraper_config: same as HtmlScraper, plus:
  - wait_selector: CSS selector to wait for before parsing (optional)
  - wait_timeout: seconds to wait (default 10)
"""

from __future__ import annotations
import logging
from scrapers.html_scraper import HtmlScraper

logger = logging.getLogger(__name__)


class DynamicScraper(HtmlScraper):
    def fetch_raw(self, url: str) -> str:
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.common.by import By
            from webdriver_manager.chrome import ChromeDriverManager
        except ImportError:
            logger.error("selenium or webdriver-manager not installed.")
            raise

        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")

        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=options,
        )
        try:
            driver.get(url)
            wait_sel = self.scraper_config.get("wait_selector")
            timeout = self.scraper_config.get("wait_timeout", 10)
            if wait_sel:
                WebDriverWait(driver, timeout).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_sel))
                )
            return driver.page_source
        finally:
            driver.quit()
