
import os
import shutil
import hashlib

def organize_pdfs(source_dir, target_dir):
    """
    Recursively finds all PDF files in source_dir and copies them to target_dir.
    Renames files ensuring valid Windows filenames and avoiding conflicts.
    """
    if not os.path.exists(target_dir):
        try:
            os.makedirs(target_dir)
        except OSError as e:
            print(f"Error creating directory {target_dir}: {e}")
            return

    source_dir = os.path.abspath(source_dir)
    target_dir = os.path.abspath(target_dir)

    print(f"Scanning for PDFs in (Source): {source_dir}")
    print(f"Copying to (Target): {target_dir}")
    
    # Valid characters for filenames, excluding space and dots for safety in prefix
    # Windows forbidden: < > : " / \ | ? *
    
    pdf_count = 0
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            file_lower = file.lower()
            if not file_lower.endswith(".pdf"):
                continue

            try:
                # Calculate relative path from source_dir
                rel_path = os.path.relpath(root, source_dir)
                
                # If file is directly in source_dir, rel_path is '.'
                if rel_path == ".":
                    prefix = ""
                else:
                    # Replace directory separators with underscores
                    clean_rel = rel_path.replace("\\", "_").replace("/", "_")
                    # Replace spaces and other potentially problematic chars in directory names
                    clean_rel = clean_rel.replace(" ", "_").replace(".", "")
                    prefix = clean_rel + "_"

                # Clean the filename itself: remove spaces
                clean_filename = file.replace(" ", "_")
                
                # Construct new filename
                new_filename = f"{prefix}{clean_filename}"
                
                # Full source and target paths
                source_path = os.path.join(root, file)
                target_path = os.path.join(target_dir, new_filename)
                
                # Copy with metadata (copy2)
                print(f"Copying: {new_filename}")
                shutil.copy2(source_path, target_path)
                pdf_count += 1
                
            except Exception as e:
                print(f"Error processing {file}: {e}")

    print(f"\nSuccessfully organized {pdf_count} PDF files into {target_dir}")

if __name__ == "__main__":
    # Explicitly using the user's project path
    PROJECT_ROOT = r"c:\Users\cho\Desktop\Temp\05 Code\260220_Architectural Thesis Advisor AI"
    SOURCE_DIR = os.path.join(PROJECT_ROOT, ".raw_data")
    TARGET_DIR = os.path.join(PROJECT_ROOT, "data", "pdfs")
    
    organize_pdfs(SOURCE_DIR, TARGET_DIR)
