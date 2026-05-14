import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta
import infographic_generator as vis

# --- Phase 1: Directory Safety Check ---
def ensure_dirs():
    for d in [WEATHER_DIR, JOY_DIR, COND_DIR, VIS_DIR, TAX_DIR]:
        if not os.path.exists(d):
            print(f"Creating missing directory: {d}")
            os.makedirs(d, exist_ok=True)

ensure_dirs()

# --- 1: THEME INTEGRATION ---
try:
    import theme_config as theme
except ImportError:
    print("CRITICAL: theme_config.py not found.")
    sys.exit(1)

# --- 2: CONFIG & PATHS (Updated for Env-Awareness) ---
def get_env_path(key, default):
    return os.environ.get(key, default)

# Base directory for absolute local paths
BASE_LOCAL = r"C:\Dev\ngaebo-site\public\data"

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
    base_wh   = get_float(feat, "v3_wh_per_km", 25.0)
    # Correctly pulling GIS_MILES for the tax gauge
    actual_miles = get_float(feat, "GIS_MILES", 3.9)

    print(f"[ENGINE AUDIT] Mapping Profile: {route_id}")
    print(f"[ENGINE AUDIT] Found properties: {list(feat.keys()) if feat else 'NONE - Lookup Failed'}")
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

    # 4. SSDI & EFFORT PENALTY CALCULATION
    saturation = min(10, p_24 * 50)
    grade_factor = 2.5 if avg_grade < 3 else 4.0 if avg_grade < 6 else 6.0
    surface_factor = 1.5 if "AGG" in surface else 3.5 if "NATIVE" in surface else 2.5
    
    ssdi = round(min(10, (saturation * 0.2) + grade_factor + surface_factor), 1)
    traction = 1.0 - (ssdi * 0.02)
    live_wh = round(base_wh / traction, 2)
    penalty = round(((live_wh / base_wh) - 1) * 100, 1)
    
    soil_status = "Dry / Dusty" if saturation < 2 else "Damp" if saturation < 5 else "Saturated"

    # 5. SURGICAL SSDI UPDATE (Preserves GIS Metadata)
    ssdi_path = os.path.join(COND_DIR, f"{route_id}_ssdi.json")
    
    # Load existing rich data if available, otherwise start with base schema
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

    # Map dynamic values into the existing schema
    ssdi_data["ssdi_score"] = ssdi
    ssdi_data["badge_type"] = "wet" if saturation > 4 else "ideal"
    ssdi_data["condition"] = "WET / SLICK" if ssdi > 7 else "IDEAL"
    ssdi_data["style_color"] = "#e66e00" if ssdi > 5 else "#2e7d32"
    
    # Update nested objects used by widgets
    if "physics" not in ssdi_data: ssdi_data["physics"] = {}
    ssdi_data["physics"]["live_traction"] = traction
    ssdi_data["physics"]["energy_penalty_pct"] = penalty
    
    if "environment" not in ssdi_data: ssdi_data["environment"] = {}
    ssdi_data["environment"]["current_temp"] = periods[0]['temperature']
    ssdi_data["environment"]["saturation_index"] = round(saturation, 1)

    # Ensure access label remains visible
    if "access" not in ssdi_data: ssdi_data["access"] = {}
    ssdi_data["access"]["label"] = "OPEN"
    ssdi_data["access"]["status_code"] = "OK"

    # Save merged data
    with open(ssdi_path, 'w') as f:
        json.dump(ssdi_data, f, indent=2)

    # 5. SURGICAL WEATHER UPDATE (Preserves Static Metadata)
    weather_path = os.path.join(WEATHER_DIR, f"{route_id}_weather.json")
    
    # Load existing data to preserve static keys, or create base if missing
    if os.path.exists(weather_path):
        with open(weather_path, 'r') as f:
            weather_data = json.load(f)
    else:
        weather_data = {
            "metadata": {"profile_id": route_id},
            "hourly_data": []
        }

    # Update Live Meteorological Values
    weather_data["current_temp"] = periods[0]['temperature']
    weather_data["temp_avg"] = round(sum([p['temperature'] for p in processed_hours[:12]]) / 12)
    weather_data["precip_24h"] = round(p_24, 2)
    weather_data["primary_condition"] = periods[0]['shortForecast']
    weather_data["precip_prob"] = p_prob_raw
    weather_data["live_wh"] = live_wh
    weather_data["effort_penalty"] = penalty

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

    # 6. TRIGGER VISUAL GENERATORS
    vis.generate_joy_dial_svg(route_id, weather_data, JOY_DIR, theme)
    vis.generate_conditions_wheel_svg(route_id, ssdi_data, VIS_DIR)
    
    # HANDSHAKE FIX: Passing ALL 5 required positional arguments
    vis.generate_effort_tax_svg(route_id, penalty, actual_miles, TAX_DIR, theme)

    print(f"SUCCESS: {route_id} updated | SSDI: {ssdi} | Penalty: {penalty}%")

if __name__ == "__main__":
    main()