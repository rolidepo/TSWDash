# Picto Icons

This folder contains PNG icons for the ebula_data_table picto column.

## Setup

1. Place your PNG icon files in this folder
2. Add the `picto_icon` field to your timetable entries with the filename

## Usage

In your timetable JSON entries, add the `picto_icon` field:

```json
{
  "km": 1.2,
  "speed_limit": 80,
  "picto": "▽",
  "picto_icon": "signal-clear.png",
  "location": "Station Name",
  "station": false,
  "latitude": 50.12345,
  "longitude": 6.78901
}
```

## Icon Caching

The icon loader uses an in-memory cache to avoid reloading images on every 100ms render cycle:

- **First render**: Icon starts loading in the background, text symbol displays as fallback (if `picto` field exists)
- **Second render+**: Cached icon displays instantly
- **If loading fails**: Falls back to text symbol specified in `picto` field

## Combining with Formatting

Icons work with all picto formatting options:

```json
{
  "picto": "▽",
  "picto_icon": "signal-clear.png",
  "picto_border_radius": true,
  "picto_strikethrough_horizontal": true,
  "picto_strikethrough_diagonal": true
}
```

## Icon Recommendations

- **Format**: PNG with transparency
- **Size**: 24x24 to 32x32 pixels (scales to fit)
- **Color**: Should work with both light and dark themes
- **Naming**: Use descriptive names like `signal-clear.png`, `station-main.png`, etc.

## Performance Notes

- Icons are cached in `window.pictoIconCache` to avoid reload delays during the 100ms render cycle
- Only icons that are actually used in visible rows are loaded
- Failed loads are marked as null in cache to prevent repeated attempts
