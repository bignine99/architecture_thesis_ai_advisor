import os
import shutil
import glob

# Paths - using absolute paths
RAW_DATA = r"C:\Users\cho\Desktop\Temp\05 Code\260220_Architectural Thesis Advisor AI\.raw_data"
TARGET_DIR = r"C:\Users\cho\Desktop\Temp\05 Code\260220_Architectural Thesis Advisor AI\data\pdfs"

# Create target directory
os.makedirs(TARGET_DIR, exist_ok=True)
print(f"Target directory: {TARGET_DIR}")

# Find all PDFs recursively
pdf_files = glob.glob(os.path.join(RAW_DATA, "**", "*.pdf"), recursive=True)
print(f"Found {len(pdf_files)} PDF files in .raw_data")

copied = 0
for pdf_path in pdf_files:
    filename = os.path.basename(pdf_path)
    target_path = os.path.join(TARGET_DIR, filename)
    
    # Handle duplicate filenames
    if os.path.exists(target_path):
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(target_path):
            target_path = os.path.join(TARGET_DIR, f"{base}_{counter}{ext}")
            counter += 1
    
    try:
        shutil.copy2(pdf_path, target_path)
        copied += 1
        print(f"  [{copied}] Copied: {os.path.basename(target_path)}")
    except Exception as e:
        print(f"  Error copying {filename}: {e}")

print(f"\nDone! Copied {copied} PDFs to {TARGET_DIR}")
