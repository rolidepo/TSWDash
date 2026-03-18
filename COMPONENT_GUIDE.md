# Component Guide

This project uses a component registry (`src/templates/components.js`) to render widgets into grid cells defined in `src/pages/*.json` (with legacy fallback to `src/pages_config.json`).

## Core Files

- `src/templates/mfd.html` - MFD template and page logic
- `src/templates/touchscreen.html` - Touchscreen template and page logic
- `src/templates/components.js` - Component renderers
- `src/templates/canvas-renderers.js` - Canvas widgets (speedometer)
- `src/pages/` - Per-page JSON configs (current)
- `src/pages_config.json` - Legacy monolithic config (fallback)

## Component Types

- `text_display`
- `text_indicator`
- `progress_bar`
- `vertical_bar`
- `seven_segment`
- `scaled_vertical_bar`
- `speedometer`

## Shared Component Fields

- `type` (required)
- `id` (required, unique per page)
- `title`
- `value` (API variable name or literal text)
- `unit`
- `area` (grid area name)
- `alignment` (`horizontal`: left/center/right, `vertical`: top/center/bottom)
- `visible_when` (conditional display)
- `styles` or `font_sizes` (typography)

Notes:
- `value` can be a string or an array of fallback variables. The first valid value found is used.
- `visible_when.variable` can also be a string or array of fallback variables.

### Example

```json
{
  "type": "text_display",
  "id": "brake_pressure_1_display",
  "title": "Brake Pressure 1",
  "value": "brake_pressure_1",
  "unit": "Pa",
  "area": "brake",
  "alignment": {"horizontal": "center", "vertical": "center"},
  "styles": {
    "title": {"fontSize": "14px", "bold": true},
    "value": {"fontSize": "20px", "bold": true}
  }
}
```

## Layout and Areas

Each page uses CSS Grid:

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

Components reference an `area` that must match an entry in `areas`.

## Typography

Use either:

```json
"styles": {"value": {"fontSize": "28px", "bold": true}}
```

or legacy:

```json
"font_sizes": {"value": "28px"}
```

## Visibility Conditions

```json
"visible_when": {
  "variable": "LZB_IsActive.Value",
  "equals": true
}
```

When false, the component content is hidden but the cell remains visible.

## Text Indicator

`text_indicator` displays a text label based on ordered conditions. The first matching condition wins.
Each condition can define its own display text/value and styling.

### Fields

- `value` (optional) Default display source (string or array). Used if a condition does not provide `display.text` or `display.value`.
- `conditions` (optional) Array of condition objects. First match wins.
- `default` (optional) Fallback display/styling when no condition matches.

#### Multi-line Text

You can display text on multiple lines using the newline character `\n` in the text string:

```json
{
  "when": {"left": "status", "operator": "==", "right": true},
  "display": {
    "text": "Line1\nLine2"
  }
}
```

This will display:
```
Line1
Line2
```

## Condition Format

```json
{
  "when": {
    "left": "SomeValue",
    "operator": "==",
    "right": true
  },
  "display": {
    "text": "Active",
    "value": ["Status.Value", "Status_legacy.Value"],
    "fontFamily": "Orbitron",
    "fontSize": "14px",
    "color": "#ffffff",
    "backgroundColor": "#000000",
    "bold": true,
    "italic": false,
    "underline": false
  }
}
```

Condition field aliases:
- `when.left` can be written as `when.value`
- `when.right` can be written as `when.compare_to`
- `when.operator` can be written as `when.compare` or `when.condition`

### Logical Operators (AND / OR)

Use `when.all` for AND logic (all conditions must be true):

```json
{
  "when": {
    "all": [
      {"left": "value1", "operator": "==", "right": true},
      {"left": "value2", "operator": "==", "right": "value3"}
    ]
  },
  "display": {
    "text": "Both conditions met"
  }
}
```

Use `when.any` for OR logic (at least one condition must be true):

```json
{
  "when": {
    "any": [
      {"left": "value1", "operator": "==", "right": true},
      {"left": "value2", "operator": "==", "right": true}
    ]
  },
  "display": {
    "text": "At least one is true"
  }
}
```
### Operators

Supported operators: `==`, `!=`, `>`, `<`, `>=`, `<=`
Aliases: `equals`, `greater`, `greater_than`, `less`, `less_than`, `gte`, `lte`

### Examples

Example 1: If value1 is true, display "Active".

```json
{
  "type": "text_indicator",
  "id": "lzb_status",
  "area": "ind1",
  "conditions": [
    {
      "when": {"left": "value1", "operator": "==", "right": true},
      "display": {"text": "Active"}
    }
  ]
}
```

Example 2: If value1 is true, show white text on black background. Else if value2 is true, show yellow text "Standby".

```json
{
  "type": "text_indicator",
  "id": "lzb_status",
  "area": "ind1",
  "conditions": [
    {
      "when": {"left": "value1", "operator": "==", "right": true},
      "display": {"text": "Active", "color": "#ffffff", "backgroundColor": "#000000"}
    },
    {
      "when": {"left": "value2", "operator": "==", "right": true},
      "display": {"text": "Standby", "color": "#ffd400"}
    }
  ]
}
```

Example 3: If value1 is greater than max speed, display value3 in white on red background.

