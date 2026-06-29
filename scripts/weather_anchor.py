import os
import json
import sys

# --- CONFIG ---
SEGMENTS_DIR = r"C:\Dev\ngaebo-site\public\data\segments"
OUTPUT_DIR = r"C:\Dev\ngaebo-site\public\data"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "weather_anchors.json")

def log(message):
    """Helper to force terminal text to flush instantly for API tracking."""
    print(message)
    sys.stdout.flush()

def generate_anchors():
    log("🚀 Starting Sync Engine Scan...")
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    anchors = {}
    
    if not os.path.exists(SEGMENTS_DIR):
        log(f"❌ ERROR: Destination directory does not exist: {SEGMENTS_DIR}")
        return

    # Check everything in the folder
    all_files = os.listdir(SEGMENTS_DIR)
    
    # FIX: Check if 'segments.json' is anywhere in the file name string
    found_files = [f for f in all_files if "segments.json" in f]
    
    # Log a failure message if no matching files are found in the target directory
    if not found_files:
        log(f"❌ ERROR: No matching segment files found in {SEGMENTS_DIR}")
        log(f"Raw directory content inspected: {all_files}")
        return

    log(f"📦 Discovered {len(found_files)} potential segment data files.")

    for filename in found_files:
        # Normalize the naming convention to parse the Clean Route ID (e.g., '3_S1')
        route_id = filename.replace("_segments.json", "").replace("segments.json", "")
        file_path = os.path.join(SEGMENTS_DIR, filename)
        
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                
                # Verify structural validity before pulling array coordinates
                if 'features' not in data or not data['features']:
                    log(f"⚠️ WARNING: Missing features array in file: {filename}")
                    continue
                    
                first_coord = data['features'][0]['geometry']['coordinates'][0]
                
                anchors[route_id] = {
                    "lat": round(first_coord[1], 4),
                    "lon": round(first_coord[0], 4)
                }
                log(f"✅ Indexed: {route_id} -> Lat: {anchors[route_id]['lat']}, Lon: {anchors[route_id]['lon']}")
        except Exception as e:
            log(f"❌ Error processing file {filename}: {e}")

    # Finalize writing to table file
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(anchors, f, indent=2)
    
    log(f"\n✨ SUCCESS: {len(anchors)} route coordinates written to {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_anchors()