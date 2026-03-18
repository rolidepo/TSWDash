# Component Styling Customization Guide

## Overview

You can now customize **per-component styling** in `pages_config.json` including:
- Font sizes (title, value, unit)
- Text weight (bold/normal)
- Text style (italic/normal)
- Text decoration (underline/none)

All styling is done per-component without modifying `components.js`.

## Styling Levels (Priority Order)

1. **Component-level** `styles` (highest priority)
2. Page-level `font_sizes` (fallback)
3. CSS default from `mfd.html` (lowest priority)

## Component Styles Structure

Each component can have a `styles` object with `title`, `value`, and `unit` sub-objects:

```json
{
  "type": "text_display",
  "id": "my_component",
  "styles": {
    "title": {
      "fontSize": "14px",
      "bold": true,
      "italic": false,
      "underline": false
    },
    "value": {
      "fontSize": "28px",
      "bold": true,
      "italic": false,
      "underline": false
    },
    "unit": {
      "fontSize": "12px",
      "bold": false,
      "italic": true,
      "underline": false
    }
  }
}
```

## Styling Properties

| Property | Type | Values | Example |
|----------|------|--------|---------|
| `fontSize` | string | Any CSS size | `"14px"`, `"2vh"`, `"clamp(12px, 2vh, 16px)"` |
| `bold` | boolean | `true` or `false` | `true` |
| `italic` | boolean | `true` or `false` | `true` |
| `underline` | boolean | `true` or `false` | `true` |

## Examples

### Simple Bold Title

```json
{
  "type": "text_display",
  "id": "speed",
  "title": "Speed",
  "value": "speed_ms.Speed_ms",
  "styles": {
    "title": {
      "bold": true
    }
  }
}
```

### Italicized Unit

```json
{
  "type": "text_display",
  "id": "temperature",
  "title": "Temperature",
  "value": "temperature",
  "unit": "°C",
  "styles": {
    "unit": {
      "italic": true,
      "fontSize": "10px"
    }
  }
}
```

### Underlined Label with Large Bold Value

```json
{
  "type": "text_display",
  "id": "brake_pressure",
  "title": "Brake Pressure",
  "value": "brake_pressure_1",
  "unit": "Pa",
  "styles": {
    "title": {
      "underline": true,
      "bold": true
    },
    "value": {
      "fontSize": "32px",
      "bold": true
    },
    "unit": {
      "italic": true
    }
  }
}
```

### Mixed Styling

```json
{
  "type": "progress_bar",
  "id": "traction",
  "title": "Traction Effort",
  "value": "tractive_effort",
  "unit": "kN",
  "styles": {
    "title": {
      "fontSize": "16px",
      "bold": true,
      "underline": false
    },
    "value": {
      "fontSize": "24px",
      "bold": true,
      "italic": false
    },
    "unit": {
      "fontSize": "12px",
      "bold": false,
      "italic": true,
      "underline": false
    }
  }
}
```

## Per-Component vs Page-Level

### Page-Level (Applies to all components)

```json
{
  "dashboard": {
    "font_sizes": {
      "title": "14px",
      "value": "28px",
      "unit": "12px"
    },
    "components": [...]
  }
}
```

### Per-Component (Overrides page-level)

```json
{
  "type": "text_display",
  "id": "important",
  "styles": {
    "title": {
      "fontSize": "18px",  // Overrides page-level
      "bold": true
    },
    "value": {
      "fontSize": "36px"   // Overrides page-level
    }
  }
}
```

## Supported Components

All text-based components support full styling:

| Component | Supports | Notes |
|-----------|----------|-------|
| `text_display` | ✅ Full | All three elements (title, value, unit) |
| `progress_bar` | ✅ Full | Title and unit |
| `vertical_bar` | ✅ Full | Title and unit |
| `seven_segment` | ✅ Full | Title, special handling for digital display |
| `speedometer` | ⚠️ Partial | Canvas-based, limited styling |

## Real-World Dashboard Example

