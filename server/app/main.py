from fastapi import FastAPI
from app.scraper import scrape_dining_hall, get_soup
from app.utils import flatten_station_items, get_configured_halls
from app.ai import analyze_menu_for_ai
from app.prepare import prepare_solver_data
import json
from app.query import push_into_db
import argparse
import os
from pathlib import Path
import time
from pydantic import BaseModel
from app.lp import LPSolverResult, execute_lp_solver

class MealRequest(BaseModel):
    dining_hall_id: int
    meal_period: str
    calories_min: int
    calories_max: int
    protein_min: int
    fat_max: int
    carb_max: int

app = FastAPI()

@app.post("/api/optimize")
async def optimize_meal(mealRequest: MealRequest) -> list[LPSolverResult]:
    return execute_lp_solver(
        cal_min=mealRequest.calories_min,
        cal_max=mealRequest.calories_max,
        protein_min=mealRequest.protein_min,
        fat_max=mealRequest.fat_max,
        carb_max=mealRequest.carb_max
    )

def process_dhall_data(dhall_data, hall_name, hall_id=None):
  for meal_period, stations in dhall_data.items():
      print(f"Processing {meal_period} for {hall_name}...")
      flattened_stations = flatten_station_items(stations)
      # print(flattened_stations)
      # break
      for station_name, items in stations.items():
          print(f"  Station: {station_name} with {len(items)} items.")
          ai_analysis = analyze_menu_for_ai({station_name: flattened_stations[station_name]})
          print(ai_analysis)
          raw_and_bundled_data = prepare_solver_data(items, ai_analysis["offerings"], station_name, meal_period, hall_id)
          push_into_db(raw_and_bundled_data)

def main(test):
    if test:
        print("This is test code. Using dummy data...")
        for file_path in Path('/Users/wenxi/Documents/CodingProjects/dining-app/server/app/offline_data').glob("*.html"):
            base_path = os.path.basename(file_path).replace('.html', '')
            print(f"Scraping file: {base_path}")
            local_test = get_soup(file_path, is_local=True)
            dhall_data = scrape_dining_hall(local_test, url=str(file_path))
        for file_path in Path('/Users/wenxi/Documents/CodingProjects/dining-app/server/app/data').glob("*.json"):
            with open("/Users/wenxi/Documents/CodingProjects/dining-app/server/app/config/halls.json", "r") as f:
                halls_config = json.load(f)
          
            with open(file_path, "r") as f:
                base_path = os.path.basename(file_path).replace('.json', '')
                hall_id = None
                for hall in halls_config:
                    if hall["test_id"] == base_path.split('_')[0]:
                        hall_id = hall["id"]
                print(f"Processing file: {base_path} for hall ID: {hall_id}")
                dhall_data = json.load(f)
                process_dhall_data(dhall_data, base_path, hall_id)
    else:
        print("This is production code. Scraping actual websites...")
        all_halls = get_configured_halls()
        for hall in all_halls:
            print(f"Scraping {hall['name']}...")
            dhall_data = scrape_dining_hall(hall['url'])
            process_dhall_data(dhall_data, hall['name'])
      

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FuelStack Dining Hall Scraper")
    parser.add_argument('--test', action='store_true', help='Run in test mode with dummy data')
    args = parser.parse_args()
    start_time = time.perf_counter()
    main(test=args.test)
    end_time = time.perf_counter()
    print(f"Execution time: {end_time - start_time:.2f} seconds")
      
      # with open("/Users/wenxi/Documents/CodingProjects/dining-app/server/app/data2/ai_test.json", "r") as f:
      #   dummy_data = json.load(f)
      # with open("/Users/wenxi/Documents/CodingProjects/dining-app/server/app/data/bursley_12_18_25.json", "r") as f:
      #   dhall_data = json.load(f)
      # for station_name, items in dhall_data["Lunch"].items():
      #     print(f"  Station: {station_name} with {len(items)} items.")
      #     # ai_analysis = analyze_menu_for_ai({station_name: flattened_stations[station_name]})
      #     ai_analysis = dummy_data[station_name] if station_name in dummy_data else {"offerings": []}
      #     raw_and_bundled_data = prepare_solver_data(items, ai_analysis["offerings"], station_name, "lunch", 1)
      #     push_into_db(raw_and_bundled_data)

