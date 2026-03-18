# 📚 Complete Documentation Index

## Quick Navigation

### 🚀 Getting Started
1. **[PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md)** - START HERE
   - Configuration verification
   - Step-by-step test sequence
   - Troubleshooting guide
   - Success criteria

### 📖 Understanding the System
2. **[STARTUP_PROCEDURE.md](STARTUP_PROCEDURE.md)** - Detailed Reference
   - Seven startup phases explained
   - Console output guide
   - State machine diagram
   - API polling flow
   - Advantages of three-state system

3. **[YOUR_CONFIG_FLOW.md](YOUR_CONFIG_FLOW.md)** - Your Specific Setup
   - Timeline with your api_endpoints.json
   - Complete execution flow (T=0 to T=32)
   - Variable files available at each state
   - Polling frequencies breakdown

### 📋 Implementation Details
4. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What Changed
   - Changes from old to new system
   - Key functions implemented
   - File structure overview
   - Benefits listed
   - Migration guide

5. **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - Complete Overview
   - What was changed and why
   - Before/after comparison
   - API endpoint changes
   - Testing instructions

### ✨ Advanced Topics
6. **[VARIABLE_SYSTEM_GUIDE.md](VARIABLE_SYSTEM_GUIDE.md)** - Variables Deep Dive
   - Nested JSON flattening explained
   - Variable naming convention
   - Runtime variables file structure
   - Usage examples

7. **[DELIVERY_COMPLETE.md](DELIVERY_COMPLETE.md)** - Final Summary
   - What was delivered
   - State machine diagram
   - Verification checklist
   - Ready to test confirmation

## System Architecture

```
TSWDash Project Structure
│
├── 🔧 Core Implementation
│   ├── src/main.py              ✅ Startup sequence (web server first)
│   ├── src/api_poller.py        ✅ Three-state system + polling logic
│   ├── src/web_server.py        ✅ Flask app + API endpoints
│   ├── src/config.py            ✅ Configuration manager
│   ├── src/api_endpoints.json   ✅ Game API configuration
│   └── src/dashboard_config.json✅ Simple dashboard layout
│
├── 📚 Documentation (You are here)
│   ├── PRE_TEST_CHECKLIST.md         ← START HERE
│   ├── STARTUP_PROCEDURE.md          ← Reference guide
│   ├── YOUR_CONFIG_FLOW.md           ← Your specific setup
│   ├── IMPLEMENTATION_SUMMARY.md     ← What changed
│   ├── CHANGES_SUMMARY.md            ← Overview
│   ├── VARIABLE_SYSTEM_GUIDE.md      ← Variables detail
│   ├── DELIVERY_COMPLETE.md          ← Final summary
│   ├── DOCUMENTATION_INDEX.md        ← This file
│   │
│   └── Original Documentation
│       ├── README.md
│       ├── ARCHITECTURE.md
│       ├── START_HERE.md
│       ├── MFD_GUIDE.md
│       ├── COMPONENT_GUIDE.md
│       ├── CUSTOMIZE_DASHBOARD.md
│       └── FIXES.md
│
└── 📁 Runtime (Generated While Running)
    ├── runtime_variables.json    ← Updated every 2 seconds
    └── __pycache__/             (Python cache, ignore)
```

## Three-State System

```
Program Start
    ↓
Web Server Ready (http://localhost:5000)
    ↓
API Polling Starts
    ↓
┌─────────────────────────────────────┐
│        OFFLINE STATE                 │
│  • Game not responding              │
│  • Polling first endpoint every 1s  │
│  • No subscription polling          │
└─────┬───────────────────────────────┘
      │ Game responds (TSW6 starts)
      │ Cleanup orphaned subscriptions
      ▼
┌─────────────────────────────────────┐
│        ONLINE STATE                  │
│  • Game responding                  │
│  • Monitoring cameraMode            │
│  • Not in FirstPerson_Driving       │
│  • No subscription polling          │
└─────┬───────────────────────────────┘
      │ cameraMode == "FirstPerson_Driving"
      │ Create all subscriptions
      ▼
┌─────────────────────────────────────┐
│      IN_SESSION STATE                │
│  • Player actively driving          │
│  • All subscriptions active         │
│  • Polling at full frequency        │
│  • Dashboard showing live data      │
└─────┬───────────────────────────────┘
      │ cameraMode changes away from driving
      │ Delete all subscriptions
      ▼
    ONLINE (back to monitoring)
```

## Documentation by Purpose

### I want to...

**Test if everything works**
→ [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md)

**Understand the startup sequence**
→ [STARTUP_PROCEDURE.md](STARTUP_PROCEDURE.md)

**See my specific setup in action**
→ [YOUR_CONFIG_FLOW.md](YOUR_CONFIG_FLOW.md)

