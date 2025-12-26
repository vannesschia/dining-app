import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "config" / "halls.json"

def get_configured_halls():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

# Helper to simplify that giant JSON before sending to AI
def flatten_menu_data(json_data):
    station_items = {} # { "Mojo Station": ["Item 1", "Item 2"] }
    
    for meal_period, stations in json_data.items():
          station_items[meal_period] = {}
          for station_name, items in stations.items():
              if station_name not in station_items[meal_period]:
                  station_items[meal_period][station_name] = []
              
              for item_name, details in items.items():
                  station_items[meal_period][station_name].append(item_name)
                    
    return station_items

def flatten_station_items(station_data):
    """
      Flatten station items from detailed dict to list of item names.
      Args:
          station_data (dict): Detailed station data with item names as keys.
      Returns:
          dict: Flattened station data with item names in a list.
      Example:
          Input: { "Mojo Station": { "Item 1": {...}, "Item 2": {...} } }
          Output: { "Mojo Station": ["Item 1", "Item 2"] }
    """
    flatten_station_items = {} # { "Mojo Station": ["Item 1", "Item 2"] }

    for station_name, items in station_data.items():
        flatten_station_items[station_name] = []
        for item_name, details in items.items():
            flatten_station_items[station_name].append(item_name)
    return flatten_station_items

