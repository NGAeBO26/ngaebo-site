import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta
import infographic_generator as vis



# --- 1: THEME INTEGRATION ---
try:
    import theme_config as theme
except ImportError:
    print("CRITICAL: theme_config.py not found.")
    sys.exit(1)

# --- 2: CONFIG & PATHS (Updated for Env-Awareness) ---
def get_env_path(key, default):
    return os.environ.get(key, default)

# 1. Dynamically determine the project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

# Base directory for absolute local paths
BASE_LOCAL = os.path.join(ROOT_DIR, 'public', 'data')

WEATHER_DIR = get_env_path("PYTHON_WEATHER_DIR", os.path.join(BASE_LOCAL, "weather"))
COND_DIR    = get_env_path("PYTHON_CONDITIONS_DIR", os.path.join(BASE_LOCAL, "conditions"))
# ADD THIS LINE: It was missing and caused the crash
JOY_DIR     = get_env_path("PYTHON_JOY_DIR", os.path.join(BASE_LOCAL, "joyscores"))
VIS_DIR     = get_env_path("PYTHON_VIS_DIR", os.path.join(BASE_LOCAL, "visualization"))
TAX_DIR     = get_env_path("PYTHON_TAX_DIR", os.path.join(BASE_LOCAL, "effortgauges"))

# Other required anchors
ANCHOR_PATH = os.path.join(BASE_LOCAL, "weather_anchors.json")
FEATURES_PATH = os.path.join(BASE_LOCAL, "v3_large_sample_testfeatures.geojson")
USER_AGENT  = 'RideGuideV3/1.0 (contact@rideguide.id)'

# --- Phase 1: Directory Safety Check ---
def ensure_dirs():
    for d in [WEATHER_DIR, JOY_DIR, COND_DIR, VIS_DIR, TAX_DIR]:
        if not os.path.exists(d):
            print(f"Creating missing directory: {d}")
            os.makedirs(d, exist_ok=True)

ensure_dirs()

# --- 3: UTILITIES & MODELS ---
def get_float(data, key, default=0.0):
    try:
        val = data.get(key, default)
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default

def get_route_props_from_geojson(profile_id, path):
    """Audited: Crawls GeoJSON features to find matching profile_id"""
    try:
        if not os.path.exists(path):
            return None
        with open(path, 'r') as f:
            gj = json.load(f)
            for feature in gj.get('features', []):
                props = feature.get('properties', {})
                if props.get('profile_id') == profile_id:
                    return props
    except Exception as e:
        print(f"GeoJSON Error: {e}")
    return None

