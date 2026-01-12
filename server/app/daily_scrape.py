from app.scraper import scrape_dining_hall, get_soup
from app.utils import flatten_station_items
from app.ai import analyze_menu_for_ai
from app.prepare import prepare_solver_data
from app.query import push_into_db, get_all_dining_halls_info
from pathlib import Path
import sys

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
          dhall_data = scrape_dining_hall(soup, url=str(hall['url']), name=str(hall['name']))
          print(dhall_data)
          # process_dhall_data(dhall_data, hall['name'], hall['id'])
    except Exception as e:
        print(f"Error occurred: {e}")
        sys.exit(1)
      

if __name__ == "__main__":
    main()