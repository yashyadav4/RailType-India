import os
import re
import json
import numpy as np
import pandas as pd

# 1. Resolve Script & Output Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(SCRIPT_DIR, "Delhi metro.csv")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "src", "data", "cities", "delhi")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# 2. Read Dataset
print(f"Reading dataset: {CSV_FILE}...")
df = pd.read_csv(CSV_FILE)

# Fix known CSV typos
df.loc[(df['Metro Line'] == 'Red line') & (df['ID (Station ID)'] == 5), 'Longitude'] = 77.268464

def clean_station_name(name):
    cleaned = re.sub(r'\(.*?\)|\[.*?\]', '', str(name)).strip()
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'^Noida\s+Sector\s+', 'Sector ', cleaned, flags=re.IGNORECASE)
    return cleaned

PREFIX_MAP = {
    "yellow_line": "YL", "blue_line": "BL", "blue_line_branch": "BLB",
    "pink_line": "PL", "red_line": "RL", "voilet_line": "VL",
    "magenta_line": "ML", "green_line": "GL", "green_line_branch": "GLB",
    "orange_line": "OL", "aqua_line": "AL", "rapid_metro": "RM", "gray_line": "GYL"
}

LINE_THEMES = {
    "yellow_line": {"name": "Yellow Line", "color": "#facc15"},
    "blue_line": {"name": "Blue Line", "color": "#2563eb"},
    "blue_line_branch": {"name": "Blue Line Branch", "color": "#3b82f6"},
    "pink_line": {"name": "Pink Line", "color": "#ec4899"},
    "red_line": {"name": "Red Line", "color": "#ef4444"},
    "voilet_line": {"name": "Violet Line", "color": "#8b5cf6"},
    "magenta_line": {"name": "Magenta Line", "color": "#d946ef"},
    "green_line": {"name": "Green Line", "color": "#22c55e"},
    "green_line_branch": {"name": "Green Line Branch", "color": "#16a34a"},
    "orange_line": {"name": "Orange Line (Airport Express)", "color": "#f97316"},
    "aqua_line": {"name": "Aqua Line", "color": "#06b6d4"},
    "rapid_metro": {"name": "Rapid Metro", "color": "#0284c7"},
    "gray_line": {"name": "Grey Line", "color": "#64748b"},
}

# 3. Clean Outlier Coordinates & Smooth Stacked Positions
def repair_and_smooth_coordinates(line_key, group):
    group = group.sort_values(by='ID (Station ID)').copy().reset_index(drop=True)
    n = len(group)
    
    lats = group['Latitude'].values.astype(float).copy()
    lngs = group['Longitude'].values.astype(float).copy()

    # Step A: Identify Outlier Coordinates (Spikes) & mark as NaN
    for i in range(n):
        if line_key == "aqua_line":
            if lngs[i] < 77.30 or lngs[i] > 77.60 or lats[i] < 28.35 or lats[i] > 28.65:
                lats[i], lngs[i] = np.nan, np.nan
        elif line_key == "blue_line" and i >= 44:
            if lngs[i] < 77.30:
                lats[i], lngs[i] = np.nan, np.nan
        elif line_key == "voilet_line":
            if lats[i] < 28.2 or lngs[i] < 77.1 or (i == 1 and lats[i] < 28.0):
                lats[i], lngs[i] = np.nan, np.nan

    # Step B: Interpolate corrupt NaNs & guarantee writable arrays (.to_numpy(copy=True))
    lats = pd.Series(lats).interpolate(method='linear').bfill().ffill().to_numpy(copy=True)
    lngs = pd.Series(lngs).interpolate(method='linear').bfill().ffill().to_numpy(copy=True)

    # Step C: Offset duplicate/stacked positions so stations step forward cleanly
    for i in range(1, n):
        if abs(lats[i] - lats[i-1]) < 0.0005 and abs(lngs[i] - lngs[i-1]) < 0.0005:
            dlat = lats[i-1] - lats[i-2] if i >= 2 else 0.004
            dlng = lngs[i-1] - lngs[i-2] if i >= 2 else 0.004
            lats[i] = lats[i-1] + (dlat * 0.7 if dlat != 0 else 0.003)
            lngs[i] = lngs[i-1] + (dlng * 0.7 if dlng != 0 else 0.003)

    group['Latitude'] = lats
    group['Longitude'] = lngs
    return group

# 4. Generate Cleaned JSON Files
processed_summary = []

for line_raw, group in df.groupby('Metro Line'):
    line_key = line_raw.lower().replace(' ', '_')
    theme = LINE_THEMES.get(line_key, {"name": line_raw.title(), "color": "#64748b"})
    prefix = PREFIX_MAP.get(line_key, "ST")
    
    repaired_group = repair_and_smooth_coordinates(line_key, group)
    
    stations = []
    for idx, (_, row) in enumerate(repaired_group.iterrows()):
        c_name = clean_station_name(row['Station Names'])
        st_code = f"{prefix}-{idx + 1:02d}"
        st_id = f"{line_key}_{idx + 1}"
        
        stations.append({
            "id": st_id,
            "code": st_code,
            "name": c_name,
            "hindiName": c_name,
            "coordinates": [round(float(row['Latitude']), 6), round(float(row['Longitude']), 6)]
        })
        
    line_data = {
        "id": line_key,
        "cityName": "Delhi NCR",
        "systemName": "Delhi Metro",
        "lineName": theme["name"],
        "color": theme["color"],
        "startTerminal": stations[0]['name'],
        "endTerminal": stations[-1]['name'],
        "totalStations": len(stations),
        "stations": stations
    }
    
    file_path = os.path.join(OUTPUT_DIR, f"{line_key}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(line_data, f, indent=2, ensure_ascii=False)
        
    processed_summary.append((f"{line_key}.json", len(stations), theme["name"]))

print("\n🎉 Route Generation Complete!")
for fname, count, name in processed_summary:
    print(f"  └─ {OUTPUT_DIR}/{fname} ({count} stations - {name})")