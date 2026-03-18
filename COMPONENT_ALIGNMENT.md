# Component Alignment Guide

## Overview

Control how components are positioned within their grid areas using the `alignment` property. This allows you to align components:
- **Horizontally**: left, center, right
- **Vertically**: top, center, bottom

## Basic Usage

Add an `alignment` object to any component:

```json
{
  "type": "text_display",
  "id": "speed_display",
  "title": "Speed",
  "value": "speed_ms.Speed_ms",
  "area": "speed",
  "alignment": {
    "horizontal": "center",
    "vertical": "center"
  }
}
```

## Alignment Properties

### Horizontal Alignment

| Value | Effect |
|-------|--------|
| `"left"` | Align component to the left edge of the area |
| `"center"` | Center component horizontally in the area |
| `"right"` | Align component to the right edge of the area |

### Vertical Alignment

| Value | Effect |
|-------|--------|
| `"top"` | Align component to the top of the area |
| `"center"` | Center component vertically in the area |
| `"bottom"` | Align component to the bottom of the area |

## Examples

### Center Everything

```json
{
  "type": "progress_bar",
  "id": "brake_pressure",
  "title": "Brake Pressure",
  "area": "brake",
  "alignment": {
    "horizontal": "center",
    "vertical": "center"
  }
}
```

### Left-Aligned and Top

```json
{
  "type": "text_display",
  "id": "info",
  "title": "Info",
  "area": "info_area",
  "alignment": {
    "horizontal": "left",
    "vertical": "top"
  }
}
```

### Right-Aligned and Bottom

```json
{
  "type": "vertical_bar",
  "id": "effort",
  "title": "Effort",
  "area": "effort_area",
  "alignment": {
    "horizontal": "right",
    "vertical": "bottom"
  }
}
```

### Centered Horizontally, Top-Aligned Vertically

```json
{
  "type": "text_display",
  "id": "header",
  "title": "Header",
  "area": "header_area",
  "alignment": {
    "horizontal": "center",
    "vertical": "top"
  }
}
```

## Real-World Dashboard Example

```json
{
  "dashboard": {
    "layout_grid": {
      "columns": "1.2fr 1fr",
      "rows": "auto 1fr auto",
      "areas": [
        "speed rpm3 rpm3",
        "speed lzb lzb",
        "rpm2 lzb lzb",
        "rpm brake brake"
      ]
    },
    "components": [
      {
        "type": "speedometer",
        "id": "speed_gauge",
        "title": "Speed",
        "area": "speed",
        "alignment": {
          "horizontal": "center",
          "vertical": "center"
        }
      },
      {
        "type": "progress_bar",
        "id": "brake_bar",
        "title": "Brake",
        "area": "brake",
        "alignment": {
          "horizontal": "center",
          "vertical": "center"
        }
      },
      {
        "type": "vertical_bar",
        "id": "traction",
        "title": "Traction",
        "area": "rpm",
        "alignment": {
          "horizontal": "left",
          "vertical": "top"
        }
      },
      {
        "type": "text_display",
        "id": "service",
        "title": "Service",
        "area": "rpm2",
        "alignment": {
          "horizontal": "right",
          "vertical": "bottom"
        }
      }
    ]
  }
}
```

## Complete Component Example with All Features

```json
{
  "type": "text_display",
  "id": "brake_pressure",
  "title": "Brake Pressure",
  "value": "brake_pressure_1",
  "unit": "Pa",
  "area": "brake",
  "alignment": {
    "horizontal": "center",
    "vertical": "center"
  },
  "styles": {
    "title": {
      "fontSize": "14px",
      "bold": true
    },
    "value": {
      "fontSize": "28px",
      "bold": true
    },
    "unit": {
      "fontSize": "12px",
      "italic": true
    }
  }
}
```

## Supported Components

All components support alignment:

| Component Type | Supports Alignment |
|---|---|
| `text_display` | ✅ Yes |
| `progress_bar` | ✅ Yes |
| `vertical_bar` | ✅ Yes |
| `seven_segment` | ✅ Yes |
| `speedometer` | ✅ Yes |
| `scaled_vertical_bar` | ✅ Yes |

## How It Works

1. Component is placed in its grid `area`
2. Alignment properties control positioning within that area
3. Uses CSS flexbox for responsive alignment
4. Works with any grid layout configuration

### Under the Hood

```javascript
// Horizontal alignment (aligns items left-to-right)
alignItems: 'flex-start'   // left
alignItems: 'center'       // center  
alignItems: 'flex-end'     // right

// Vertical alignment (aligns items top-to-bottom)
justifyContent: 'flex-start'   // top
justifyContent: 'center'       // center
justifyContent: 'flex-end'     // bottom
```

## Best Practices

1. **Use center alignment** - For most components in shared areas
2. **Align to corners** - For status/info components (top-left, bottom-right)
3. **Be consistent** - Use similar alignment across similar components
4. **Consider content flow** - Left-align text, center icons/gauges
5. **Test on target display** - Alignment depends on area size

## Tips

- **Use with grid layouts** - Alignment is most useful with defined grid areas
- **Combine with styles** - Alignment + styling creates professional layouts
- **Responsive friendly** - Alignment adapts to different screen sizes
- **Optional property** - If not specified, components use natural spacing

## Visual Guide

```
┌─────────────────────────┐
│  LEFT      CENTER      RIGHT
├─────────────────────────┤
│ ░ Component  ▌Component  ░Component
│
│
│ ░ Component  ▌Component  ░Component
│
│
│ ░ Component  ▌Component  ░Component
├─────────────────────────┤
│ TOP          CENTER          BOTTOM
```

Where:
- `░ Component` = left or right aligned
- `▌Component` = center aligned
- Top/Center/Bottom controls vertical position

---

**Status:** ✅ Feature ready to use

**Last Updated:** 2026-02-18

**Files Modified:**
- `src/pages_config.json` - Added `alignment` to components
- `src/templates/mfd.html` - Added `applyComponentAlignment()` function
