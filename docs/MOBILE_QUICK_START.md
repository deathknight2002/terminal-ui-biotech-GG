# 📱 Mobile App - Quick Start Guide

**Simple, straightforward guide to get the mobile app running in minutes.**

## Prerequisites Check

Before you start, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **Terminal/Command Prompt** access
- ✅ Internet connection for dependencies

**Check your versions:**
```bash
node --version   # Should show v18 or higher
npm --version    # Should show 8 or higher
```

## Step 1: Clone or Download Project

**Option A: Clone with Git**
```bash
git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
cd terminal-ui-biotech-GG
```

**Option B: Download ZIP**
1. Download from GitHub
2. Extract the ZIP file
3. Open terminal in extracted folder

## Step 2: Install Dependencies

From the project root directory:

```bash
# Install all dependencies (takes 2-3 minutes)
npm install
```

**What this does:**
- Installs dependencies for mobile app
- Installs dependencies for component library
- Sets up workspace links

**Common issues:**
- **"npm not found"**: Install Node.js first
- **Permission errors**: Don't use `sudo`, check folder permissions
- **Network errors**: Check internet connection, try again

## Step 3: Build Frontend Components

The mobile app depends on the component library. Build it first:

```bash
npm run build:components
```

**Expected output:**
```
> frontend-components@1.0.0 build
> vite build

✓ built in 3.45s
```

**If this fails:**
- Check that dependencies installed correctly
- Run `cd frontend-components && npm install`
- Try building again

## Step 4: Start Mobile Dev Server

```bash
npm run dev:mobile
```

**Expected output:**
```
> biotech-terminal-mobile@1.0.0 dev
> vite --port 3002

  VITE v5.x.x  ready in 432 ms

  ➜  Local:   http://localhost:3002/
  ➜  Network: http://192.168.1.x:3002/
```

## Step 5: Open in Browser

1. **Open your browser** (Chrome, Safari, Firefox)
2. **Navigate to:** `http://localhost:3002`
3. **You should see** the mobile dashboard

### Test in Mobile View

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Press `Ctrl+Shift+M` (Windows) or `Cmd+Shift+M` (Mac)
3. Select device: iPhone 14 Pro
4. Navigate through the app

**Safari:**
1. Enable Developer menu (Settings → Advanced)
2. Select Develop → Enter Responsive Design Mode
3. Choose iPhone device

## Step 6: Test All Pages

Navigate to each page to verify everything works:

- ✅ **Dashboard**: `http://localhost:3002/dashboard`
- ✅ **Pipeline**: `http://localhost:3002/pipeline`
- ✅ **Trials**: `http://localhost:3002/trials`
- ✅ **Financial**: `http://localhost:3002/financial`
- ✅ **Intelligence**: `http://localhost:3002/intelligence`
- ✅ **News**: `http://localhost:3002/news`

**Each page should:**
- Load without errors
- Display mobile-optimized layout
- Show navigation (hamburger menu + bottom tabs)
- Render correctly in portrait orientation

## Testing on Real Mobile Device

### iOS (iPhone/iPad)

1. **Find your computer's IP address:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   # Look for something like 192.168.1.x
   
   # Windows
   ipconfig
   # Look for IPv4 Address
   ```

2. **On your iPhone:**
   - Connect to same WiFi network
   - Open Safari
   - Go to: `http://YOUR_IP_ADDRESS:3002`
   - Example: `http://192.168.1.100:3002`

3. **Add to Home Screen:**
   - Tap Share button (square with arrow)
   - Scroll down, tap "Add to Home Screen"
   - Name it "Biotech Terminal"
   - Tap "Add"

4. **Launch as PWA:**
   - Tap the icon on your Home Screen
   - App runs in fullscreen mode
   - No Safari UI shown

### Android

1. Find your computer's IP (same as iOS step 1)
2. On Android phone:
   - Connect to same WiFi
   - Open Chrome
   - Go to: `http://YOUR_IP_ADDRESS:3002`
3. Chrome may prompt "Add to Home screen"
4. Or use menu → "Add to Home screen"

