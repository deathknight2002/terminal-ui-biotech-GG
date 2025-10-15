# iOS Mobile App Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    iOS Device (iPhone/iPad)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Biotech Terminal Mobile App (Native)           │ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │      Capacitor iOS Native Shell                 │  │ │
│  │  │  • WKWebView                                    │  │ │
│  │  │  • Native iOS APIs                              │  │ │
│  │  │  • Safe Area Handling                           │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                       ↕                                │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │    React Web App (mobile/dist/)                 │  │ │
│  │  │  • React 19 + TypeScript                        │  │
│  │  │  • React Router (SPA)                           │  │
│  │  │  • TanStack Query (data fetching)               │  │
│  │  │  • Zustand (state management)                   │  │
│  │  │  • Framer Motion (animations)                   │  │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                       ↕                                │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │   Frontend Components Library                   │  │
│  │  │  • Terminal UI Components                       │  │
│  │  │  • Biotech Domain Components                    │  │
│  │  │  • Glass UI Effects                             │  │
│  │  │  • Charts & Visualizations                      │  │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↕ HTTP(S) / WebSocket
┌─────────────────────────────────────────────────────────────┐
│              Backend Services (Mac or Server)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   Python FastAPI Backend (Port 8000) - REQUIRED       │ │
│  │  • Drug pipeline data                                  │ │
│  │  • Clinical trials                                     │ │
│  │  • Company profiles                                    │ │
│  │  • Catalyst tracking                                   │ │
│  │  • Database (SQLite/PostgreSQL)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   Node.js Express Backend (Port 3001) - OPTIONAL      │ │
│  │  • WebSocket connections                               │ │
│  │  • Real-time market data                               │ │
│  │  • Live updates                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Development Workflow

### Initial Setup

```
Developer Machine (macOS)
├── 1. npm run build:components    → Build frontend-components/
├── 2. npm run build:mobile        → Build mobile web app (mobile/dist/)
├── 3. cd mobile && npx cap sync   → Copy web assets to iOS project
└── 4. npm run cap:open:ios        → Open Xcode
```

### Daily Development

```
┌──────────────────────────────────────────────────────────────┐
│  Development Mode 1: Full Rebuild (Slower)                   │
├──────────────────────────────────────────────────────────────┤
│  1. Edit code in mobile/src/                                 │
│  2. npm run build:mobile         → Rebuild                   │
│  3. npm run cap:sync             → Sync to iOS               │
│  4. Run in Xcode (⌘R)            → Test on device            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Development Mode 2: Live Reload (Faster)                    │
├──────────────────────────────────────────────────────────────┤
│  1. npm run dev:mobile           → Start dev server :3002    │
│  2. Edit capacitor.config.ts:                                │
│     server: {                                                │
│       url: 'http://YOUR_MAC_IP:3002',                        │
│       cleartext: true                                        │
│     }                                                         │
│  3. npm run cap:sync             → Sync config               │
│  4. Run in Xcode (⌘R)            → Auto-reload on changes!   │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### API Requests

```
iOS App Component
    ↓ (TanStack Query)
React Query Hook
    ↓ (axios/fetch)
HTTP Request
    ↓ (WiFi/Cellular)
FastAPI Backend
    ↓ (SQLAlchemy)
Database (SQLite/PostgreSQL)
    ↑ (SQL Query Results)
JSON Response
    ↑ (HTTP)
React Component
    ↓ (State Update)
UI Re-render
```

### WebSocket (Optional)

```
iOS App
    ↓ (socket.io-client)
WebSocket Connection
    ↓ (WiFi/Cellular)
Node.js Express
    ↓ (socket.io)
Real-time Event Handlers
    ↑ (Broadcast)
Live Data Updates
    ↑ (WebSocket)
iOS App
    ↓ (State Update)
