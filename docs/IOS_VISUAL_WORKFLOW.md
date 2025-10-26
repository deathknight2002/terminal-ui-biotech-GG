# iOS Mobile App - Visual Workflow Guide

A step-by-step visual guide to building and installing the Biotech Terminal iOS app.

## 🎯 The Journey: Web App → iOS App

```
┌─────────────────────────────────────────────────────────────┐
│                    START HERE                                │
│  You have: Web app code (mobile/src/)                       │
│  You want: Native iOS app on your iPhone                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Build Web Assets                                   │
│  Command: npm run build:mobile                              │
│                                                              │
│  React/TypeScript → JavaScript Bundle                       │
│  mobile/src/ → mobile/dist/                                 │
│                                                              │
│  Creates:                                                    │
│  ├── index.html                                             │
│  ├── assets/index-[hash].js                                 │
│  └── assets/index-[hash].css                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Sync to iOS Project                                │
│  Command: npm run cap:sync                                  │
│                                                              │
│  Copies: mobile/dist/ → mobile/ios/App/App/public/          │
│                                                              │
│  Now your web app is inside the iOS project!                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Open in Xcode                                      │
│  Command: npm run cap:open:ios                              │
│                                                              │
│  Opens: mobile/ios/App/App.xcworkspace                      │
│                                                              │
│  Xcode window shows:                                        │
│  ├── App (project)                                          │
│  ├── Pods (dependencies)                                    │
│  └── Public (your web app!)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Configure Signing (First Time Only)                │
│                                                              │
│  In Xcode:                                                   │
│  1. Click "App" in project navigator                        │
│  2. Select "Signing & Capabilities" tab                     │
│  3. Check "Automatically manage signing"                    │
│  4. Team: Select your Apple ID                              │
│  5. Bundle Identifier: com.bioterminal.app                  │
│                                                              │
│  Xcode creates a certificate automatically!                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Select Device                                      │
│                                                              │
│  1. Connect iPhone/iPad via USB                             │
│  2. Unlock device and trust computer                        │
│  3. Device appears in Xcode toolbar                         │
│  4. Select it from dropdown                                 │
│                                                              │
│  Dropdown shows:                                             │
│  > John's iPhone (Your Device Name)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Build & Run                                        │
│  Click: ▶ (Play button) in Xcode                            │
│                                                              │
│  Xcode will:                                                 │
│  1. ⚙️  Compile Swift code                                   │
│  2. 📦 Bundle web assets                                     │
│  3. ✍️  Sign with your certificate                           │
│  4. 📲 Install on your device                                │
│  5. 🚀 Launch the app                                        │
│                                                              │
│  First time: Takes ~30 seconds                              │
│  Later builds: ~10 seconds                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Trust Developer (First Time Only)                  │
│                                                              │
│  App crashes? Normal on first install!                      │
│                                                              │
│  On your iPhone/iPad:                                        │
│  Settings → General → VPN & Device Management                │
│  → Find your Apple ID → Tap "Trust"                         │
│                                                              │
│  Return to home screen and launch app again!                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    🎉 SUCCESS!                               │
│                                                              │
│  Your iPhone/iPad now has:                                   │
│  📱 Biotech Terminal app on home screen                      │
│  🚀 Native iOS experience                                    │
│  ✨ Full functionality                                       │
│                                                              │
│  Next: Configure backend connection                          │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites Checklist

Before starting, make sure you have:

```
Hardware:
├── ✓ Mac with macOS
├── ✓ iPhone or iPad (iOS 14.0+)
└── ✓ USB cable to connect them

Software:
├── ✓ Xcode 14.0+ (from Mac App Store)
├── ✓ Xcode Command Line Tools (xcode-select --install)
├── ✓ CocoaPods (sudo gem install cocoapods)
├── ✓ Node.js 18+ (node --version)
└── ✓ npm (npm --version)

Account:
└── ✓ Apple ID (free, no paid account needed)
```

Run this to check: `npm run verify:ios`

## 🔄 Development Workflow

### After Making Code Changes

```
┌─────────────────────────────────────────────────────────────┐
│  You edited: mobile/src/pages/Dashboard.tsx                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  OPTION A: Standard Build (Safe)                            │
│                                                              │
│  $ npm run build:mobile                                     │
│  $ cd mobile && npm run cap:sync                            │
│  $ npm run cap:open:ios                                     │
│  # In Xcode: Click Run (▶)                                  │
│                                                              │
│  Time: ~30-60 seconds per iteration                         │
└─────────────────────────────────────────────────────────────┘
                            OR
