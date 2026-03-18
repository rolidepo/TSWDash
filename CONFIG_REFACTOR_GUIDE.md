# Configuration Architecture Refactor - Integration Guide

## Overview
The configuration has been refactored from a monolithic `pages_config.json` into a modular structure with individual page files and shared API transforms.

## New Structure

```
src/
├── pages/
│   ├── api_transforms.json      (shared transforms for all pages)
│   ├── home.json                (home page config)
│   ├── dashboard.json           (dashboard page config)
│   ├── EUGen.json               (EUGen page config)
│   ├── diagnostics.json         (diagnostics page config)
│   ├── info.json                (info page config)
│   └── settings.json            (settings page config)
├── pages_config_loader.py       (utility to merge configs)
├── pages_config.json            (legacy - kept for compatibility)
└── web_server.py                (updated to use new loader)
```

## Key Changes

### 1. Individual Page Files (`src/pages/*.json`)
- **Each file contains a single page definition**
- Format: `{ "page_name": { ...page config... } }`
- Page files: home.json, dashboard.json, EUGen.json, diagnostics.json, info.json, settings.json

### 2. Shared API Transforms (`src/pages/api_transforms.json`)
- Contains all value transformation rules used across pages
- Includes: multipliers, units, comparison thresholds, min/max ranges
- Example transforms: speed, RPM, brake pressure, temperature

### 3. Configuration Loader (`src/pages_config_loader.py`)
- Python utility that merges individual page files and api_transforms
- Returns standardized config structure: `{ pages, api_transforms, settings }`
- Can be used standalone or imported by web_server.py

### 4. Backward Compatibility
- Existing `pages_config.json` is preserved (not deleted)
- web_server.py tries new structure first, then falls back to legacy file
- No breaking changes to frontend code

## Usage

### In Python Code
```python
from pages_config_loader import load_pages_config

# Load merged configuration
config = load_pages_config(pages_dir='pages')

# Access pages, transforms, and settings
pages = config['pages']
transforms = config['api_transforms']
settings = config['settings']
```

### From CLI
```bash
python src/pages_config_loader.py
```

### Web Server (Automatic)
The web_server.py automatically:
1. Checks for `src/pages/` folder
2. If found, uses the modular config loader
3. If not found, falls back to `pages_config.json`

## Adding New Pages

To add a new page:

1. **Create new JSON file** in `src/pages/`:
   ```json
   {
     "new_page_name": {
       "title": "Page Title",
       "layout": "layout_type",
       "template": "mfd",
       "components": [...],
       "buttons": {...},
       "menu_labels": {...}
     }
   }
   ```

2. **No other changes needed** - The loader automatically picks it up

3. **Update navigation** in other pages' button configs if needed

## Modifying API Transforms

All value transformations are centralized in `src/pages/api_transforms.json`:

```json
{
  "field_name": {
    "multiply": 1.0,
    "add": 0,
    "unit": "unit_string",
    "min": 0,
    "max": 100,
    "compare_critical": 500000
  }
}
```

Changes here apply globally to all pages using that field.

## Frontend Templates

Template files automatically detect which template to use:
- **mfd.html** - Used for MFD template pages (physical button layout)
- **touchscreen.html** - Used for touchscreen pages (responsive layout)

No changes needed to template files.

## Migration Status

✅ **Completed:**
- Modular folder structure created
- Pages split into individual files
- API transforms extracted to shared file
- Configuration loader created
- web_server.py updated with fallback logic

✅ **Verified:**
- All 6 pages migrated: home, dashboard, EUGen, diagnostics, info, settings
- API transforms preserved with all original data
- Settings preserved with defaults

✅ **Backward Compatible:**
- Legacy pages_config.json still present
- No changes to mfd.html or touchscreen.html
- web_server.py auto-detects new structure

## Next Steps (Optional)

1. **Archive legacy file**: Once new structure is stable, `pages_config.json` can be removed
2. **Add more pages**: Simply add new JSON files to `src/pages/` folder
3. **Enhance transforms**: Update `src/pages/api_transforms.json` with additional fields
4. **Template duplication** (if needed): Create separate mfd_template.html and touchscreen_template.html for complete separation

## Rollback

If issues arise, the legacy `pages_config.json` is preserved. Simply delete the `src/pages/` folder and web_server.py will automatically use the old file.
