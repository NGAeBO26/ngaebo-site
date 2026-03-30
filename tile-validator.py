import os
from PIL import Image

# Adjust if your project root is different
TILES_DIR = r"public/tiles"

print("Starting tile validation...")

# Collect all PNG tile paths first so we know total count
all_tiles = []
for root, dirs, files in os.walk(TILES_DIR):
    for file in files:
        if file.lower().endswith(".png"):
            all_tiles.append(os.path.join(root, file))

total = len(all_tiles)
print(f"Found {total} tiles to scan.")

bad_tiles = []
checked = 0
last_percent = -1

for path in all_tiles:
    checked += 1
    percent = int((checked / total) * 100)

    # Print progress only when percent changes
    if percent != last_percent:
        print(f"Progress: {percent}% ({checked}/{total})")
        last_percent = percent

    # 1. Check file size
    if os.path.getsize(path) == 0:
        bad_tiles.append((path, "zero-byte file"))
        continue

    # 2. Check PNG signature
    with open(path, "rb") as f:
        sig = f.read(8)
        if sig != b"\x89PNG\r\n\x1a\n":
            bad_tiles.append((path, "invalid PNG signature"))
            continue

    # 3. Try to decode with Pillow
    try:
        with Image.open(path) as img:
            img.verify()
    except Exception as e:
        bad_tiles.append((path, f"decode error: {e}"))
        continue

print("\n--- BAD TILES FOUND ---")
for path, reason in bad_tiles:
    print(f"{path} -> {reason}")

print(f"\nTotal bad tiles: {len(bad_tiles)}")