UI Real-time Update
```

## Network Topology

### Local Development

```
┌──────────────────────────────────────────────────────┐
│                    Local WiFi Network                 │
│                   (192.168.1.x)                       │
│                                                       │
│  ┌─────────────────────┐      ┌──────────────────┐  │
│  │  Developer Mac      │      │   iPhone/iPad    │  │
│  │  IP: 192.168.1.100  │◄────►│ (Your Device)    │  │
│  │                     │ WiFi │                  │  │
│  │  Python  :8000 ◄────┼──────┼─ HTTP Requests   │  │
│  │  Node.js :3001 ◄────┼──────┼─ WebSocket       │  │
│  │  Mobile  :3002 ◄────┼──────┼─ Dev Server      │  │
│  └─────────────────────┘      └──────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Production Deployment

```
┌───────────────────────────────────────────────────────┐
│                       Internet                         │
│                                                        │
│  ┌──────────────┐         ┌─────────────────────┐    │
│  │ iOS Device   │         │  Cloud Server       │    │
│  │ (Anywhere)   │◄───────►│  (AWS/GCP/Azure)    │    │
│  │              │  HTTPS  │                     │    │
│  │  Mobile App  │◄────────┤  • FastAPI :443     │    │
│  │              │  WSS    │  • SSL Certificate  │    │
│  │              │◄────────┤  • PostgreSQL       │    │
│  └──────────────┘         │  • Redis (cache)    │    │
│                           └─────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

## Build Process

### Component Library Build

```
frontend-components/src/
    ↓ TypeScript Compiler (tsc)
Type Definitions (.d.ts)
    ↓ Vite Build
Bundled Library
    ↓ Output
frontend-components/dist/
    ├── index.js
    ├── terminal.js
    ├── biotech.js
    └── frontend-components.css
```

### Mobile App Build

```
mobile/src/
    ↓ Import Components
frontend-components/dist/
    ↓ TypeScript Compiler
JavaScript + Types
    ↓ Vite Build
Optimized Bundle
    ↓ Output
mobile/dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── manifest.webmanifest
```

### iOS Native Build

```
mobile/dist/
    ↓ Capacitor Sync
mobile/ios/App/App/public/
    ↓ CocoaPods Install
iOS Dependencies (Pods/)
    ↓ Xcode Build (⌘B)
Compiled Swift + Web Assets
    ↓ Code Signing
Signed .app Bundle
    ↓ Install (⌘R)
iPhone/iPad Device
```

## File Structure

```
terminal-ui-biotech-GG/
├── mobile/                        # Mobile app workspace
│   ├── src/                       # React source code
│   │   ├── components/            # Mobile-specific components
│   │   ├── pages/                 # Mobile pages/screens
│   │   ├── styles/                # Mobile-specific styles
│   │   └── App.tsx                # Main app component
│   ├── dist/                      # Built web assets (generated)
│   ├── ios/                       # Native iOS project (generated)
│   │   ├── App.xcworkspace        # Open this in Xcode
│   │   └── App/
│   │       ├── App/               # iOS app code
│   │       │   ├── AppDelegate.swift
│   │       │   ├── Info.plist
│   │       │   └── public/        # Web assets (synced from dist/)
│   │       └── Podfile            # CocoaPods dependencies
│   ├── capacitor.config.ts        # Capacitor configuration
│   ├── package.json               # Mobile dependencies + scripts
│   └── vite.config.ts             # Vite build config
│
├── frontend-components/           # Shared component library
│   ├── src/                       # Component source code
│   └── dist/                      # Built components (generated)
│
├── bt_platform/                   # Python backend
│   └── core/
│       └── app.py                 # FastAPI application
│
├── backend/                       # Node.js backend (optional)
│   └── src/
│       └── index.ts               # Express application
│
└── docs/                          # Documentation
    ├── IOS_NATIVE_APP_GUIDE.md    # Complete setup guide
    ├── IOS_QUICK_REFERENCE.md     # Quick commands
    ├── IOS_BACKEND_CONFIG.md      # Backend configuration
    └── IOS_ARCHITECTURE.md        # This file
