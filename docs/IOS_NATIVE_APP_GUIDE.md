# iOS Native App Setup Guide

This guide covers setting up and building the Biotech Terminal as a native iOS app for **personal use** using Capacitor.

## Prerequisites

### Required Software
1. **macOS** with Xcode 14.0+ (required for iOS development)
2. **Xcode Command Line Tools**: `xcode-select --install`
3. **CocoaPods**: `sudo gem install cocoapods`
4. **Node.js 18+** and **npm**
5. **Apple Developer Account** (free for personal use, no paid membership required)

### iOS Device Requirements
- iPhone/iPad running iOS 14.0 or later
- USB cable to connect device to Mac
- Device must be registered in your Apple Developer account

## Initial Setup

### 1. Build the Web Assets

First, ensure the mobile app is built:

```bash
# From project root
cd /path/to/terminal-ui-biotech-GG

# Build frontend components (required dependency)
npm run build:components

# Build mobile app web assets
npm run build:mobile
```

This creates the `mobile/dist/` directory with your web app.

### 2. Install iOS Dependencies

```bash
cd mobile

# Install CocoaPods dependencies
cd ios/App
pod install
cd ../..
```

### 3. Configure App Identity

Edit `mobile/capacitor.config.ts` and set your unique app ID:

```typescript
const config: CapacitorConfig = {
  appId: 'com.yourname.bioterminal',  // Change this to your unique ID
  appName: 'Biotech Terminal',
  // ... rest of config
};
```

**Important**: Use a reverse domain name you control (e.g., `com.yourname.bioterminal`)

## Building for iOS Device

### Option 1: Using Xcode (Recommended for Personal Use)

#### Step 1: Open Project in Xcode

```bash
cd mobile
npm run cap:open:ios
```

This opens `mobile/ios/App/App.xcworkspace` in Xcode.

#### Step 2: Configure Signing

1. In Xcode, select the **App** target in the project navigator
2. Go to **Signing & Capabilities** tab
3. Under **Team**, select your Apple Developer account
   - If not listed, click "Add Account..." and sign in with your Apple ID
4. Set **Bundle Identifier** to match your `appId` in `capacitor.config.ts`
5. Xcode will automatically create a provisioning profile for personal development

#### Step 3: Connect Your Device

1. Connect your iPhone/iPad via USB
2. Select your device from the device dropdown in Xcode toolbar
3. If prompted, trust the computer on your iOS device

#### Step 4: Build and Run

1. Click the **Play** button (▶) in Xcode toolbar
2. Xcode will:
   - Build the app
   - Install it on your device
   - Launch it automatically

#### Step 5: Trust Developer Certificate (First Time Only)

1. On your iOS device, go to **Settings → General → VPN & Device Management**
2. Find your Apple ID under "Developer App"
3. Tap it and select **Trust "Your Name"**
4. Return to home screen and launch "Biotech Terminal"

### Option 2: Using Capacitor CLI

```bash
cd mobile

# Build and run on connected device
npm run cap:run:ios
```

This will build and deploy to your connected iOS device.

## Updating the App

When you make changes to the web app:

```bash
# 1. Rebuild web assets
npm run build:mobile

# 2. Sync changes to native project
npm run cap:sync

# 3. Rebuild in Xcode or use cap:run:ios
npm run cap:run:ios
```

## Development Workflow

### Live Reload During Development

For faster development, you can run the web server and point the native app to it:

#### 1. Start the Mobile Dev Server

```bash
cd mobile
npm run dev
```

The app runs at `http://localhost:3002`

#### 2. Enable Live Reload in Capacitor Config

Edit `mobile/capacitor.config.ts`:

```typescript
server: {
  url: 'http://YOUR_MAC_IP:3002',  // Replace with your Mac's IP
  cleartext: true
},
```

Find your Mac's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### 3. Rebuild and Run

```bash
npm run cap:sync:ios
npm run cap:open:ios
```

Build and run in Xcode. The app will now load from your dev server with hot reload!

