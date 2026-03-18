# MFD Guide

This guide covers the MFD template, page structure, and button actions.

## Access

- `http://localhost:5000/mfd`
- `http://localhost:5000/touchscreen`

## Configuration File

`src/pages_config.json` defines pages, layouts, components, and buttons.

### Page Layout

```json
"layout_grid": {
  "columns": "1.2fr 1fr",
  "rows": "auto 1fr auto",
  "areas": [
    "speed rpm3 rpm3",
    "speed lzb lzb",
    "rpm2 lzb lzb",
    "rpm brake brake"
  ]
}
```

Components reference a grid `area` name.

### Templates

Each page can specify a template:

```json
"template": "mfd"
```

or

```json
"template": "touchscreen"
```

### Per-Page Colors

```json
"background_color": "#0a0a0a",
"text_color": "#00ff00",
"border_color": "#00ff00"
```

## Buttons

Buttons are defined per page:

```json
"buttons": {
  "top": {
    "S": {"action": "page_navigate", "target": "settings"},
    "i": {"action": "page_navigate", "target": "info"},
    "contrast": {"action": "toggle_night_mode"}
  },
  "right": {
    "up": {"action": "scroll", "direction": "up"}
  },
  "bottom": {
    "0": {"action": "page_back"}
  }
}
```

Supported actions include:

- `page_navigate` - Navigate to a specific page
- `page_back` - Go back to the previous page
- `open_schedule_browser` - Open the timetable schedule browser overlay
- `toggle_night_mode` - Toggle night mode display
- `adjust_brightness` - Adjust screen brightness
- `adjust_contrast` - Adjust screen contrast
- `input_number` - Input number (for interactive forms)
- `toggle` - Toggle a setting
- `condition_check` - Conditional logic
- `power_off` - Power off the display

### Runtime Variable Actions (New)

Use runtime variables when you need values that are not provided by the API but should behave like normal data fields in components and conditions.

Default runtime variable currently available:
- `GNT_active` (default: `false`)

You can toggle or set runtime variables from page buttons:

```json
"5": {
  "action": "toggle_runtime_variable",
  "variable": "GNT_active"
}
```

```json
"5": {
  "action": "set_runtime_variable",
  "variable": "GNT_active",
  "value": true
}
```

Generic update pattern (future-ready):

```json
"5": {
  "action": "update_runtime_variable",
  "variable": "SomeVariable",
  "operation": "toggle"
}
```

Supported operations:
- `toggle`
- `set` (via `value`)
- `increment` (via `step`)
- `decrement` (via `step`)

### Conditional Menu Labels with visible_when (New)

`menu_labels` supports either a plain string or an object with `text` and `visible_when`.

Simple label:

```json
"5": "GNT"
```

Conditional label example:

```json
"5": {
  "text": "GNT ON",
  "visible_when": {
    "variable": "GNT_active",
    "equals": true
  }
}
```

If `visible_when` is not satisfied, the menu slot is rendered as empty.

## Components

Component types are defined in `src/templates/components.js`. Use `styles` or `font_sizes` to control typography, and `visible_when` for conditional display.

For details, see `COMPONENT_GUIDE.md`.

## Schedule Browser (Timetable Loader)

The schedule browser allows you to load timetable JSON files from `src/timetable/schedule/` and make their data available to components.

### Activating the Schedule Browser

Add a button action in your page configuration:

```json
"buttons": {
  "top": {
    "TT": {"action": "open_schedule_browser"}
  }
}
```

### Using the Schedule Browser

1. **Press the assigned button** (e.g., "TT") to open the overlay
2. **Enter train number** using number buttons (0-9) to filter schedules
3. **Navigate the list** using Up/Down arrow buttons
4. **Select a schedule** by pressing the "E" button
5. **Close without selecting** by pressing the "C" button

The overlay displays:
- Search bar (highlighted when active)
- Filtered list of schedules showing route code and train number
- Selected item is highlighted

### Schedule File Format

Schedule files in `src/timetable/schedule/*.json` should follow this format:

```json
{
  "train_info": {
    "company": "RailPool",
    "train_number": "GAG 47502",
    "destination": "Köln Kalk Nord - Genk",
    "type": "Slow Freight",
    "priority": "3",
    "max_speed_kph": 90,
    "route_code": "SKA",
    "service_timetable": "SKA_1.json"
  },
  "timetable_data": [
    {
      "station": "Köln-Müngersdorf/Technologiepark",
      "stop": true,
      "ETA": "",
      "ETD": "12:58:00",
      "ATA": "",
      "ATD": "",
      "diff": ""
    },
    {
      "station": "Aachen Hbf",
      "stop": true,
      "ETA": "13:56:00",
      "ETD": "",
      "ATA": "",
      "ATD": "",
      "diff": ""
    }
  ]
}
```

