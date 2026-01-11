from fastapi import FastAPI
from app.scraper import scrape_dining_hall, get_soup
from app.utils import flatten_station_items, get_configured_halls
from app.ai import analyze_menu_for_ai
from app.prepare import prepare_solver_data
import json
from app.query import push_into_db, get_all_dining_halls_info, get_dining_hall_default_menu
import argparse
import os
from pathlib import Path
import time
from pydantic import BaseModel
from app.lp import LPSolverResult, execute_lp_solver
from fastapi.middleware.cors import CORSMiddleware
from app.lp import MealRequest
import sys


class DiningHallMenuRequest(BaseModel):
    dining_hall_id: int
    meal_period: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/menu")
async def get_default_menu(id: int, meal_period: str):
    return get_dining_hall_default_menu(id, meal_period)

@app.get("/get-dining-halls")
async def get_all_dining_halls():
    return get_all_dining_halls_info()

@app.post("/optimize-meal")
async def optimize_meal(meal_request: MealRequest) -> list[LPSolverResult]:
    return execute_lp_solver(meal_request)

def process_dhall_data(dhall_data, hall_name, hall_id=None):
  for meal_period, stations in dhall_data.items():
      print(f"Processing {meal_period} for {hall_name}...")
      flattened_stations = flatten_station_items(stations)
      for station_name, items in stations.items():
          print(f"  Station: {station_name} with {len(items)} items.")
          ai_analysis = analyze_menu_for_ai({station_name: flattened_stations[station_name]})
          print(ai_analysis)
          raw_and_bundled_data = prepare_solver_data(items, ai_analysis["offerings"], station_name, meal_period, hall_id)
          push_into_db(raw_and_bundled_data)

def main():
    try:
      all_halls = get_all_dining_halls_info()
      for hall in all_halls:
          print(f"Scraping {hall['name']}...")
          soup = get_soup(hall['url'])
          dhall_data = scrape_dining_hall(soup, name=str(hall['name']))
          print(dhall_data)
          process_dhall_data(dhall_data, hall['name'], hall['id'])
    except Exception as e:
        print(f"Error occurred: {e}")
        sys.exit(1)
    # if test:
    #     print("This is test code. Using dummy data...")
    #     for file_path in Path('/Users/wenxi/Documents/CodingProjects/dining-app/server/app/offline_data').glob("*.html"):
    #         base_path = os.path.basename(file_path).replace('.html', '')
    #         print(f"Scraping file: {base_path}")
    #         local_test = get_soup(file_path, is_local=True)
    #         dhall_data = scrape_dining_hall(local_test, url=str(file_path))
    #     for file_path in Path('/Users/wenxi/Documents/CodingProjects/dining-app/server/app/data').glob("*.json"):
    #         with open("/Users/wenxi/Documents/CodingProjects/dining-app/server/app/config/halls.json", "r") as f:
    #             halls_config = json.load(f)
          
    #         with open(file_path, "r") as f:
    #             base_path = os.path.basename(file_path).replace('.json', '')
    #             hall_id = None
    #             for hall in halls_config:
    #                 if hall["test_id"] == base_path.split('_')[0]:
    #                     hall_id = hall["id"]
    #             print(f"Processing file: {base_path} for hall ID: {hall_id}")
    #             dhall_data = json.load(f)
    #             process_dhall_data(dhall_data, base_path, hall_id)
    # else:
        # print("This is production code. Scraping actual websites...")
      

if __name__ == "__main__":
    main()
    # parser = argparse.ArgumentParser(description="FuelStack Dining Hall Scraper")
    # parser.add_argument('--test', action='store_true', help='Run in test mode with dummy data')
    # args = parser.parse_args()
    # start_time = time.perf_counter()
    # main(test=args.test)
    # end_time = time.perf_counter()
    # print(f"Execution time: {end_time - start_time:.2f} seconds")