```json
{
  "dashboard": {
    "title": "Train Dashboard",
    "layout": "dashboard",
    "components": [
      {
        "type": "text_display",
        "id": "speed",
        "title": "Speed",
        "value": "speed_ms.Speed_ms",
        "unit": "km/h",
        "styles": {
          "title": {
            "fontSize": "14px",
            "bold": true
          },
          "value": {
            "fontSize": "32px",
            "bold": true
          },
          "unit": {
            "fontSize": "12px",
            "italic": true
          }
        }
      },
      {
        "type": "progress_bar",
        "id": "brake",
        "title": "Brake Pressure",
        "value": "brake_pressure_1",
        "unit": "Pa",
        "styles": {
          "title": {
            "fontSize": "12px",
            "bold": true,
            "underline": true
          },
          "unit": {
            "fontSize": "11px",
            "italic": true
          }
        }
      },
      {
        "type": "vertical_bar",
        "id": "traction",
        "title": "Traction",
        "value": "tractive_effort_TractiveEffort_N",
        "unit": "kN",
        "styles": {
          "value": {
            "fontSize": "24px",
            "bold": true
          }
        }
      }
    ]
  }
}
```

## Tips & Best Practices

1. **Be consistent** - Use similar styling patterns across related components
2. **Emphasize important values** - Use `bold: true` for critical data
3. **Distinguish units** - Often use `italic: true` for unit text
4. **Hierarchy** - Make titles smaller, values larger, units smallest
5. **Mix sparingly** - Don't use all three (bold, italic, underline) at once
6. **Test responsiveness** - Use `clamp()` for font sizes if supporting different screen sizes

## Common Combinations

### Emphasized Value
```json
"styles": {
  "value": {
    "fontSize": "32px",
    "bold": true
  }
}
```

### Professional Look
```json
"styles": {
  "title": {
    "bold": true
  },
  "unit": {
    "italic": true,
    "fontSize": "10px"
  }
}
```

### Clear Hierarchy
```json
"styles": {
  "title": {
    "fontSize": "12px"
  },
  "value": {
    "fontSize": "32px",
    "bold": true
  },
  "unit": {
    "fontSize": "10px",
    "italic": true
  }
}
```

## Troubleshooting

### Styling not applying?

1. Check JSON syntax - `styles` object must be valid
2. Verify component type - Must be text-based (text_display, progress_bar, etc.)
3. Correct property names - `fontSize`, `bold`, `italic`, `underline`
4. Boolean values - Use `true`/`false`, not `"true"`/`"false"`

### Value looks wrong?

- Element not updating? It may be using page-level `font_sizes` instead
- Add explicit `styles` object to component to override
- Component-level `styles` always take priority

### Can't remove styling?

Each property can be:
- Explicitly set: `"bold": true` or `"bold": false`
- Omitted: Property not set (uses inherited/default)

```json
// This sets bold explicitly
"styles": {"value": {"bold": true}}

// This removes bold override (uses default)
"styles": {"value": {}}
```

## API Reference

### Styles Object Structure

```typescript
interface ComponentStyles {
  title?: ElementStyle;
  value?: ElementStyle;
  unit?: ElementStyle;
}

interface ElementStyle {
  fontSize?: string;     // CSS font-size value
  bold?: boolean;        // true = bold, false = normal
  italic?: boolean;      // true = italic, false = normal
  underline?: boolean;   // true = underline, false = none
}
```

### Styling Application Order

```
1. Render component with defaults from CSS
2. Apply page-level font_sizes (if exists)
3. Apply component-level styles (overrides everything)
4. Final rendered element has combined styling
```

---

**Status:** ✅ Feature ready to use

**Last Updated:** 2026-02-18

**Files Modified:**
- `src/pages_config.json` - Added `styles` to components
- `src/templates/components.js` - Added `applyElementStyles()` function
- `src/templates/mfd.html` - Components receive styling config


## Examples

### Dashboard Page - Large Fonts

```json
"dashboard": {
  "title": "Dashboard",
  "font_sizes": {
    "title": "16px",
    "value": "32px",
    "unit": "14px"
  },
  "components": [...]
}
```

### Diagnostics Page - Compact Fonts

For pages with many components, use smaller fonts:

```json
"diagnostics": {
  "title": "Diagnostics",
  "font_sizes": {
    "title": "12px",
    "value": "24px",
    "unit": "10px"
  },
  "components": [...]
}
```

### Info Page - Very Large Fonts

For pages that need maximum readability:

```json
"info": {
  "title": "Information",
  "font_sizes": {
    "title": "20px",
    "value": "36px",
    "unit": "16px"
  },
  "components": [...]
}
```

## Supported Units

Any CSS font-size value is supported:

