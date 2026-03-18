# Your Configuration - Specific Flow

This document shows exactly how YOUR api_endpoints.json works with the new system.

## Your Configuration

### Single Endpoints (Always Polled)
```json
"single_endpoints": [
  {
    "id": "player_info",           ← FIRST endpoint, used for game detection
    "frequency_ms": 1000,          ← Poll every 1 second
    "path": "DriverAid.PlayerInfo",
    "variables": {"PlayerInfo": "player_info"}
  }
]
```

### Subscriptions (Only Polled During IN_SESSION)
```json
"subscriptions": [
  {
    "id": 1,
    "name": "main_telemetry",
    "frequency_ms": 100,           ← Poll every 100ms during session
    "endpoints": [
      "CurrentDrivableActor.Function.HUD_GetSpeed",
      ...
    ]
  },
  {
    "id": 2,
    "name": "electrical_systems",
    "frequency_ms": 10000,         ← Poll every 10 seconds during session
    "endpoints": [
      "CurrentDrivableActor.Function.HUD_GetAmmeter",
      ...
    ]
  }
]
```

## Complete Execution Timeline

### T=0: Application Starts
```
$ python main.py

[Main] Loading configuration...
  └─ Loads api_endpoints.json
  └─ Loads CommAPIKey.txt
  └─ Validates both

[Main] Initializing API poller...
  └─ Creates APIPoller instance
  └─ Sets game_status = "offline"

[Main] Initializing web dashboard...
  └─ Creates Flask app
  └─ Loads dashboard_config.json

[Main] Starting web server thread...
  └─ Werkzeug server starts
  └─ Listening on 0.0.0.0:5000

✓ Web server started on http://0.0.0.0:5000
  Access at: http://localhost:5000

Status: OFFLINE (no data available yet)
```

**At this point:** Dashboard is accessible but shows status as OFFLINE

---

### T=1-3 seconds: TSW6 Not Running

```
[Main] Starting API polling thread...
[Main] Waiting for game to come online...
✓ Application initialized successfully
  • Web server: Running (dashboard accessible now)
  • API poller: Running (checking for game...)

[Polling Loop - Iteration 1]
  _check_game_online()
    └─ Try: GET /get/DriverAid.PlayerInfo
       └─ TIMEOUT or 404 → Game is OFFLINE
       └─ game_status = "offline"
  
  _check_player_session()
    └─ Skipped (only runs if online or in_session)
  
  _poll_single_endpoints()
    └─ Try: GET /get/DriverAid.PlayerInfo [already tried in check_game_online]
       └─ TIMEOUT or 404 → No data
  
  _poll_subscriptions()
    └─ Skipped (only runs if in_session)

Sleep 100ms → Repeat

Every second the loop shows:
[player_info] 14:20:10.123 | Connection timeout
[player_info] 14:20:11.123 | Connection timeout
```

**Status:** OFFLINE - Dashboard shows no data

---

### T=4: Start TSW6 with -HTTPAPI

```bash
# In Steam: Properties → General → LAUNCH OPTIONS
# Add: -HTTPAPI
# Then launch game
```

**In console, wait 4-6 seconds...**

```
[APIPoller] ========== GAME ONLINE ==========
[APIPoller] Previous session subscriptions cleaned up

[Polling Loop - Iteration 50]
  _check_game_online()
    └─ Try: GET /get/DriverAid.PlayerInfo
       └─ SUCCESS (200 OK)
       └─ game_status = "offline" → "online" (TRANSITION!)
       └─ Call _cleanup_subscriptions()
          └─ DELETE /subscription?Subscription=1
          └─ DELETE /subscription?Subscription=2
  
  _check_player_session()
    └─ game_status == "online" → Run this
    └─ Get latest_data["player_info.cameraMode"]
       └─ Value is: "Menus" or "MainMenu"
       └─ Not "FirstPerson_Driving" → Stay "online"
  
  _poll_single_endpoints()
    └─ GET /get/DriverAid.PlayerInfo
       └─ Response:
       {
         "Values": {
           "geoLocation": {...},
           "playerProfileName": "Roland Molnar",
           "cameraMode": "Menus",
           ...
         }
       }
       └─ Flattens to:
          - player_info.geoLocation.longitude
          - player_info.geoLocation.latitude
          - player_info.playerProfileName
          - player_info.cameraMode = "Menus"
          - ...
  
  _poll_subscriptions()
    └─ Skipped (only in_session)

[player_info] 14:20:15.000
  Path: DriverAid.PlayerInfo
    player_info.geoLocation.longitude: 0.521924
    player_info.geoLocation.latitude: 51.380108
    player_info.playerProfileName: Roland Molnar
    player_info.cameraMode: Menus
    player_info.currentServiceName: None
    player_info.currentTile.x: 0
    player_info.currentTile.y: 0

Status: ONLINE
Dashboard shows: Status = "online", No telemetry data yet
```

