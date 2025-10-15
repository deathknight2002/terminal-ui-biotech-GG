# iOS Mobile App - Quick Reference

## Prerequisites Checklist
- [ ] macOS with Xcode 14.0+ installed
- [ ] Xcode Command Line Tools: `xcode-select --install`
- [ ] CocoaPods: `sudo gem install cocoapods`
- [ ] Apple ID signed into Xcode (Preferences → Accounts)
- [ ] iOS device connected via USB
- [ ] Node.js 18+ and npm installed

## First-Time Setup

```bash
# 1. Install dependencies (from project root)
cd /path/to/terminal-ui-biotech-GG
npm install

# 2. Build frontend components
npm run build:components

# 3. Build mobile web app
npm run build:mobile

# 4. Install iOS dependencies
cd mobile/ios/App
pod install
cd ../../..

# 5. Configure app ID in mobile/capacitor.config.ts
# Change appId from 'com.bioterminal.app' to 'com.yourname.bioterminal'

# 6. Open in Xcode
cd mobile
npm run cap:open:ios

# 7. In Xcode:
#    - Select your device from device dropdown
#    - Select "App" target
#    - Go to "Signing & Capabilities"
#    - Select your Team (Apple ID)
#    - Click Run (▶)

# 8. On your iOS device (first time only):
#    Settings → General → VPN & Device Management
#    → Trust your Apple ID
```

## Daily Development

### Making Changes to Web App

```bash
# 1. Make your changes in mobile/src/

# 2. Rebuild
npm run build:mobile

# 3. Sync to native project
cd mobile
npm run cap:sync

# 4. Run in Xcode
npm run cap:open:ios
# Click Run (▶)
```

### Using Live Reload (Faster Development)

```bash
# 1. Start dev server
cd mobile
npm run dev
# Note the URL: http://localhost:3002

# 2. Find your Mac's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example output: inet 192.168.1.100

# 3. Edit mobile/capacitor.config.ts
# Uncomment and update:
#   server: {
#     url: 'http://192.168.1.100:3002',
#     cleartext: true
#   }

# 4. Sync and run
npm run cap:sync
npm run cap:open:ios
# Click Run (▶)

# Now changes auto-reload on device!

# 5. When done, comment out server config in capacitor.config.ts
```

## Common Commands

### Building & Syncing
```bash
npm run build:mobile      # Build web assets
npm run cap:sync          # Sync to iOS project
npm run cap:sync:ios      # Sync iOS only
npm run cap:build         # Build web + sync
```

### Opening & Running
```bash
npm run cap:open:ios      # Open in Xcode
npm run cap:run:ios       # Build and run on device
```

### Development
```bash
npm run dev               # Start dev server (port 3002)
npm run lint              # Lint code
npm run typecheck         # Check TypeScript
```

## Troubleshooting Quick Fixes

### "No code signing identities found"
```bash
# Open Xcode → Preferences → Accounts
# Add your Apple ID if missing
# Select account → Download Manual Profiles
```

### "Untrusted Enterprise Developer" on device
```bash
# On device:
# Settings → General → VPN & Device Management
# Find your Apple ID → Trust
```

### Build errors after git pull
```bash
npm run build:components
npm run build:mobile
cd mobile
npm run cap:sync
```

### CocoaPods errors
```bash
cd mobile/ios/App
pod deintegrate
pod install
cd ../../..
```

### Capacitor out of sync
```bash
cd mobile
npm run cap:sync
```

### Clean rebuild
```bash
# Clean everything
npm run build:components
npm run build:mobile
cd mobile/ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..
npm run cap:sync
npm run cap:open:ios
# In Xcode: Product → Clean Build Folder
```

## Backend Configuration

### Local Development
```bash
# 1. Find your Mac's IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Start backend on your Mac
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000

# 3. Update API URL in mobile app
# Edit mobile/src/config.ts or set environment variable:
# VITE_API_URL=http://YOUR_MAC_IP:8000
```

### Production
```bash
# Create .env file in mobile/
echo "VITE_API_URL=https://api.your-backend.com" > mobile/.env

# Rebuild
npm run build:mobile
npm run cap:sync
```

## File Structure

```
mobile/
├── capacitor.config.ts          # Capacitor configuration (edit appId here)
├── ios/                         # Native iOS project
│   └── App/
│       ├── App.xcworkspace      # Open this in Xcode
│       ├── Podfile              # CocoaPods dependencies
│       └── App/                 # iOS source files
├── src/                         # Web app source code
├── dist/                        # Built web assets (generated)
└── package.json                 # Scripts and dependencies
```

## Important Notes

### App ID / Bundle Identifier
- Must be unique (e.g., `com.yourname.bioterminal`)
- Set in `mobile/capacitor.config.ts`
- Must match in Xcode: Target → Signing & Capabilities → Bundle Identifier

### Personal Use Certificate
- Free Apple ID allows:
  - 3 apps on device at once
  - 7-day expiration (need to reinstall weekly)
  - No App Store distribution
- Paid Developer Program ($99/year) removes these limits

### Firewall
If device can't reach local backend:
```bash
# System Preferences → Security & Privacy → Firewall → Firewall Options
# Add Python and Node to allowed apps
```

## Resources

- **Full Guide**: [docs/IOS_NATIVE_APP_GUIDE.md](../docs/IOS_NATIVE_APP_GUIDE.md)
- **Mobile README**: [mobile/README.md](../mobile/README.md)
- **PWA Alternative**: [docs/IOS_PWA_GUIDE.md](../docs/IOS_PWA_GUIDE.md)
- **Capacitor Docs**: https://capacitorjs.com/docs/ios

## Getting Help

1. Check [docs/IOS_NATIVE_APP_GUIDE.md](../docs/IOS_NATIVE_APP_GUIDE.md) troubleshooting section
2. Search GitHub issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
3. Capacitor Discord: https://discord.gg/UPYYRhtyzp
4. Stack Overflow: Tag with `capacitor` and `ios`
