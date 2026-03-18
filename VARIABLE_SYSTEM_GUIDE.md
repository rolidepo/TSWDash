# Variable System Guide - Deep Nested JSON Support

## 🆕 What Changed

The API polling system now **automatically handles deeply nested JSON responses** and creates **hierarchical variable names** using dot notation.

## 📋 How It Works

### Nested JSON Flattening

When the API returns nested JSON like this:

```json
{
  "Result": "Success",
  "Values": {
    "geoLocation": {
      "longitude": 0.52192438677304942,
      "latitude": 51.380108707397724
    },
    "currentTile": {
      "x": 0,
      "y": 0
    },
    "playerProfileName": "Roland Molnar",
    "cameraMode": "FirstPerson_Standing",
    "currentServiceName": "None"
  }
}
```

The system automatically creates these variables:

- `driver_info.geoLocation.longitude` = 0.52192438677304942
- `driver_info.geoLocation.latitude` = 51.380108707397724
- `driver_info.currentTile.x` = 0
- `driver_info.currentTile.y` = 0
- `driver_info.playerProfileName` = "Roland Molnar"
- `driver_info.cameraMode` = "FirstPerson_Standing"
- `driver_info.currentServiceName` = "None"

### Variable Naming Convention

**Pattern:** `{base_name}.{json_path}`

- **base_name** = Variable name from `api_endpoints.json` mapping
- **json_path** = Full path through the nested JSON structure

**Examples:**

| Base Name | JSON Path | Full Variable Name |
|-----------|-----------|-------------------|
| `driver_info` | `playerProfileName` | `driver_info.playerProfileName` |
| `driver_info` | `geoLocation.longitude` | `driver_info.geoLocation.longitude` |
| `speed_ms` | `Speed (ms)` | `speed_ms.Speed (ms)` |
| `brake_pressure_1` | `WhiteNeedle (Pa)` | `brake_pressure_1.WhiteNeedle (Pa)` |

### Arrays/Lists

If the JSON contains arrays, they're indexed:

```json
{
  "Values": {
    "motors": [
      {"id": 1, "power": 100},
      {"id": 2, "power": 95}
    ]
  }
}
```

Creates:
- `motor_data.motors[0].id` = 1
- `motor_data.motors[0].power` = 100
- `motor_data.motors[1].id` = 2
- `motor_data.motors[1].power` = 95

## 🎯 Runtime Variables File

### Location
`src/runtime_variables.json`

This file is **automatically created and updated every 2 seconds** while the app runs.

### Purpose
- 📝 **Reference guide** - See all discovered variables
- 🔍 **Type information** - Check data types
- 📊 **Current values** - View live data
- 🗓️ **Discovery tracking** - When each variable was first seen
- 🎨 **Dashboard config** - Easy copy-paste for dashboard_config.json

### File Structure

```json
{
  "timestamp": "2026-02-18T14:23:45.123456",
  "total_variables": 42,
  "variables": {
    "driver_info": [
      {
        "name": "driver_info.geoLocation.longitude",
        "endpoint": "DriverAid.PlayerInfo",
        "type": "float",
        "first_seen": "2026-02-18T14:20:15.456789",
        "current_value": 0.52192438677304942
      },
      {
        "name": "driver_info.geoLocation.latitude",
        "endpoint": "DriverAid.PlayerInfo",
        "type": "float",
        "first_seen": "2026-02-18T14:20:15.456789",
        "current_value": 51.380108707397724
      }
    ],
    "speed_ms": [
      {
        "name": "speed_ms.Speed (ms)",
        "endpoint": "CurrentDrivableActor.Function.HUD_GetSpeed",
        "type": "float",
        "first_seen": "2026-02-18T14:20:10.123456",
        "current_value": 15.5
      }
    ]
  }
}
```

### Using Variables in Dashboard

1. **Start the application:**
   ```bash
   cd src
   python main.py
   ```

2. **Wait 2-3 seconds** for the game session to start and data to poll

3. **Open `runtime_variables.json`** in VS Code or any text editor

4. **Copy variable names** you want to display

5. **Add to `dashboard_config.json`:**
   ```json
   {
     "title": "My Dashboard",
     "sections": [
       {
         "name": "Player Location",
         "variables": [
           "driver_info.geoLocation.longitude",
           "driver_info.geoLocation.latitude",
           "driver_info.playerProfileName"
         ]
       }
     ]
   }
   ```

6. **Restart the app** to see changes

## 📝 Console Output

The console now shows all flattened variables:

