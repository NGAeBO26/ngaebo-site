import json
import os
import sys
import math
import urllib.request
from datetime import datetime, timedelta

# --- 1: THEME INTEGRATION ---
try:
    import theme_config as theme
except ImportError:
    print("CRITICAL: theme_config.py not found in scripts folder.")
    sys.exit(1)

# --- 2: CONFIG & PATHS ---
ANCHOR_PATH = r"C:\Dev\ngaebo-site\public\data\weather_anchors.json"
WEATHER_DIR = r"C:\Dev\ngaebo-site\public\data\weather"
JOY_DIR     = r"C:\Dev\ngaebo-site\public\data\joyscores"
COND_DIR    = r"C:\Dev\ngaebo-site\public\data\conditions"
VIS_DIR     = r"C:\Dev\ngaebo-site\public\data\visualization"
USER_AGENT  = 'RideGuideV3/1.0 (contact@yourdomain.com)'

for d in [WEATHER_DIR, JOY_DIR, COND_DIR, VIS_DIR]:
    if not os.path.exists(d): os.makedirs(d)

# Wheel Theme
WHEEL_THEME = {
    "sky_blue": "#236ea0",      
    "faint_blue": "#e3f2fd",    
    "mud_brown": "#4d3a24",     
    "faint_brown": "#d9cbb9",   
    "rim_grey": "#d1d1d1",      
    "charcoal": "#333333",
    "spoke_grey": "#333333",
}

# --- 3: PHYSICS & JOY MODELS ---
def calculate_joy_v2(temp, humidity, wind_speed_str, precip_prob, sat_idx):
    try:
        wind_speed = int(''.join(filter(str.isdigit, wind_speed_str)))
    except: wind_speed = 5
    thermal_joy = 40
    if temp > 75: thermal_joy -= (temp - 75) * 2
    if temp < 55: thermal_joy -= (55 - temp) * 1.5
    if humidity > 60: thermal_joy -= (humidity - 60) * 0.5
    surface_joy = 30
    if sat_idx > 1.5: surface_joy -= 15 
    elif sat_idx <= 0.5: surface_joy -= 10 
    aero_joy = 15 - (wind_speed * 0.5)
    safety_joy = 15 - (precip_prob * 0.15)
    return round(max(0, min(100, thermal_joy + surface_joy + aero_joy + safety_joy)), 1)

def get_historical_saturation(lat, lon):
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
            weighted_sum = sum([p * (1 - (i * 0.1)) for i, p in enumerate(reversed(precip_history))])
            return round(weighted_sum, 2), precip_24h_in
    except: return 0.0, 0.0

