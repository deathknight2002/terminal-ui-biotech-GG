# Backend Configuration for iOS Mobile App

This guide explains how to configure and connect the iOS mobile app to the backend services.

## Overview

The Biotech Terminal mobile app requires two backend services:

1. **Python FastAPI Backend** (Port 8000)
   - Main API for biotech data, drug pipelines, clinical trials
   - Database operations (SQLite/PostgreSQL)
   - Data providers and integrations

2. **Node.js Express Backend** (Port 3001) - Optional
   - Real-time WebSocket connections
   - Market data streaming
   - Live updates

## Backend Architecture

```
iOS Device (Mobile App)
    ↓ HTTPS/HTTP
Mac/Server (Backend)
    ├─ Python FastAPI :8000  (Required)
    └─ Node.js Express :3001 (Optional)
```

## Configuration Methods

### Method 1: Environment Variables (Recommended)

Create a `.env` file in the `mobile/` directory:

```bash
# mobile/.env
VITE_API_URL=http://YOUR_BACKEND_URL:8000
VITE_WS_URL=ws://YOUR_BACKEND_URL:3001
```

**For local development** (backend on your Mac):
```bash
# Find your Mac's local IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example output: inet 192.168.1.100

# mobile/.env
VITE_API_URL=http://192.168.1.100:8000
VITE_WS_URL=ws://192.168.1.100:3001
```

**For production** (backend on server):
```bash
# mobile/.env
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
```

After changing `.env`:
```bash
npm run build:mobile
npm run cap:sync
```

### Method 2: Direct Code Configuration

