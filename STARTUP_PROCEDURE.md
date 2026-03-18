# New Startup Procedure & Session Management

## Overview

The application now uses a **three-state game detection system** with a redesigned startup sequence that prioritizes dashboard accessibility.

### Three Game States

```
┌──────────┐      Game Online      ┌────────┐      FirstPerson_Driving     ┌────────────┐
│ OFFLINE  │─────────────────────→ │ ONLINE │──────────────────────────→ │ IN_SESSION │
│          │                       │        │                            │            │
└──────────┘ ←─────────────────── └────────┘ ←───────────────────────── └────────────┘
             Game Offline           Camera           Camera Changed
                                    Changes          Away From Driving
```

## Startup Sequence

### Phase 1: Web Server (Immediate)
```
[Main] Loading configuration...
[Main] Initializing API poller...
[Main] Initializing web dashboard...
[Main] Starting web server thread...
✓ Web server started on http://0.0.0.0:5000
  Access at: http://localhost:5000
```

**What's happening:**
- Configuration is loaded
- Web server starts FIRST (before polling)
- Dashboard is immediately accessible even with no game data
- User can open browser and see the interface

### Phase 2: API Polling (Checking for Game)
```
[Main] Starting API polling thread...
[Main] Waiting for game to come online...
✓ Application initialized successfully
  • Web server: Running (dashboard accessible now)
  • API poller: Running (checking for game...)
```

**What's happening:**
- Poller starts in background
- Polls only the **first single endpoint** (player_info)
- Frequency: ~1 second (based on your config)
- Waiting for positive response

### Phase 3: Game Detection

**OFFLINE → ONLINE Transition:**
```
[APIPoller] ========== GAME ONLINE ==========
[APIPoller] Previous session subscriptions cleaned up
```

**What happens:**
- First single endpoint successfully responds
- Game is confirmed online
- Any leftover subscriptions from previous session are deleted
- System now watches for session start

### Phase 4: Session Detection

**ONLINE → IN_SESSION Transition:**
```
[APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========
[APIPoller] Setting up subscription 1 with 10 endpoints
[APIPoller] Subscription 1 created successfully
[APIPoller] Setting up subscription 2 with 2 endpoints
[APIPoller] Subscription 2 created successfully
```

**What happens:**
- Monitors `player_info.cameraMode` (flattened variable name)
- When mode = "FirstPerson_Driving" → Session starts
- ALL subscriptions are created at once
- Polling begins at configured frequencies

### Phase 5: Session Running

```
[Subscription 1] 14:23:45.128
  Path: CurrentDrivableActor.Function.HUD_GetSpeed
    speed_ms.Speed (ms): 15.5
  Path: CurrentDrivableActor.Function.HUD_GetRPM
    rpm.RPM: 1200
  ...

[player_info] 14:23:46.000
  Path: DriverAid.PlayerInfo
    player_info.cameraMode: FirstPerson_Driving
    player_info.playerProfileName: Roland Molnar
```

**What's happening:**
- Active polling of all subscriptions
- Single endpoints continue polling
- Web dashboard updates live
- All normal features active

### Phase 6: Session End Detection

**IN_SESSION → ONLINE Transition:**
```
[APIPoller] ========== SESSION ENDED (Camera mode: Cabview) ==========
[APIPoller] Subscription 1 removed
[APIPoller] Subscription 2 removed
```

**What happens:**
- `player_info.cameraMode` changes away from "FirstPerson_Driving"
- ALL subscriptions are deleted
- System returns to "ONLINE" state
- Only first endpoint continues polling
- Reduces API strain while waiting for next session

### Phase 7: Game Goes Offline

**ONLINE/IN_SESSION → OFFLINE Transition:**
```
[APIPoller] ========== GAME OFFLINE ==========
```

**What happens:**
- First single endpoint stops responding
- All subscriptions deleted (if in session)
- State changes to "OFFLINE"
- Back to checking first endpoint periodically
- Dashboard shows status, no data available

## Console Output Guide

### Status Indicators

```
[Main] = Application startup/shutdown
[APIPoller] = Polling engine updates
[Subscription X] = Data poll results
[endpoint_id] = Single endpoint polls
[WebDashboard] = Web server updates
```

### Key Messages

| Message | Meaning | Action |
|---------|---------|--------|
| `✓ Web server started` | Dashboard is ready | Can open http://localhost:5000 |
| `GAME ONLINE` | Game responding to first endpoint | Waiting for FirstPerson_Driving |
| `SESSION STARTED` | Player in driving mode | All data now being polled |
| `GAME OFFLINE` | Game not responding | No data available |
| `SESSION ENDED` | Player left driving mode | Subscriptions removed |

## API Polling Flow

### OFFLINE State
```
Every ~1000ms:
  └─ GET /get/DriverAid.PlayerInfo
     ├─ NO RESPONSE → Stay OFFLINE
     └─ SUCCESS → Go to ONLINE, cleanup subs
```

### ONLINE State
```
Every ~1000ms:
  ├─ GET /get/DriverAid.PlayerInfo  [Check game still alive]
  │  └─ NO RESPONSE → Go to OFFLINE
  │
  └─ Check player_info.cameraMode
     ├─ "FirstPerson_Driving" → Go to IN_SESSION
     └─ Other → Stay ONLINE
```