```

## Technology Stack

### iOS Native Layer
- **Capacitor 7.4.3**: Web-to-native bridge
- **WKWebView**: Embedded web browser
- **Swift**: iOS native code
- **CocoaPods**: Dependency management

### Web Application Layer
- **React 19**: UI framework
- **TypeScript 5.9**: Type-safe JavaScript
- **Vite 7**: Build tool and dev server
- **React Router 6**: Client-side routing
- **TanStack Query 5**: Data fetching and caching
- **Zustand 4**: State management
- **Framer Motion 11**: Animations
- **Axios**: HTTP client

### Component Library
- **Radix UI**: Headless UI components
- **TanStack Virtual**: Virtualized lists
- **Plotly.js**: Scientific charts
- **Recharts**: Simpler charts
- **Lucide React**: Icons

### Backend Services
- **Python FastAPI**: REST API
- **Node.js Express**: WebSocket server (optional)
- **SQLAlchemy**: ORM
- **Socket.io**: WebSocket library
- **SQLite/PostgreSQL**: Database

## Security Architecture

### Development (HTTP)

```
iOS Device
    ↓ HTTP (cleartext allowed via ATS exception)
Local Network (192.168.x.x)
    ↓ WiFi
Mac/Development Server
    ↓ No encryption needed (local network)
Backend Services
```

### Production (HTTPS)

```
iOS Device
    ↓ HTTPS (TLS 1.2+)
    ↓ Certificate validation
Internet
    ↓ SSL/TLS encryption
Cloud Server
    ↓ JWT token validation
    ↓ API authentication
Backend Services
```

### Security Layers

1. **Transport Security**
   - Development: HTTP with ATS exception for local IPs
   - Production: HTTPS required (TLS 1.2+)

2. **Authentication**
   - JWT tokens stored in iOS Keychain
   - Token refresh mechanism
   - Secure token transmission

3. **Data Storage**
   - Sensitive data in iOS Keychain (via Capacitor Storage)
   - Non-sensitive data in localStorage
   - No plaintext secrets in code

4. **Code Obfuscation** (Optional)
   - JavaScript minification (Vite)
   - Dead code elimination
   - Asset optimization

## Performance Considerations

### App Size
- Web assets: ~500KB (compressed)
- Native wrapper: ~20MB (includes iOS framework)
- Total installed size: ~25MB

### Load Time
- First launch: ~2s (load web assets)
- Subsequent launches: ~0.5s (cached)
- API requests: <1s (local), 1-3s (internet)

### Memory Usage
- WKWebView: ~50-100MB
- React app: ~30-50MB
- Native wrapper: ~10-20MB
- Total: ~100-170MB

### Optimization Strategies
- Code splitting (Vite)
- Tree shaking (remove unused code)
- Asset optimization (image compression)
- Lazy loading (load pages on demand)
- Virtual scrolling (TanStack Virtual)
- Memoization (React.memo, useMemo)

## Deployment Checklist

### Development Build
- [ ] Build components: `npm run build:components`
- [ ] Build mobile: `npm run build:mobile`
- [ ] Sync to iOS: `npm run cap:sync`
- [ ] Open Xcode: `npm run cap:open:ios`
- [ ] Select device and run

### Production Build
- [ ] Set production API URLs in `.env`
- [ ] Enable HTTPS for backend
- [ ] Build for production: `VITE_MODE=production npm run build:mobile`
- [ ] Remove `server` config from `capacitor.config.ts`
- [ ] Sync to iOS: `npm run cap:sync`
- [ ] In Xcode: Product → Archive
- [ ] Upload to App Store Connect (optional)

## Resources

- **Setup Guide**: `docs/IOS_NATIVE_APP_GUIDE.md`
- **Quick Reference**: `docs/IOS_QUICK_REFERENCE.md`
- **Backend Config**: `docs/IOS_BACKEND_CONFIG.md`
- **Capacitor Docs**: https://capacitorjs.com/docs
- **React Docs**: https://react.dev
- **FastAPI Docs**: https://fastapi.tiangolo.com
