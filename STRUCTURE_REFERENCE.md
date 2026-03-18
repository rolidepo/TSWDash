# New Configuration Structure - Quick Reference

## Folder Layout
```
TSWDash/
├── src/
│   ├── pages/                          (NEW - Module folder)
│   │   ├── api_transforms.json        ✨ Shared by all pages
│   │   ├── home.json                  ✨ Home page
│   │   ├── dashboard.json             ✨ Dashboard page
│   │   ├── EUGen.json                 ✨ EUGen page
│   │   ├── diagnostics.json           ✨ Diagnostics page
│   │   ├── info.json                  ✨ Info page
│   │   └── settings.json              ✨ Settings page
│   ├── pages_config.json              (Legacy - still exists)
│   ├── pages_config_loader.py         ✨ NEW - Config merger
│   ├── web_server.py                  📝 UPDATED - Uses loader
│   ├── main.py
│   ├── api_poller.py
│   ├── config.py
│   ├── api_endpoints.json
│   └── templates/
│       ├── mfd.html
│       └── touchscreen.html
├── CONFIG_REFACTOR_GUIDE.md           ✨ NEW - Full integration guide
├── REFACTOR_COMPLETE.md               ✨ NEW - Completion summary
└── ...other docs...

✨ = New file
📝 = Modified file
```

## File Descriptions

### `src/pages/api_transforms.json`
**Purpose**: Central registry of value transformations applied to all data points

**Usage**: Referenced by components to transform raw API values

**Numeric Transforms**:
```json
{
  "speed_ms.Speed_ms": { "multiply": 3.6, "unit": "km/h" },
  "temperature": { "unit": "°C", "min": -40, "max": 80 }
}
```

**Substring Transforms** (extract part of a string):
```json
{
  "tod_data.WorldTimeISO8601_no_tz": {
    "source": "tod_data.WorldTimeISO8601",
    "substring": {
      "start": 0,
      "end": -13
    }
  },
  "tod_data.WorldTimeISO8601_time_only": {
    "source": "tod_data.WorldTimeISO8601",
    "substring": {
      "start": 10,
      "end": -2
    }
  },
  "tod_data.WorldTimeISO8601_date_only": {
    "source": "tod_data.WorldTimeISO8601",
    "substring": {
      "start": 8
    }
  }
}
```

**Substring Properties**:
- `source`: (required) The API key to extract from
- `substring.start`: Starting index (0-based). Default: 0
- `substring.end`: Ending index (exclusive). Use negative to count from end. Optional - if omitted, goes to end of string

**Examples**:
- `"start": 0, "end": -13` → Remove last 13 characters
- `"start": 10, "end": -2` → Remove first 10 and last 2 characters  
- `"start": 8` → Remove first 8 characters

### `src/pages/home.json` - `settings.json`
**Purpose**: Individual page definitions

**Structure**:
```json
{
  "page_name": {
    "title": "Page Title",
    "template": "mfd" or "touchscreen",
    "layout": "layout_type",
    "layout_grid": { "columns": "...", "rows": "...", "areas": [...] },
    "components": [...],
    "buttons": { "top": {...}, "right": {...}, "bottom": {...} },
    "menu_labels": {...}
  }
}
```

### `src/pages_config_loader.py`
**Purpose**: Python utility that dynamically merges all page files

**Exports**:
```python
def load_pages_config(pages_dir='pages') -> dict:
    """Returns: { "pages": {...}, "api_transforms": {...}, "settings": {...} }"""
```

**Called by**: web_server.py (automatic)

### `src/web_server.py` (Modified)
**Changed method**: `_load_pages_config()`

**New logic**:
1. Check for `src/pages/` folder
2. If exists → use pages_config_loader
3. If not → fallback to pages_config.json (legacy)

**No other changes** - fully backward compatible

## Data Flow

```
Browser Request
    ↓
web_server.py (/api/config endpoint)
    ↓
pages_config_loader.py (if pages/ exists)
    ↓
Merges: home.json + dashboard.json + ... + api_transforms.json
    ↓
Returns complete config
    ↓
Browser receives unified JSON structure
    ↓
mfd.html or touchscreen.html renders page
```

## Adding a New Page

### Step 1: Create JSON File
Create `src/pages/my_feature.json`:
```json
{
  "my_feature": {
    "title": "My Feature",
    "template": "mfd",
    "components": [
      {
        "type": "text_display",
        "id": "my_component",
        "title": "Component Title",
        "value": "data_field"
      }
    ],
    "buttons": {...},
    "menu_labels": {...}
  }
}
```

### Step 2: Add Data Transform (if needed)
Edit `src/pages/api_transforms.json`:
```json
{
  "data_field": {
    "multiply": 1,
    "add": 0,
    "unit": "units"
  }
}
```

### Step 3: Link from Other Pages
Update navigation buttons in other page files to reference "my_feature"

**That's it!** The loader automatically picks it up.

## API Endpoint Response Structure

Request: `GET /api/config`

Response (unchanged from before):
```json
{
  "pages": {
    "home": {...},
    "dashboard": {...},
    "EUGen": {...},
    "diagnostics": {...},
    "info": {...},
    "settings": {...}
  },
  "api_transforms": {
    "speed_ms.Speed_ms": {...},
    "temperature": {...}
  },
  "settings": {
    "template": "mfd",
    "default_page": "home",
    "brightness": 100,
    "contrast": 100
  }
}
```

## Migration Checklist

- [x] Created `src/pages/` folder
- [x] Split 850-line monolith into 6 page files
- [x] Extracted api_transforms to shared file
- [x] Created pages_config_loader.py utility
- [x] Updated web_server.py with fallback logic
- [x] UTF-8 encoding verified
- [x] All pages tested and merged successfully
- [x] Legacy pages_config.json preserved
- [x] Documentation created

## Status

🟢 **READY FOR PRODUCTION**

- New structure active and working
- Backward compatibility maintained
- All 6 pages loading correctly
- No API changes for frontend
- Can rollback anytime by deleting `pages/` folder
