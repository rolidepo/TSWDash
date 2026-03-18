# Pre-Test Checklist

Before running the application, verify these items are in place.

## ✅ Configuration Verification

### api_endpoints.json

- [ ] First single endpoint is `player_info`
  ```json
  "single_endpoints": [
    {
      "id": "player_info",
      "frequency_ms": 1000,
      "path": "DriverAid.PlayerInfo",
      "variables": {"PlayerInfo": "player_info"}
    }
  ]
  ```

- [ ] `player_info` endpoint is FIRST in the array (index 0)

- [ ] Subscriptions defined for telemetry data

- [ ] `DriverAid.PlayerInfo` includes all required fields:
  - `cameraMode` (used for session detection)
  - Other player info fields

### CommAPIKey.txt

- [ ] File exists at: `Documents\My Games\TrainSimWorld6\Saved\Config\CommAPIKey.txt`
- [ ] Game has been launched with `-HTTPAPI` at least once

## 🎮 Game Setup

- [ ] Train Sim World 6 installed
- [ ] Launch option set: Properties → General → LAUNCH OPTIONS → Add `-HTTPAPI`
- [ ] Game has been started at least once with `-HTTPAPI` enabled
  - (This generates CommAPIKey.txt)

## 📁 File Structure

- [ ] [src/main.py](src/main.py) - Updated startup sequence
- [ ] [src/api_poller.py](src/api_poller.py) - Three-state system implemented
- [ ] [src/web_server.py](src/web_server.py) - Using `game_status` instead of `session_active`
- [ ] [src/api_endpoints.json](src/api_endpoints.json) - Configured correctly
- [ ] [src/dashboard_config.json](src/dashboard_config.json) - Exists (can be default)
- [ ] [src/pages_config.json](src/pages_config.json) - Exists (can be default)

## 🧪 Test Sequence

### Phase 1: Web Server Starts
```bash
cd src
python main.py
```

**Verify:**
- [ ] No errors in first 5 lines
- [ ] Web server message appears: `Web server started on http://0.0.0.0:5000`
- [ ] Can access dashboard: Open http://localhost:5000 in browser
- [ ] Dashboard shows status as "offline" (no data yet)

**Wait 3-5 seconds**

### Phase 2: Game Offline
**Expected console output:**
```
[APIPoller] Error in polling loop
[player_info] Connection timeout
```

**Verify:**
- [ ] Polling is happening (repeated messages)
- [ ] Status is "offline"
- [ ] No errors, just connection timeouts

### Phase 3: Start TSW6
1. Launch Train Sim World 6 with `-HTTPAPI` parameter
2. Wait for game to load to main menu
3. Monitor console for 5-10 seconds

**Expected console output:**
```
[APIPoller] ========== GAME ONLINE ==========
[APIPoller] Previous session subscriptions cleaned up
[player_info] 14:20:xx.xxx
  Path: DriverAid.PlayerInfo
    player_info.geoLocation.longitude: ...
    player_info.geoLocation.latitude: ...
    player_info.playerProfileName: Roland Molnar
    player_info.cameraMode: Menus
```

**Verify:**
- [ ] "GAME ONLINE" message appears
- [ ] Player info variables show (look for cameraMode value)
- [ ] No subscription data yet (only player_info)
- [ ] Dashboard status changed to "online"

### Phase 4: Select Route and Enter Locomotive
1. Choose a route in game
2. Enter a locomotive cabin (press F to enter)
3. Switch to FirstPerson_Driving view
4. Monitor console

**Expected console output:**
```
[APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========
[APIPoller] Setting up subscription 1 with 10 endpoints
[APIPoller] Subscription 1 created successfully
[APIPoller] Setting up subscription 2 with 2 endpoints
[APIPoller] Subscription 2 created successfully

[Subscription 1] 14:20:xx.xxx
  Path: CurrentDrivableActor.Function.HUD_GetSpeed
    speed_ms.Speed (ms): 0.0
  ...
```

**Verify:**
- [ ] "SESSION STARTED" message appears
- [ ] Both subscriptions created
- [ ] Subscription data polling begins
- [ ] Dashboard status changed to "in_session"
- [ ] Dashboard shows live telemetry data
- [ ] Data updates frequently (~100ms)

### Phase 5: Exit Driving Mode
1. Press ESC to open menu or switch camera mode
2. Monitor console

**Expected console output:**
```
[APIPoller] ========== SESSION ENDED (Camera mode: Menus) ==========
[APIPoller] Subscription 1 removed
[APIPoller] Subscription 2 removed
```

