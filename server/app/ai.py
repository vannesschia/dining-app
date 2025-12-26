import os
import instructor
from groq import Groq
from pydantic import BaseModel
from typing import List
from app.utils import flatten_menu_data
from pathlib import Path
import json
from dotenv import load_dotenv
from enum import Enum
from app.prepare import prepare_solver_data
from app.query import push_into_db

load_dotenv()  # Load environment variables from .env file

class ServiceStyle(str, Enum):
    BUNDLE = "bundle"           # Pre-defined plate (High Convenience)
    SELF_SERVE = "self_serve"   # Salad bar, Toast, Deli (Medium Convenience)
    # SERVER_ITEM = "server_item" # A side dish on a hot line (Low Convenience)

# 1. Define the Schema
class VirtualMeal(BaseModel):
    name: str
    items: List[str]
    service_style: ServiceStyle
    reasoning: str

class StationMenu(BaseModel):
    offerings: List[VirtualMeal]

# 2. Setup Client
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
client = instructor.from_groq(
    groq_client,
    mode=instructor.Mode.JSON
)
# client = instructor.from_provider(
#     "groq/openai/gpt-oss-120b",
#     mode=instructor.Mode.MD_JSON
# )

def group_station_items(station_name: str, item_list: List[str]):
    SYSTEM_PROMPT = """
      You are a Culinary Data Architect. Structure raw food lists into "Meal Bundles".

      RULES:
      1. **Bundling Logic**:
        - **Fixed Plate**: If a station has 1 Main + distinct Sides (e.g., Roast + Potatoes), bundle EVERYTHING into one 'bundle'.
        - **Mixed Mains**: If a station has multiple distinct Mains (e.g., Burger AND Fish), create separate 'bundle' objects for each, reusing sides if applicable.
        - **Build-Your-Own**: ONLY if no clear Main exists (e.g., Toast), keep items as 'self_serve'. ALSO create 2-3 logical 'bundle' suggestions (e.g., "Veggie Salad Bowl").

      2. **Output format**: Valid JSON only.

      OUTPUT SCHEMA:
      {
        "station_name": "String",
        "offerings": [
          {
            "name": "String",
            "items": ["String", "String"],
            "service_style": "bundle" | "self_serve",
            "reasoning": "String"
          }
        ]
      }
    """

    USER_PROMPT = f"""
      EXAMPLES:

      Input: "Signature Maize" -> ["Pork Roast", "Rice", "Avocado", "Corn"]
      Output:
      {{
        "station_name": "Signature Maize",
        "offerings": [
          {{
            "name": "Pork Roast Plate",
            "items": ["Pork Roast", "Rice", "Avocado", "Corn"],
            "service_style": "bundle",
            "reasoning": "Main dish with standard sides."
          }}
        ]
      }}

      Input: "Toast Bar" -> ['Eggs', 'Bacon', 'Tots']
      Output:
      {{
        "station_name": "Toast Bar",
        "offerings": [
          {{ "name": "Side of Eggs", "items": ["Eggs"], "service_style": "self_serve", "reasoning": "Component" }},
          {{ "name": "Side of Bacon", "items": ["Bacon"], "service_style": "self_serve", "reasoning": "Component" }},
          {{ "name": "Side of Tots", "items": ["Tots"], "service_style": "self_serve", "reasoning": "Component" }},
          {{ "name": "Classic Breakfast", "items": ["Eggs", "Bacon", "Tots"], "service_style": "bundle", "reasoning": "Standard Combo" }}
        ]
      }}

      Input: "Kings Grill" -> ['Burger', 'Fish', 'Fries']
      Output:
      {{
        "station_name": "Kings Grill",
        "offerings": [
          {{ "name": "Burger Combo", "items": ["Burger", "Fries"], "service_style": "bundle", "reasoning": "Classic pairing" }},
          {{ "name": "Fish & Chips", "items": ["Fish", "Fries"], "service_style": "bundle", "reasoning": "Alternative Main" }}
        ]
      }}

      TASK:
      Input: Station "{station_name}" -> {item_list}
      Output:
    """


    # 3. The Call
    # Note: We use 'response_model' instead of 'response_format'
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT},
        ],
        response_model=StationMenu,
    )

    return resp

def analyze_menu_for_ai(json_data):
    stations_to_ignore = ['Soup', 'MBakery', 'Deli']
    print(json_data.keys())
    key, components = next(iter(json_data.items()))
    if len(components) <= 1:
        offerings = []
        for item in components:
            offerings.append(
              {
                  "name": item,
                  "items": [item],
                  "service_style": "bundle",
                  "reasoning": ""
              }
            )
        return { "offerings": offerings }

    if key in stations_to_ignore:
        offerings = []
        if key == 'Soup':
          for items in json_data.values():
              for item in items:
                  offerings.append(
                    {
                        "name": item,
                        "items": [item],
                        "service_style": "bundle",
                        "reasoning": ""
                    }
                  )
        elif key == 'MBakery':
            for items in json_data.values():
                for item in items:
                    offerings.append(
                      {
                          "name": item,
                          "items": [item],
                          "service_style": "dessert",
                          "reasoning": ""
                      }
                    )
        return { "offerings": offerings }

    for station, items in json_data.items():
        print(f"Analyzing station: {station} with {len(items)} items.")
        analysis = group_station_items(station, items)
    return analysis.model_dump()

if __name__ == "__main__":
    for file_path in Path('/Users/wenxi/Documents/CodingProjects/dining-app/server/app/data').glob("*.json"):
        with open(file_path, "r") as f:
            dummy_data = json.load(f)
            analysis = flatten_menu_data(dummy_data)

            data = {}
            for meal_period, stations in analysis.items():
                bundled_data = analyze_menu_for_ai(stations)
                for station_name, offerings in bundled_data.items():
                  raw_and_bundled_data = prepare_solver_data(dummy_data[meal_period][station_name], offerings)
                  push_into_db(raw_and_bundled_data, meal_period, station_name, 1)
