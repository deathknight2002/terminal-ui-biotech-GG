# iOS PWA Installation Guide

## Overview

The Biotech Terminal is now available as a Progressive Web App (PWA) optimized for iOS 26. This guide covers installing and using the terminal as a standalone app on your iPhone or iPad.

## What's New in iOS 26

Apple's iOS 26 (released September 15, 2025) includes significant PWA improvements:

- **"Open as Web App" toggle** enabled by default when adding to Home Screen
- Full standalone mode with app switcher integration
- Improved WebKit capabilities with Liquid Glass visual effects
- Better safe-area handling for notch and bottom bar

## Installing on iPhone/iPad (iOS 26)

### Step-by-Step Installation

1. **Open Safari** and navigate to your Biotech Terminal URL
   - Example: `https://biotech-terminal.app`

2. **Tap the Share button** (square with arrow pointing up)
   - Located at the bottom of Safari (iPhone) or top (iPad)

3. **Scroll down and tap "Add to Home Screen"**
   - iOS 26 shows "Open as Web App" toggle enabled by default
   - Keep this toggle ON for best experience

4. **Customize the name** (optional)
   - Default: "Biotech Terminal"
   - Tap "Add" in the top right corner

5. **Launch from Home Screen**
   - The app icon appears on your Home Screen
   - Tap to open in fullscreen standalone mode
   - No Safari UI, just your terminal

### Verifying Installation

✅ **You'll know it's working when:**
- App opens fullscreen (no Safari bars)
- Shows in app switcher like native apps
- Respects safe areas (notch/bottom bar)
- "Last Refreshed" timestamp visible in footer

## Using the PWA

### Manual Refresh Model

The terminal uses a **manual-refresh-only** data model:

- **Zero background network traffic** after initial load
- **No automatic polling** or data updates
- **Explicit refresh required** to get new data

### How to Refresh Data

1. **Refresh Button** (top right corner)
   - Tap to open refresh menu
   - Options: News, Clinical Trials, Catalysts, or Refresh All
   - Shows spinner while fetching

2. **Last Refreshed Timestamp**
   - Displayed in footer bar
   - Updates only when you refresh
   - Shows exact date/time of last data fetch

3. **Handling Errors**
   - If backend is busy (429/5xx), you'll see a banner
   - App continues showing cached data
   - Banner is dismissible

### Offline Behavior

- **Static assets cached** (app shell, styles, scripts)
- **Works offline** for UI navigation
- **Data requires network** for refresh

## Technical Details

### Safe Areas & Layout

The app automatically handles:
- **iPhone notch** (safe-area-inset-top)
- **Bottom gesture bar** (safe-area-inset-bottom)
- **Landscape orientation** (left/right insets)

CSS uses `env(safe-area-inset-*)` variables for proper spacing.

### Display Modes

The app detects how it's running:

- **Standalone** (installed PWA): Full UI polish, backdrop blur
- **Browser** (Safari): Standard web experience
- **Minimal-UI**: Reduced browser chrome

### Liquid Glass Effects

In standalone mode, the app applies:
- **Backdrop blur** on headers/toolbars
- **Translucent overlays** for depth
- **Subtle borders** for visual hierarchy

These effects match iOS 26's design language.

## Features NOT Included (By Design)

### No Background Activity

❌ **WebSocket connections** - Disabled to eliminate background network  
❌ **Periodic Background Sync** - Not used (Safari doesn't support it)  
❌ **Background Fetch** - Not implemented  
❌ **Push Notifications** - Disabled (though iOS 16.4+ supports Web Push)

**Why?** The manual-refresh model provides:
- Predictable resource usage
- Controlled network traffic
- Lower backend costs
- Simpler debugging

## Troubleshooting

### PWA Won't Install

**Problem:** "Add to Home Screen" doesn't show or fails

**Solutions:**
1. Ensure you're using Safari (not Chrome/Firefox on iOS)
2. Check you're on HTTPS (required for PWAs)
3. Verify manifest.webmanifest loads at `/manifest.webmanifest`
4. Clear Safari cache and try again

### App Opens in Safari Instead of Standalone

**Problem:** Tapping icon opens Safari tabs instead of fullscreen

**Solutions:**
1. Delete the app from Home Screen
2. Re-add, ensuring "Open as Web App" toggle is ON
3. iOS 26 defaults to ON, but verify during install

### Safe Areas Not Respected

**Problem:** Content hidden by notch or bottom bar

**Solutions:**
1. Force-quit and relaunch the app
2. Check viewport meta tag includes `viewport-fit=cover`
3. Verify CSS uses `env(safe-area-inset-*)` variables

### Data Won't Refresh

**Problem:** Tapping refresh button does nothing

**Solutions:**
1. Check network connection
2. Verify backend is running (if local dev)
3. Look for error banner at top of app
4. Check browser console for errors (Dev Mode)

## Comparison: PWA vs Native App

| Feature | PWA | Native (Capacitor) |
|---------|-----|-------------------|
| Installation | Add to Home Screen | App Store |
| Updates | Instant (web) | App Store review |
| Offline | Limited (cached assets) | Full offline support |
| Platform APIs | Web APIs only | Native + Web APIs |
| Distribution | URL | App Store |
| Size | ~500KB initial | ~20MB+ |

**Recommendation:** Start with PWA, consider native wrapper if you need:
- App Store presence
- Advanced platform APIs
- Full offline data storage

## Optional: Capacitor Native Wrapper

If you need a true native app, wrap the PWA with Capacitor:

### Setup Capacitor (iOS)

```bash
cd mobile/
npm install
npx cap add ios
npx cap open ios
```

### Configure in Xcode

1. Set bundle ID: `com.yourcompany.bioterminal`
2. Add icons and splash screens
3. Configure capabilities (if needed)
4. Build and deploy to TestFlight

### Benefits of Native Wrapper

- ✅ App Store distribution
- ✅ Native share/file access
- ✅ Better offline storage
- ✅ TestFlight beta testing

See `/mobile/README.md` for full Capacitor setup guide.

## Resources

- [MDN: Add to Home Screen](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Add_to_home_screen)
- [Apple: Web Apps on iOS](https://developer.apple.com/documentation/webkit/adding_a_web_app_to_the_home_screen)
- [iOS 26 Release Notes](https://developer.apple.com/ios/whats-new/)
- [Web.dev: PWA Best Practices](https://web.dev/pwa/)

## Support

For issues or questions:
- GitHub Issues: [terminal-ui-biotech-GG/issues](https://github.com/deathknight2002/terminal-ui-biotech-GG/issues)
- Docs: [docs/REFRESH_MODEL.md](../docs/REFRESH_MODEL.md)
