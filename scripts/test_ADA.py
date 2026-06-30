# scripts/test_ADA.py
import json
import csv
import logging
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from axe_selenium_python import Axe

# Setup clean console streaming for Windows environments
log_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')

file_handler = logging.FileHandler("accessibility_sheet_export.log", encoding="utf-8")
file_handler.setFormatter(log_formatter)

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(log_formatter)

logging.basicConfig(level=logging.INFO, handlers=[file_handler, console_handler])

TARGET_HOST = "https://northgeorgiaebikes.com"

ROUTES_TO_AUDIT = [
    {"path": "/", "desc": "Homepage Grid Panel"},
    {"path": "/rides", "desc": "RideGuides Telemetry Map Workspace"},
    {"path": "/shop", "desc": "Shopify Retail Showcase Marketplace"},
    {"path": "/about", "desc": "Founder First-Person Biography Card"},
    {"path": "/bikes", "desc": "BikeFinder Multi-Step Advisor"},
    {"path": "/community", "desc": "Community Connections Dashboard"},
    {"path": "/legals", "desc": "Legal Policy Documents & Statements"},
    {"path": "/samples", "desc": "Free Sample Pack Lead Capture Funnel"},
    {"path": "/route-report", "desc": "Static Route Blueprint Report View"}
]

def infer_react_component(html_snippet, target_selector, page_desc):
    """
    Heuristic analyzer that maps raw HTML elements back to your source 
    React components based on your specific layout class footprints.
    """
    snippet_lower = html_snippet.lower()
    selector_lower = str(target_selector).lower()
    
    if "cookie" in snippet_lower or "cookie" in selector_lower:
        return "CookieBanner.tsx"
    if "capture" in snippet_lower or "leadform" in snippet_lower or "tactical" in snippet_lower:
        return "TacticalLeadForm.tsx"
    if "site-header" in snippet_lower or "nav-desktop" in snippet_lower or "rg-header" in snippet_lower:
        return "Header.tsx"
    if "lead-capture-footer" in snippet_lower or "funnel-container" in snippet_lower or "footer" in snippet_lower:
        return "Footer.tsx"
    if "digital-product-showcase" in snippet_lower:
        return "DigitalProductShowcase.tsx"
    if "featured-products" in snippet_lower or "featured-shop" in snippet_lower:
        return "FeaturedProducts.tsx"
    if "sample-hero" in snippet_lower or "sample-card" in snippet_lower:
        return "SamplePackHero.tsx"
    
    # Fallback to the main page wrapper name if it's a structural layout defect
    return f"Page: {page_desc}"

def run_flat_spreadsheet_audit():
    logging.info(f"[ADA] Starting tracking sheet compliance sweep for host: {TARGET_HOST}")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    # This array will store rows perfectly flat for easy spreadsheet mapping
    flat_rows_database = []
    
    try:
        for route in ROUTES_TO_AUDIT:
            target_url = f"{TARGET_HOST}{route['path']}"
            logging.info(f"[ADA] Processing: {route['path']}")
            
            try:
                driver.get(target_url)
                axe = Axe(driver)
                axe.inject()
                results = axe.run()
                violations = results.get("violations", [])
                
                # ─── 🎯 FLATTENING LOOP ───
                # Break out of the nested categories to parse items individually
                for violation in violations:
                    rule_id = violation.get("id")
                    description = violation.get("description")
                    help_url = violation.get("helpUrl")
                    
                    for node in violation.get("nodes", []):
                        target_selector = ", ".join(node.get("target", []))
                        html_snippet = node.get("html", "")
                        impact_level = node.get("impact", "unknown").upper()
                        failure_summary = node.get("failureSummary", "").replace("\n", " ")
                        
                        # Apply our heuristic component mapper
                        guessed_component = infer_react_component(html_snippet, target_selector, route["desc"])
                        
                        flat_rows_database.append({
                            "Component / File Context": guessed_component,
                            "Page Path": route["path"],
                            "Impact Severity": impact_level,
                            "Issue Type": rule_id,
                            "Target CSS Selector": target_selector,
                            "HTML Code Snippet": html_snippet,
                            "How to Fix / Failure Summary": failure_summary,
                            "Source File Line Reference": "MANUAL CHECK (Vite Bundled)", # Ready for you to note lines down
                            "Documentation / Help Link": help_url
                        })
                        
            except Exception as page_err:
                logging.error(f"[ADA-FAIL] Could not scan path {route['path']}: {page_err}")
                
        # ─── 🎯 SAVE TO FLATTENED JSON ───
        with open("flat_accessibility_report.json", "w", encoding="utf-8") as json_file:
            json.dump(flat_rows_database, json_file, indent=4, ensure_ascii=False)
            
        # ─── 🎯 SAVE DIRECTLY TO CSV FOR GOOGLE SHEETS ───
        csv_filename = "accessibility_tracking_sheet.csv"
        if flat_rows_database:
            csv_headers = flat_rows_database[0].keys()
            with open(csv_filename, "w", newline="", encoding="utf-8-sig") as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=csv_headers)
                writer.writeheader()
                writer.writerows(flat_rows_database)
                
        logging.info("==================================================")
        logging.info(f"🎉 SHEET COMPILATION FINISHED SUCCESSFULLY!")
        logging.info(f"📊 Total Individual Items Logged: {len(flat_rows_database)}")
        logging.info(f"💾 Imported Spreadsheet file created: {csv_filename}")
        logging.info("==================================================")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    run_flat_spreadsheet_audit()