# --- 4: JUMBO JOY DIAL GENERATOR ---
def generate_joy_dial_svg(pid, data):
    try:
        DAWN, DUSK = 6, 18 
        RADIUS, CX, CY = 380, 500, 480 
        ARC_WIDTH = 72 

        meta = data.get('metadata', {})
        start_h = max(6, min(16, meta.get('prime_window_start', 10)))
        end_h = max(8, min(18, meta.get('prime_window_end', 12)))
        prime_joy = meta.get('prime_joy_score', 0.0)
        
        hourly_map = {datetime.fromisoformat(p['startTime']).hour: p.get('joy_score', 50) 
                      for p in data.get('hourly_data', [])}

        def get_coords(h, r):
            angle = 180 - (h - 6) * 15 
            rad = math.radians(angle)
            return CX + r * math.cos(rad), CY - r * math.sin(rad)

        graticules = ""
        for i in range((DUSK - DAWN) * 2 + 1):
            h_val = DAWN + (i * 0.5)
            is_hour = i % 2 == 0
            t_in, t_out = (RADIUS - 45, RADIUS + 45) if is_hour else (RADIUS - 40, RADIUS - 5)
            x1, y1 = get_coords(h_val, t_in); x2, y2 = get_coords(h_val, t_out)
            graticules += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#444" stroke-width="{4 if is_hour else 2}" stroke-linecap="round" opacity="{0.6 if is_hour else 0.3}" />'

        bg_segments, highlights = "" , ""
        for h in range(DAWN, DUSK):
            score = hourly_map.get(h, 50)
            color = theme.get_joy_color(score)
            x1, y1 = get_coords(h, RADIUS); x2, y2 = get_coords(h + 1, RADIUS)
            path_d = f'M {x1:.1f} {y1:.1f} A {RADIUS} {RADIUS} 0 0 1 {x2:.1f} {y2:.1f}'
            is_prime = start_h <= h < end_h
            opacity = "1.0" if is_prime else "0.65"
            bg_segments += f'<path d="{path_d}" fill="none" stroke="{color}" stroke-width="{ARC_WIDTH}" stroke-opacity="{opacity}" />'
            if is_prime:
                highlights += f'<path d="{path_d}" fill="none" stroke="{color}" stroke-width="{ARC_WIDTH+12}" stroke-linecap="butt" />'

        hour_labels = ""
        anchors = [DAWN, 12, DUSK]
        for h in [6, 8, 10, 12, 14, 16, 18]:
            tx, ty = get_coords(h, RADIUS + 115) 
            display_h = h if h <= 12 else h - 12
            suffix = ("am" if h < 12 else "pm") if h in anchors else ""
            hour_labels += (f'<text x="{tx}" y="{ty}" text-anchor="middle" font-family="{theme.FONT_FAMILY}" font-size="50" font-weight="900" fill="#555">{display_h}{suffix}</text>')

        def get_hand(hour, width, opacity):
            tx, ty = get_coords(hour, RADIUS - 50)
            angle = 180 - (hour - 6) * 15
            rad_ortho = math.radians(angle + 90)
            bx1, by1 = CX + width * math.cos(rad_ortho), CY - width * math.sin(rad_ortho)
            bx2, by2 = CX - width * math.cos(rad_ortho), CY + width * math.sin(rad_ortho)
            return f'<polygon points="{tx:.1f},{ty:.1f} {bx1:.1f},{by1:.1f} {bx2:.1f},{by2:.1f}" fill="#333" opacity="{opacity}" />'

        hands = get_hand(start_h, 16, 0.8) + get_hand(end_h, 10, 0.4) + f'<circle cx="{CX}" cy="{CY}" r="14" fill="#333" />'
        bx, by = get_coords((start_h + end_h) / 2, RADIUS)
        
        svg = f"""<svg width="100%" height="100%" viewBox="0 0 1250 900" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(100, 100)">
                {bg_segments}{hour_labels}{highlights}{graticules}{hands}
                <circle cx="{bx}" cy="{by}" r="85" fill="white" stroke="{theme.get_joy_color(prime_joy)}" stroke-width="12" />
                <text x="{bx}" y="{by + 24}" text-anchor="middle" font-family="{theme.FONT_FAMILY}" font-size="62" font-weight="800" fill="#222">{prime_joy}</text>
            </g></svg>"""
        with open(os.path.join(JOY_DIR, f"{pid}_joy_dial.svg"), 'w') as f: f.write(svg)
    except Exception as e: print(f"JOY DIAL ERR: {e}")

