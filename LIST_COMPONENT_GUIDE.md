# List Component Guide

## Overview

The **list** component is a rolling list display that shows a scrolling history of values based on condition matching. It works similarly to the `text_indicator` component but maintains a queue of the latest N items, automatically removing the oldest item when the list reaches maximum capacity.

## Key Features

- **Condition-based display**: Shows values when specified conditions are met
- **Rolling queue**: Maintains the latest N items (configurable via `maxRows`)
- **Auto-removal**: Oldest items are automatically removed when the list fills up
- **Row-only borders**: Horizontal borders between rows only, no outer borders
- **Customizable styling**: Each row supports all styling options from `text_indicator`:
  - Font type and size
  - Background color
  - Text color
  - Font weight (bold), italic, underline
  - Blinking (text, background, or both)
  - Strikethrough and crossthrough effects
- **Display order**: Items are displayed from oldest (top) to newest (bottom)

## Configuration Properties

### Required Properties
- `type`: `"list"` - Specifies this is a list component
- `id`: Unique identifier for the component
- `conditions`: Array of condition objects (similar to text_indicator)

### Component-Level Styling Properties
- `fontFamily` (string): Font family for all rows (e.g., `"Arial"`, `"Courier New"`)
- `fontSize` (string): Font size for all rows (e.g., `"14px"`, `"16px"`)
- `maxRows` (number): Maximum number of rows to display (default: 5)
- `rowHeight` (string): Height of each row (e.g., `"20px"`, `"auto"` - default: `"auto"`)
- `color` (string, fallback): Default text color for rows
- `backgroundColor` (string, fallback): Default background color for rows

### Condition Objects
Each condition in the `conditions` array has the structure:

```json
{
  "when": { /* condition logic */ },
  "display": { /* styling and text for this condition */ }
}
```

The `when` property supports:
- **Simple comparison**: `{"left": "variable_name", "operator": "==", "right": value}`
- **Array fallback**: `{"left": ["var1", "var2"], "operator": "==", "right": value}`
- **AND logic**: `{"all": [condition1, condition2, ...]}`
- **OR logic**: `{"any": [condition1, condition2, ...]}`

The `display` property can include:
- `text` (string): The text to display in the row
- `color` (string): Text color
- `backgroundColor` (string): Background color
- `fontFamily` (string): Override the component's font family
- `fontSize` (string): Override the component's font size
- `bold` (boolean): Make text bold
- `italic` (boolean): Make text italic
- `underline` (boolean): Underline text
- `blinking` (string): Animation mode:
  - `true` or `"both"`: Blink both text and background
  - `"text"`: Only text blinks
  - `"background"` or `"bg"`: Only background blinks
- `blinkingTextColorOn` (string): Text color when background blinks (light state)
- `blinkingTextColorOff` (string): Text color when background blinks (dark state)
- `strikethrough` (boolean): Draw a line through the text
- `strikethroughColor` (string): Color of strikethrough line
- `strikethroughWidth` (number): Width of strikethrough line (default: 3px)
- `crossthrough` (boolean): Draw an X through the text
- `crossthroughColor` (string): Color of crossthrough lines
- `crossthroughWidth` (number): Width of crossthrough lines (default: 3px)

## Usage Examples

### Basic List with Simple Conditions

```json
{
  "type": "list",
  "id": "event_log",
  "fontFamily": "Arial",
  "fontSize": "12px",
  "maxRows": 5,
  "rowHeight": "18px",
  "area": "event_area",
  "conditions": [
    {
      "when": {"left": "brake_active", "operator": "==", "right": true},
      "display": {
        "text": "Brake Applied",
        "backgroundColor": "#FF6B6B",
        "color": "#FFFFFF",
        "bold": true
      }
    },
    {
      "when": {"left": "door_open", "operator": "==", "right": true},
      "display": {
        "text": "Door Open",
        "backgroundColor": "#FFA500",
        "color": "#000000"
      }
    },
    {
      "when": {"left": "power_mode", "operator": "==", "right": "active"},
      "display": {
        "text": "Power Mode Active",
        "backgroundColor": "#4CAF50",
        "color": "#FFFFFF"
      }
    }
  ]
}
```

### List with Blinking Effects

```json
{
  "type": "list",
  "id": "alert_log",
  "fontFamily": "Courier New",
  "fontSize": "13px",
  "maxRows": 4,
  "rowHeight": "20px",
  "area": "alerts_area",
  "color": "#FFFFFF",
  "backgroundColor": "#1a1a1a",
  "conditions": [
    {
      "when": {"left": "emergency_stop", "operator": "==", "right": true},
      "display": {
        "text": "EMERGENCY STOP",
        "backgroundColor": "#FF0000",
        "color": "#FFFFFF",
        "bold": true,
        "blinking": "both"
      }
    },
    {
      "when": {"left": "overspeed", "operator": "==", "right": true},
      "display": {
        "text": "OVERSPEED WARNING",
        "backgroundColor": "#FFD700",
        "color": "#000000",
        "blinking": "background",
        "blinkingTextColorOn": "#000000",
        "blinkingTextColorOff": "#FFFF00"
      }
    }
  ]
}
```

