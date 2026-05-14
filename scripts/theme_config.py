# theme_config.py

# --- TYPOGRAPHY ---
FONT_FAMILY = "Montserrat, sans-serif"

BRAND_THEME = {
    # Performance Ramp
    "tier_1": "#8da65a",  # Olive (Easy)
    "tier_2": "#ebc850",  # Mellow Yellow (Moderate)
    "tier_3": "#af5519",  # Copper (Hard)
    "tier_4": "#a52d23",  # Flame Red (Extreme)

    # Accent Greens & UI
    "leaf_green":    "#4a5d23",
    "verdant_green": "#1b7f3a",
    "sunset_orange": "#e66e00",
    "sky_blue":      "#236ea0",

    # Greys & Typography
    "charcoal":      "#333333ff", # Primary text/lines
    "graphite":      "#4b4b4b",  # Secondary text
    "slate":         "#6e7c7c",  # UI Accents
    "cloud":         "#f7f7f7",  # Subtle dividers

    # Bases
    "bone_white":    "#f4f3ef",  # Specs Background
    "sand":          "#fdf4ce",  # Highlight Background
    "white":         "#ffffff"
}

SPARKLINE_DNA = {
    "dimensions": [800, 200],
    "padding": {"left": 85, "right": 40, "top": 15, "bottom": 40}, 
    "stroke_width": 2.5,
    "grid_interval_mi": 0.5,
    "curtain_opacity": 0.25
}

SPIDER_DNA = {
    "dimensions": [500, 500],
    "center": [250, 250],
    "max_radius": 150,
    "grid_steps": 10,       
    "badge_radius": 14,
    "badge_weight": 800,
    "badge_font_size": 10,
    "label_font_size": 14
}

def get_grade_color(grade):
    """Directional Grade Ramp (Matches Map Symbology)."""
    if grade < -4:    return BRAND_THEME["sky_blue"]
    if grade >= -4 and grade< 0:    return BRAND_THEME["leaf_green"]
    if grade >= 0 and grade < 4:    return BRAND_THEME["verdant_green"]
    if grade >= 4 and grade < 8:    return BRAND_THEME["tier_2"]
    if grade < 12:   return BRAND_THEME["sunset_orange"]
    return BRAND_THEME["tier_4"]

def get_score_color(score):
    """Surgical Color-to-Zone Sync (10-Point Scale)."""
    if score < 2.0: return BRAND_THEME["leaf_green"]     
    if score < 4.0: return BRAND_THEME["verdant_green"]         
    if score < 6.0: return BRAND_THEME["tier_2"]
    if score > 8.0: return BRAND_THEME["tier_3"]           
    return BRAND_THEME["tier_4"]                         

def get_joy_color(score):
    """Maps 0-100 Joy Score to Brand Theme Colors."""
    if score >= 90: return BRAND_THEME["verdant_green"] # Peak Joy/Hero Dirt
    if score >= 75: return BRAND_THEME["tier_2"]        # Good Conditions
    if score >= 60: return BRAND_THEME["sunset_orange"] # Moderate/Challenging
    return BRAND_THEME["sky_blue"]                      # Harsh/Cold/Wet

def get_tax_color(pct):
    """Maps effort tax percentage to brand intensity colors."""
    if pct >= 50: return BRAND_THEME["tier_4"]
    if pct >= 30: return BRAND_THEME["tier_3"]
    if pct >= 20: return BRAND_THEME["tier_2"]
    if pct >= 10: return BRAND_THEME["leaf_green"]
    return BRAND_THEME["sky_blue"]