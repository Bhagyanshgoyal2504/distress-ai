import os
import glob

# Find all tsx files
files = glob.glob('src/app/**/*.tsx', recursive=True)

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "http://localhost:8000" in content:
        # Add the API_BASE_URL constant at the top of the file after imports
        if "const API_BASE_URL" not in content:
            import_end_idx = content.find('\n\n')
            if import_end_idx != -1:
                content = content[:import_end_idx] + "\n\nconst API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';" + content[import_end_idx:]
            else:
                content = "const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';\n" + content
        
        # Replace occurrences
        content = content.replace("'http://localhost:8000", "API_BASE_URL + '")
        content = content.replace("`http://localhost:8000", "`\\${API_BASE_URL}")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

print("Done updating API URLs.")