| Format | Example | Comment |
|--------|---------|---------|
| Pixels | `"16px"` | Absolute size |
| Relative to parent | `"1.5em"` | 1.5x parent font size |
| Viewport height | `"5vh"` | 5% of viewport height |
| Viewport width | `"3vw"` | 3% of viewport width |
| Clamp (responsive) | `"clamp(12px, 3vh, 24px)"` | Min, preferred, max |

## Responsive Example

Use `clamp()` for responsive sizing that scales with viewport:

```json
"dashboard": {
  "font_sizes": {
    "title": "clamp(12px, 2vh, 18px)",
    "value": "clamp(24px, 4vh, 40px)",
    "unit": "clamp(10px, 1.5vh, 16px)"
  },
  "components": [...]
}
```

This makes fonts scale automatically based on screen size while staying within min/max bounds.

## Which Components Support Font Size Changes?

All text-based components support the `font_sizes` configuration:

| Component Type | Supports | Notes |
|---|---|---|
| `text_display` | ✅ Yes | Title, value, and unit |
| `progress_bar` | ✅ Yes | Title and unit |
| `vertical_bar` | ✅ Yes | Title and unit |
| `seven_segment` | ✅ Yes | Title, special handling for value (digital) |
| `speedometer` | ⚠️ Partial | Canvas-based, uses fixed sizes |

## Comparison: Before vs After

### Before (Old Way)
Edit `components.js` and change hardcoded values:
```javascript
// Had to edit components.js:
value.style.fontSize = '44px';  // ❌ Not flexible
```

### After (New Way)
Configure in `pages_config.json`:
```json
"font_sizes": {
  "value": "44px"  // ✅ Per-page, easy to customize
}
```

## Troubleshooting

### Font sizes not applying?

1. **Check syntax** - Make sure `font_sizes` is an object with `title`, `value`, `unit` keys
2. **Check component type** - Not all components support font sizes (canvas-based ones don't)
3. **Check CSS units** - Use valid CSS values like `"14px"`, not `"14"` or `"14 px"`
4. **Check JSON validity** - Validate your `pages_config.json` is valid JSON

### Fonts too small/too large?

Test different values to find what works best:
- Start with page-level settings
- If needed, apply component-level overrides
- Use `clamp()` for responsive scaling

### Component override not working?

Make sure the component has `font_sizes` configured:
```json
{
  "type": "text_display",
  "id": "my_component",
  "font_sizes": {  // ← Required
    "value": "36px"
  }
}
```

## Real-World Example

Complete page configuration with mixed font sizes:

```json
"dashboard": {
  "title": "Train Dashboard",
  "layout": "dashboard",
  "font_sizes": {
    "title": "14px",
    "value": "28px",
    "unit": "12px"
  },
  "components": [
    {
      "type": "text_display",
      "id": "speed",
      "title": "Speed",
      "value": "speed_ms.Speed_ms",
      "unit": "km/h"
      // Uses page-level fonts: title 14px, value 28px, unit 12px
    },
    {
      "type": "text_display",
      "id": "brake_pressure",
      "title": "Brake P",
      "value": "brake_pressure_1.WhiteNeedle_Pa",
      "unit": "Pa",
      "font_sizes": {  // Component override
        "value": "36px"  // Larger than page default
      }
    }
  ]
}
```

## Tips & Best Practices

1. **Start with page-level** - Define `font_sizes` once per page
2. **Use component overrides sparingly** - For emphasis on key values only
3. **Test responsive sizing** - Use `clamp()` for consistent look across screen sizes
4. **Keep it readable** - Don't go below 12px for body text on MFD
5. **Group similar pages** - Pages with same layout should have same font sizes

## API Reference

### Font Sizes Object Structure

```typescript
interface FontSizes {
  title?: string;    // CSS font-size value or undefined
  value?: string;    // CSS font-size value or undefined
  unit?: string;     // CSS font-size value or undefined
}
```

### Where Font Sizes Apply

```
Page Config (font_sizes)
       ↓
  Applied to all components
       ↓
Component Config (font_sizes) - Overrides if present
       ↓
   Force applied to component's elements
```

---

**Status:** ✅ Feature ready to use

**Last Updated:** 2026-02-18

**Files Modified:**
- `src/pages_config.json` - Added `font_sizes` to pages
- `src/templates/components.js` - Added font size application logic
- `src/templates/mfd.html` - Added font size attachment to components