**Important**: Remember to remove the `server` config before building for production.

## Backend Configuration

The mobile app connects to backend APIs. Configure the backend URL:

### For Local Development

If running backends locally on your Mac:

1. Find your Mac's local IP: `ifconfig | grep "inet "`
2. Update API endpoints in `mobile/src/config.ts` (if exists) or environment variables

Example:
```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'http://YOUR_MAC_IP:8000';
```

### For Production

Set the production backend URL before building:

```bash
# Create .env file in mobile/
echo "VITE_API_URL=https://api.your-backend.com" > mobile/.env
```

## Troubleshooting

### "No code signing identities found"

**Solution**: 
1. Open Xcode Preferences → Accounts
2. Add your Apple ID if not present
3. Select your account and click "Download Manual Profiles"

### "Untrusted Enterprise Developer"

**Solution**: Trust your developer certificate on the device (see Step 5 above)

### "Command PhaseScriptExecution failed"

**Solution**:
```bash
cd mobile/ios/App
pod deintegrate
pod install
```

### Build Fails with "Module not found"

**Solution**: Ensure components are built first:
```bash
npm run build:components
npm run build:mobile
npm run cap:sync
```

### Device Not Showing in Xcode

**Solutions**:
1. Unlock your device
2. Trust the computer (tap "Trust" on device)
3. Restart Xcode
4. Check cable connection

### App Crashes on Launch

**Solutions**:
1. Check Xcode console for error messages
2. Verify backend URLs are accessible from device
3. Check `capacitor.config.ts` configuration
4. Clean build folder: Xcode → Product → Clean Build Folder

## App Store Distribution (Optional)

For personal use, you don't need App Store distribution. However, if you want to:

### Personal Use via TestFlight

1. Enroll in Apple Developer Program ($99/year)
2. Create App Store Connect record
3. Archive app in Xcode (Product → Archive)
4. Upload to App Store Connect
5. Invite yourself as TestFlight tester

### Sideloading via AltStore (Free Alternative)

AltStore allows sideloading without developer account:

1. Install AltStore: https://altstore.io
2. Build IPA file in Xcode (Product → Archive → Export)
3. Use AltStore to install on your device
4. Re-sign weekly (free account limitation)

## Backend Setup Notes

The iOS app requires these backends to be running:

### Python FastAPI Backend (Port 8000)
```bash
cd /path/to/terminal-ui-biotech-GG
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000
```

### Node.js Backend (Port 3001) - Optional
```bash
cd backend
npm run dev
```

### Making Backends Accessible to iOS Device

If running backends on your Mac:

1. Ensure firewall allows connections:
   - System Preferences → Security & Privacy → Firewall Options
   - Add Python and Node to allowed apps

2. Use your Mac's local IP (not localhost)

3. For production, deploy backends to a server and use HTTPS URLs

## Security Considerations

### For Personal Use
- Keep your Apple ID credentials secure
- Don't distribute the IPA file to others
- Backends should use authentication (JWT tokens)

### For Production
- Enable App Transport Security (HTTPS only)
- Implement certificate pinning
- Use environment-specific configurations
- Enable code obfuscation

## Useful Commands Reference

```bash
# Build web assets
npm run build:mobile

# Sync web assets to native project
npm run cap:sync
npm run cap:sync:ios

# Open in Xcode
npm run cap:open:ios

# Run on device
npm run cap:run:ios

# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/ios@latest

# Clean iOS build
cd mobile/ios/App
rm -rf Pods Podfile.lock
pod install
```

## Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Xcode Help](https://help.apple.com/xcode/)
- [CocoaPods Guides](https://guides.cocoapods.org/)

## Support

For issues specific to this app:
- Check GitHub Issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
- Review mobile/README.md for mobile-specific documentation
- Check docs/IOS_PWA_GUIDE.md for PWA alternative

For general iOS/Capacitor issues:
- Capacitor Community Discord: https://discord.gg/UPYYRhtyzp
- Stack Overflow: Tag questions with `capacitor` and `ios`