### IN_SESSION State
```
Every polling cycle:
  ├─ GET /get/DriverAid.PlayerInfo  [Every 1000ms]
  │  └─ Check player_info.cameraMode
  │     ├─ "FirstPerson_Driving" → Stay IN_SESSION
  │     └─ Other → Go to ONLINE, delete subs
  │
  ├─ Subscription 1  [Every 100ms]
  │  └─ Speed, RPM, Brake, etc.
  │
  ├─ Subscription 2  [Every 10000ms]
  │  └─ Electrical
  │
  └─ Single endpoints  [At their frequencies]
      └─ Temperature, etc.
```

## Configuration Requirements

Your `api_endpoints.json` must have:

### 1. First Single Endpoint Must Be player_info
```json
{
  "single_endpoints": [
    {
      "id": "player_info",
      "frequency_ms": 1000,
      "path": "DriverAid.PlayerInfo",
      "variables": {"PlayerInfo": "player_info"}
    },
    ...
  ]
}
```

**Why:** This endpoint is used to detect if the game is online and if player is driving.

### 2. Subscriptions Define Session Data
```json
{
  "subscriptions": [
    {
      "id": 1,
      "name": "main_telemetry",
      "frequency_ms": 100,
      "endpoints": [...],
      "variables": {...}
    },
    ...
  ]
}
```

**Why:** These only run when NOT in a session to save API resources.

## Web API Endpoints

### `/api/data` - Real-time Data

**Response:**
```json
{
  "game_status": "in_session",  // or "offline", "online"
  "data": {
    "speed_ms.Speed (ms)": 15.5,
    "rpm.RPM": 1200,
    "player_info.playerProfileName": "Roland Molnar",
    "player_info.cameraMode": "FirstPerson_Driving",
    ...
  },
  "timestamp": "14:23:45.128"
}
```

### `/health` - Health Check

**Response:**
```json
{
  "status": "healthy",
  "poller_running": true,
  "game_status": "in_session"
}
```

## Dashboard Status Display

Update your [dashboard_config.json](src/dashboard_config.json) to show game status:

```json
{
  "title": "TSW MFD Dashboard",
  "status_indicator": true,
  "sections": [
    {
      "name": "Status",
      "variables": ["game_status"]  // Shows: offline, online, or in_session
    },
    ...
  ]
}
```

## Migration from Old System

### What Changed

| Old | New |
|-----|-----|
| `session_active` boolean | `game_status` string (offline/online/in_session) |
| Session detected via single endpoint | Session detected via `cameraMode` = "FirstPerson_Driving" |
| Subscriptions created at startup | Subscriptions created only when in session |
| Subscriptions deleted on shutdown | Subscriptions deleted immediately when session ends |
| Web server started after poller | Web server started FIRST |

### What Stayed the Same

- ✅ Same api_endpoints.json format
- ✅ Same variable naming with dots
- ✅ Same flattened JSON structure
- ✅ Same web endpoints and data format
- ✅ Same frequency control

### What You Need to Update

1. **Dashboard displays:** Change from checking `session_active` to checking `game_status`
2. **API consumers:** Update response parsing from `session_active: true/false` to `game_status: "offline"|"online"|"in_session"`

Example update:
```javascript
// OLD
if (response.session_active) { ... }

// NEW
if (response.game_status === "in_session") { ... }
```

## Advantages of Three-State System

1. **Better UX** - Dashboard accessible immediately while waiting for game
2. **Resource efficiency** - Subscriptions only active during actual play
3. **Clearer status** - Three distinct states vs boolean true/false
4. **Safer cleanup** - Previous subscriptions cleaned up on game start
5. **Session awareness** - Knows if player is actually driving
6. **Fewer API calls** - No polling subscriptions when not playing

## Troubleshooting

### Dashboard loads but shows "offline"

- TSW6 not running with `-HTTPAPI` parameter
- Check console: Should see game online message
- Verify API key is correct

### Game shows "online" but never goes to "in_session"

- Player not in FirstPerson_Driving mode
- Switch camera mode to first-person driving
- Check that DriverAid.PlayerInfo endpoint is reachable
- Look for cameraMode value in runtime_variables.json

### Subscriptions not being created

- Game status should show "in_session"
- In-game camera mode must be exactly "FirstPerson_Driving"
- Check console output for errors
- Verify subscriptions are defined in api_endpoints.json

### Subscriptions deleted too quickly

- Camera mode detected as not "FirstPerson_Driving"
- Try different view modes to find correct value
- Use discover_fields.py to see actual cameraMode values from API

## Files Modified

- [src/main.py](src/main.py) - Startup sequence
- [src/api_poller.py](src/api_poller.py) - Three-state system
- [src/web_server.py](src/web_server.py) - API response format
- [src/api_endpoints.json](src/api_endpoints.json) - Must have player_info first

## References

- [VARIABLE_SYSTEM_GUIDE.md](VARIABLE_SYSTEM_GUIDE.md) - Variable naming
- [README.md](README.md) - General documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