**Status:** ONLINE - Waiting for FirstPerson_Driving

---

### T=5: Player Selects Route and Gets in Locomotive

```bash
# In game: Select route, load, and press F to enter driving cabin
```

```
[Polling Loop - Iteration 52]
  _check_game_online()
    └─ GET /get/DriverAid.PlayerInfo
       └─ SUCCESS → Stay "online"
  
  _check_player_session()
    └─ Get latest_data["player_info.cameraMode"]
       └─ VALUE IS: "FirstPerson_Driving" (MATCHES!)
       └─ Call _setup_all_subscriptions()
       │
       └─ _setup_subscription(Subscription 1)
          ├─ POST /subscription/CurrentDrivableActor.Function.HUD_GetSpeed?Subscription=1
          ├─ POST /subscription/CurrentDrivableActor.Function.HUD_GetRPM?Subscription=1
          ├─ POST /subscription/CurrentDrivableActor.Function.HUD_GetBrakeGauge_1?Subscription=1
          ├─ POST /subscription/CurrentDrivableActor.Function.HUD_GetBrakeGauge_2?Subscription=1
          ├─ POST /subscription/CurrentDrivableActor.Function.HUD_GetTractiveEffort?Subscription=1
          ├─ POST /subscription/CurrentDrivableActor.Function.GetTargetDynamicBrakingEffort?Subscription=1
          ├─ POST /subscription/CurrentDrivableActor.Function.HUD_GetAcceleration?Subscription=1
          ├─ POST /subscription/CurrentDrivableActor/LZB_Service.Property.targetSpeedDistance_m?Subscription=1
          ├─ POST /subscription/CurrentDrivableActor/LZB_Service.Property.bIsActivated?Subscription=1
          └─ POST /subscription/CurrentDrivableActor/LZB_Service.Property.LocoMaxSpeed?Subscription=1
       
       └─ [APIPoller] Setting up subscription 1 with 10 endpoints
       └─ [APIPoller] Subscription 1 created successfully
       
       └─ _setup_subscription(Subscription 2)
          ├─ POST /subscription/CurrentDrivableActor.Function.HUD_GetAmmeter?Subscription=2
          └─ POST /subscription/CurrentDrivableActor.Function.HUD_GetVoltmeter?Subscription=2
       
       └─ [APIPoller] Setting up subscription 2 with 2 endpoints
       └─ [APIPoller] Subscription 2 created successfully
       
       └─ game_status = "online" → "in_session" (TRANSITION!)
  
  [APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========

Status: IN_SESSION
Dashboard shows: Status = "in_session", All telemetry data now available
```

---

### T=6-30: Active Driving Session

```
[Polling Loop - Iteration 53]
  _check_game_online()
    └─ GET /get/DriverAid.PlayerInfo [Poll every 1s]
       └─ SUCCESS
  
  _check_player_session()
    └─ Get latest_data["player_info.cameraMode"]
       └─ Still "FirstPerson_Driving"
       └─ game_status stays "in_session"
  
  _poll_single_endpoints()
    └─ GET /get/DriverAid.PlayerInfo [Poll every 1s]
       └─ Updates player_info variables
  
  _poll_subscriptions()  ← NOW ACTIVE!
    └─ Subscription 1 [Poll every 100ms]
       ├─ GET /subscription?Subscription=1
       └─ Response has Entries array with all 10 endpoints
          ├─ speed_ms.Speed (ms) = 15.5
          ├─ rpm.RPM = 1200
          ├─ brake_pressure_1.WhiteNeedle (Pa) = 415884
          └─ ... 7 more endpoints
    
    └─ Subscription 2 [Poll every 10000ms]
       ├─ GET /subscription?Subscription=2
       └─ Response has Entries array
          ├─ amperage.Ammeter = 125.5
          └─ voltage.Voltmeter = 600.0

[Subscription 1] 14:20:16.100
  Path: CurrentDrivableActor.Function.HUD_GetSpeed
    speed_ms.Speed (ms): 15.5
  Path: CurrentDrivableActor.Function.HUD_GetRPM
    rpm.RPM: 1200
  Path: CurrentDrivableActor.Function.HUD_GetBrakeGauge_1
    brake_pressure_1.WhiteNeedle (Pa): 415884
    brake_pressure_1.RedNeedle (Pa): 0
  ...
  [10 endpoints total]

[Subscription 1] 14:20:16.200
  [Data updated]

[Subscription 1] 14:20:16.300
  [Data updated]

[player_info] 14:20:16.000
  Path: DriverAid.PlayerInfo
    player_info.cameraMode: FirstPerson_Driving
    [other player info]

[Subscription 2] 14:20:26.000
  Path: CurrentDrivableActor.Function.HUD_GetAmmeter
    amperage.Ammeter: 125.5
  Path: CurrentDrivableActor.Function.HUD_GetVoltmeter
    voltage.Voltmeter: 600.0

[APIPoller] Variables file updated: runtime_variables.json (35 variables)
```

