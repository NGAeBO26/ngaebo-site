import json
import os
import math
from datetime import datetime

# Wheel Theme - Identical match to weather_engine.py
WHEEL_THEME = {
    "sky_blue": "#236ea0",      
    "faint_blue": "#e3f2fd",    
    "mud_brown": "#4d3a24",     
    "faint_brown": "#d9cbb9",   
    "rim_grey": "#d1d1d1",      
    "charcoal": "#333333",
    "spoke_grey": "#333333",
}

def generate_joy_dial_svg(pid, data, output_dir, theme):
    """Audited: Matches weather_engine.py Jumbo Joy Dial logic exactly."""
    try:
        target_dir = output_dir 
        if not os.path.exists(target_dir): os.makedirs(target_dir)

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
        with open(os.path.join(target_dir, f"{pid}_joy_dial.svg"), 'w') as f: f.write(svg)
    except Exception as e: print(f"JOY DIAL ERR: {e}")

def generate_conditions_wheel_svg(pid, ssdi_data, output_dir):
    """Audited: Matches weather_engine.py Condition Wheel logic exactly."""
    try:
        target_dir = output_dir
        if not os.path.exists(target_dir): os.makedirs(target_dir)

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

        with open(os.path.join(target_dir, f"{pid}_conditions_wheel.svg"), "w") as f:
            f.write(svg)
    
  
    except Exception as e: print(f"WHEEL ERR: {e}")

def generate_effort_tax_svg(pid, tax_pct, actual_miles, output_dir, theme):
    """
    Generates a high-impact Effort Tax rail with semi-circular ends.
    Uses theme_config.py to drive the dynamic color ramp.
    """
    try:
        if not os.path.exists(output_dir): os.makedirs(output_dir)

        # 1. GEOMETRY & DATA
        WIDTH, HEIGHT = 1000, 320 
        G_START, G_END = 80, 920 
        G_WIDTH, CY = G_END - G_START, 160 
        BAR_H = 65 
        
        # Pull dynamic color for pin from theme
        fill_color = theme.get_tax_color(tax_pct)
        fill_pct = min(1.0, max(0.0, tax_pct / 50))
        fill_x = G_START + (fill_pct * G_WIDTH)

        # 2. DYNAMIC GRADIENT GENERATION
        # We sample the theme ramp to build the static background rail
        gradient_stops = ""
        for pt in [0, 10, 20, 30, 40, 50]:
            offset = (pt / 50) * 100
            color = theme.get_tax_color(pt)
            gradient_stops += f'<stop offset="{offset}%" stop-color="{color}" />\n'

        # 3. DUAL-AXIS TICKS (Logic restored from svg_generator_v3.py)
        ticks = ""
        for i in range(51): 
            tx = G_START + (i / 50 * G_WIDTH)
            is_maj = i % 10 == 0
            t_l = 45 if is_maj else 20
            ticks += f'<line x1="{tx}" y1="{CY-(BAR_H/2)-8}" x2="{tx}" y2="{CY-(BAR_H/2)-8-t_l}" stroke="{theme.BRAND_THEME["charcoal"]}" stroke-width="{6 if is_maj else 2}" opacity="0.3" />'
            ticks += f'<line x1="{tx}" y1="{CY+(BAR_H/2)+8}" x2="{tx}" y2="{CY+(BAR_H/2)+8+t_l}" stroke="{theme.BRAND_THEME["charcoal"]}" stroke-width="{6 if is_maj else 2}" opacity="0.3" />'
            if is_maj:
                # Top Axis: Tax Percent
                ticks += f'<text x="{tx}" y="{CY-110}" text-anchor="middle" font-family="{theme.FONT_FAMILY}" font-size="42" font-weight="700" fill="#777">{i}%</text>'
                # Bottom Axis: Dynamic Mileage
                ticks += f'<text x="{tx}" y="{CY+125}" text-anchor="middle" font-family="{theme.FONT_FAMILY}" font-size="38" font-weight="700" fill="#777">{actual_miles * (1 + (i / 100)):.1f}</text>'
        
        # 4. SVG ASSEMBLY
        svg = f"""<svg width="100%" height="100%" viewBox="0 0 1000 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="taxGrad" x1="0%" y1="0%" x2="100%" y2="0%">{gradient_stops}</linearGradient>
                <clipPath id="taxClip"><rect x="{G_START}" y="{CY-(BAR_H/2)-2}" width="{fill_x - G_START}" height="{BAR_H+4}" rx="{BAR_H/2}" /></clipPath>
            </defs>
            <rect x="{G_START}" y="{CY-(BAR_H/2)}" width="{G_WIDTH}" height="{BAR_H}" fill="url(#taxGrad)" fill-opacity="0.18" rx="{BAR_H/2}" />
            <rect x="{G_START}" y="{CY-(BAR_H/2)-1}" width="{G_WIDTH}" height="{BAR_H+2}" fill="url(#taxGrad)" clip-path="url(#taxClip)" rx="{BAR_H/2}" />
            {ticks}
            <polygon points="{fill_x},{CY-(BAR_H/2)-12} {fill_x-28},{CY-85} {fill_x+28},{CY-85}" fill="{fill_color}" />
        </svg>"""

        with open(os.path.join(output_dir, f"{pid}_effort_tax.svg"), 'w') as f: 
            f.write(svg)
            
    except Exception as e: print(f"EFFORT TAX ERR: {e}")