# Schedule Browser Implementation Summary

## Overview

A fully implemented schedule/timetable browser overlay system that allows users to:
1. Open an interactive overlay dialog with a button press
2. Search and filter timetable files by train number
3. Navigate the list with arrow keys
4. Select and load schedule data into components
5. Close the overlay with the C button

## Files Modified

### 1. `src/templates/mfd.html`
- **Added CSS** for overlay, search bar, and list styling
- **Added HTML** overlay structure inside main screen
- **Added State** variables to MFDState for overlay management
- **Added Functions**:
  - `openScheduleBrowser()` - Opens overlay and fetches schedule list
  - `closeScheduleBrowser()` - Closes overlay
  - `renderScheduleList()` - Renders filtered schedule items with selection
  - `selectSchedule()` - Loads selected schedule JSON
  - `flattenTimetableData()` - Converts schedule to component variables
  - `handleScheduleBrowserInput(digit)` - Handles number button input
  - `handleScheduleBrowserNavigation(direction)` - Handles up/down navigation
- **Modified** `handleButtonPress()` to intercept inputs when overlay is active

### 2. `src/web_server.py`
- **Added Endpoint** `/api/schedules/list` - Lists all JSON files in `src/timetable/schedule/` with route code and train number
- **Added Endpoint** `/api/schedules/load/<filename>` - Returns full JSON content of a schedule file
- Both endpoints include error handling and path security checks

### 3. `src/pages_config.json`
- **Added Button** "TT" to home page top buttons with `"action": "open_schedule_browser"`
- **Added Page** "timetable" with components displaying all loaded schedule data
- **Added Menu Label** "TT" for button 6 on home page

### 4. `MFD_GUIDE.md`
- **Added** `open_schedule_browser` to supported button actions list
- **Added Section** "Schedule Browser (Timetable Loader)" with:
  - How to activate and use
  - Schedule file format specification
  - Using timetable data in components
  - List of all available timetable variables

### 5. `SCHEDULE_BROWSER.md` (New)
- Complete standalone guide for the schedule browser feature
- Examples and configuration details
- Technical implementation details
- Future enhancement suggestions

## How It Works

### User Flow
1. User presses "TT" button (or any button with `open_schedule_browser` action)
2. Overlay opens with search bar highlighted
3. User types train number using 0-9 buttons to filter schedules
4. User navigates filtered list with Up/Down arrows
5. User presses "E" to load selected schedule OR "C" to cancel
6. If loaded, schedule data merges into `MFDState.displayData` with `tt_` prefix
7. All components can now access the timetable variables

### Data Flow
```
Schedule Files (src/timetable/schedule/*.json)
  ↓
Backend /api/schedules/list → Frontend scheduleList
  ↓
User selects schedule
  ↓
Backend /api/schedules/load/<file> → Frontend timetableData
  ↓
flattenTimetableData() → Merge into displayData
  ↓
Components read tt_* variables
```

## Variable Naming Convention

All timetable data uses the `tt_` prefix to avoid conflicts with API data:

- **From train_info**: `tt_company`, `tt_train_number`, `tt_destination`, `tt_type`, `tt_priority`, `tt_max_speed_kph`, `tt_route_code`, `tt_service_timetable`
- **From first stop**: `tt_current_station`, `tt_current_stop`, `tt_current_ETA`, `tt_current_ETD`, `tt_current_ATA`, `tt_current_ATD`, `tt_current_diff`
- **Full array**: `tt_timetable` (array of all stops)

## Example Usage

### Button Configuration
```json
{
  "action": "open_schedule_browser"
}
```

### Component Configuration
```json
{
  "type": "text_display",
  "title": "Train",
  "value": "tt_train_number"
}
```

## Testing

To test the implementation:

1. Place a schedule JSON file in `src/timetable/schedule/` (example: `SKA_GAG_47502.json` already exists)
2. Start the dashboard: `python main.py`
3. Open the MFD in browser: `http://localhost:5000/mfd`
4. Press the "TT" button on the home page
5. Enter "47502" using number buttons
6. Press Down arrow to move to list (if multiple results)
7. Press "E" to load the schedule
8. Navigate to the "timetable" page (button 6) to see the loaded data

## Notes

- The overlay is absolutely positioned within the main screen and covers all content
- While active, it intercepts all button presses except those explicitly handled
- The search is case-insensitive and matches any part of the train number
- Security: File path validation prevents directory traversal attacks
- The selected schedule persists until the page is reloaded or a new schedule is selected

## Future Enhancements

Potential improvements:
- Backspace/clear functionality for search input
- Show full timetable table within the overlay
- Highlight current/next stop based on system time
- Auto-load schedule based on active train (via API)
- Keyboard shortcuts (e.g., ESC to close)
- Schedule favorites/bookmarks
- Export loaded schedule data
- Edit schedule files from UI

---

**Implementation Date**: 2026-02-22  
**Status**: ✅ Complete and Ready for Use