┌─────────────────────────────────────────────────────────────┐
│  OPTION B: Live Reload (Fast!)                              │
│                                                              │
│  # One-time setup:                                           │
│  1. Start dev server: npm run dev:mobile                    │
│  2. Edit capacitor.config.ts:                               │
│     server: { url: 'http://YOUR_MAC_IP:3002', cleartext: true }
│  3. Sync: npm run cap:sync                                  │
│  4. Build in Xcode once                                     │
│                                                              │
│  Now changes auto-reload on your device!                    │
│  Time: ~2-5 seconds per change                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 Backend Connection Workflow

### Local Development (Backend on Mac)

```
┌─────────────────────────────────────────────────────────────┐
│  Your Mac                          Your iPhone               │
│  ┌─────────────────┐              ┌──────────────┐          │
│  │ Terminal 1      │              │ Biotech      │          │
│  │                 │              │ Terminal App │          │
│  │ $ poetry run    │   WiFi       │              │          │
│  │   uvicorn ...   │◄────────────►│ Makes API    │          │
│  │   --host 0.0.0.0│              │ requests     │          │
│  │   --port 8000   │              │              │          │
│  │                 │              │ http://...   │          │
│  │ Backend running │              │ :8000/api/   │          │
│  └─────────────────┘              └──────────────┘          │
└─────────────────────────────────────────────────────────────┘

Steps:
1. Find Mac IP: ifconfig | grep "inet " | grep -v 127.0.0.1
   Example output: inet 192.168.1.100

2. Start backend on Mac:
   $ poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000

3. Configure mobile app:
   $ echo "VITE_API_URL=http://192.168.1.100:8000" > mobile/.env

4. Rebuild and sync:
   $ npm run build:mobile
   $ cd mobile && npm run cap:sync

5. Test from iPhone Safari: http://192.168.1.100:8000/docs
   Should see FastAPI documentation!

6. Run app in Xcode - now it connects to your Mac!
```

### Production (Backend on Server)

```
┌─────────────────────────────────────────────────────────────┐
│  Internet                                                    │
│                                                              │
│  Your iPhone              Cloud Server                       │
│  ┌──────────────┐         ┌─────────────────┐              │
│  │ Biotech      │  HTTPS  │ Your Backend    │              │
│  │ Terminal App │◄───────►│ (AWS/GCP/etc)   │              │
│  │              │         │                 │              │
│  │ Makes API    │         │ FastAPI :443    │              │
│  │ requests     │         │ SSL Certificate │              │
│  │              │         │ PostgreSQL      │              │
│  └──────────────┘         └─────────────────┘              │
└─────────────────────────────────────────────────────────────┘

Steps:
1. Deploy backend to cloud:
   - AWS EC2 + nginx + Let's Encrypt SSL
   - Or Railway/Render/Heroku (automatic SSL)

2. Configure mobile app:
   $ echo "VITE_API_URL=https://api.your-domain.com" > mobile/.env

3. Build for production:
   $ VITE_MODE=production npm run build:mobile
   $ cd mobile && npm run cap:sync

4. Build in Xcode and install on device

App now connects to production backend over HTTPS!
```

## 🎨 Customization Workflow

### Changing App Icon

```
1. Create app icon (1024x1024 PNG)

2. In Xcode:
   - Click App → App → Assets.xcassets → AppIcon
   - Drag your icon to the 1024x1024 slot
   - Xcode generates all sizes automatically

3. Clean and rebuild:
   - Product → Clean Build Folder
   - Product → Run
```

### Changing App Name

```
1. Edit mobile/capacitor.config.ts:
   appName: 'Your App Name'

2. Sync to iOS:
   $ npm run cap:sync

3. Or edit directly in Xcode:
   - Click App target
   - General → Display Name: "Your App Name"
```

### Changing Bundle ID

```
1. Edit mobile/capacitor.config.ts:
   appId: 'com.yourname.yourapp'

2. Sync to iOS:
   $ npm run cap:sync

3. In Xcode:
   - Click App target
   - Signing & Capabilities → Bundle Identifier: com.yourname.yourapp
   - May need to re-select Team
```

## 🐛 Troubleshooting Flowchart

