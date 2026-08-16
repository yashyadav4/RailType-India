import os
import json

# 1. Point to your local JSON directory
TARGET_DIR = os.path.join("src", "data", "cities", "delhi")

# 2. Codes map
PREFIX_MAP = {
    "yellow_line": "YL", "blue_line": "BL", "blue_line_branch": "BLB",
    "pink_line": "PL", "red_line": "RL", "voilet_line": "VL",
    "magenta_line": "ML", "green_line": "GL", "green_line_branch": "GLB",
    "orange_line": "OL", "aqua_line": "AL", "rapid_metro": "RM", "gray_line": "GYL"
}

if not os.path.exists(TARGET_DIR):
    print(f"Error: Could not find directory {TARGET_DIR}")
else:
    print("\nCopy and paste this array into your src/data/cities/index.js file:\n")
    print("    lines: [")
    
    # 3. Read every JSON file and generate the updated catalog entry
    for f in sorted(os.listdir(TARGET_DIR)):
        if f.endswith('.json'):
            with open(os.path.join(TARGET_DIR, f), 'r', encoding='utf-8') as file:
                data = json.load(file)
                line_id = data.get("id")
                code = PREFIX_MAP.get(line_id, "ST")
                
                # Determine type (Line, Branch, Express)
                line_type = "Express" if "orange" in line_id else "Branch" if "branch" in line_id else "Line"
                
                print(f'      {{ id: "{line_id}", name: "{data.get("lineName")}", code: "{code}", color: "{data.get("color")}", stations: {data.get("totalStations")}, type: "{line_type}", terminals: "{data.get("startTerminal")} ↔ {data.get("endTerminal")}" }},')
    
    print("    ]")