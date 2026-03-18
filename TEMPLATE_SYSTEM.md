# Template System Guide

## Overview

TSWDash supports multiple UI templates that share the same component system and configuration. You can switch between different visual styles without changing your page layouts or component configurations.

## Available Templates

### 1. **mfd** (Physical MFD Interface)
- Full physical Multi-Function Display interface
- Includes border, functional buttons (D1-D6, L1-L6, R1-R6, S, F, I)
- Designed to look like actual train MFD hardware
- Grid-based layout inside the screen area
- Best for: Realistic simulation, physical button aesthetics

### 2. **touchscreen** (Clean Touchscreen Interface)
- Modern, minimalist black interface
- No borders or physical button decorations
- Full-screen grid layout
- Header bar with page title and status indicator
- Bottom navigation bar with page buttons
- Smooth hover effects and transitions
- Best for: Touch devices, clean minimal look, maximum screen space

## Configuration

### Setting the Default Template

Edit `src/pages_config.json` and set the template in the settings section:

```json
{
  "pages": {
    "dashboard": { ... },
    "diagnostics": { ... }
  },
  "settings": {
    "template": "mfd",        // or "touchscreen"
    "default_page": "dashboard"
  }
}
```

### Per-Page Template Selection

**NEW!** You can now specify different templates for individual pages:

```json
{
  "pages": {
    "dashboard": {
      "template": "mfd",           // This page uses MFD template
      "title": "Main Dashboard",
      "components": [ ... ]
    },
    "diagnostics": {
      "template": "touchscreen",   // This page uses touchscreen template
      "title": "Diagnostics",
      "components": [ ... ]
    },
    "settings": {
      // No template specified - falls back to settings.template
      "title": "Settings",
      "components": [ ... ]
    }
  },
  "settings": {
    "template": "mfd",             // Default for pages without template property
    "default_page": "dashboard"
  }
}
```

**How it works:**
1. When you navigate to a page, it checks the page's `template` property
2. If the page specifies a different template, it automatically redirects
3. If no page template is specified, it uses `settings.template`
4. The system remembers the page when switching templates (e.g., `/touchscreen#diagnostics`)

**Examples:**
- Dashboard uses physical MFD for realistic train controls
- Diagnostics uses touchscreen for clean data visualization  
- Settings uses touchscreen for modern UI
- Each page can use whichever template fits best!

### Template Options

- `"mfd"` - Physical MFD interface (default)
- `"touchscreen"` - Clean touchscreen interface

## Direct Access URLs

You can access templates and pages directly via URL:

- **Default (configured template)**: `http://localhost:5000/`
- **MFD template**: `http://localhost:5000/mfd`
- **Touchscreen template**: `http://localhost:5000/touchscreen`
- **Specific page on MFD**: `http://localhost:5000/mfd#diagnostics`
- **Specific page on touchscreen**: `http://localhost:5000/touchscreen#settings`

This allows you to test both templates and bookmark specific pages.

## Navigation Between Templates

When you navigate to a page that specifies a different template:

1. **Automatic Redirect**: The system detects the template mismatch
2. **Seamless Switch**: Redirects to correct template (e.g., `/mfd` → `/touchscreen`)
3. **Page Preserved**: The page name is kept in the URL hash
4. **No Data Loss**: All component configurations stay the same

Example: If you're on the MFD template viewing dashboard, and you navigate to a page configured with `"template": "touchscreen"`, the browser automatically navigates to `/touchscreen#pagename`.

## Component Compatibility

Both templates use the same:
- `components.js` rendering engine
- Component types (speedometer, text_display, progress_bar, etc.)
- Component configurations from `pages_config.json`
- Styling system (fontSize, bold, italic, underline)
- Alignment system (horizontal/vertical positioning)
- API data system

**This means you can switch templates without changing any component configurations!**

## Layout Differences

### MFD Template
- Screen area: Fixed 800x600px inside physical border
- Grid layout applies to screen area
- Buttons: Physical button areas (D1-D6, L1-L6, R1-R6, S, F, I)
- Navigation: Via labeled physical buttons

### Touchscreen Template
- Screen area: Full viewport (100vw x 100vh)
- Header bar: 60px with page title and status
- Content area: Flexible, takes remaining space
- Navigation bar: 70px at bottom with modern buttons
- Grid layout applies to content area

## Clickable Components (Touchscreen)

The touchscreen template supports clickable components. Add to any component in `pages_config.json`:

```json
{
  "type": "text_display",
  "id": "nav_component",
  "title": "Go to Diagnostics",
  "clickable": true,
  "onClick": {
    "action": "page_navigate",
    "target": "diagnostics"
  }
}
```

### onClick Actions

- `page_navigate` - Navigate to another page
  ```json
  "onClick": {"action": "page_navigate", "target": "diagnostics"}
  ```

## Visual Examples

