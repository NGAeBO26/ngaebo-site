/* src/config/theme_config.ts */

// --- TYPOGRAPHY ---
export const FONT_FAMILY = "Montserrat, sans-serif";

export const BRAND_THEME = {
    // Performance Ramp
    tier_1: "#8da65a",  // Olive (Easy)
    tier_2: "#ebc850",  // Mellow Yellow (Moderate)
    tier_3: "#af5519",  // Copper (Hard)
    tier_4: "#a52d23",  // Flame Red (Extreme)

    // Accent Greens & UI
    leaf_green:    "#4a5d23",
    verdant_green: "#1b7f3a",
    sunset_orange: "#e66e00",
    sky_blue:      "#236ea0",

    // Greys & Typography
    charcoal:      "#333333",
    graphite:      "#4b4b4b",
    slate:         "#6e7c7c",
    cloud:         "#f7f7f7",

    // Bases
    bone_white:    "#f4f3ef",
    sand:          "#fdf4ce",
    white:         "#ffffff"
};

// --- LOGIC RAMPS ---

export const get_grade_color = (grade: number): string => {
    if (grade < -4) return BRAND_THEME.sky_blue;
    if (grade < 0)  return BRAND_THEME.leaf_green;
    if (grade < 4)  return BRAND_THEME.verdant_green;
    if (grade < 8)  return BRAND_THEME.tier_2;
    if (grade < 12) return BRAND_THEME.sunset_orange;
    return BRAND_THEME.tier_4;
};

export const get_score_color = (score: number): string => {
    if (score < 2.0) return BRAND_THEME.leaf_green;     
    if (score < 4.0) return BRAND_THEME.verdant_green;         
    if (score < 6.0) return BRAND_THEME.tier_2;
    if (score > 8.0) return BRAND_THEME.tier_3;           
    return BRAND_THEME.tier_4;                         
};

export const get_joy_color = (score: number): string => {
    if (score >= 90) return BRAND_THEME.verdant_green;
    if (score >= 75) return BRAND_THEME.tier_2;
    if (score >= 60) return BRAND_THEME.sunset_orange;
    return BRAND_THEME.sky_blue;
};

export const get_tax_color = (pct: number): string => {
    if (pct >= 50) return BRAND_THEME.tier_4;
    if (pct >= 30) return BRAND_THEME.tier_3;
    if (pct >= 20) return BRAND_THEME.tier_2;
    if (pct >= 10) return BRAND_THEME.leaf_green;
    return BRAND_THEME.sky_blue;
};