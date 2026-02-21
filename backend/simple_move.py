
import os
import shutil
import sys

# Force output encoding to utf-8 for Windows console compatibility
sys.stdout.reconfigure(encoding='utf-8')

def organize_pdfs():
    # Define source and target directories
    # Use absolute paths to eliminate any ambiguity
    # NOTE: These paths are specific to the user's environment
    source_base = r"c:\Users\cho\Desktop\Temp\05 Code\260220_Architectural Thesis Advisor AI\.raw_data"
    target_dir = r"c:\Users\cho\Desktop\Temp\05 Code\260220_Architectural Thesis Advisor AI\data\pdfs"

    print(f"Source Base: {source_base}")
    print(f"Target Dir: {target_dir}")

    # Ensure target directory exists
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    # Walk through the source directory
    count = 0
    for root, dirs, files in os.walk(source_base):
        for file in files:
            if file.lower().endswith(".pdf"):
                source_path = os.path.join(root, file)
                
                # Create a simple, flat filename
                # To avoid long path issues, let's just use the filename prefix concept but keep it shorter if possible
                # Structure: [ParentFolder]_[FileName]
                parent_folder = os.path.basename(root)
                
                # Sanitize filename
                safe_parent = parent_folder.replace(" ", "_").replace(".", "")
                safe_file = file.replace(" ", "_")
                
                new_filename = f"{safe_parent}_{safe_file}"
                target_path = os.path.join(target_dir, new_filename)
                
                try:
                    shutil.copy2(source_path, target_path)
                    print(f"Copied: {new_filename}")
                    count += 1
                except Exception as e:
                    print(f"Failed to copy {file}: {e}")

    print(f"\nTotal PDFs copied: {count}")

if __name__ == "__main__":
    organize_pdfs()
