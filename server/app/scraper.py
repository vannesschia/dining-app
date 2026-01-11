from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import pprint
import json
import re
from pathlib import Path
import os

def get_soup(source: str, is_local=False):
    """
    Launches a browser, visits the URL or loads local file, and returns a BeautifulSoup object.
    """
    if is_local:
        # Load from the file you saved
        with open(source, "r", encoding="utf-8") as f:
            return BeautifulSoup(f.read(), "html.parser")
    else:
        with sync_playwright() as p:
            # Change to headless=True when running in production
            browser = p.chromium.launch(headless=False) 
            page = browser.new_page()
            
            page.goto(source)
            
            # Wait for the specific element that holds the menu to load
            # We'll wait for the body just to be safe for this test
            page.wait_for_selector("body")
            
            # Grab HTML
            html_content = page.content()
            browser.close()
        return BeautifulSoup(html_content, "html.parser")

def split_measurement(s: str):
    """
    Splits a measurement string into its numeric and unit components.
    E.g., "200mg" -> (200, "mg")
    """
    measurement_units = {'g' : 'grams', 'mg': 'milligrams', 'mcg': 'micrograms', 'IU': 'international units', 'kcal': 'kilocalories', 'oz': 'ounces', 'cups': 'cups', 'serving(s)': 'servings'}
    match = re.match(r"(\d+)(\D+)", s)
    if match:
        value = float(match.group(1))
        unit = measurement_units.get(match.group(2), match.group(2)) # check, if default to just the raw unit, bad?
        return value, unit
    return None, None

