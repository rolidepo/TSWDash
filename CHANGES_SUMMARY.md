# Complete Implementation: Startup & Session Management Rework

## Summary

You requested a complete rework of the startup procedure and session management. Here's what has been implemented:

## 🎯 What Was Changed

### 1. **Startup Sequence**
- ❌ OLD: Load config → Start poller → Start web server
- ✅ NEW: Load config → Start web server FIRST → Start poller

**Benefit:** Dashboard is immediately accessible even before game data arrives

### 2. **Session Detection**
- ❌ OLD: Single boolean `session_active`
- ✅ NEW: Three distinct states: `offline`, `online`, `in_session`

**States:**
- **OFFLINE** - Game not responding
- **ONLINE** - Game responding but player not driving
- **IN_SESSION** - Player in FirstPerson_Driving mode (subscriptions active)

### 3. **Game Online Detection**
- ✅ NEW: Polls first single endpoint (`player_info`) continuously
- ✅ NEW: Detects when game comes online independent of session state
- ✅ NEW: Cleans up any leftover subscriptions when game starts

### 4. **Session Detection Logic**
- ❌ OLD: Generic endpoint reachability check
- ✅ NEW: Monitors `player_info.cameraMode` value specifically
- ✅ NEW: Subscribes only when mode = "FirstPerson_Driving"
- ✅ NEW: Unsubscribes immediately when mode changes

### 5. **Subscription Management**
- ❌ OLD: Created at startup, deleted at shutdown
- ✅ NEW: Created when entering FirstPerson_Driving, deleted when exiting
- ✅ NEW: Auto-cleanup of orphaned subscriptions on game start

## 📋 Files Modified

### Core Implementation
1. **[src/api_poller.py](src/api_poller.py)** - Main implementation
   - New three-state system
   - Refactored polling loop
   - Session detection via cameraMode
   - Subscription lifecycle management

2. **[src/main.py](src/main.py)** - Startup sequence
   - Web server starts first
   - Poller starts second
   - Updated initialization messages

3. **[src/web_server.py](src/web_server.py)** - API responses
   - Changed `session_active` → `game_status`
   - Updated `/api/data` and `/health` endpoints

### No Changes Needed
- [src/config.py](src/config.py) - No changes
- [src/dashboard_config.json](src/dashboard_config.json) - No changes required
- [src/api_endpoints.json](src/api_endpoints.json) - Existing config works (removed old session_status check)

## 📚 Documentation Created

### Quick Start
- [STARTUP_PROCEDURE.md](STARTUP_PROCEDURE.md) - Complete detailed guide

### Implementation Details  
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - What changed and why

### Your Specific Configuration
- [YOUR_CONFIG_FLOW.md](YOUR_CONFIG_FLOW.md) - Exact timeline with your config

### Testing
- [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md) - Step-by-step test guide

## 🔄 Key New Methods in APIPoller

```python
_polling_loop()             # 4-step main loop
_check_game_online()        # Step 1: Game responding?
_check_player_session()     # Step 2: Player driving?
_handle_state_transitions() # Step 3: Handle changes
_setup_all_subscriptions()  # Create all subs
_remove_all_subscriptions() # Delete all subs
_cleanup_subscriptions()    # Clean orphaned subs
```

## 🎮 API Polling Behavior

### OFFLINE (Game Not Running)
```
Every 1 second:
  GET /get/DriverAid.PlayerInfo
  └─ Timeout/Error → Stay OFFLINE
```

### ONLINE (Game Running, Not Playing)
```
Every 1 second:
  GET /get/DriverAid.PlayerInfo
  └─ Success → Check cameraMode
  
If cameraMode == "FirstPerson_Driving":
  → Go to IN_SESSION
  → Create subscriptions
```

### IN_SESSION (Player Driving)
```
Subscription 1 every 100ms:
  GET /subscription?Subscription=1
  └─ Speed, RPM, Brake, etc.

Subscription 2 every 10000ms:
  GET /subscription?Subscription=2
  └─ Electrical data

Every 1 second:
  GET /get/DriverAid.PlayerInfo
  └─ If cameraMode != "FirstPerson_Driving"
     → Go to ONLINE
     → Delete subscriptions
```

## 📊 Comparison

### Before
```
Single state: session_active (true/false)
├─ Boolean doesn't distinguish between:
│  ├─ Game not running
│  ├─ Game running but not driving
│  └─ Game running and driving
├─ Subscriptions: Always created if game online
└─ Web server starts after poller
```

### After
```
Three states: game_status
├─ "offline" - Game not running
├─ "online" - Game running but not driving
└─ "in_session" - Player actively driving
├─ Subscriptions: Only created when driving
└─ Web server starts first
```

## ✅ Testing the Implementation

### Quick Test
```bash
cd src
python main.py
```

1. Should see web server start immediately
2. Open http://localhost:5000 (dashboard accessible)
3. Start TSW6 (console shows "GAME ONLINE")
4. Enter driving mode (console shows "SESSION STARTED")
5. Exit driving mode (console shows "SESSION ENDED")
6. Close game (console shows "GAME OFFLINE")

### Expected Console Output
```
[Main] Starting web server thread...
✓ Web server started on http://0.0.0.0:5000

[APIPoller] ========== GAME ONLINE ==========
[APIPoller] Previous session subscriptions cleaned up

[APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========
[APIPoller] Setting up subscription 1 with 10 endpoints
[APIPoller] Subscription 1 created successfully

[Subscription 1] 14:20:16.100
  speed_ms.Speed (ms): 15.5
  
[APIPoller] ========== SESSION ENDED (Camera mode: Menus) ==========
[APIPoller] Subscription 1 removed

[APIPoller] ========== GAME OFFLINE ==========
```

## 🔧 Configuration Requirements

Your `api_endpoints.json` MUST have:

1. **First single endpoint is `player_info`** (index 0)
   - Used for game detection
   - Used for session detection (cameraMode)

2. **All subscriptions defined normally**
   - Will be created when FirstPerson_Driving
   - Will be deleted when camera changes

## 📡 API Changes

### Endpoint: `/api/data`

**Before:**
```json
{
  "session_active": true,
  "data": {...},
  "timestamp": "14:20:16.123"
}
```

**After:**
```json
{
  "game_status": "in_session",  // "offline" | "online" | "in_session"
  "data": {...},
  "timestamp": "14:20:16.123"
}
```

## 🎯 Benefits

1. ✅ **Immediate Dashboard Access** - Available before game data
2. ✅ **Better Status Visibility** - Three clear states
3. ✅ **Resource Efficient** - No subscriptions when not playing
4. ✅ **Automatic Cleanup** - Orphaned subscriptions cleared
5. ✅ **Session Aware** - Explicit FirstPerson_Driving detection
6. ✅ **Safer** - Clear separation of concerns (online vs session)

## ⚠️ Important Notes

1. **First single endpoint must be player_info** - Critical for system to work
2. **cameraMode value is case-sensitive** - Must be exactly "FirstPerson_Driving"
3. **Web server starts first** - This is intentional
4. **Subscriptions auto-cleanup** - No manual management needed
5. **Three states are exclusive** - System in exactly one state at any time

## 🚀 Ready to Use

The implementation is complete and ready for testing. See [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md) for step-by-step testing instructions.

All documentation is in place:
- [STARTUP_PROCEDURE.md](STARTUP_PROCEDURE.md) - Detailed reference
- [YOUR_CONFIG_FLOW.md](YOUR_CONFIG_FLOW.md) - Timeline with your config
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Overview of changes
- [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md) - Testing guide

**Start testing:**
```bash
cd src
python main.py
```

Then open: http://localhost:5000