## Troubleshooting

### Problem: "Cannot GET /"

**Solution:**
- Check that dev server is running
- Look for the "Local: http://localhost:3002/" message
- If port 3002 is in use, stop other processes

### Problem: "Module not found"

**Error Code: E009**

**Solution:**
```bash
# Rebuild components
npm run build:components

# Reinstall mobile dependencies
cd mobile
npm install
cd ..

# Try starting again
npm run dev:mobile
```

### Problem: "Port 3002 already in use"

**Error Code: E007**

**Solution:**
```bash
# Find and kill process on port 3002
# macOS/Linux:
lsof -i :3002
kill -9 <PID>

# Windows:
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

### Problem: Blank screen or white page

**Solution:**
1. Open browser console (F12)
2. Look for error messages
3. Most common: components not built
   ```bash
   npm run build:components
   ```
4. Refresh browser

### Problem: Layout broken on mobile

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check viewport meta tag in mobile/index.html
4. Verify CSS is loading (check Network tab)

### Problem: Can't access from phone

**Common causes:**
- Phone and computer on different WiFi networks
- Firewall blocking port 3002
- Using wrong IP address

**Solution:**
```bash
# Test if server is accessible
# On computer, try:
curl http://localhost:3002

# Should return HTML

# Check firewall:
# macOS: System Preferences → Security & Privacy → Firewall
# Windows: Windows Defender Firewall → Allow an app
# Linux: sudo ufw status
```

## Automated Verification

Use our verification script for step-by-step guidance:

```bash
npm run verify:mobile
```

This script will:
- Check Node.js installation
- Verify all dependencies
- Check critical files
- Test mobile pages
- Verify TypeScript setup
- Test dev server startup
- Provide detailed error messages with solutions

## Quick Command Reference

```bash
# Start mobile app (after setup)
npm run dev:mobile

# Stop mobile app
# Press Ctrl+C in terminal

# Rebuild components
npm run build:components

# Build mobile app for production
npm run build:mobile

# Run full smoke test
npm run smoke-test

# Quick environment check
npm run preflight
```

## Next Steps

Once your mobile app is running:

1. **Customize**: Edit `mobile/src/pages/` to modify pages
2. **Style**: Update `mobile/src/styles/` for custom themes
3. **Deploy**: Build and deploy to hosting service
4. **Test**: Use interactive smoke test (`docs/INTERACTIVE_SMOKE_TEST.html`)

## Getting Help

**Error codes:**
- `E001`: Dependencies issue → Run `npm install`
- `E007`: Mobile setup issue → Check file structure
- `E009`: Component missing → Run `npm run build:components`

**Resources:**
- [Smoke Testing Guide](SMOKE_TESTING_GUIDE.md) - Comprehensive testing
- [Mobile README](../mobile/README.md) - Detailed mobile documentation
- [iOS PWA Guide](IOS_PWA_GUIDE.md) - iOS-specific installation
- [Main README](../README.md) - Full platform documentation

**Still stuck?**
1. Run the verification script: `npm run verify:mobile`
2. Check error code in the output
3. Follow the specific solution provided
4. Check GitHub issues for similar problems

## Success Checklist

✅ Node.js 18+ installed  
✅ Dependencies installed (`npm install`)  
✅ Components built (`npm run build:components`)  
✅ Dev server starts without errors  
✅ Can access `http://localhost:3002`  
✅ All pages load correctly  
✅ Mobile layout displays properly  
✅ Navigation works (menu and tabs)  
✅ Can access from phone (optional)  
✅ PWA installation works (optional)

**If all checked:** 🎉 You're ready to develop!

## Advanced: Production Deployment

Once development is complete:

```bash
# Build for production
npm run build:mobile

# Output in: mobile/dist/

# Deploy to:
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - Custom server: Copy dist/ folder
```

**Requirements for production:**
- HTTPS required (for PWA features)
- Service worker for offline support
- Proper viewport configuration
- Icons in multiple sizes

See [IOS_PWA_GUIDE.md](IOS_PWA_GUIDE.md) for production deployment checklist.