Edit `mobile/src/config.ts` (create if doesn't exist):

```typescript
// mobile/src/config.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  wsURL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  timeout: 30000,
};
```

Then import in your API calls:

```typescript
import { API_CONFIG } from './config';
import axios from 'axios';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});
```

### Method 3: Capacitor Live Reload (Development Only)

For fastest development iteration, point the native app directly to your dev server:

Edit `mobile/capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  // ... other config
  server: {
    url: 'http://192.168.1.100:3002',  // Your Mac's IP + mobile dev server port
    cleartext: true,                     // Allow HTTP (dev only!)
  },
};
```

Then:
```bash
# Start dev server
npm run dev:mobile

# Sync to iOS
cd mobile
npm run cap:sync
npm run cap:open:ios
```

**Important**: Remove `server` config before building for production!

## Running Backends for iOS Development

### Python FastAPI Backend

#### Option 1: Run on Mac (Local Network)

```bash
# From project root
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` makes the server accessible from other devices on your network (like your iPhone).

**Test from Mac:**
```bash
curl http://localhost:8000/api/v1/health
```

**Test from iPhone** (with backend running on Mac):
```bash
# From Mac, find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# From iPhone Safari, visit:
http://192.168.1.100:8000/docs
```

#### Option 2: Deploy to Server

Deploy to a cloud server (AWS, DigitalOcean, etc.) and use HTTPS:

```bash
# On server
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000

# Configure mobile app
VITE_API_URL=https://api.your-domain.com
```

### Node.js Express Backend (Optional)

```bash
# From project root
cd backend
npm run dev
```

Or with custom host:
```bash
HOST=0.0.0.0 PORT=3001 npm run dev
```

## Network Configuration

### Firewall Settings (macOS)

Allow incoming connections for local development:

1. **System Preferences → Security & Privacy → Firewall**
2. Click **Firewall Options**
3. Add Python and Node to allowed apps
4. Or disable firewall for development (re-enable later!)

### iOS App Transport Security (ATS)

For local development with HTTP (not HTTPS), iOS requires ATS exceptions.

The iOS project is already configured to allow local connections. See `mobile/ios/App/App/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

This allows HTTP connections to:
- `localhost`
- `127.0.0.1`
- Local network IPs (192.168.x.x, 10.x.x.x)

**For production**, always use HTTPS!

## Testing Backend Connectivity

### From iOS Device

#### 1. Check if backend is reachable

Open Safari on your iPhone and visit:
- `http://YOUR_MAC_IP:8000/docs` - Should show FastAPI docs
- `http://YOUR_MAC_IP:8000/api/v1/health` - Should return JSON

#### 2. Check from mobile app

Add a test button in your app:

```typescript
// mobile/src/pages/Dashboard.tsx
const testBackend = async () => {
  try {
    const response = await fetch('http://192.168.1.100:8000/api/v1/health');
    const data = await response.json();
    console.log('Backend response:', data);
    alert('Backend connected!');
  } catch (error) {
    console.error('Backend error:', error);
    alert('Backend not reachable');
  }
};

// Add button
<button onClick={testBackend}>Test Backend</button>
```

#### 3. Check Xcode console

In Xcode, view the console output (View → Debug Area → Show Debug Area) to see:
- Network requests
- API responses
- Connection errors

## Common Issues

### "Network request failed"

**Causes:**
- Backend not running
- Wrong IP address
- Firewall blocking connections
- iOS and Mac on different networks

**Solutions:**
```bash
# 1. Verify backend is running
curl http://localhost:8000/api/v1/health

# 2. Verify IP address is correct
ifconfig | grep "inet " | grep -v 127.0.0.1

# 3. Check firewall allows connections
# System Preferences → Security & Privacy → Firewall

# 4. Ensure iPhone and Mac on same WiFi network
```

### "Cannot connect to localhost"

**Problem:** iOS device can't reach `localhost` or `127.0.0.1`

**Solution:** Use your Mac's actual IP address (192.168.x.x or 10.x.x.x)

### "NSURLSession error -1009: The Internet connection appears to be offline"

**Problem:** iOS simulator/device can't reach backend

**Solutions:**
1. Check WiFi connection on device
2. Use Mac's IP, not localhost
3. Ensure backend running with `--host 0.0.0.0`
4. Disable VPN if active

### CORS Errors

**Problem:** Backend rejects requests from mobile app

**Solution:** Configure CORS in backend:

```python
# bt_platform/core/app.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, restrict `allow_origins` to your domain.

## Production Deployment

### Backend Requirements

1. **HTTPS Required**: iOS requires HTTPS in production
2. **SSL Certificate**: Use Let's Encrypt or cloud provider
3. **Domain Name**: Point to your backend server

### Deployment Options

#### Option 1: Cloud Hosting (AWS, GCP, Azure)

```bash
# Deploy FastAPI backend
# Example with AWS EC2 + nginx + SSL

# 1. Set up EC2 instance
# 2. Install nginx with SSL (certbot)
# 3. Configure nginx reverse proxy to FastAPI
# 4. Point domain (api.your-domain.com) to server
# 5. Update mobile app: VITE_API_URL=https://api.your-domain.com
```

#### Option 2: Serverless (AWS Lambda, Google Cloud Functions)

FastAPI can run serverless using Mangum:

```bash
pip install mangum
```

```python
# lambda_handler.py
from mangum import Mangum
from bt_platform.core.app import app

handler = Mangum(app)
```

#### Option 3: Platform-as-a-Service (Heroku, Railway, Render)

```bash
# Example with Railway
railway init
railway up

# Get deployment URL
railway domain

# Update mobile app
VITE_API_URL=https://your-app.railway.app
```

### Backend Health Monitoring

Add health check endpoint for monitoring:

```python
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
```

Monitor from iOS app:

```typescript
useEffect(() => {
  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/v1/health`);
      const data = await response.json();
      setBackendStatus(data.status === 'healthy' ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  checkHealth();
  const interval = setInterval(checkHealth, 60000); // Check every minute
  return () => clearInterval(interval);
}, []);
```

## Security Considerations

### API Keys and Secrets

**Never hardcode secrets in the app!**

Instead:
1. Store in `.env` (not committed to git)
2. Pass as environment variables
3. Use secure storage (iOS Keychain) via Capacitor plugins

```typescript
// Install Capacitor Secure Storage
npm install @capacitor/storage

// Use secure storage
import { Storage } from '@capacitor/storage';

await Storage.set({
  key: 'apiKey',
  value: 'your-secret-key'
});

const { value } = await Storage.get({ key: 'apiKey' });
```

### Authentication

Implement JWT tokens:

```typescript
// Login and store token
const login = async (username: string, password: string) => {
  const response = await fetch(`${API_CONFIG.baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const { token } = await response.json();
  await Storage.set({ key: 'authToken', value: token });
};

// Use token in requests
const { value: token } = await Storage.get({ key: 'authToken' });
const response = await fetch(`${API_CONFIG.baseURL}/api/v1/drugs`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### HTTPS in Production

**Required for:**
- Production apps
- App Store submission
- Secure data transmission

**Setup:**
1. Get SSL certificate (Let's Encrypt free)
2. Configure nginx/Apache with SSL
3. Update mobile app URL to `https://`

## Environment-Specific Configuration

Use different configs for dev/staging/prod:

```typescript
// mobile/src/config.ts
const configs = {
  development: {
    apiURL: 'http://192.168.1.100:8000',
    wsURL: 'ws://192.168.1.100:3001',
  },
  staging: {
    apiURL: 'https://staging-api.your-domain.com',
    wsURL: 'wss://staging-api.your-domain.com',
  },
  production: {
    apiURL: 'https://api.your-domain.com',
    wsURL: 'wss://api.your-domain.com',
  },
};

const ENV = import.meta.env.MODE || 'development';
export const API_CONFIG = configs[ENV];
```

Build for specific environment:

```bash
# Development
npm run build:mobile

# Production
VITE_MODE=production npm run build:mobile
```

## Resources

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [iOS App Transport Security](https://developer.apple.com/documentation/security/preventing_insecure_network_connections)
- [Capacitor HTTP Plugin](https://capacitorjs.com/docs/apis/http)
- [Capacitor Storage](https://capacitorjs.com/docs/apis/storage)

## Support

For backend-specific issues:
- Check `docs/IOS_NATIVE_APP_GUIDE.md`
- GitHub Issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
- FastAPI Documentation: https://fastapi.tiangolo.com
