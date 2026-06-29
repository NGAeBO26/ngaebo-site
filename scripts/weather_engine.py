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

# --- 2: CONFIG & PATHS ---
def get_env_path(key, default):
    return os.environ.get(key, default)

# Dynamically determine the project root paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

DIST_DATA_DIR = os.path.join(ROOT_DIR, 'dist', 'data')
PUBLIC_DATA_DIR = os.path.join(ROOT_DIR, 'public', 'data')

# 🎯 IMMUTABLE PLATFORM GATEKEEPER:
# Since Vite builds mean /dist always exists, we target the environment by operating system.
# Windows machines force local workspace compilation. Linux containers target live production.
IS_WINDOWS_DEV = SCRIPT_DIR.startswith("C:") or sys.platform == "win32"

if not IS_WINDOWS_DEV and os.path.exists(DIST_DATA_DIR):
    BASE_LOCAL = DIST_DATA_DIR
    print(f"[ENGINE DIRECTION]: Production container detected. Writing to Ephemeral Storage: {BASE_LOCAL}")
else:
    BASE_LOCAL = PUBLIC_DATA_DIR
    print(f"[ENGINE DIRECTION]: Local Development environment verified. Writing to: {BASE_LOCAL}")

WEATHER_DIR = get_env_path("PYTHON_WEATHER_DIR", os.path.join(BASE_LOCAL, "weather"))
COND_DIR    = get_env_path("PYTHON_CONDITIONS_DIR", os.path.join(BASE_LOCAL, "conditions"))
JOY_DIR     = get_env_path("PYTHON_JOY_DIR", os.path.join(BASE_LOCAL, "joyscores"))
VIS_DIR     = get_env_path("PYTHON_VIS_DIR", os.path.join(BASE_LOCAL, "visualization"))
TAX_DIR     = get_env_path("PYTHON_TAX_DIR", os.path.join(BASE_LOCAL, "effortgauges"))

ANCHOR_PATH = os.path.join(ROOT_DIR, 'public', 'data', 'weather_anchors.json')
FEATURES_PATH = os.path.join(ROOT_DIR, 'public', 'data', 'rideguide_routes_v3.geojson')

if not os.path.exists(ANCHOR_PATH):
    ANCHOR_PATH = os.path.join(ROOT_DIR, 'dist', 'data', 'weather_anchors.json')
    FEATURES_PATH = os.path.join(ROOT_DIR, 'dist', 'data', 'rideguide_routes_v3.geojson')

# Standard user identity parameters
USER_AGENT  = 'RideGuideV3/1.0 (contact@rideguide.id)'

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
    try:
        if not os.path.exists(path):
            return None
        with open(path, 'r', encoding='utf-8') as f:
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

