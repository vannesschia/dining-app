import pulp
from app.query import fetch_menu_items
from pydantic import BaseModel

CAL_MIN = 900
CAL_MAX = 1200
PROTEIN_MIN = 60
FAT_MAX = 60
CARB_MAX = 150

class MenuOption(BaseModel):
    name: str
    id: int
    components: list[str] = []
    quantity: int
    station: str = ""
    calories_kcal: int
    protein_g: int
    total_carbohydrate_g: int
    total_fat_g: int

class LPSolverResult(BaseModel):
    options: list[MenuOption]
    total_calories_kcal: int = 0
    total_protein_g: int = 0
    total_carbohydrate_g: int = 0
    total_fat_g: int = 0

class MealRequest(BaseModel):
    dining_hall_id: int
    meal_period: str
    calories_min: int
    calories_max: int
    protein_min: int | None = None
    protein_max: int | None = None
    fat_min: int | None = None
    fat_max: int | None = None
    carb_min: int | None = None
    carb_max: int | None = None
    sugars_min: int | None = None
    sugars_max: int | None = None
    sodium_min: int | None = None
    sodium_max: int | None = None
    traits: list[str] = []
    allergens: list[str] = []

def execute_lp_solver(
        # cal_min=CAL_MIN, 
        # cal_max=CAL_MAX, 
        # protein_min=None, 
        # protein_max=None, 
        # fat_min=None, 
        # fat_max=None, 
        # carb_min=None,
        # carb_max=None,
        # sugars_min=None,
        # sugars_max=None,
        # sodium_min=None,
        # sodium_max=None,
        # traits=[],
        # allergens=[]
        mr: MealRequest
      ):
    print(mr)
    # -----------------------
    # 1) Fetch Data
    # -----------------------
    offerings = fetch_menu_items(1, "lunch", mr.traits, mr.allergens)
    # print(offerings)

    # -----------------------
    # 2) Setup Solver
    # -----------------------
    prob = pulp.LpProblem("Meal_Optimizer", pulp.LpMaximize)

    # -----------------------
    # 3) Decision Variables
    # -----------------------
    x = pulp.LpVariable.dicts(
        "item",
        [o["id"] for o in offerings],
        lowBound=0,
        upBound=2,
        cat="Integer"
    )

    # -----------------------
    # 4) Scoring & Classification
    # -----------------------
    mains = []
    sides = []

    for o in offerings:
        var = x[o["id"]]

        # Convenience-based base score + a mild protein reward (optional but recommended)
        if o["convenience_score"] == 5:
            base_score = 1000
            mains.append(var)
        elif o["convenience_score"] == 3:
            base_score = 500
            sides.append(var)
        else:
            base_score = 1
            sides.append(var)

        # Your score
        o["solver_score"] = (
            base_score
            + 15.0 * o["protein_g"]
            - 0.5 * o["total_carbohydrate_g"]
            - 0.2 * o["calories_kcal"]
        )

    # -----------------------
    # 5) Constraints
    # -----------------------
    prob += pulp.lpSum(mains) >= 1, "at_least_1_main"
    prob += pulp.lpSum(mains) <= 3, "at_most_3_mains"
    prob += pulp.lpSum(sides) <= 3, "at_most_3_sides"

    cal = [x[o["id"]] * o["calories_kcal"] for o in offerings]
    pro = [x[o["id"]] * o["protein_g"] for o in offerings]
    fat = [x[o["id"]] * o["total_fat_g"] for o in offerings]
    carb = [x[o["id"]] * o["total_carbohydrate_g"] for o in offerings]

    prob += pulp.lpSum(cal) >= mr.calories_min, "calories_min"
    prob += pulp.lpSum(cal) <= mr.calories_max, "calories_max"
    if mr.protein_min:
      prob += pulp.lpSum(pro) >= mr.protein_min, "protein_min"
    if mr.protein_max:
      prob += pulp.lpSum(pro) <= mr.protein_max, "protein_max"
    if mr.fat_min:
      prob += pulp.lpSum(fat) >= mr.fat_min, "fat_min"
    if mr.fat_max:
      prob += pulp.lpSum(fat) <= mr.fat_max, "fat_max"
    if mr.carb_min:
      prob += pulp.lpSum(carb) >= mr.carb_min, "carb_min"
    if mr.carb_max:
      prob += pulp.lpSum(carb) <= mr.carb_max, "carb_max"
    if mr.sugars_min:
      prob += pulp.lpSum(carb) <= mr.sugars_min, "sugars_min"
    if mr.sugars_max:
      prob += pulp.lpSum(carb) <= mr.sugars_max, "sugars_max"
    if mr.sodium_min:
      prob += pulp.lpSum(carb) <= mr.sodium_min, "sodium_min"
    if mr.sodium_max:
      prob += pulp.lpSum(carb) <= mr.sodium_max, "sodium_max"
    # -----------------------
    # 6) Diversity (Approach A): reuse penalty
    # -----------------------
    reuse_count = {o["id"]: 0 for o in offerings}
    LAMBDA_REUSE = 300 # tune 20–80

    def set_objective_with_diversity(prob, x, offerings, reuse_count):
        prob.objective = pulp.lpSum(
            x[o["id"]] * (o["solver_score"] - LAMBDA_REUSE * reuse_count[o["id"]])
            for o in offerings
        )

    # set the initial objective
    set_objective_with_diversity(prob, x, offerings, reuse_count)

    # -----------------------
    # 7) Solve & Generate Variety
    # -----------------------
    solutions_found = 0
    desired_options = 10

    print("\n--- GENERATING MENUS ---")

    all_menus = []

    while solutions_found < desired_options:
        status = prob.solve(pulp.PULP_CBC_CMD(msg=0))
        if status != 1:
            print("Stopped: No more unique feasible menus found.")
            break

        solutions_found += 1
        print(f"\n🍱 MENU OPTION #{solutions_found}")

        total_cal = 0
        total_pro = 0
        total_carb = 0
        total_fat = 0

        used_ids = []
        lp_solver_result = LPSolverResult(options=[])
        for o in offerings:
            qty = int(round(x[o["id"]].varValue or 0))
            if qty > 0:
                used_ids.append(o["id"])
                tag = "[MAIN]" if any(x[o["id"]] is v for v in mains) else "[SIDE]"
                print(f"  - {qty}x ({o['id']}) {o['name']} {tag} ({o['calories_kcal']} kcal, {o['protein_g']}g pro)")

                total_cal += o["calories_kcal"] * qty
                total_pro += o["protein_g"] * qty
                total_carb += o["total_carbohydrate_g"] * qty
                total_fat += o["total_fat_g"] * qty
                curr_option = MenuOption(
                    name=o["name"],
                    id=o["id"],
                    quantity=qty,
                    components=o.get("components", []),
                    station =o.get("station", ""),
                    calories_kcal=o["calories_kcal"],
                    protein_g=o["protein_g"],
                    total_carbohydrate_g=o["total_carbohydrate_g"],
                    total_fat_g=o["total_fat_g"]
                )
                lp_solver_result.options.append(curr_option)
        lp_solver_result.total_calories_kcal = total_cal
        lp_solver_result.total_protein_g = total_pro
        lp_solver_result.total_carbohydrate_g = total_carb
        lp_solver_result.total_fat_g = total_fat
        all_menus.append(lp_solver_result)
        print(f"  Totals: {total_cal} kcal, {total_pro}g Protein, {total_carb}g Carbs, {total_fat}g Fat")

        # ---- Update reuse counts (penalize items used in this menu next time)
        for item_id in used_ids:
            reuse_count[item_id] += 1

        # ---- Re-apply objective with updated penalties
        set_objective_with_diversity(prob, x, offerings, reuse_count)

        # ---- No-good cut (prevents exact repeats)
        sol_vals = {o["id"]: int(round(x[o["id"]].varValue or 0)) for o in offerings}
        add_no_good_cut_0_2(prob, x, sol_vals, solutions_found)
    
    return all_menus

def add_no_good_cut_0_2(prob, x_dict, sol_vals, iter_k):
    z = {}  # z[item_id, val] in {0,1}
    for item_id, xvar in x_dict.items():
        for val in (0, 1, 2):
            z[(item_id, val)] = pulp.LpVariable(f"z_{iter_k}_{item_id}_{val}", cat="Binary")

        # exactly one value chosen
        prob += (
            z[(item_id, 0)] + z[(item_id, 1)] + z[(item_id, 2)] == 1,
            f"pick_one_{iter_k}_{item_id}"
        )

        # link xvar = 0*z0 + 1*z1 + 2*z2
        prob += (
            xvar == 0 * z[(item_id, 0)] + 1 * z[(item_id, 1)] + 2 * z[(item_id, 2)],
            f"link_{iter_k}_{item_id}"
        )

    # forbid choosing the same value for every variable as the previous solution
    prob += (
        pulp.lpSum(z[(item_id, sol_vals[item_id])] for item_id in sol_vals) <= len(sol_vals) - 3,
        f"nogood_{iter_k}"
    )
