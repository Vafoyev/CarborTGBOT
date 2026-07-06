"""
CarBor Scraper - Konfiguratsiya
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Scraper
SCRAPE_INTERVAL = int(os.getenv("SCRAPE_INTERVAL_SECONDS", "60"))

# Redis kanallari
CHANNEL_NEW_CAR = "carbor:new_car"
CHANNEL_STATUS = "carbor:status"

# HTTP headers (bot kabi ko'rinish)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "uz,ru;q=0.9,en;q=0.8",
}