### Using Timetable Data in Components

Once a schedule is loaded, all fields from `train_info` are available with the `tt_` prefix:

```json
{
  "type": "text_display",
  "title": "Train",
  "value": "tt_train_number",
  "unit": ""
}
```

```json
{
  "type": "text_display",
  "title": "Destination",
  "value": "tt_destination",
  "unit": ""
}
```

```json
{
  "type": "text_display",
  "title": "Max Speed",
  "value": "tt_max_speed_kph",
  "unit": "km/h"
}
```

### Available Timetable Variables

From `train_info` (all prefixed with `tt_`):
- `tt_company` - Operating company
- `tt_train_number` - Train service number
- `tt_destination` - Final destination
- `tt_type` - Service type (e.g., "Slow Freight")
- `tt_priority` - Priority level
- `tt_max_speed_kph` - Maximum speed in km/h
- `tt_route_code` - Route identifier
- `tt_service_timetable` - Reference timetable file

From first stop in `timetable_data` (prefixed with `tt_current_`):
- `tt_current_station` - Current/first station name
- `tt_current_stop` - Whether stopping (true/false)
- `tt_current_ETA` - Expected arrival time
- `tt_current_ETD` - Expected departure time
- `tt_current_ATA` - Actual arrival time
- `tt_current_ATD` - Actual departure time
- `tt_current_diff` - Time difference

The full `timetable_data` array is also available as `tt_timetable` for advanced components.
        "x": 300,
        "y": 300,
        "width": 80,
        "height": 80,
        "value": "doors_open",
        "condition": "==",
        "compare": 0,
        "icon": "door_closed",
        "icon_inactive": "door_open"
      }
    ],
    "buttons": {
      "top": {
        "aus": {"action": "power_off"},
        "S": {"action": "page_navigate", "target": "settings"}
      },
      "right": {...},
      "bottom": {...}
    }
  }
}
```

## 🎨 Styling

The MFD uses a realistic train display aesthetic:
- **Screen Background**: Dark with green terminal-style text
- **Borders**: Gray plastic frame (like a real MFD)
- **Buttons**: 3D gray with press effects
- **Text**: Green monospace (terminal style)
- **Glows**: Subtle green glow for active elements

## 📱 Responsive Design

The MFD automatically scales to:
- **Desktop**: Full resolution
- **Tablet**: Reduced button size, maintains aspect ratio
- **Mobile**: Compact layout

## 🐛 Debugging

### Enable Debug Logging

In `config.py`:
```python
DEBUG = True  # Change default to True
```

Then you'll see:
- Component loading messages
- Button press events
- API data updates
- Page navigation events

### Console Information

```
Session: online/offline       - Connection status
Last Updated: 14:32:45        - Data timestamp
Page: Main Dashboard          - Current page name
```

## 🔧 Advanced: Custom API Values

To use API values not in the default mapping:

1. Add to `api_endpoints.json`:
```json
"single_endpoints": {
  "custom_value": {
    "path": "/get/GameState.SimulationTime",
    "id": 123,
    "variables": {
      "simulation_time": "time"
    }
  }
}
```

2. Use in pages_config.json:
```json
{
  "type": "text_display",
  "value": "simulation_time",
  "title": "Sim Time"
}
```

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `pages_config.json` | **Main configuration** - Pages, components, buttons, transforms |
| `mfd.html` | MFD interface with physical frame |
| `web_server.py` | Serves MFD and provides `/api/pages` route |
| `api_endpoints.json` | API polling configuration (unchanged) |
| `api_poller.py` | Data polling engine (unchanged) |

## 🚀 Quick Start

1. **Edit `pages_config.json`** to customize pages and components
2. **Add new components** for different data types
3. **Configure buttons** to navigate and control
4. **Set API transforms** for unit conversions
5. **Access `/mfd`** in your browser

No code changes needed - pure JSON configuration!

## ✨ Future Enhancements

- [ ] Custom icons/pictograms
- [ ] Animation transitions between pages
- [ ] Recording and playback of session data
- [ ] Multi-screen synchronization
- [ ] Mobile app integration
- [ ] Voice control of buttons
- [ ] Drag-and-drop page designer

---

**Version**: 1.0 MFD System  
**Status**: ✅ Production Ready