### MFD Template
```
┌──────────────────────────────────┐
│  [D1] [D2] [D3] [D4] [D5] [D6]  │
│  ┌────────────────────────────┐  │
│[L1]│                          │[R1]
│[L2]│   Grid Layout Area       │[R2]
│[L3]│   (Your Components)      │[R3]
│[L4]│                          │[R4]
│[L5]│                          │[R5]
│[L6]└────────────────────────────┘[R6]
│     [S]   [F]   [I]             │
└──────────────────────────────────┘
```

### Touchscreen Template
```
┌────────────────────────────────────┐
│ Page Title            ● Status     │ ← Header (60px)
├────────────────────────────────────┤
│                                    │
│                                    │
│   Grid Layout Area                 │ ← Content (flexible)
│   (Your Components)                │
│                                    │
│                                    │
├────────────────────────────────────┤
│ [Dashboard] [Diagnostics] [Info]   │ ← Navigation (70px)
└────────────────────────────────────┘
```

## Styling Tips

### For MFD Template
- Use area-based layout in layout_grid
- Consider button label positioning
- 800x600px screen area
- Smaller font sizes work better

### For Touchscreen Template
- Full viewport is available
- Larger font sizes work better
- Use alignment for positioning
- Add clickable to components for interactivity
- Consider touch-friendly sizing (44px+ hit targets)

## Example Configuration

### Mixed Template Setup (Recommended)
```json
{
  "pages": {
    "dashboard": {
      "template": "mfd",              // Physical controls for driving
      "title": "",
      "layout_grid": {
        "columns": "1fr 1fr",
        "rows": "auto 1fr",
        "gap": "8px"
      },
      "components": [
        {
          "type": "speedometer",
          "id": "speed_gauge",
          "title": "Speed",
          "value": "speed_ms.Speed_ms"
        }
      ]
    },
    "diagnostics": {
      "template": "touchscreen",      // Clean view for data
      "title": "System Diagnostics",
      "layout_grid": {
        "columns": "1fr 1fr",
        "rows": "1fr 1fr 1fr",
        "gap": "20px"
      },
      "components": [
        {
          "type": "text_display",
          "id": "voltage",
          "title": "System Voltage",
          "value": "voltage",
          "unit": "V",
          "styles": {
            "title": {"fontSize": "24px"},
            "value": {"fontSize": "48px", "bold": true}
          }
        }
      ]
    },
    "settings": {
      "template": "touchscreen",      // Modern UI for settings
      "title": "Settings",
      "components": [ ... ]
    }
  },
  "settings": {
    "template": "mfd",                // Default template
    "default_page": "dashboard"
  }
}
```

### Single Template Setup
```json
{
  "pages": {
    "dashboard": { ... },             // Uses settings.template
    "diagnostics": { ... }            // Uses settings.template
  },
  "settings": {
    "template": "touchscreen",        // All pages use touchscreen
    "default_page": "dashboard"
  }
}
```

## Migration Between Templates

### Switching from MFD to Touchscreen
1. Change `"template": "touchscreen"` in settings (or per-page)
2. Consider increasing font sizes for better visibility
3. Add `clickable` to components if you want touch navigation
4. Test grid layout - you have more space now

### Switching from Touchscreen to MFD
1. Change `"template": "mfd"` in settings
2. Consider reducing font sizes to fit 800x600px screen
3. Remove `clickable` from components (buttons are physical)
4. Adjust grid layout for smaller screen

## Creating Custom Templates

Want to create your own template? Templates are HTML files in `src/templates/`:

1. Create `src/templates/mytemplate.html`
2. Include `components.js` and `canvas-renderers.js`
3. Fetch `/api/pages` for configuration
4. Fetch `/api/data` for real-time data
5. Use `ComponentFactory.renderComponent()` to render components
6. Set `"template": "mytemplate"` in pages_config.json

Both existing templates can serve as examples!

## Troubleshooting

### Template not loading
- Check `settings.template` value in pages_config.json
- Ensure template file exists: `src/templates/{template}.html`
- Check console for errors
- Try direct URL: `http://localhost:5000/{template}`

### Components not rendering
- All templates use the same component system
- Check component configuration in pages_config.json
- Verify components.js is loading (check browser console)
- API data must be polling correctly

### Layout issues
- Different templates have different screen sizes
- MFD: 800x600px fixed screen
- Touchscreen: Full viewport, flexible
- Adjust grid layout and font sizes accordingly

## Best Practices

1. **Test Both Templates** - Your config should work in both
2. **Use Relative Sizing** - `clamp()` for fonts, percentages for layout
3. **Alignment is Your Friend** - Use alignment instead of absolute positioning
4. **Clickable Areas** - Consider touch targets (44px minimum)
5. **Status Visibility** - Both templates show game status, use it
6. **Page Organization** - Multiple pages work in both templates

## Summary

The template system gives you flexibility in how you view your data:
- **MFD**: Realistic, physical button interface
- **Touchscreen**: Modern, clean, touch-friendly

Both share the same powerful component system and configuration, so you can switch anytime without losing your work!