### List with Strikethrough and Crossthrough

```json
{
  "type": "list",
  "id": "status_log",
  "fontFamily": "Arial",
  "fontSize": "14px",
  "maxRows": 6,
  "rowHeight": "auto",
  "conditions": [
    {
      "when": {"left": "system_error", "operator": "==", "right": true},
      "display": {
        "text": "System Error Detected",
        "color": "#FF0000",
        "bold": true,
        "strikethrough": true,
        "strikethroughColor": "#FF0000",
        "strikethroughWidth": 2
      }
    },
    {
      "when": {"left": "fault_critical", "operator": "==", "right": true},
      "display": {
        "text": "CRITICAL FAULT",
        "color": "#FFFFFF",
        "backgroundColor": "#800000",
        "bold": true,
        "crossthrough": true,
        "crossthroughColor": "#FFFFFF",
        "crossthroughWidth": 3
      }
    }
  ]
}
```

### List with Array Fallback in Conditions

```json
{
  "type": "list",
  "id": "traction_log",
  "fontFamily": "Arial",
  "fontSize": "12px",
  "maxRows": 5,
  "rowHeight": "16px",
  "conditions": [
    {
      "when": {
        "left": ["traction_mode", "traction_mode_v2"],
        "operator": "==",
        "right": "full"
      },
      "display": {
        "text": "Full Traction",
        "backgroundColor": "#4CAF50",
        "color": "#FFFFFF"
      }
    },
    {
      "when": {
        "left": ["traction_mode", "traction_mode_v2"],
        "operator": "==",
        "right": "partial"
      },
      "display": {
        "text": "Partial Traction",
        "backgroundColor": "#FFA500",
        "color": "#FFFFFF"
      }
    }
  ]
}
```

### List with AND/OR Logic

```json
{
  "type": "list",
  "id": "advanced_status",
  "fontFamily": "Arial",
  "fontSize": "13px",
  "maxRows": 5,
  "rowHeight": "18px",
  "conditions": [
    {
      "when": {
        "all": [
          {"left": "brake_active", "operator": "==", "right": true},
          {"left": "speed", "operator": ">", "right": 50}
        ]
      },
      "display": {
        "text": "Emergency Braking (High Speed)",
        "backgroundColor": "#FF0000",
        "color": "#FFFFFF",
        "bold": true,
        "blinking": "background"
      }
    },
    {
      "when": {
        "any": [
          {"left": "door_open", "operator": "==", "right": true},
          {"left": "window_open", "operator": "==", "right": true}
        ]
      },
      "display": {
        "text": "Opening Detected",
        "backgroundColor": "#FFA500",
        "color": "#000000"
      }
    }
  ]
}
```

## How It Works

1. **On Every Update**: The component checks all conditions against current data
2. **Condition Matching**: For each condition that evaluates to true, the display text is resolved
3. **Queue Addition**: New items are added to the internal queue with a timestamp
4. **Queue Trimming**: If the queue exceeds `maxRows`, the oldest items are removed
5. **Rendering**: Rows are rendered in order from oldest (top) to newest (bottom)
6. **Styling Applied**: Each row gets its styling from the matched condition's `display` object

## Display Order

Items are always displayed from **oldest to newest**:
```
Row 1 (oldest item)
Row 2
Row 3
Row 4
Row 5 (newest item)
```

When a new item is added and the list is full, the oldest item (Row 1) is removed and shifts happen:
```
← Item 1 removed (oldest)
Row 1 (was Row 2)
Row 2 (was Row 3)
Row 3 (was Row 4)
Row 4 (was Row 5)
Row 5 (new item - newest)
```

## Styling Inheritance

- **Component-level styles**: `fontFamily`, `fontSize`, `color`, `backgroundColor` apply to all rows as defaults
- **Condition-level styles** (in `display`): Override component-level styles for that specific row
- **Fallback order**: Condition display → Default config → Component config → Built-in defaults

## Notes

- The list component maintains state internally; items persist across updates
- Each condition that matches adds one item; multiple matching conditions in a single update add multiple items
- Items are based on timestamps, so multiple matches at the same timestamp appear in order
- The component is optimized to check all conditions every update (not just the first match)
- Border styling is automatic: horizontal borders appear between rows only, no outer border

## Example Integration in Page Configuration

```json
{
  "MyPage": {
    "title": "Status Page",
    "layout": "mfd",
    "template": "mfd",
    "components": [
      {
        "type": "list",
        "id": "event_history",
        "fontFamily": "Arial",
        "fontSize": "12px",
        "maxRows": 8,
        "rowHeight": "18px",
        "area": "events",
        "conditions": [
          /* ... condition definitions ... */
        ]
      }
    ]
  }
}
```

## Troubleshooting

- **Rows not updating**: Ensure your `when` condition logic is correct and your data variables exist
- **Text not showing**: Check that the `text` field in `display` is being resolved correctly
- **Styling not applied**: Verify that the style properties are spelled correctly and match the supported options
- **List empty**: Check that at least one condition is evaluating to true