# --- 5: CONDITION WHEEL GENERATOR ---
def generate_conditions_wheel_svg(pid, ssdi_data):
    try:
        sat_idx = ssdi_data.get("environment", {}).get("saturation_index", 0.0)
        sat_class = ssdi_data.get("environment", {}).get("soil_status", "").upper()
        rug_val = ssdi_data.get("ruggedness", {}).get("value", 0.0)
        rug_class = ssdi_data.get("ruggedness", {}).get("class", "").upper()
        
        sat_pct = min(100.0, sat_idx) / 100.0
        rug_pct = min(1.0, rug_val) / 1.0

        CX, CY, RADIUS, THICKNESS, HUB_RADIUS = 500, 500, 390, 60, 85 
        TEXT_RADIUS = RADIUS - (THICKNESS / 2) - 35 
        RIM_INNER_RADIUS = RADIUS - (THICKNESS/2) - 16

        def get_fill_geometry(is_top, pct):
            base_angle = 180 if is_top else 0
            sweep_angle = pct * 180
            steps = 40
            outer_r = RADIUS + (THICKNESS / 2)
            inner_r = RADIUS - (THICKNESS / 2)
            outer_pts = []
            for i in range(steps + 1):
                ang = math.radians(base_angle + (i/steps * sweep_angle))
                outer_pts.append(f"{CX + outer_r * math.cos(ang):.1f},{CY + outer_r * math.sin(ang):.1f}")
            inner_pts = []
            for i in range(steps, -1, -1):
                ang = math.radians(base_angle + (i/steps * sweep_angle))
                inner_pts.append(f"{CX + inner_r * math.cos(ang):.1f},{CY + inner_r * math.sin(ang):.1f}")
            return " ".join(outer_pts + inner_pts)

        def render_hemisphere(is_top):
            color_base = WHEEL_THEME["faint_blue"] if is_top else WHEEL_THEME["faint_brown"]
            grad_id = "topFillGrad" if is_top else "bottomFillGrad"
            pct = sat_pct if is_top else rug_pct
            start_deg = 180 if is_top else 0
            
            knobs = ""
            for i in range(25):
                rad = math.radians(start_deg + (i * 7.5))
                kx, ky = CX + (RADIUS + 40) * math.cos(rad), CY + (RADIUS + 40) * math.sin(rad)
                knobs += f'<circle cx="{kx:.1f}" cy="{ky:.1f}" r="25" fill="{color_base}" />\n'
            
            bg_path = f"M {CX-RADIUS if is_top else CX+RADIUS},{CY} A {RADIUS},{RADIUS} 0 0,1 {CX+RADIUS if is_top else CX-RADIUS},{CY}"
            
            return f"""<g id="{'top' if is_top else 'bottom'}">{knobs}
                <path d="{bg_path}" fill="none" stroke="{color_base}" stroke-width="{THICKNESS}" />
                <polygon points="{get_fill_geometry(is_top, pct)}" fill="url(#{grad_id})" />
            </g>"""

        svg = f"""<svg width="100%" height="100%" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="topFillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="{WHEEL_THEME['faint_blue']}" /><stop offset="100%" stop-color="{WHEEL_THEME['sky_blue']}" />
                </linearGradient>
                <linearGradient id="bottomFillGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="{WHEEL_THEME['faint_brown']}" /><stop offset="100%" stop-color="{WHEEL_THEME['mud_brown']}" />
                </linearGradient>
                <path id="topTextPath" d="M {CX-TEXT_RADIUS},{CY} A {TEXT_RADIUS},{TEXT_RADIUS} 0 0,1 {CX+TEXT_RADIUS},{CY}" />
                <path id="bottomTextPath" d="M {CX-TEXT_RADIUS},{CY} A {TEXT_RADIUS},{TEXT_RADIUS} 0 0,0 {CX+TEXT_RADIUS},{CY}" />
            </defs>

            {"".join([f'<line x1="{CX + HUB_RADIUS * math.cos(math.radians(i*30))}" y1="{CY + HUB_RADIUS * math.sin(math.radians(i*30))}" x2="{CX + RIM_INNER_RADIUS * math.cos(math.radians(i*30))}" y2="{CY + RIM_INNER_RADIUS * math.sin(math.radians(i*30))}" stroke="{WHEEL_THEME["charcoal"]}" stroke-width="4" opacity="0.6" />' for i in range(12)])}
            
            <circle cx="{CX}" cy="{CY}" r="{HUB_RADIUS}" fill="white" stroke="{WHEEL_THEME['charcoal']}" stroke-width="2" />
            <circle cx="{CX}" cy="{CY}" r="{RADIUS - (THICKNESS/2) - 8}" fill="none" stroke="{WHEEL_THEME['rim_grey']}" stroke-width="16" />
            
            {render_hemisphere(is_top=True)}
            {render_hemisphere(is_top=False)}
            
            <text font-family="Montserrat" font-size="70" font-weight="900" fill="{WHEEL_THEME['sky_blue']}" letter-spacing="8">
                <textPath href="#topTextPath" startOffset="50%" text-anchor="middle" dominant-baseline="hanging">{sat_class} ({int(sat_idx)}%)</textPath>
            </text>
            <text font-family="Montserrat" font-size="70" font-weight="900" fill="{WHEEL_THEME['mud_brown']}" letter-spacing="8">
                <textPath href="#bottomTextPath" startOffset="50%" text-anchor="middle" dominant-baseline="auto">
                    {rug_class} ({rug_val:.2f})
                </textPath>
            </text>
        </svg>"""

        with open(os.path.join(VIS_DIR, f"{pid}_conditions_wheel.svg"), "w") as f:
            f.write(svg)
    except Exception as e: print(f"WHEEL ERR: {e}")

