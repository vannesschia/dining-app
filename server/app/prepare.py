def get_convenience_score(style):
    if style == "bundle":
        return 5  # Gold standard: "One click, one plate"
    elif style == "self_serve":
        return 3   # Good: "Grab it yourself"
    else:
        return 1   # Fallback
  
def prepare_solver_data(raw_scraper_items, ai_output, station_name, meal_period, dining_hall_id):
    # PER STATION?
    solver_variables = []
    covered_item_names = set()

    for offering in ai_output:
        score = get_convenience_score(offering.get("service_style", None))
        traits = set()
        allergens = set()
        portion_size = None
        serving_size_g = None
        calories = None
        total_fat_g = None
        saturated_fat_g = None
        trans_fat_g = None
        cholesterol_mg = None
        sodium_mg = None
        total_carbohydrate_g = None
        dietary_fiber_g = None
        sugars_g = None
        protein_g = None

        if len(offering["items"]) == 1 and offering["items"][0] in raw_scraper_items.keys():
            portion_size = raw_scraper_items[offering["items"][0]]['nutrition'].get('Serving Size', {}).get('portion_size', "1 serving")
            serving_size_g = raw_scraper_items[offering["items"][0]]['nutrition'].get('Serving Size', {}).get('value', None)
        else:
            portion_size = "1 meal"
            # serving_size_g = raw_scraper_items[offering["items"][0]]['nutrition'].get('Serving Size', {}).get('value', None)
        for item in offering["items"]:
            # Aggregate traits
            for potential_trait in ["Vegan", "Vegetarian", "Gluten Free", "Halal", "Kosher"]:
                if all(potential_trait in raw_scraper_items.get(item, {}).get("traits", []) for item in offering["items"]):
                    traits.add(potential_trait)
            if item in raw_scraper_items.keys():
                # Aggregate allergens
                allergens.update(raw_scraper_items[item]["allergens"])

                # For numeric values, we can take sums as needed
                serving_size_g = (serving_size_g or 0) + raw_scraper_items[item]['nutrition'].get('Serving Size', {}).get('value', 0)
                calories = (calories or 0) + raw_scraper_items[item]['nutrition'].get('Calories', {}).get('value', 0)
                total_fat_g = (total_fat_g or 0) + raw_scraper_items[item]['nutrition'].get('Total Fat', {}).get('value', 0)
                saturated_fat_g = (saturated_fat_g or 0) + raw_scraper_items[item]['nutrition'].get('Saturated Fat', {}).get('value', 0)
                trans_fat_g = (trans_fat_g or 0) + raw_scraper_items[item]['nutrition'].get('Trans Fat', {}).get('value', 0)
                cholesterol_mg = (cholesterol_mg or 0) + raw_scraper_items[item]['nutrition'].get('Cholesterol', {}).get('value', 0)
                sodium_mg = (sodium_mg or 0) + raw_scraper_items[item]['nutrition'].get('Sodium', {}).get('value', 0)
                total_carbohydrate_g = (total_carbohydrate_g or 0) + raw_scraper_items[item]['nutrition'].get('Total Carbohydrate', {}).get('value', 0)
                dietary_fiber_g = (dietary_fiber_g or 0) + raw_scraper_items[item]['nutrition'].get('Dietary Fiber', {}).get('value', 0)
                sugars_g = (sugars_g or 0) + raw_scraper_items[item]['nutrition'].get('Sugars', {}).get('value', 0)
                protein_g = (protein_g or 0) + raw_scraper_items[item]['nutrition'].get('Protein', {}).get('value', 0)

        solver_variables.append({
            "name": offering["name"],
            "components": offering["items"], # List of strings
            "traits": list(traits),
            "allergens": list(allergens),
            "dining_hall_id": dining_hall_id,
            "meal_period": meal_period.lower(),
            "station": station_name,
            "serving_size_g": int(serving_size_g),
            "portion_size": portion_size,
            "calories_kcal": int(calories),
            "total_fat_g": total_fat_g,
            "saturated_fat_g": saturated_fat_g,
            "trans_fat_g": trans_fat_g,
            "cholesterol_mg": cholesterol_mg,
            "sodium_mg": sodium_mg,
            "total_carbohydrate_g": total_carbohydrate_g,
            "dietary_fiber_g": dietary_fiber_g,
            "sugars_g": sugars_g,
            "protein_g": protein_g,
            "convenience_score": score,
            "type": "entree" if offering.get("service_style", None) != "dessert" else "dessert"
        })

        # Mark these items as "handled"
        # If the offering is a single item (A La Carte), mark it as covered.
        # If it's a bundle, we technically still allow the raw items to exist 
        # (Hybrid Model), but usually, the AI will explicitly create 
        # A La Carte options for them too if the prompt is good.
        if len(offering["items"]) == 1:
            covered_item_names.add(offering["items"][0])

    # 2. Add Leftover Scraper Items (The Safety Net)
    for raw_item_name, raw_item in raw_scraper_items.items():
        if raw_item_name not in covered_item_names:
            traits = list()
            for potential_trait in ["Vegan", "Vegetarian", "Gluten Free", "Halal", "Kosher"]:
                if potential_trait in raw_item.get("traits", []):
                    traits.append(potential_trait)

            # This is an item the AI missed or ignored.
            # We add it, but with a "Penalty Score"
            solver_variables.append({
                "name": raw_item_name,
                "components": [raw_item_name],
                "traits": traits,
                "allergens": raw_item['allergens'],
                "dining_hall_id": dining_hall_id,
                "meal_period": meal_period.lower(),
                "station": station_name,
                "portion_size": raw_item.get('nutrition', {}).get('Serving Size', {}).get('portion_size', 0),
                "serving_size_g": int(raw_item.get('nutrition', {}).get('Serving Size', {}).get('value', 0)),
                "calories_kcal": int(raw_item.get('nutrition', {}).get('Calories', {}).get('value', 0)),
                "total_fat_g": raw_item.get('nutrition', {}).get('Total Fat', {}).get('value', 0),
                "saturated_fat_g": raw_item.get('nutrition', {}).get('Saturated Fat', {}).get('value', 0),
                "trans_fat_g": raw_item.get('nutrition', {}).get('Trans Fat', {}).get('value', 0),
                "cholesterol_mg": raw_item.get('nutrition', {}).get('Cholesterol', {}).get('value', 0),
                "sodium_mg": raw_item.get('nutrition', {}).get('Sodium', {}).get('value', 0),
                "total_carbohydrate_g": raw_item.get('nutrition', {}).get('Total Carbohydrate', {}).get('value', 0),
                "dietary_fiber_g": raw_item.get('nutrition', {}).get('Dietary Fiber', {}).get('value', 0),
                "sugars_g": raw_item.get('nutrition', {}).get('Sugars', {}).get('value', 0),
                "protein_g": raw_item.get('nutrition', {}).get('Protein', {}).get('value', 0),
                "convenience_score": 1,
                "type": "entree"
            })
            
    return solver_variables