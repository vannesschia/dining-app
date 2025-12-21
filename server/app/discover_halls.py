import json
import os
from pathlib import Path
from server.app.scraper import scrape_dining_hall

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "config" / "halls.json"

def get_configured_halls():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

def scrape_all():
    halls = get_configured_halls()
    for hall in halls:
        print(f"Scraping {hall['name']}...")
        scrape_dining_hall(hall['url'])