# 🎯 OPEN-METEO ARCHIVE CORE ACCUMULATION MATRIX INTEGRATION
def get_historical_saturation(lat, lon):
    """Calculates Saturation Index (S) in mm and converts 24h precip to inches via a 10-day decay sum."""
    try:
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=10)
        url = (f"https://archive-api.open-meteo.com/v1/archive?"
               f"latitude={lat}&longitude={lon}&start_date={start_date}&end_date={end_date}"
               f"&daily=precipitation_sum&timezone=auto")
        
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            precip_history = data.get('daily', {}).get('precipitation_sum', [])
            
            precip_24h_mm = precip_history[-1] if precip_history else 0.0
            precip_24h_in = round(precip_24h_mm * 0.0393701, 2)
            
            # Weighted sum decay function for soil saturation calculation metrics
            weighted_sum = sum([p * (1 - (i * 0.1)) for i, p in enumerate(reversed(precip_history))])
            return round(weighted_sum, 2), precip_24h_in
    except Exception as e:
        print(f"⚠️ Open-Meteo Saturation Tracking Warning: {e}")
        return 0.0, 0.0

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
    if not feat:
        print(f"ERROR: No metadata features found matching ID {route_id}")
        sys.exit(1)
    
    avg_grade = get_float(feat, "v3_avg_grade", 0.0)
    actual_miles = get_float(feat, "GIS_MILES", 3.9)

    # 🎯 ALIGN CONTEXT MAPS TO YOUR SPECIFIC STRING VALUE ATTRIBUTES
    v3_surface = str(feat.get("v3_surface", "Improved Gravel")).strip()
    print(f"[ENGINE AUDIT] Mapping Profile: {route_id}")
    print(f"[ENGINE AUDIT] Grade: {avg_grade} | Surface Layer Label: {v3_surface} | Miles: {actual_miles}")

    # 3. FETCH METEOROLOGICAL SPECS & CALCULATE HISTORICAL DECAY SATURATION
    periods = fetch_weather(anchor['lat'], anchor['lon'])
    if not periods:
        sys.exit(1)

    # Triggering the integrated Open-Meteo Archive decay pipeline
    sat_idx, historical_precip_24h = get_historical_saturation(anchor['lat'], anchor['lon'])
    print(f"[ENGINE AUDIT] 10-Day Weighted Saturation Calculated: {sat_idx} mm | Last 24h: {historical_precip_24h} in")

    processed_hours = []
    p_prob_raw = periods[0].get('probabilityOfPrecipitation', {}).get('value', 0) or 0
    best_joy = 0.0
    p_start, p_end = 8, 11

    for p in periods[:24]:
        temp = p['temperature']
        precip = p.get('probabilityOfPrecipitation', {}).get('value', 0) or 0
        
        # Calculate hourly context joy scores utilizing the historical saturation track metrics
        try:
            wind_speed = int(''.join(filter(str.isdigit, p.get('windSpeed', '5 mph'))))
        except:
            wind_speed = 5

        thermal_joy = 40
        if temp > 75: thermal_joy -= (temp - 75) * 2
        if temp < 55: thermal_joy -= (55 - temp) * 1.5
        
        surface_joy = 30
        if sat_idx > 1.5: surface_joy -= 15 
        elif sat_idx <= 0.5: surface_joy -= 10 
        
        aero_joy = 15 - (wind_speed * 0.5)
        safety_joy = 15 - (precip * 0.15)
        
        joy = round(max(0, min(100, thermal_joy + surface_joy + aero_joy + safety_joy)), 1)
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

    # ==========================================================================
    # 🎯 4. THERMODYNAMIC SSDI & EFFORT PENALTY CALCULATION
    # ==========================================================================
    v3_terrain_score = float(feat.get("v3_terrain_score", 4.0))
    current_temp = periods[0]['temperature']
    current_forecast = str(periods[0]['shortForecast']).lower()

    # ☀️ Calculate the Dynamic Thermodynamic Evaporation Modifier (Em)
    evap_modifier = 1.0
    
    if "sunny" in current_forecast or "clear" in current_forecast:
        if current_temp >= 85:
            evap_modifier = 0.4   # High thermal evaporation (Bakes surface crust)
        elif current_temp >= 70:
            evap_modifier = 0.6   # Moderate evaporation
        else:
            evap_modifier = 0.8   # Light evaporation
    elif "cloudy" in current_forecast or "overcast" in current_forecast:
        if current_temp >= 80:
            evap_modifier = 0.8   # Warm cloud cover limits evaporation slightly
        else:
            evap_modifier = 1.0   # Cool cloud cover traps ground moisture completely
            
    # If it is actively raining or storming, force full penalty baseline
    if "rain" in current_forecast or "shower" in current_forecast or "thunderstorm" in current_forecast:
        evap_modifier = 1.0

    # Apply Sensitivity Multipliers
    if "Native Red Clay" in v3_surface:
        sensitivity = 3.0
    elif "Improved Gravel" in v3_surface:
        sensitivity = 1.0
    elif "Paved / Chipseal" in v3_surface:
        sensitivity = 0.2
    else:
        sensitivity = 1.0

    # Enforce QGIS capped saturation layer threshold
    effective_sat = min(3.5, sat_idx)

    # Compute Balanced Thermodynamic SSDI Formula
    ssdi = round(v3_terrain_score + (effective_sat * sensitivity * evap_modifier), 1)

    print(f"[THERMO TRACE] Evap Mod: {evap_modifier} | Eff Sat: {effective_sat} | Final SSDI: {ssdi}")

    # Decompressed Condition Gateways Mapped to New Balanced Output
    if "Paved / Chipseal" in v3_surface and sat_idx > 0.1:
        cond, badge, color, traction_mod = "WET PAVEMENT", "wet", "#e66e00", 0.90
    elif ssdi < 2.5: 
        cond, badge, color, traction_mod = "DRY / DUSTY", "dry", "#4a5d23", 0.95
    elif ssdi < 4.5: 
        cond, badge, color, traction_mod = "IDEAL", "ideal", "#2e7d32", 1.0
    elif ssdi < 7.0: 
        cond, badge, color, traction_mod = "DAMP / PACK", "ideal", "#1b5e20", 0.98
    elif ssdi < 10.0: 
        cond, badge, color, traction_mod = "WET / SLICK", "wet", "#e66e00", 0.80
    else: 
        cond, badge, color, traction_mod = "MUDDY / SOFT", "muddy", "#a52d23", 0.50

    # --- 7. PHYSICS ---
    base_traction_idx = float(feat.get("v3_traction_idx", 0.9))
    base_wh = float(feat.get("v3_wh_km", 25.0))
    
    live_traction = round(base_traction_idx * traction_mod, 2)
    
    energy_penalty_factor = 0.15 if "Paved / Chipseal" in v3_surface else 0.40 
    energy_mod = 1.0 + ((1.0 - traction_mod) * energy_penalty_factor)
    
    live_wh = round(base_wh * energy_mod, 2)
    energy_penalty_pct = round(((live_wh / base_wh) - 1) * 100, 1)
    
    soil_status = "Dry" if sat_idx <= 0.5 else "Saturated" if sat_idx > 1.5 else "Damp"

    # 5. SURGICAL CONFIGURATION IO UPDATES
    weather_path = os.path.join(WEATHER_DIR, f"{route_id}_weather.json")
    if os.path.exists(weather_path):
        with open(weather_path, 'r', encoding='utf-8') as f:
            weather_data = json.load(f)
    else:
        weather_data = {"metadata": {"profile_id": route_id}, "hourly_data": []}
        
    ssdi_path = os.path.join(COND_DIR, f"{route_id}_ssdi.json")
    if os.path.exists(ssdi_path):
        with open(ssdi_path, 'r', encoding='utf-8') as f:
            ssdi_data = json.load(f)
    else:
        ssdi_data = {"profile_id": route_id, "physics": {}, "environment": {}, "access": {}}

    ssdi_data["ssdi_score"] = ssdi
    ssdi_data["badge_type"] = badge
    ssdi_data["condition"] = cond
    ssdi_data["style_color"] = color
    
    ssdi_data["physics"]["live_traction"] = live_traction
    ssdi_data["physics"]["live_wh_per_km"] = live_wh
    ssdi_data["physics"]["energy_penalty_pct"] = energy_penalty_pct
    ssdi_data["physics"]["v3_base_intensity"] = v3_terrain_score
    
    ssdi_data["environment"]["current_temp"] = periods[0]['temperature']
    ssdi_data["environment"]["saturation_index"] = round(sat_idx, 1)
    ssdi_data["environment"]["soil_status"] = soil_status

    if "access" not in ssdi_data: ssdi_data["access"] = {}
    ssdi_data["access"]["label"] = ssdi_data["access"].get("label", "OPEN")
    ssdi_data["access"]["status_code"] = ssdi_data["access"].get("status_code", "OK")

    with open(ssdi_path, 'w', encoding='utf-8') as f:
        json.dump(ssdi_data, f, indent=2)

    weather_data["current_temp"] = periods[0]['temperature']
    weather_data["temp_avg"] = round(sum([p['temperature'] for p in processed_hours[:12]]) / 12)
    weather_data["precip_24h"] = historical_precip_24h
    weather_data["primary_condition"] = periods[0]['shortForecast']
    weather_data["precip_prob"] = p_prob_raw
    weather_data["live_wh"] = live_wh
    weather_data["energy_penalty_pct"] = energy_penalty_pct

    weather_data["metadata"]["generated_at"] = datetime.now().isoformat()
    weather_data["metadata"]["saturation_index"] = round(sat_idx, 1)
    weather_data["metadata"]["ssdi"] = ssdi
    weather_data["metadata"]["soil_status"] = soil_status
    weather_data["metadata"]["prime_joy_score"] = round(best_joy, 1)
    weather_data["metadata"]["prime_window_start"] = p_start
    weather_data["metadata"]["prime_window_end"] = p_end
    weather_data["hourly_data"] = processed_hours

    with open(weather_path, 'w', encoding='utf-8') as f:
        json.dump(weather_data, f, indent=2)
    
    print(f"SUCCESS: {route_id} updated")
    sys.stdout.flush()

    # 6. TRIGGER VISUAL RENDERING ENGINES
    vis.generate_joy_dial_svg(route_id, weather_data, JOY_DIR, theme)
    vis.generate_conditions_wheel_svg(route_id, ssdi_data, VIS_DIR)
    vis.generate_effort_tax_svg(route_id, energy_penalty_pct, actual_miles, TAX_DIR, theme)

    print(f"SUCCESS: {route_id} updated | SSDI: {ssdi} | Penalty: {energy_penalty_pct}%")
    sys.stdout.flush()

if __name__ == "__main__":
    main()