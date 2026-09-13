import glob

files = glob.glob('src/app/**/*.tsx', recursive=True)

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the bug
    bad_string = "const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL + '';"
    good_string = "const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';"
    
    if bad_string in content:
        content = content.replace(bad_string, good_string)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file_path}")

print("Fix completed.")
