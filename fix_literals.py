
import sys

def fix_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        new_content = content.replace('\\${', '${')
        
        if content != new_content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Fixed {filepath}")
        else:
            print(f"No changes needed for {filepath}")
            
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")

if __name__ == "__main__":
    for filepath in sys.argv[1:]:
        fix_file(filepath)
