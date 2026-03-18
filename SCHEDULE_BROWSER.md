# Schedule Browser (Timetable Loader)

The Schedule Browser is an interactive overlay that allows you to load timetable JSON files and display their data in your MFD components.

## Quick Start

1. **Open the browser**: Press the "TT" button (or any button configured with `"action": "open_schedule_browser"`)
2. **Search**: Enter train numbers using the number buttons 0-9
3. **Navigate**: Use Up/Down arrow buttons to move through the filtered list
4. **Select**: Press "E" to load the selected schedule
5. **Cancel**: Press "C" to close without loading

## Configuration

### Add Button to Open Browser

In your `pages_config.json`, add this button action:

```json
"buttons": {
  "top": {
    "TT": {"action": "open_schedule_browser"}
  }
}
```

### Schedule File Format

Place schedule JSON files in `src/timetable/schedule/`. Example format:

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
    }
  ]
}
```

## Using Timetable Data

Once loaded, timetable data is merged into the component data with the `tt_` prefix.

### Train Info Variables

All fields from `train_info` are prefixed with `tt_`:

```json
{
  "type": "text_display",
  "title": "Train",
  "value": "tt_train_number"
}
```

Available variables:
- `tt_company` - Operating company
- `tt_train_number` - Train service number
- `tt_destination` - Final destination
- `tt_type` - Service type
- `tt_priority` - Priority level
- `tt_max_speed_kph` - Maximum speed
- `tt_route_code` - Route code
- `tt_service_timetable` - Reference timetable

### Current Station Variables

The first stop in `timetable_data` is available with the `tt_current_` prefix:

- `tt_current_station` - Station name
- `tt_current_stop` - Stop indicator (true/false)
- `tt_current_ETA` - Expected arrival time
- `tt_current_ETD` - Expected departure time
- `tt_current_ATA` - Actual arrival time
- `tt_current_ATD` - Actual departure time
- `tt_current_diff` - Time difference

### Full Timetable Array

The complete `timetable_data` array is available as `tt_timetable` for advanced components that need to iterate through all stops.

## Example Page

See the `timetable` page in `pages_config.json` for a complete example that displays:
- Train number (large, bold)
- Destination
- Train type
- Maximum speed with unit
- Route code
- Operating company
- Current/first station

## How It Works

1. **List Endpoint**: `/api/schedules/list` scans `src/timetable/schedule/` and returns all JSON files with their route code and train number
2. **Load Endpoint**: `/api/schedules/load/<filename>` returns the full JSON content of a specific schedule file
3. **Data Merging**: The loaded schedule is flattened and merged into `MFDState.displayData` so components can access it just like API data
4. **State Management**: The overlay state is tracked in `MFDState.scheduleOverlayActive` and button inputs are intercepted while active

## Button Interception

When the schedule browser overlay is open, these buttons are intercepted:
- **0-9**: Add digits to the search query
- **Up/Down**: Navigate the filtered list
- **E**: Select the highlighted schedule
- **C**: Close the overlay

All other button presses are ignored while the overlay is active.

## Technical Details

### Frontend (mfd.html)

Functions added:
- `openScheduleBrowser()` - Opens overlay and loads schedule list
- `closeScheduleBrowser()` - Closes overlay
- `renderScheduleList()` - Renders filtered schedule items
- `selectSchedule()` - Loads selected schedule file
- `flattenTimetableData()` - Flattens JSON to component-accessible variables
- `handleScheduleBrowserInput()` - Handles number input
- `handleScheduleBrowserNavigation()` - Handles up/down navigation
- `handleButtonPress()` - Updated to intercept when overlay is active

State variables added to `MFDState`:
- `timetableData` - Full loaded timetable object
- `scheduleOverlayActive` - Boolean overlay state
- `scheduleList` - Array of available schedules
- `scheduleSearchQuery` - Current search string
- `scheduleSelectedIndex` - Currently selected list index
- `scheduleSearchBarFocused` - Whether search bar is focused

### Backend (web_server.py)

Endpoints added:
- `GET /api/schedules/list` - Returns list of all schedule files with route code and train number
- `GET /api/schedules/load/<filename>` - Returns full content of a specific schedule file

### CSS Styles

Classes added to `mfd.html`:
- `.schedule-overlay` - Full-screen overlay container
- `.schedule-overlay.active` - Visible state
- `.schedule-search-bar` - Search input at top
- `.schedule-search-bar.highlighted` - Focused state with shadow
- `.schedule-list` - Scrollable list container
- `.schedule-item` - Individual schedule item
- `.schedule-item.selected` - Highlighted selection
- `.schedule-item-code` - Route code display
- `.schedule-item-number` - Train number display

## Future Enhancements

Potential additions:
- [ ] Support backspace/clear in search
- [ ] Show full timetable table in overlay
- [ ] Highlight next/current stop based on time
- [ ] Auto-select schedule based on current train
- [ ] Multiple timetable locations/favorites
- [ ] Export/import schedule files
- [ ] Schedule editing interface

---

**Version**: 1.0  
**Status**: ✅ Fully Implemented