```
[Subscription 1] 14:23:45.128
  Path: DriverAid.PlayerInfo
    driver_info.geoLocation.longitude: 0.52192438677304942
    driver_info.geoLocation.latitude: 51.380108707397724
    driver_info.currentTile.x: 0
    driver_info.currentTile.y: 0
    driver_info.playerProfileName: Roland Molnar
    driver_info.cameraMode: FirstPerson_Standing
    driver_info.currentServiceName: None

[Subscription 1] 14:23:45.250
  Path: CurrentDrivableActor.Function.HUD_GetSpeed
    speed_ms.Speed (ms): 15.5

[APIPoller] Variables file updated: runtime_variables.json (42 variables)
```

## 🔧 Configuration Changes

### No Changes Required!

Your existing `api_endpoints.json` continues to work. The base variable names are used as prefixes for all nested values.

**Example - Current Config:**
```json
{
  "subscriptions": [
    {
      "id": 1,
      "endpoints": ["DriverAid.PlayerInfo"],
      "variables": {
        "DriverAid.PlayerInfo": "driver_info"
      }
    }
  ]
}
```

**What happens:**
- Base name: `driver_info`
- All nested JSON fields automatically become: `driver_info.{path}`

### Backward Compatibility

If you had code looking for simple variable names, they may need updating. Check `runtime_variables.json` to see the new full variable names.

## 🎨 MFD/Dashboard Integration

Use the new variable names in your `pages_config.json`:

```json
{
  "pages": {
    "navigation": {
      "title": "Navigation Info",
      "components": [
        {
          "type": "text_display",
          "id": "longitude",
          "title": "Longitude",
          "value": "driver_info.geoLocation.longitude",
          "decimals": 6
        },
        {
          "type": "text_display",
          "id": "latitude",
          "title": "Latitude",
          "value": "driver_info.geoLocation.latitude",
          "decimals": 6
        },
        {
          "type": "text_display",
          "id": "player_name",
          "title": "Driver",
          "value": "driver_info.playerProfileName"
        }
      ]
    }
  }
}
```

## 🏗️ Implementation Details

### Key Functions

**`_flatten_nested_dict(data, base_name, parent_key="")`**
- Recursively traverses nested dictionaries and lists
- Builds dot-notation variable names
- Handles unlimited nesting depth

**`_track_variable(var_name, endpoint_path, value)`**
- Records metadata about each discovered variable
- Tracks data type, endpoint source, discovery time

**`_write_variables_file()`**
- Writes `runtime_variables.json` every 2 seconds
- Groups variables by base name
- Shows current values and metadata

### Thread Safety

All variable writes are protected by threading locks to prevent race conditions between the poller and web server threads.

## 📊 Monitoring

### Live Variable Count

Watch the console for:
```
[APIPoller] Variables file updated: runtime_variables.json (42 variables)
```

### File Location

The file is created in: `src/runtime_variables.json`

It's updated automatically while the app runs and contains the most recent data.

## 🐛 Troubleshooting

### Variables file not created?
- Wait 2-3 seconds after app starts
- Ensure TSW6 is running with `-HTTPAPI`
- Check console for errors

### Missing expected variables?
- Check if the endpoint is configured in `api_endpoints.json`
- Verify the game session is active (green indicator)
- Look at console output to see what's being polled

### Variable names different than expected?
- Check `runtime_variables.json` for actual names
- The system uses the exact JSON structure from the API response

## 🎯 Best Practices

1. ✅ **Start app, check runtime_variables.json** before configuring dashboard
2. ✅ **Use descriptive base names** in api_endpoints.json (e.g., `driver_info`, not `di`)
3. ✅ **Group related endpoints** in subscriptions for efficient polling
4. ✅ **Copy exact variable names** from runtime_variables.json (case-sensitive!)
5. ✅ **Keep runtime_variables.json open** while developing dashboards

## 📚 Related Files

- [`api_endpoints.json`](src/api_endpoints.json) - Configure what to poll
- [`dashboard_config.json`](src/dashboard_config.json) - Simple dashboard layout
- [`pages_config.json`](src/pages_config.json) - Advanced MFD pages
- [`runtime_variables.json`](src/runtime_variables.json) - Auto-generated reference (created at runtime)
- [`api_poller.py`](src/api_poller.py) - Core polling implementation

## 🔄 Migration Guide

If you're upgrading from the old flat variable system:

1. **Run the app** to generate `runtime_variables.json`
2. **Check which variables changed names** (they now have dots in them)
3. **Update dashboard_config.json** with new variable names
4. **Update pages_config.json** component `value` fields
5. **Test the dashboard** to verify all data displays correctly

Example migration:
```json
// OLD
"variables": ["speed_ms", "rpm"]

// NEW  
"variables": ["speed_ms.Speed (ms)", "rpm.RPM"]
```

Check `runtime_variables.json` for the exact new names!
