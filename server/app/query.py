import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
from zoneinfo import ZoneInfo

load_dotenv()

URL = api_key=os.environ.get("SUPABASE_PROJECT_URL")
KEY = os.environ.get("SUPABASE_ANON_API_KEY")
supabase: Client = create_client(URL, KEY)

def push_into_db(data):
    """
    Pushes the prepared data into the Supabase database.
    
    Args:
        data (dict): The data to be inserted into the database.
        meal_period (str): The meal period (e.g., breakfast, lunch, dinner).
        station_name (str): The name of the station.
    """
    table_name = "menu_items"
    try:
        response = (
            supabase.table(table_name)
            .insert(data) # Insert takes a list of dictionaries for single or bulk inserts
            .execute()
        )
        print("Data pushed successfully:", response.data)
    except Exception as e:
        print(f"An error occurred: {e}")

def fetch_menu_items(dining_hall_id = None, meal_period = None):
    """
    Fetches all menu items from the Supabase database.
    
    Returns:
        list: A list of menu items.
    """
    if dining_hall_id is None:
        return []
    if meal_period is None:
        return []
    
    est_now = datetime.now(ZoneInfo("America/New_York"))
    today_date_est = est_now.date().isoformat()
    table_name = "menu_items"
    try:
        response = (
            supabase.table(table_name)
            .select("*")
            .eq("date", "2025-12-27")
            .eq("dining_hall_id", dining_hall_id)
            .eq("meal_period", meal_period.lower())
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

