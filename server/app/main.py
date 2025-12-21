from fastapi import FastAPI
from app.scraper import scrape_dining_hall
from discover_halls import scrape_all

app = FastAPI()

@app.get("/")
def home():
    return {"message": "FuelStack API is running!"}

@app.get("/menu/south-quad")
def get_south_quad_menu():
    # Call your scraper function here
    scrape_all()