**Verify:**
- [ ] "SESSION ENDED" message appears
- [ ] Both subscriptions deleted
- [ ] Status changed back to "online"
- [ ] Dashboard shows old data (no longer updating)

### Phase 6: Close Game
1. Close TSW6
2. Monitor console for 10 seconds

**Expected console output:**
```
[APIPoller] ========== GAME OFFLINE ==========
```

**Verify:**
- [ ] "GAME OFFLINE" message appears
- [ ] Console shows timeouts again
- [ ] Status changed to "offline"

## 📊 Runtime Files

During test, check for generated files:

- [ ] **runtime_variables.json** exists in `src/` directory
- [ ] File contains discovered variables
- [ ] File updates every 2 seconds (timestamp changes)
- [ ] File includes variable types and current values

**Sample content:**
```json
{
  "timestamp": "2026-02-18T14:20:16.123456",
  "total_variables": 35,
  "variables": {
    "player_info": [
      {
        "name": "player_info.cameraMode",
        "endpoint": "DriverAid.PlayerInfo",
        "type": "str",
        "current_value": "FirstPerson_Driving"
      }
    ],
    "speed_ms": [
      {
        "name": "speed_ms.Speed (ms)",
        "endpoint": "CurrentDrivableActor.Function.HUD_GetSpeed",
        "type": "float",
        "current_value": 15.5
      }
    ]
  }
}
```

## 🐛 Troubleshooting During Test

### Dashboard won't load
- [ ] Is web server running? (Check first 10 console lines)
- [ ] Is port 5000 already in use? (Check firewall)
- [ ] Can you ping localhost? (Run: `ping localhost`)

### Shows "offline" after game launches
- [ ] Is TSW6 launched with `-HTTPAPI` parameter?
- [ ] Did you wait for main menu to fully load?
- [ ] Is there a firewall blocking port 31270?
- [ ] Check TSW6 system requirements (only works with specific versions)

### Game shows "online" but no subscriptions created
- [ ] Is player in FirstPerson_Driving mode?
  - Try: ESC → Camera options → Set to FirstPerson Driving
- [ ] Check console for "GAME ONLINE" message (confirms game detected)
- [ ] Look at runtime_variables.json for player_info.cameraMode value
  - Should be exactly: `"FirstPerson_Driving"` (case-sensitive!)

### Subscriptions created but no data in dashboard
- [ ] Subscription data appears in console but not dashboard?
- [ ] Check variable names in dashboard_config.json
- [ ] Are variable names spelled exactly right?
  - Use names from runtime_variables.json
  - They contain dots and may be different from old names

### Console shows many connection timeouts
- [ ] This is normal when game is offline
- [ ] Should stop once game starts
- [ ] If continues after game loaded, check network connection

## ✔️ Success Criteria

You've successfully implemented the new system when:

1. ✅ Web server starts before polling
2. ✅ Dashboard accessible immediately at localhost:5000
3. ✅ "GAME ONLINE" message appears when TSW6 starts
4. ✅ "SESSION STARTED" when entering FirstPerson_Driving
5. ✅ Subscriptions created and data flows to dashboard
6. ✅ "SESSION ENDED" when exiting driving mode
7. ✅ "GAME OFFLINE" when game closes
8. ✅ runtime_variables.json created and updated continuously
9. ✅ Three status values work: "offline", "online", "in_session"

## 📝 Notes

- First test may take several tries due to timing
- TSW6 startup can be slow - allow 10-15 seconds
- FirstPerson_Driving detection is case-sensitive
- Exact cameraMode value should match your game version
  - Use `discover_fields.py` if you're unsure of the value
- Keep console visible during test to see all messages

## 🆘 If Something Goes Wrong

1. Stop app: Ctrl+C
2. Check console output for error messages
3. Review [YOUR_CONFIG_FLOW.md](YOUR_CONFIG_FLOW.md) for expected behavior
4. Verify [api_endpoints.json](src/api_endpoints.json) configuration
5. Run discover_fields.py to verify API connectivity
6. Check [STARTUP_PROCEDURE.md](STARTUP_PROCEDURE.md) for detailed reference
7. Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for overview

## 🎯 Next Steps After Successful Test

1. Test with remote device (tablet/phone) on same WiFi
   - Access: `http://<your-pc-ip>:5000`
2. Configure dashboard layout in dashboard_config.json
3. Configure advanced MFD pages in pages_config.json
4. Add custom components or transformations as needed

---

**Ready to test? Start with:**
```bash
cd src
python main.py
```

Then open: http://localhost:5000

Good luck! 🚂
