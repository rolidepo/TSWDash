import json
import os
from pathlib import Path

def load_pages_config(pages_dir='pages'):
    """
    Load all page configurations from individual JSON files in the pages directory.
    
    Args:
        pages_dir: Directory containing individual page JSON files
        
    Returns:
        dict: Merged configuration with pages, api_transforms, and settings
    """
    pages_path = Path(pages_dir)
    
    if not pages_path.exists():
        print(f"Error: Pages directory '{pages_dir}' not found")
        return None
    
    config = {
        "pages": {},
        "api_transforms": {},
        "settings": {
            "template": "mfd",
            "default_page": "home",
            "brightness": 100,
            "contrast": 100,
            "night_mode": False,
            "font_family": "monospace",
            "theme": "dark"
        }
    }
    
    # Load api_transforms
    api_transforms_file = pages_path / 'api_transforms.json'
    if api_transforms_file.exists():
        with open(api_transforms_file, 'r', encoding='utf-8') as f:
            config['api_transforms'] = json.load(f)
    
    # Load all page files
    for file in pages_path.glob('*.json'):
        if file.name == 'api_transforms.json':
            continue
            
        try:
            with open(file, 'r', encoding='utf-8') as f:
                page_data = json.load(f)
                # Merge pages from this file
                if 'pages' in page_data:
                    config['pages'].update(page_data['pages'])
                else:
                    # If the file root is a page object, add it
                    # Assuming the page name is the key in the root
                    for key, value in page_data.items():
                        config['pages'][key] = value
        except json.JSONDecodeError as e:
            print(f"Error parsing {file.name}: {e}")
        except Exception as e:
            print(f"Error loading {file.name}: {e}")
    
    return config


if __name__ == '__main__':
    config = load_pages_config()
    if config:
        print(json.dumps(config, indent=2))