```json
{
  "type": "text_indicator",
  "id": "overspeed",
  "area": "ind2",
  "conditions": [
    {
      "when": {
        "left": ["value1", "value1_legacy"],
        "operator": ">",
        "right": ["max_speed", "max_speed_legacy"]
      },
      "display": {
        "value": ["value3", "value3_legacy"],
        "color": "#ffffff",
        "backgroundColor": "#cc0000"
      }
    }
  ]
}
```

Example 4: AND logic - Display "Critical" if speed > max AND brake pressure > threshold.

```json
{
  "type": "text_indicator",
  "id": "critical_status",
  "area": "ind3",
  "conditions": [
    {
      "when": {
        "all": [
          {"left": "current_speed", "operator": ">", "right": "max_speed"},
          {"left": "brake_pressure", "operator": ">", "right": 5000}
        ]
      },
      "display": {
        "text": "Critical",
        "color": "#ffffff",
        "backgroundColor": "#cc0000",
        "bold": true
      }
    }
  ]
}
```

Example 5: OR logic - Display "Warning" if either system is active.

```json
{
  "type": "text_indicator",
  "id": "system_warning",
  "area": "ind4",
  "conditions": [
    {
      "when": {
        "any": [
          {"left": "LZB_IsActive.Value", "operator": "==", "right": true},
          {"left": "PZB_IsActive.Value", "operator": "==", "right": true}
        ]
      },
      "display": {
        "text": "Warning",
        "color": "#ffd400"
      }
    }
  ]
}
```

Example 6: Blinking animation - Display "Alert" with blinking animation when condition is true.

```json
{
  "type": "text_indicator",
  "id": "alert_status",
  "area": "ind5",
  "conditions": [
    {
      "when": {"left": "alert_active", "operator": "==", "right": true},
      "display": {
        "text": "Alert",
        "color": "#ffffff",
        "backgroundColor": "#cc0000",
        "bold": true,
        "blinking": true
      }
    }
  ]
}
```

Example 6: Blinking animation - Display "Alert" with blinking text and background when condition is true.

```json
{
  "type": "text_indicator",
  "id": "alert_status",
  "area": "ind5",
  "conditions": [
    {
      "when": {"left": "alert_active", "operator": "==", "right": true},
      "display": {
        "text": "Alert",
        "color": "#ffffff",
        "backgroundColor": "#cc0000",
        "bold": true,
        "blinking": true
      }
    }
  ]
}
```

Example 7: Blinking text only - Text blinks while background stays visible.

```json
{
  "when": {"left": "warning", "operator": "==", "right": true},
  "display": {
    "text": "Warning",
    "color": "#ffd400",
    "backgroundColor": "#000000",
    "blinking": "text"
  }
}
```

Example 8: Blinking background only - Background blinks while text stays visible.

```json
{
  "when": {"left": "critical", "operator": "==", "right": true},
  "display": {
    "text": "Critical",
    "color": "#ffffff",
    "backgroundColor": "#cc0000",
    "blinking": "background"
  }
}
```

Notes:
- `when.left` and `when.right` accept strings or arrays (fallback supported).
- `display.value` accepts strings or arrays (fallback supported).
- If a condition does not define `display.text` or `display.value`, the component `value` is used.
- Use `when.all` for AND logic (all sub-conditions must be true).
- Use `when.any` for OR logic (at least one sub-condition must be true).
- Use `display.blinking` to add a 1-second opacity animation cycle (appears/disappears every 1000ms):
  - `"blinking": true` or `"blinking": "both"` - Both text and background blink (opacity cycles)
  - `"blinking": "text"` - Only text blinks, background stays visible
  - `"blinking": "background"` or `"blinking": "bg"` - Only background blinks, text stays visible
- Optional text colors for background blinking:
  - `display.blinkingTextColorOn` - Text color when background is visible
  - `display.blinkingTextColorOff` - Text color when background is hidden
- Diagonal lines overlay:
  - `display.strikethrough: true` - Single diagonal line through component
  - `display.strikethroughColor` - Color of strikethrough line (default: white)
  - `display.strikethroughWidth` - Width of strikethrough line in pixels (default: 3)
  - `display.crossthrough: true` - Two diagonal lines forming an X
  - `display.crossthroughColor` - Color of crossthrough lines (default: white)
  - `display.crossthroughWidth` - Width of crossthrough lines in pixels (default: 3)

Example 9: Strikethrough - Single diagonal line with custom color.

```json
{
  "when": {"left": "status", "operator": "==", "right": "invalid"},
  "display": {
    "text": "Invalid",
    "color": "#ffffff",
    "strikethrough": true,
    "strikethroughColor": "#ff0000"
  }
}
```

Example 10: Crossthrough - X pattern with custom color.

```json
{
  "when": {"left": "status", "operator": "==", "right": "cancelled"},
  "display": {
    "text": "Cancelled",
    "color": "#ffffff",
    "crossthrough": true,
    "crossthroughColor": "#666666"
  }
}
```


## Click Actions

Components can be clickable with `onClick`:

```json
"clickable": true,
"onClick": {"action": "page_back"}
```

Actions include:

- `page_navigate`
- `page_back`
- `toggle_night_mode`
- `adjust_brightness`
- `adjust_contrast`
- `input_number`
- `toggle`
- `condition_check`

## Adding New Components

Add a new renderer in `components.js` and then configure it in `pages_config.json` using the same shared fields shown above.
