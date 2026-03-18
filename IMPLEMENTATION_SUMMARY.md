# Implementation Summary: Startup Procedure & Session Management Rework

## ✅ Changes Implemented

### 1. **Three-State Game Detection System**

Replaced the simple on/off `session_active` boolean with a three-state system:

- **OFFLINE** - Game not responding
- **ONLINE** - Game responding but player not driving
- **IN_SESSION** - Player actively driving (FirstPerson_Driving)

### 2. **Startup Sequence Redesigned**

```
1. Load configuration
2. Initialize poller (don't start yet)
3. ✓ Start web server FIRST (dashboard immediately accessible)
4. ✓ Then start API polling
5. Poll first single endpoint (player_info) to detect game
6. Once online, monitor cameraMode for session
7. When FirstPerson_Driving → Create subscriptions
8. When camera changes → Delete subscriptions
```

**Key benefit:** Dashboard accessible even before game data arrives

### 3. **State Transitions**

#### OFFLINE → ONLINE
- First single endpoint (`player_info`) successfully responds
- Cleanup any leftover subscriptions from previous session
- Begin monitoring for session start

#### ONLINE → IN_SESSION
- `player_info.cameraMode` becomes `"FirstPerson_Driving"`
- Create ALL subscriptions at once
- Begin polling subscriptions at configured frequencies

#### IN_SESSION → ONLINE
- `player_info.cameraMode` changes away from `"FirstPerson_Driving"`
- Delete ALL subscriptions immediately
- Stop polling subscriptions (reduce API load)
- Return to just monitoring first endpoint

#### ONLINE/IN_SESSION → OFFLINE
- First single endpoint stops responding
- If in session, delete all subscriptions
- Return to baseline minimum polling

### 4. **File Structure**

Key implementation methods:

**`api_poller.py`:**
```python
_polling_loop()                    # Main loop with 4 steps
_check_game_online()              # Step 1: Detect game
_check_player_session()           # Step 2: Detect session (via cameraMode)
_handle_state_transitions()       # Step 3: Handle state changes
_setup_all_subscriptions()        # Create all subs
_remove_all_subscriptions()       # Delete all subs
_cleanup_subscriptions()          # Delete orphaned subs on startup
```

**`main.py`:**
- Initialize poller first
- Start web server second
- Start polling thread third

**`web_server.py`:**
- Updated `/api/data` to return `game_status` instead of `session_active`
- Updated `/health` endpoint similarly

### 5. **Configuration Requirements**

Your `api_endpoints.json` MUST have:

1. **First single endpoint is `player_info`:**
   ```json
   {
     "id": "player_info",
     "frequency_ms": 1000,
     "path": "DriverAid.PlayerInfo",
     "variables": {"PlayerInfo": "player_info"}
   }
   ```
   - Used for game detection
   - Used for session detection (via cameraMode)
   - Must be at index 0 in single_endpoints array

2. **All subscriptions defined:**
   - Only created when FirstPerson_Driving
   - Deleted when camera changes away
   - Ready to be cleaned up on game startup

### 6. **Console Output Example**

```
[Main] Loading configuration...
[Main] Initializing API poller...
[Main] Initializing web dashboard...
[Main] Starting web server thread...
✓ Web server started on http://0.0.0.0:5000

[Main] Starting API polling thread...
[Main] Waiting for game to come online...
✓ Application initialized successfully
  • Web server: Running (dashboard accessible now)
  • API poller: Running (checking for game...)

[APIPoller] ========== GAME ONLINE ==========
[APIPoller] Previous session subscriptions cleaned up

[APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========
[APIPoller] Setting up subscription 1 with 10 endpoints
[APIPoller] Subscription 1 created successfully
```

### 7. **Variable Naming**

Session detection uses the flattened variable name:
- `player_info.cameraMode` - Full hierarchical name
- "FirstPerson_Driving" - Expected value for session start
- Any other value - Session is not active

## 📊 Polling Behavior Comparison

### Before (Simple Binary)
```
OFFLINE ←→ ONLINE/SESSION

Subscriptions:
- Created at startup
- Deleted at shutdown or error
- Always created if game online

Single endpoints:
- Polled continuously
```

### After (Three-State)
```
OFFLINE ←→ ONLINE ←→ IN_SESSION

Subscriptions:
- Created ONLY when FirstPerson_Driving
- Deleted IMMEDIATELY when camera changes
- Cleaned up on game startup

Single endpoints:
- Polled continuously regardless of state
- Used for both game and session detection
```

## 🎯 Benefits

1. ✅ **Dashboard Available Immediately** - Web server starts first, accessible even before game
2. ✅ **Better Status Visibility** - Three distinct states vs boolean
3. ✅ **Resource Efficient** - No subscriptions when not actively playing
4. ✅ **Automatic Cleanup** - Leftover subscriptions cleared on game start
5. ✅ **Session Aware** - Knows exactly when player is driving
6. ✅ **Safer** - Session detection is explicit (camera mode) not implicit

## 🔧 What You Need to Do

### 1. Verify api_endpoints.json

Make sure first single endpoint is player_info:
```json
"single_endpoints": [
  {
    "id": "player_info",
    "frequency_ms": 1000,
    "path": "DriverAid.PlayerInfo",
    "variables": {"PlayerInfo": "player_info"}
  },
  ...
]
```

### 2. Update Dashboard/API Consumers

Change from:
```json
{ "session_active": true/false }
```

To:
```json
{ "game_status": "offline" | "online" | "in_session" }
```

### 3. Test the Flow

1. Start app:
   ```bash
   cd src
   python main.py
   ```

2. Open http://localhost:5000 - should load immediately

3. Start TSW6 - console should show `GAME ONLINE`

4. Enter FirstPerson_Driving mode - console shows `SESSION STARTED`

5. Exit driving mode - console shows `SESSION ENDED`

6. Close game - console shows `GAME OFFLINE`

## 📋 Files Changed

- [src/main.py](src/main.py) - Startup sequence
- [src/api_poller.py](src/api_poller.py) - Three-state system + session detection
- [src/web_server.py](src/web_server.py) - Response format
- [src/api_endpoints.json](src/api_endpoints.json) - Removed session_status endpoint
- [STARTUP_PROCEDURE.md](STARTUP_PROCEDURE.md) - New detailed guide

## 📚 Documentation

See [STARTUP_PROCEDURE.md](STARTUP_PROCEDURE.md) for:
- Detailed state diagrams
- Complete polling flow explanation
- Console output guide
- Troubleshooting tips
- Migration guide

## ⚠️ Important Notes

1. **First single endpoint is critical** - Must be player_info for game/session detection
2. **cameraMode value is exact** - Must be exactly "FirstPerson_Driving" (case-sensitive)
3. **Web server starts first** - This is intentional for immediate dashboard access
4. **Subscriptions auto-cleanup** - No manual cleanup needed on startup
5. **Three states are exclusive** - System is always in exactly one state

## 🚀 Ready to Test

The implementation is complete and ready for testing. Start the application and monitor the console to see the new startup sequence and state transitions.