def scrape_dining_hall(soup: BeautifulSoup, url: str = " ", name: str = " "):
    """
    Launches a browser, visits the URL, and returns a list of food items.
    """
    print(f"--- Starting Scrape for: {url} ---")
    
    # Extract Data
    menu = soup.find(id="mdining-items")

    nutrition_facts_labels = {'Serving Size', 'Calories', 'Total Fat', 'Saturated Fat', 'Trans Fat', 'Cholesterol', 'Sodium', 'Total Carbohydrate', 'Dietary Fiber', 'Sugars', 'Protein', 'Vitamin A', 'Vitamin C', 'Calcium', 'Iron', 'Potassium'}
    measurement_units = {'g' : 'grams', 'mg': 'milligrams', 'mcg': 'micrograms', 'IU': 'international units', 'kcal': 'kilocalories', 'oz': 'ounces', 'cups': 'cups', 'serving(s)': 'servings'}
    info = {}
    current_section = None
    if menu:
        menu_descendants = menu.find_all(recursive=False)
        for tag in menu_descendants:
            if tag.name == "h3":
                # print("Menu Section:", tag.get_text(strip=True))
                current_section = tag.get_text(strip=True)
                info[current_section] = {}
            elif tag.name == "div" and "courses" in tag.get("class", []):
                stations = tag.find("ul", class_="courses_wrapper").find_all("li", recursive=False)
                if not stations:
                    # print(" No stations found in this section.")
                    continue
                else:
                    for station in stations:
                        st = station.find("h4").get_text(strip=True)
                        # print("Station:", st)
                        info[current_section][st] = {}
                        check_availability = station.find("ul", class_="items").find("a", class_="item-no-nutrition")
                        if check_availability:
                            # print("  No nutrition information available for items in this station.")
                            info[current_section].pop(st)
                            continue
                        station_items = station.find("ul", class_="items").find_all("li", recursive=False)
                        for item in station_items:
                            item_name = item.select("div .item-name")[0].get_text(strip=True)
                            # print(" - Item:", item_name)
                            info[current_section][st][item_name] = {}
                            traits = item.find("ul", class_="traits").find_all("li")
                            trait_list = [trait.get_text(strip=True) for trait in traits]
                            # print("     Traits:", trait_list)
                            info[current_section][st][item_name]['traits'] = trait_list
                            allergen_info = item.find('div', class_='nutrition-wrapper').find("div", class_="allergens")
                            if not allergen_info:
                                # print("     No allergen information available.")
                                info[current_section][st][item_name]['allergens'] = []
                            else:
                                allergens = allergen_info.find('ul').find_all('li')
                                allergens = [allergen.get_text(strip=True) for allergen in allergens]
                                # print("     Allergens:", allergens)
                                info[current_section][st][item_name]['allergens'] = allergens
                            nutrition_table = item.find('div', class_='nutrition-wrapper').find("table", class_="nutrition-facts")
                            if not nutrition_table:
                                # print("         No nutrition information available.")
                                info[current_section][st][item_name]['nutrition'] = {}
                                continue
                            else:
                                nutrition = nutrition_table.find("tbody").find_all("tr")
                                nutrition_info = {}
                                for nutrient in nutrition:
                                    cols = nutrient.find_all("td")
                                    if not cols:
                                        continue
                                    elif len(cols) < 2:
                                        # This is likely a "Calories" or "Serving Size" row
                                        item_header = cols[0].get_text().split()
                                        # print(item_header)
                                        if ' '.join(item_header[0:2]) == "Serving Size":
                                            nutrition_info['Serving Size'] = {}
                                            portion_size = ''
                                            if len(item_header) < 5:
                                                portion_size = ' '.join(item_header[2:3])
                                            else:
                                                portion_size = ' '.join(item_header[2:4])
                                            nutrition_info['Serving Size']['portion_size'] = portion_size
                                            measurement = re.sub(r"[()]", "", item_header[-1])
                                            nutrition_info['Serving Size']['value'], nutrition_info['Serving Size']['unit'] = split_measurement(measurement)
                                        elif ' '.join(item_header[0:1]) == "Calories":
                                            calories_value = ''
                                            if len(item_header) >= 2:
                                                calories_value = item_header[1]
                                            nutrition_info['Calories'] = {}
                                            nutrition_info['Calories']['value'] = float(calories_value) if calories_value != '' else 0.0
                                            nutrition_info['Calories']['unit'] = 'kilocalories' if calories_value != '' else calories_value
                                    else:
                                        if cols[0].get_text(strip=True) == "":
                                                continue
                                        else:
                                            nutrient_content = cols[0].get_text().split()
                                            prefix = ""
                                            postfix = ""
                                            value = ""
                                            measurement = ""
                                            if ' '.join(nutrient_content[0:2]) in nutrition_facts_labels:
                                                prefix = ' '.join(nutrient_content[0:2])
                                                postfix = ' '.join(nutrient_content[2:])
                                                # print(f"        {prefix}:", postfix, end=' | ')
                                            elif ' '.join(nutrient_content[0:1]) in nutrition_facts_labels:
                                                prefix = ' '.join(nutrient_content[0:1])
                                                postfix = ' '.join(nutrient_content[1:])
                                                # print(f"        {prefix}:", postfix, end=' | ')
                                            for i in range(len(postfix)):
                                                if postfix[i].isalpha():
                                                    value = postfix[0:i].strip()
                                                    measurement = measurement_units[postfix[i:]]
                                                    break
                                            nutrition_info[prefix] = {}
                                            nutrition_info[prefix]['value'] = float(value) if value != '' else 0.0
                                            nutrition_info[prefix]['unit'] = measurement

                                            nutrient_percentage = re.sub('%', '', cols[1].get_text(strip=True))
                                            # print(f"% Daily Value: {nutrient_percentage}")
                                            nutrition_info[prefix]['daily_value'] = float(nutrient_percentage) if nutrient_percentage != '' else 0.0
                                info[current_section][st][item_name]['nutrition'] = nutrition_info
    
    # base_path = os.path.basename(url).replace('.html', '')
    # base_path = name
    # data_end_path = "/Users/wenxi/Documents/CodingProjects/dining-app/server/app/data/" + base_path + ".json"
    # with open(data_end_path, "w") as json_file:
    #     json.dump(info, json_file, indent=4)
    # print(f"Information successfully written to {data_end_path}")
    # pprint.pprint(info)
    # return {"status": "success"}
    return info

# --- TEST BLOCK ---
if __name__ == "__main__":
    # test_url = "https://dining.umich.edu/menus-locations/dining-halls/south-quad/?menuDate=2025-12-18"
    for file_path in Path('/Users/wenxi/Documents/CodingProjects/dining-app/server/app/offline_data').glob("*.html"):
        base_path = os.path.basename(file_path).replace('.html', '')
        print(f"Processing file: {base_path}")
        local_test = get_soup(file_path, is_local=True)
        data = scrape_dining_hall(local_test, url=str(file_path))
        print("Scraped Data:", data)