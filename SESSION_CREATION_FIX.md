# Session Creation Fix - Duplicate Subscriptions Issue

## Problem Identified

The system was creating subscriptions **every second** even though the `cameraMode` hadn't changed:

```
[APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========
[APIPoller] Setting up subscription 1 with 10 endpoints
[APIPoller] Subscription 1 created successfully
[APIPoller] Setting up subscription 2 with 2 endpoints
[APIPoller] Subscription 2 created successfully
```

This message repeated every second instead of appearing just once when transitioning to the session.

## Root Cause

The bug was in `_check_game_online()` method:

```python
# OLD CODE (BUGGY)
if is_reachable:
    if self.game_status == "offline":
        # ... cleanup ...
    self.game_status = "online"  # ← ALWAYS sets to "online"!
```

**What was happening:**
1. Loop 1: `_check_game_online()` sets `game_status = "online"`
2. Loop 1: `_check_player_session()` sees `game_status != "in_session"` (it's "online") → creates subscriptions, sets to "in_session"
3. Loop 2: `_check_game_online()` **overwrites** `game_status = "online"` (losing the "in_session" state!)
4. Loop 2: `_check_player_session()` sees `game_status != "in_session"` again (it was reset!) → creates subscriptions AGAIN!

## Solution Implemented

### 1. Preserve Game Status During Online Check

**NEW CODE:**
```python
# FIXED CODE
if is_reachable:
    if self.game_status == "offline":
        # Only transition FROM offline TO online
        self.game_status = "online"
        # ... cleanup ...
    # Don't overwrite if already online or in_session!
else:
    # Only go offline if online or in_session
    if self.game_status != "offline":
        self.game_status = "offline"
```

**Effect:** `_check_game_online()` now preserves the "in_session" state once it's set.

### 2. Tighten Session Transition Detection

**NEW CODE:**
```python
# Only trigger on actual state transitions
if camera_mode == "FirstPerson_Driving" and self.game_status == "online":
    # Transition: online → in_session
    self.game_status = "in_session"
    self._setup_all_subscriptions()
    self.subscriptions_setup = True

elif camera_mode != "FirstPerson_Driving" and self.game_status == "in_session":
    # Transition: in_session → online
    self.game_status = "online"
    self._remove_all_subscriptions()
    self.subscriptions_setup = False
```

**Effect:** Subscriptions only created on transitions, not every cycle.

### 3. Add Subscription State Tracking

Added `self.subscriptions_setup` flag to track if subscriptions are currently active:
- Set to `False` when going offline or removing subscriptions
- Set to `True` after creating subscriptions
- Provides defensive protection + better logging

## State Machine Now Works Correctly

```
┌──────────────────────────────────────────────────┐
│                Game Offline                       │
│         (game_status = "offline")                 │
│         (subscriptions_setup = false)             │
└───────────────────┬──────────────────────────────┘
                    │
        Game responds to ping
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│                Game Online                        │
│         (game_status = "online")                  │
│         (subscriptions_setup = false)             │
│   Player NOT driving (cameraMode != driving)     │
└───────────────────┬──────────────────────────────┘
                    │
    cameraMode == "FirstPerson_Driving"
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│            Player In Session                      │
│         (game_status = "in_session")              │
│         (subscriptions_setup = true)              │
│   Subscriptions ACTIVE, polling data at 100ms    │
└───────────────────┬──────────────────────────────┘
                    │
cameraMode changed away from "FirstPerson_Driving"
        OR game goes offline
                    │
                    ▼
            Back to Online/Offline
```

## Polling Loop Flow (Fixed)

```
Loop iteration:
  1. _check_game_online()
     - If offline: stay offline ✓
     - If online: PRESERVE state (don't reset!) ✓
     
  2. _check_player_session() 
     - If online + camera driving: transition to in_session ✓
     - If in_session + camera not driving: back to online ✓
     - No redundant subscriptions ✓
     
  3. _poll_single_endpoints()
     - Always poll (regardless of state)
     
  4. _poll_subscriptions()
     - Only if in_session ✓
```

## Expected Behavior After Fix

**First run (game starting):**
```
[APIPoller] ========== GAME ONLINE ==========
[APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========
[APIPoller] Setting up subscription 1 with 10 endpoints
[APIPoller] Subscription 1 created successfully
[APIPoller] Setting up subscription 2 with 2 endpoints
[APIPoller] Subscription 2 created successfully
```

**Continuous polling (no duplicate messages):**
- game_status stays "in_session"
- subscriptions_setup stays true
- Subscription messages **DO NOT** repeat
- Data polling continues smoothly

**When camera changes (e.g., switching views):**
```
[APIPoller] ========== SESSION ENDED (Camera mode: Floating) ==========
```

**When player gets back in driving:**
```
[APIPoller] ========== SESSION STARTED (FirstPerson_Driving) ==========
[APIPoller] Setting up subscription 1 with 10 endpoints
[APIPoller] Subscription 1 created successfully
[APIPoller] Setting up subscription 2 with 2 endpoints
[APIPoller] Subscription 2 created successfully
```

## Testing

To verify the fix works:

1. Run: `cd src && python main.py`
2. Get into FirstPerson_Driving mode in the game
3. **Verify:** "SESSION STARTED" appears **ONLY ONCE**, not every second
4. **Verify:** Subscription creation messages appear **ONLY ONCE** per session
5. **Verify:** Continuous polling shows data updates without subscription creation
6. **Verify:** When exiting FirstPerson driving or game goes offline, subscriptions clean up

## Changes Made

### Files Modified

**src/api_poller.py:**

1. **Line ~62:** Added `self.subscriptions_setup = False` flag
2. **Lines ~205-218:** Fixed `_check_game_online()` to preserve "in_session" state
3. **Lines ~225-232:** Fixed exception handler to reset flag on offline
4. **Lines ~233-276:** Rewrote `_check_player_session()` to use state transitions only
5. **Lines ~288-302:** Updated `_cleanup_subscriptions()` to set flag
6. **Lines ~228, ~231:** Added `self.subscriptions_setup = False` resets

### Key Changes Summary

| What | Before | After |
|------|--------|-------|
| State preservation | Always resets to "online" | Preserves "in_session" |
| Session detection | Any loop where status != "in_session" | Only on state transitions |
| Subscriptions | Created every second | Created once per session |
| Flag tracking | N/A | Added subscriptions_setup flag |

## Why This Works

The **state machine** was being broken by `_check_game_online()` constantly resetting the status. Now:

1. ✅ States are preserved once set
2. ✅ Transitions only happen on actual changes (camera mode, offline)
3. ✅ Subscriptions created/deleted only on transitions
4. ✅ No duplicate API calls for subscription management
5. ✅ Cleaner, predictable behavior

---

**Status:** ✅ Ready to test - the fix prevents duplicate subscription creation while maintaining proper session detection.