def fetch_weather(lat, lon):
    try:
        url = f"https://api.weather.gov/points/{lat},{lon}"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            forecast_url = data['properties']['forecastHourly']
            
        req_f = urllib.request.Request(forecast_url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req_f) as res_f:
            return json.loads(res_f.read().decode())['properties']['periods']
    except Exception as e:
        print(f"Fetch Error: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python weather_engine.py <route_id>")
        sys.exit(1)

    route_id = sys.argv[1]
    
    # 1. LOAD ANCHOR
    with open(ANCHOR_PATH, 'r') as f:
        anchors = json.load(f)
    
    anchor = anchors.get(route_id)
    if not anchor:
        print(f"ERROR: Anchor not found for {route_id}")
        sys.exit(1)

    # 2. LOAD ROUTE METRICS FROM GEOJSON
    feat = get_route_props_from_geojson(route_id, FEATURES_PATH)
    
    avg_grade = get_float(feat, "v3_avg_grade", 0.0)
    surface   = str(feat.get("SURFACE_TY", "NATIVE"))
    base_wh = float(feat.get("v3_wh_km", 25.0))
    # Correctly pulling GIS_MILES for the tax gauge
    actual_miles = get_float(feat, "GIS_MILES", 3.9)

    print(f"[ENGINE AUDIT] Mapping Profile: {route_id}")
    # print(f"[ENGINE AUDIT] Found properties: {list(feat.keys()) if feat else 'NONE - Lookup Failed'}")
    print(f"[ENGINE AUDIT] Grade: {avg_grade} | Surface: {surface} | Miles: {actual_miles}")

    # 3. FETCH & PROCESS WEATHER
    periods = fetch_weather(anchor['lat'], anchor['lon'])
    if not periods:
        sys.exit(1)

    processed_hours = []
    p_24 = 0.0
    p_prob_raw = periods[0].get('probabilityOfPrecipitation', {}).get('value', 0) or 0
    best_joy = 0.0
    p_start, p_end = 8, 11

    for p in periods[:24]:
        temp = p['temperature']
        precip = p.get('probabilityOfPrecipitation', {}).get('value', 0) or 0
        p_24 += (precip / 100.0) * 0.1 
        
        joy = 100 - (abs(70 - temp) * 0.5) - (precip * 0.4)
        if joy > best_joy:
            best_joy = joy

        processed_hours.append({
            "number": p['number'],
            "startTime": p['startTime'],
            "temperature": temp,
            "probabilityOfPrecipitation": p.get('probabilityOfPrecipitation', {}),
            "windSpeed": p.get('windSpeed', '0 mph'),
            "windDirection": p.get('windDirection', ''),
            "shortForecast": p['shortForecast'],
            "joy_score": round(max(0, joy), 1)
        })

    # 4. SSDI & EFFORT PENALTY CALCULATION (RESTORED TO QGIS PARITY)
    # Pull GIS attributes from the feature (passed into the engine from the GeoJSON)
    v3_terrain_score = float(feat.get("v3_terrain_score", 4.0))
    v3_surface = str(feat.get("v3_surface", "AGG")).upper()
    
    # Calculate Saturation Index (JIT)
    saturation = min(10, p_24 * 50)
    
    # Exact QGIS Sensitivity Multiplier
    sensitivity = 3.0 if "NAT" in v3_surface else 1.0 if "AGG" in v3_surface else 0.2
    
    # Exact QGIS SSDI Formula (No caps, no 0.2 dampener)
    ssdi = round(v3_terrain_score + (saturation * sensitivity), 1)

    # Exact QGIS Classification Logic
    if "PAV" in v3_surface and saturation > 0.1:
        cond, badge, color, traction_mod = "WET PAVEMENT", "wet", "#e66e00", 0.90
    elif ssdi < 2.5: 
        cond, badge, color, traction_mod = "DRY / DUSTY", "dry", "#4a5d23", 0.95
    elif ssdi < 4.5: 
        cond, badge, color, traction_mod = "IDEAL", "ideal", "#2e7d32", 1.0
    elif ssdi < 7.0: 
        cond, badge, color, traction_mod = "WET / SLICK", "wet", "#e66e00", 0.75
    else: 
        cond, badge, color, traction_mod = "MUDDY / SOFT", "muddy", "#a52d23", 0.50

    # --- 7. PHYSICS (RESTORED TO QGIS SOURCE OF TRUTH) ---
    # Pull base constants from the GIS feature
    base_traction_idx = float(feat.get("v3_traction_idx", 0.9))
    base_wh = float(feat.get("v3_wh_km", 25.0))
    
    # Calculate Live Traction (using the traction_mod from your classification block)
    live_traction = round(base_traction_idx * traction_mod, 2)
    
    # Physics Dampening logic
    energy_penalty_factor = 0.15 if "PAV" in v3_surface else 0.40 
    energy_mod = 1.0 + ((1.0 - traction_mod) * energy_penalty_factor)
    
    # Final Physics values
    live_wh = round(base_wh * energy_mod, 2)
    energy_penalty_pct = round(((live_wh / base_wh) - 1) * 100, 1)
    
    # Map soil status label based on your index
    soil_status = "Dry / Dusty" if saturation < 2 else "Damp" if saturation < 5 else "Saturated"

    # 5. SURGICAL SSDI UPDATE (Preserves GIS Metadata)
    weather_path = os.path.join(WEATHER_DIR, f"{route_id}_weather.json")
    
    # Initialize weather_data BEFORE assigning to it
    if os.path.exists(weather_path):
        with open(weather_path, 'r') as f:
            weather_data = json.load(f)
    else:
        weather_data = {
            "metadata": {"profile_id": route_id},
            "hourly_data": []
        }
    ssdi_path = os.path.join(COND_DIR, f"{route_id}_ssdi.json")
    
    if os.path.exists(ssdi_path):
        with open(ssdi_path, 'r') as f:
            ssdi_data = json.load(f)
    else:
        ssdi_data = {
            "profile_id": route_id,
            "physics": {},
            "environment": {},
            "access": {}
        }

    # Map dynamic values into the existing schema using QGIS logic
    ssdi_data["ssdi_score"] = ssdi
    ssdi_data["badge_type"] = badge
    ssdi_data["condition"] = cond
    ssdi_data["style_color"] = color
    
    if "physics" not in ssdi_data: ssdi_data["physics"] = {}
    ssdi_data["physics"]["live_traction"] = live_traction
    ssdi_data["physics"]["live_wh_per_km"] = live_wh
    ssdi_data["physics"]["energy_penalty_pct"] = energy_penalty_pct
    ssdi_data["physics"]["v3_base_intensity"] = v3_terrain_score
    
    if "environment" not in ssdi_data: ssdi_data["environment"] = {}
    ssdi_data["environment"]["current_temp"] = periods[0]['temperature']
    ssdi_data["environment"]["saturation_index"] = round(saturation, 1)
    ssdi_data["environment"]["soil_status"] = soil_status

    # Preserve or set default access
    if "access" not in ssdi_data: ssdi_data["access"] = {}
    ssdi_data["access"]["label"] = ssdi_data["access"].get("label", "OPEN")
    ssdi_data["access"]["status_code"] = ssdi_data["access"].get("status_code", "OK")

    with open(ssdi_path, 'w') as f:
        json.dump(ssdi_data, f, indent=2)

    # Update Live Meteorological Values
    weather_data["current_temp"] = periods[0]['temperature']
    weather_data["temp_avg"] = round(sum([p['temperature'] for p in processed_hours[:12]]) / 12)
    weather_data["precip_24h"] = round(p_24, 2)
    weather_data["primary_condition"] = periods[0]['shortForecast']
    weather_data["precip_prob"] = p_prob_raw
    weather_data["live_wh"] = live_wh
    weather_data["energy_penalty_pct"] = energy_penalty_pct

    # Update Metadata Block (Preserving other sub-keys)
    if "metadata" not in weather_data: weather_data["metadata"] = {}
    weather_data["metadata"]["generated_at"] = datetime.now().isoformat()
    weather_data["metadata"]["saturation_index"] = round(saturation, 1)
    weather_data["metadata"]["ssdi"] = ssdi
    weather_data["metadata"]["soil_status"] = soil_status
    weather_data["metadata"]["prime_joy_score"] = round(best_joy, 1)
    weather_data["metadata"]["prime_window_start"] = p_start
    weather_data["metadata"]["prime_window_end"] = p_end
    
    # Update Hourly Array
    weather_data["hourly_data"] = processed_hours

    # Save Merged Result
    with open(weather_path, 'w') as f:
        json.dump(weather_data, f, indent=2)
    
    # --- PYTHON EARLY EXIT MESSAGE ---
    print(f"SUCCESS: {route_id} updated")
    sys.stdout.flush() # Force Node.js to see the message NOW
    # ----------------------------------------

    # 6. TRIGGER VISUAL GENERATORS
    vis.generate_joy_dial_svg(route_id, weather_data, JOY_DIR, theme)
    vis.generate_conditions_wheel_svg(route_id, ssdi_data, VIS_DIR)
    
    # CHANGE: Use energy_penalty_pct instead of the undefined 'penalty'
    vis.generate_effort_tax_svg(route_id, energy_penalty_pct, actual_miles, TAX_DIR, theme)

    # Update your final print statement as well for accurate logging
    print(f"SUCCESS: {route_id} updated | SSDI: {ssdi} | Penalty: {energy_penalty_pct}%")

if __name__ == "__main__":
    main()