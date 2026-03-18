# TSW Dashboard (MFD + Touchscreen)

Python-based polling for the Train Sim World External Interface API with a web UI that supports both MFD and touchscreen templates. Pages and components are driven by JSON configuration.

## Quick Start

1. Enable HTTPAPI in TSW
   - Steam launch options: `-HTTPAPI`
   - Start the game once so `CommAPIKey.txt` is created.

2. Install dependencies
   - `pip install -r requirements.txt`

3. Run the app
   - `cd src`
   - `python main.py`

4. Open the UI
   - Default: `http://localhost:5000`
   - MFD: `http://localhost:5000/mfd`
   - Touchscreen: `http://localhost:5000/touchscreen`

## Configuration Overview

- `src/api_endpoints.json`
  - Defines subscriptions, single endpoints, and patch endpoints.
  - Maps API fields to variable names used by the UI.

- `src/pages_config.json`
  - Defines pages, layouts, components, buttons, and per-page templates.
  - Uses CSS Grid via `layout_grid` with `columns`, `rows`, and `areas`.
  - Supports per-page colors: `background_color`, `text_color`, `border_color`.

## Templates

- `mfd` - physical frame and buttons
- `touchscreen` - full-screen minimal UI with night mode

Pages can specify `"template": "mfd"` or `"template": "touchscreen"` individually.

## Components

Implemented in `src/templates/components.js`. Common types:

- `text_display`
- `progress_bar`
- `vertical_bar`
- `seven_segment`
- `scaled_vertical_bar`
- `speedometer`

Use `styles` or `font_sizes` per component to adjust typography, and `alignment` to position content within cells.

## API Reference

Reference PDF:
`reference/TSW External Interface API 1.5 1.pdf`

## Notes

- API key location: `Documents\My Games\TrainSimWorld6\Saved\Config\CommAPIKey.txt`
- Poller is thread-safe and does not persist data between sessions.
