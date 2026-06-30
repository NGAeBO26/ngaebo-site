# scripts/test_endpoints.py
import requests
import logging
import sys

# 🎯 THE FIX: Force FileHandler to write UTF-8 explicitly, and keep the console safe from encoding drops
log_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')

file_handler = logging.FileHandler("workspace_test_suite.log", encoding="utf-8")
file_handler.setFormatter(log_formatter)

# Force the console stream handler to drop back to safe string substitutions if characters are missing
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(log_formatter)

logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler]
)

TARGET_HOST = "https://northgeorgiaebikes.com"

ENDPOINTS_TO_TEST = [
    {"path": "/", "method": "GET", "desc": "Homepage Base Render"},
    {"path": "/about", "method": "GET", "desc": "About Us Floating Canvas View"},
    {"path": "/api/products", "method": "GET", "desc": "Shopify Static Products Pipeline"},
    {"path": "/api/subscribe", "method": "POST", "desc": "MailerLite Lead Capture Form Gateway", "payload": {"email": "test_verification_runner@ngaebo.com"}}
]

def run_system_health_audit():
    # 🎯 UPDATED: Using safe text-based status tags to support Windows command line encodings safely
    logging.info(f"[START] Beginning End-to-End System Audit for: {TARGET_HOST}")
    pass_count = 0
    fail_count = 0

    for target in ENDPOINTS_TO_TEST:
        url = f"{TARGET_HOST}{target['path']}"
        logging.info(f"[RUN] Testing: {target['desc']} -> {url}")
        
        try:
            if target["method"] == "POST":
                response = requests.post(url, json=target.get("payload", {}), timeout=10)
            else:
                response = requests.get(url, timeout=10)
                
            if response.status_code == 200:
                logging.info(f"[PASS] Response received cleanly (HTTP 200)")
                pass_count += 1
            elif response.status_code == 401:
                logging.error(f"[FAIL] HTTP 401 Unauthorized! Secrets or App Spec parameters are misconfigured.")
                fail_count += 1
            else:
                logging.warning(f"[ALERT] Server returned unexpected code {response.status_code}")
                fail_count += 1
                
        except requests.exceptions.RequestException as e:
            logging.critical(f"[CRIT] Handshake connection failed completely: {e}")
            fail_count += 1

    logging.info("==================================================")
    logging.info(f"[SUMMARY] AUDIT COMPLETE: {pass_count} Passed | {fail_count} Failed/Blocked")
    logging.info("==================================================")

if __name__ == "__main__":
    run_system_health_audit()