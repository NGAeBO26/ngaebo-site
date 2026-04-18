import os

BASE = r"C:\Dev\ngaebo-site\public\data"

FOLDERS = [
    "profiles",
    "trail-guides",
]

def ensure_folders():
    for f in FOLDERS:
        path = os.path.join(BASE, f)
        if not os.path.exists(path):
            os.makedirs(path)
            print(f"Created folder: {path}")
        else:
            print(f"Exists: {path}")

if __name__ == "__main__":
    ensure_folders()