# --- 6: CORE EXECUTION ---
def fetch_weather(route_id):
    with open(ANCHOR_PATH, 'r') as f: anchors = json.load(f)
    if route_id not in anchors: return
    lat, lon = anchors[route_id]['lat'], anchors[route_id]['lon']

    try:
        req = urllib.request.Request(f'https://api.weather.gov/points/{lat},{lon}', headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req) as res:
            f_url = json.loads(res.read().decode())['properties']['forecastHourly']
        with urllib.request.urlopen(urllib.request.Request(f_url, headers={'User-Agent': USER_AGENT})) as res:
            periods = json.loads(res.read().decode())['properties']['periods']

        sat_idx, precip_24h = get_historical_saturation(lat, lon)
        soil_status = "Dry" if sat_idx <= 0.5 else "Damp" if sat_idx <= 1.5 else "Saturated"

        processed_hours = []
        for p in periods[:24]:
            joy = calculate_joy_v2(p['temperature'], p['relativeHumidity'].get('value', 50), p['windSpeed'], p.get('probabilityOfPrecipitation', {}).get('value', 0) or 0, sat_idx)
            p['joy_score'] = joy
            processed_hours.append(p)

        # --- Constrained Prime Window Logic ---
        best_joy, p_start, p_end = 0, 10, 12

        # 1. Filter forecast for ONLY daylight hours (6am - 6pm)
        daylight_hours = [p for p in processed_hours if 6 <= datetime.fromisoformat(p['startTime']).hour < 18]

        # 2. Find best 2-hour daylight block
        if len(daylight_hours) >= 2:
            for i in range(len(daylight_hours) - 1):
                avg_joy = (daylight_hours[i]['joy_score'] + daylight_hours[i+1]['joy_score']) / 2
                if avg_joy > best_joy:
                    best_joy = avg_joy
                    p_start = datetime.fromisoformat(daylight_hours[i]['startTime']).hour
                    p_end = p_start + 2

        weather_output = {
            "current_temp": periods[0]['temperature'],
            "temp_avg": int(sum([p['temperature'] for p in processed_hours[:12]]) / 12),
            "precip_24h": precip_24h,
            "short": periods[0]['shortForecast'],
            "primary_condition": periods[0]['shortForecast'], # RESTORED KEY
            "precip_prob": periods[0].get('probabilityOfPrecipitation', {}).get('value', 0) or 0, # RESTORED KEY
            "metadata": {
                "profile_id": route_id, "generated_at": datetime.now().isoformat(),
                "saturation_index": sat_idx, "soil_status": soil_status,
                "prime_joy_score": round(best_joy, 1), "prime_window_start": p_start, "prime_window_end": p_end
            },
            "hourly_data": processed_hours
        }

        # SSDI & Wheel Generation
        ssdi_path = os.path.join(COND_DIR, f"{route_id}_ssdi.json")
        if os.path.exists(ssdi_path):
            with open(ssdi_path, 'r') as f:
                ssdi_data = json.load(f)
            generate_conditions_wheel_svg(route_id, ssdi_data)

        with open(os.path.join(WEATHER_DIR, f"{route_id}_weather.json"), 'w') as f:
            json.dump(weather_output, f, indent=2)
        
        generate_joy_dial_svg(route_id, weather_output)
        print(f"SUCCESS: Updated {route_id} | Sat: {sat_idx} | Joy: {round(best_joy,1)}")

    except Exception as e: print(f"FAILED: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1: fetch_weather(sys.argv[1])