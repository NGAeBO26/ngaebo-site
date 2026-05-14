import os
import json

# --- CONFIG ---
# Source: Where your NEW .json segment files live
SEGMENTS_DIR = r"C:\Dev\ngaebo-site\public\data\segments"
# Destination: The master lookup file for the server
OUTPUT_DIR = r"C:\Dev\ngaebo-site\public\data"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "weather_anchors.json")

def generate_anchors():
    # Ensure the output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    anchors = {}
    
    if not os.path.exists(SEGMENTS_DIR):
        print(f"ERROR: Could not find segments folder at {SEGMENTS_DIR}")
        return

    # Scan for _segments.json files
    found_files = [f for f in os.listdir(SEGMENTS_DIR) if f.endswith("_segments.json")]
    
    if not found_files:
        print(f"No _segments.json files found in {SEGMENTS_DIR}")
        return

    for filename in found_files:
        # Strip the suffix to get the ID (e.g., 28-2_S1)
        route_id = filename.replace("_segments.json", "")
        file_path = os.path.join(SEGMENTS_DIR, filename)
        
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                
                # Based on 28-2_S1_segments.json structure:
                # features[0] -> geometry -> coordinates[0]
                # Coordinates are [longitude, latitude]
                first_coord = data['features'][0]['geometry']['coordinates'][0]
                
                anchors[route_id] = {
                    "lat": round(first_coord[1], 4),
                    "lon": round(first_coord[0], 4)
                }
                print(f"✅ Indexed: {route_id} ({anchors[route_id]['lat']}, {anchors[route_id]['lon']})")
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")

    # Save the master lookup table
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(anchors, f, indent=2)
    
    print(f"\n✨ SUCCESS: {len(anchors)} routes mapped to {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_anchors()