```
                      App Won't Build?
                            ↓
                    ┌───────┴───────┐
                    │               │
            Build Error?      Signing Error?
                    │               │
                    ↓               ↓
        Check TypeScript    Go to Signing Tab
        $ npm run typecheck  Select Apple ID Team
        Fix any errors       Click Run again
                    │               │
                    └───────┬───────┘
                            ↓
                       ┌────────────────┐
                       │ Build Succeeds │
                       │ but App Crashes?│
                       └────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
          First Time?        Later Times?
                    │               │
                    ↓               ↓
           Trust Developer   Check Xcode Console
           (Settings → General)  Look for errors
           Trust your Apple ID   Fix and rebuild
                    │               │
                    └───────┬───────┘
                            ↓
                    ┌──────────────┐
                    │  App Works!  │
                    │  But Can't   │
                    │  Reach Backend?│
                    └──────────────┘
                            ↓
              Check Network Connection
              ├─ Same WiFi? iPhone + Mac
              ├─ Firewall allows connections?
              ├─ Backend running? curl http://...
              └─ Correct IP in .env file?
                            ↓
                    ┌──────────────┐
                    │  All Working!│
                    └──────────────┘
```

## 📱 Using the App

### Daily Usage Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  MORNING: Start Work                                         │
│                                                              │
│  1. Start backend on Mac:                                    │
│     $ poetry run uvicorn bt_platform.core.app:app \         │
│       --host 0.0.0.0 --port 8000                            │
│                                                              │
│  2. Launch app on iPhone (tap icon)                         │
│     App connects to Mac backend automatically                │
│                                                              │
│  3. Use app throughout the day                              │
│     - View drug pipelines                                    │
│     - Check clinical trials                                  │
│     - Analyze catalysts                                      │
│     - Research companies                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DEVELOPMENT: Making Changes                                 │
│                                                              │
│  1. Edit code in mobile/src/ on Mac                         │
│                                                              │
│  2. Rebuild:                                                │
│     $ npm run build:mobile                                  │
│     $ cd mobile && npm run cap:sync                         │
│                                                              │
│  3. Run in Xcode (▶)                                         │
│     New version installs on device                           │
│                                                              │
│  4. Test on device                                          │
│     Repeat until satisfied                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WEEKLY: Re-sign App (Free Apple ID Only)                   │
│                                                              │
│  Free Apple ID certificates expire after 7 days             │
│                                                              │
│  To re-sign:                                                 │
│  1. Open Xcode                                              │
│  2. Click Run (▶)                                           │
│  3. New certificate installed                               │
│                                                              │
│  Upgrade to paid account to avoid this!                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎓 Learning Path

### Level 1: Basic User
```
✓ Install app on device (follow this guide)
✓ Use with local backend
✓ Understand rebuild process
→ Time to proficiency: 1 hour
```

### Level 2: Active Developer
```
✓ Set up live reload
✓ Configure production backend
✓ Customize app icon/name
✓ Understand Capacitor plugins
→ Time to proficiency: 4 hours
```

### Level 3: Advanced
```
✓ Add native plugins (camera, notifications)
✓ Implement offline storage
✓ Configure TestFlight
✓ Submit to App Store
→ Time to proficiency: 2-4 days
```

## 📚 Resources by Topic

```
Getting Started:
├─ docs/IOS_IMPLEMENTATION_SUMMARY.md  → Overview
├─ docs/IOS_NATIVE_APP_GUIDE.md       → Complete setup
└─ docs/IOS_QUICK_REFERENCE.md        → Commands

Backend Setup:
└─ docs/IOS_BACKEND_CONFIG.md         → Full backend guide

Understanding System:
├─ docs/IOS_ARCHITECTURE.md           → Architecture diagrams
└─ docs/IOS_VISUAL_WORKFLOW.md        → This file

Need Help?
├─ npm run verify:ios                 → Check setup
├─ Xcode console logs                 → Debug issues
├─ GitHub Issues                       → Report problems
└─ Capacitor Discord                   → Community help
```

## 🚀 Next Steps

1. ✅ Understand this workflow
2. ✅ Run `npm run verify:ios` to check prerequisites
3. ✅ Follow Step 1-7 above to build and install
4. ✅ Configure backend connection
5. ✅ Start using your native iOS app!

**Questions?** Check `docs/IOS_NATIVE_APP_GUIDE.md` for detailed explanations.

**Issues?** See troubleshooting flowchart above.

**Ready?** Let's build: `npm run build:mobile && cd mobile && npm run cap:open:ios`
