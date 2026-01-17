from fastapi import FastAPI
from app.query import get_all_dining_halls_info, get_dining_hall_default_menu
from pydantic import BaseModel
from app.lp import LPSolverResult, execute_lp_solver
from fastapi.middleware.cors import CORSMiddleware
from app.lp import MealRequest


class DiningHallMenuRequest(BaseModel):
    dining_hall_id: int
    meal_period: str

app = FastAPI(
    title="FuelStack API",
    description="Neuro-Symbolic AI Dining Optimization Engine",
    version="1.0.0"
)

origins = ["http://localhost:5173", "https://dining-app-zeta.vercel.app/"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

