# Schedule Browser - Quick Start Guide

## What You Can Do Now

You now have a fully functional schedule/timetable browser! Here's what's been implemented:

## 🎯 Features

✅ **Open overlay browser** - Press "TT" button to open
✅ **Search by train number** - Use 0-9 buttons to filter
✅ **Navigate list** - Use Up/Down arrows  
✅ **Select schedule** - Press "E" to load
✅ **Close overlay** - Press "C" to cancel
✅ **Display timetable data** - All loaded data available to components
✅ **Example timetable page** - Button 6 on home page

## 🚀 Try It Now

1. **Start the dashboard**:
   ```bash
   python src/main.py
   ```

2. **Open in browser**:
   ```
   http://localhost:5000/mfd
   ```

3. **Load a schedule**:
   - Press the **TT** button (top row)
   - Type **47502** using number buttons
   - Press **Down** arrow (if needed)
   - Press **E** to load

4. **View the data**:
   - Press **6** (bottom row) to go to timetable page
   - You'll see train number, destination, type, speed, route, company, and current station

## 📁 Add Your Own Schedules

Create JSON files in `src/timetable/schedule/` directory:

**Example: `src/timetable/schedule/MY_TRAIN_123.json`**
```json
{
  "train_info": {
    "company": "Your Company",
    "train_number": "MY 123",
    "destination": "London - Paris",
    "type": "Express",
    "priority": "1",
    "max_speed_kph": 200,
    "route_code": "LP",
    "service_timetable": "LP_1.json"
  },
  "timetable_data": [
    {
      "station": "London St Pancras",
      "stop": true,
      "ETA": "",
      "ETD": "10:30:00",
      "ATA": "",
      "ATD": "",
      "diff": ""
    },
    {
      "station": "Paris Gare du Nord",
      "stop": true,
      "ETA": "13:47:00",
      "ETD": "",
      "ATA": "",
      "ATD": "",
      "diff": ""
    }
  ]
}
```

Your schedule will immediately appear in the browser list!

## 🎨 Use Timetable Data in Any Page

Add timetable components to any page in `src/pages_config.json`:

```json
{
  "type": "text_display",
  "title": "Train Number",
  "value": "tt_train_number"
}
```

Available variables (all prefixed with `tt_`):
- `tt_company`
- `tt_train_number`
- `tt_destination`
- `tt_type`
- `tt_priority`
- `tt_max_speed_kph`
- `tt_route_code`
- `tt_service_timetable`
- `tt_current_station`
- `tt_current_ETA`
- `tt_current_ETD`

## 🔧 Customize

### Add Button to Any Page

In your page configuration:
```json
"buttons": {
  "top": {
    "TT": {"action": "open_schedule_browser"}
  }
}
```

### Style the Overlay

Edit CSS in `src/templates/mfd.html` (search for "Schedule Browser Overlay")

### Modify Behavior

Edit JavaScript functions in `src/templates/mfd.html`:
- `openScheduleBrowser()`
- `renderScheduleList()`
- `selectSchedule()`
- `handleScheduleBrowserInput()`

## 📖 Full Documentation

- **Complete Guide**: See `SCHEDULE_BROWSER.md`
- **Implementation Details**: See `SCHEDULE_BROWSER_IMPLEMENTATION.md`
- **MFD Guide**: See `MFD_GUIDE.md` (includes schedule browser section)

## 🐛 Troubleshooting

**Overlay doesn't open?**
- Check console for errors (F12 in browser)
- Verify button configuration in pages_config.json

**No schedules in list?**
- Verify JSON files exist in `src/timetable/schedule/`
- Check JSON files are valid (use a JSON validator)
- Check console for loading errors

**Data not displaying?**
- Make sure you selected a schedule (pressed "E")
- Check component `value` uses correct `tt_` prefix
- Verify the schedule file has the expected fields

**Search not working?**
- Make sure overlay is open (search bar should be visible)
- Check that number buttons are defined in your page config

## 💡 Tips

- **Fast search**: Type first few digits to narrow down quickly
- **Route codes**: Organize schedules with consistent route codes for easy browsing
- **Default page**: Navigate to timetable page after loading to see all data
- **Multiple schedules**: You can load different schedules without reloading the page

---

**Enjoy your new Schedule Browser! 🚆📋**