**Know what was changed**
→ [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

**Get a complete overview**
→ [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)

**Understand variable naming**
→ [VARIABLE_SYSTEM_GUIDE.md](VARIABLE_SYSTEM_GUIDE.md)

**Verify implementation is complete**
→ [DELIVERY_COMPLETE.md](DELIVERY_COMPLETE.md)

**Configure the system**
→ [src/api_endpoints.json](src/api_endpoints.json)

**Add dashboard widgets**
→ [CUSTOMIZE_DASHBOARD.md](CUSTOMIZE_DASHBOARD.md)

**Build advanced MFD**
→ [COMPONENT_GUIDE.md](COMPONENT_GUIDE.md)

## Key Concepts

### Three States
- **OFFLINE** - Game unreachable
- **ONLINE** - Game responding but not playing
- **IN_SESSION** - Player in driving mode

### Startup Phases
1. Configuration loading
2. Web server initialization (accessible immediately)
3. API polling starts
4. Game detection
5. Session detection
6. Subscription management
7. Active polling

### Polling Frequencies
- **Game check** - Every 1000ms (first endpoint)
- **Subscription 1** - Every 100ms (during session)
- **Subscription 2** - Every 10000ms (during session)
- **Variables file** - Updated every 2000ms

### Variable Naming
- Format: `{base_name}.{json_path}`
- Example: `driver_info.geoLocation.longitude`
- From: `player_info` → `player_info.*`

## Implementation Checklist

- ✅ Three-state system implemented
- ✅ Web server starts first
- ✅ Game online detection
- ✅ Session detection via cameraMode
- ✅ Subscription auto-creation
- ✅ Subscription auto-deletion
- ✅ Orphaned subscription cleanup
- ✅ Nested JSON flattening
- ✅ Runtime variables tracking
- ✅ Console logging updated
- ✅ API endpoints updated
- ✅ Complete documentation

## Quick Start Commands

```bash
# Navigate to source
cd src

# Run the application
python main.py

# In another terminal, test the API
curl http://localhost:5000/api/data

# Or open dashboard
# http://localhost:5000
```

## Test Timeline

1. **T=0** - Start app
2. **T=1** - Web server ready (dashboard accessible)
3. **T=2-5** - Polling starts, checking for game
4. **T=5** - Start TSW6
5. **T=10** - Game shows ONLINE, cleanup happens
6. **T=15** - Enter driving mode
7. **T=16** - SESSION STARTED, subscriptions created
8. **T=30** - Exit driving mode
9. **T=31** - SESSION ENDED, subscriptions deleted
10. **T=32** - Close game
11. **T=33** - GAME OFFLINE

## Files at a Glance

| File | Status | Purpose |
|------|--------|---------|
| main.py | ✅ Updated | Startup (web first) |
| api_poller.py | ✅ Updated | Three-state system |
| web_server.py | ✅ Updated | API responses |
| api_endpoints.json | ✅ Works | Configuration |
| runtime_variables.json | ✅ New | Variable tracking |

## Troubleshooting Quick Links

- Dashboard won't load → [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md#dashboard-wont-load)
- Game shows offline → [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md#shows-offline-after-game-launches)
- No subscriptions → [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md#game-shows-online-but-no-subscriptions-created)
- Understand cameraMode → [YOUR_CONFIG_FLOW.md](YOUR_CONFIG_FLOW.md) (search "cameraMode")
- API changes → [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md#-api-changes)

## Related Systems

### Previous Documents (Still Valid)
- [README.md](README.md) - General project info
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [VARIABLE_SYSTEM_GUIDE.md](VARIABLE_SYSTEM_GUIDE.md) - Deep nesting variables
- [CUSTOMIZE_DASHBOARD.md](CUSTOMIZE_DASHBOARD.md) - Simple dashboard
- [COMPONENT_GUIDE.md](COMPONENT_GUIDE.md) - MFD components
- [MFD_GUIDE.md](MFD_GUIDE.md) - Advanced MFD

### New Features
- runtime_variables.json generation
- Three-state system
- Automatic subscription lifecycle
- Web server-first startup

## Summary

You now have:
- ✅ **Complete implementation** of three-state startup and session management
- ✅ **Comprehensive documentation** (4 main guides + 3 supporting docs)
- ✅ **Your specific setup** detailed with timeline and polling breakdown
- ✅ **Test checklist** with step-by-step verification
- ✅ **Ready to deploy** system with automatic cleanup and management

👉 **Next Step:** Open [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md) and follow the test sequence!

---

## Document Versions

| Document | Purpose | Read Time |
|----------|---------|-----------|
| PRE_TEST_CHECKLIST | Testing guide | 5 min |
| STARTUP_PROCEDURE | Detailed reference | 15 min |
| YOUR_CONFIG_FLOW | Your setup timeline | 10 min |
| IMPLEMENTATION_SUMMARY | What changed | 5 min |
| CHANGES_SUMMARY | Overview | 3 min |
| VARIABLE_SYSTEM_GUIDE | Variables explained | 10 min |
| DELIVERY_COMPLETE | Final summary | 3 min |

**Total Documentation:** ~50 minutes to fully understand

**Minimum to Start Testing:** 5 minutes ([PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md))