**Status:** IN_SESSION - Dashboard updates every ~100ms with live data

---

### T=31: Player Presses ESC and Changes to External Camera

```bash
# In game: Press ESC or switch camera to "Cabview" or "External"
```

```
[Polling Loop - Iteration 310]
  _check_game_online()
    └─ GET /get/DriverAid.PlayerInfo
       └─ SUCCESS
  
  _check_player_session()
    └─ Get latest_data["player_info.cameraMode"]
       └─ VALUE CHANGED TO: "Cabview"
       └─ NOT "FirstPerson_Driving"
       └─ Call _remove_all_subscriptions()
       │
       └─ _remove_subscription_by_id(1)
          ├─ DELETE /subscription?Subscription=1
          └─ [APIPoller] Subscription 1 removed
       
       └─ _remove_subscription_by_id(2)
          ├─ DELETE /subscription?Subscription=2
          └─ [APIPoller] Subscription 2 removed
       
       └─ game_status = "in_session" → "online" (TRANSITION!)

[APIPoller] ========== SESSION ENDED (Camera mode: Cabview) ==========

Status: ONLINE
Dashboard shows: Status = "online", Old telemetry data still visible, no updates
```

**Status:** ONLINE - Subscriptions deleted, only monitoring first endpoint

---

### T=32: Player Closes Game

```bash
# Close Train Sim World 6
```

```
[Polling Loop - Iteration 320]
  _check_game_online()
    └─ Try: GET /get/DriverAid.PlayerInfo
       └─ TIMEOUT → Game unreachable
       └─ game_status = "online" → "offline" (TRANSITION!)
  
  _check_player_session()
    └─ Skipped (not online or in_session)
  
  [APIPoller] ========== GAME OFFLINE ==========

Status: OFFLINE
Dashboard shows: Status = "offline", Old data still visible but stale
```

**Status:** OFFLINE - Back to checking first endpoint every 1 second

---

## Console Output Summary

```
$ python main.py

[Main] Loading configuration...
[Main] Initializing API poller...
[Main] Initializing web dashboard...
[Main] Starting web server thread...
✓ Web server started on http://0.0.0.0:5000
[Main] Starting API polling thread...
✓ Application initialized successfully

[APIPoller] ========== GAME ONLINE ==========
[APIPoller] Previous session subscriptions cleaned up

[APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========
[APIPoller] Setting up subscription 1 with 10 endpoints
[APIPoller] Subscription 1 created successfully
[APIPoller] Setting up subscription 2 with 2 endpoints
[APIPoller] Subscription 2 created successfully

[Subscription 1] 14:20:16.100
  Path: CurrentDrivableActor.Function.HUD_GetSpeed
    speed_ms.Speed (ms): 15.5
  ...

[APIPoller] ========== SESSION ENDED (Camera mode: Cabview) ==========
[APIPoller] Subscription 1 removed
[APIPoller] Subscription 2 removed

[APIPoller] ========== GAME OFFLINE ==========

Ctrl+C

[Main] Shutting down...
[APIPoller] Polling thread stopped
[Main] Application stopped
```

## Variable Files Available During Each State

### OFFLINE
- `runtime_variables.json` - LIMITED
  - Contains variables from successful single endpoints (if any)
  - From player_info endpoint (when game is online briefly)
  - No subscription data available

### ONLINE
- `runtime_variables.json` - PARTIAL
  - player_info.* variables (all nested fields)
  - No subscription variables yet

### IN_SESSION
- `runtime_variables.json` - COMPLETE
  - player_info.* variables
  - All subscription variables:
    - speed_ms.*
    - rpm.*
    - brake_pressure_1.*
    - brake_pressure_2.*
    - amperage.*
    - voltage.*
    - etc.
  - Total: 35+ variables

## Polling Frequencies

### Always Polled
- **player_info** (first single endpoint) - Every 1000ms
  - Checks game online status
  - Checks player session status (cameraMode)

### Only Polled OFFLINE/ONLINE (Not During IN_SESSION)
- None in your current config

### Only Polled IN_SESSION
- **Subscription 1** - Every 100ms (10x per second)
  - Speed, RPM, Brake, Traction, Acceleration, LZB data
  - Most important telemetry
- **Subscription 2** - Every 10000ms (once every 10 seconds)
  - Electrical (Amperage, Voltage)
  - Less frequently needed

This design minimizes API load when not actively playing (only 1 request/second) and maximizes data freshness when playing (up to 110 requests/second across subscriptions).
