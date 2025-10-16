# Advanced Mobile Features Implementation Guide

This document describes the newly implemented advanced features for the Biotech Terminal mobile app.

## Features Implemented

### 1. Real Backend Integration - WebSocket Streaming

**Files Created:**
- `mobile/src/hooks/useWebSocket.ts` - WebSocket connection management hook
- `mobile/src/hooks/useStreamingAIChat.ts` - Streaming AI chat hook
- `backend/src/websocket/ai-chat-websocket.ts` - Backend AI chat WebSocket handler
- `backend/src/routes/notifications.ts` - Push notification routes
- `backend/src/routes/widgets.ts` - Widget data routes

**Features:**
- Real-time WebSocket connection to backend (port 3001)
- Streaming AI responses with chunk-by-chunk delivery
- Auto-reconnection with exponential backoff
- Subscribe/unsubscribe to data streams
- Heartbeat mechanism for connection health

**Usage:**
```typescript
import { useWebSocket } from '../hooks/useWebSocket';

const { isConnected, emit, on, subscribe } = useWebSocket({
  url: 'http://localhost:3001',
  autoConnect: true,
});

// Subscribe to market data
subscribe(['market:VRTX', 'biotech:updates']);

// Listen for updates
on('market_data', (data) => {
  console.log('Market update:', data);
});
```

### 2. Voice Input - Speech Recognition

**Files Created:**
- `mobile/src/hooks/useSpeechRecognition.ts` - Speech recognition hook using Web Speech API

**Features:**
- Web Speech API integration for browser support
- Real-time interim results display
- Continuous or single-utterance modes
- Error handling and fallback
- Works in Safari and Chrome

**Usage:**
```typescript
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const { isListening, transcript, start, stop } = useSpeechRecognition({
  onResult: (text) => {
    console.log('Final transcript:', text);
  },
});

// Start listening
<button onClick={start}>🎤</button>
```

**Integration:**
The AI Chat interface now has voice input enabled by default. Press the microphone button to start voice input, and it will automatically populate the message field.

### 3. Push Notifications - APNs Configuration

**Files Created:**
- `mobile/src/services/pushNotifications.ts` - Push notification service
- `backend/src/routes/notifications.ts` - Notification management API

**Features:**
- Capacitor Push Notifications plugin integration
- APNs registration and token management
- FDA alert subscriptions
- Price change alert subscriptions (configurable threshold)
- Foreground and background notification handling
- Deep linking support

**Setup:**
1. Initialize push notifications:
```typescript
import { pushNotificationService } from '../services/pushNotifications';

await pushNotificationService.initialize();
```

2. Subscribe to alerts:
```typescript
// FDA alerts
await pushNotificationService.subscribeToFDAAlerts(['VRTX', 'REGN', 'MRNA']);

// Price change alerts (5% threshold)
await pushNotificationService.subscribeToPriceAlerts(['VRTX', 'REGN'], 5);
```

3. Listen for notifications:
```typescript
pushNotificationService.addListener('fda_alert', (payload) => {
  console.log('FDA alert:', payload.title);
});
```

**iOS Configuration:**
Update `mobile/ios/App/App/Info.plist` to enable push notifications and background modes.

### 4. Offline Mode - Service Worker & IndexedDB

**Files Created:**
- `mobile/public/sw.js` - Service worker with caching strategies
- `mobile/src/services/offlineStorage.ts` - IndexedDB storage service
- `mobile/public/manifest.json` - PWA manifest

**Features:**
- Service worker with cache-first for static assets
- Network-first with fallback for API requests
- IndexedDB for structured data storage
- Background sync for offline actions
- Automatic cache cleanup and versioning

**Caching Strategy:**
- Static assets (HTML, CSS, JS): Cache-first
- API responses: Network-first with cache fallback
- Dynamic data: Stored in IndexedDB with timestamps

**Usage:**
```typescript
import { offlineStorage, STORES } from '../services/offlineStorage';

// Initialize storage
await offlineStorage.initialize();

// Cache data
await offlineStorage.cacheCompanies(companies);
await offlineStorage.cachePipeline(pipeline);

// Retrieve cached data
const cachedCompanies = await offlineStorage.getCachedCompanies();

// Check if stale (default 5 minutes)
const isStale = await offlineStorage.isStale(STORES.COMPANIES, 'all');
```

**Service Worker Registration:**
The service worker is automatically registered in `mobile/index.html`.

### 5. iOS Widgets - Portfolio & News

**Files Created:**
- `mobile/src/services/widgetDataProvider.ts` - Widget data provider service
- `backend/src/routes/widgets.ts` - Widget API endpoints

**Features:**
- Portfolio summary widget (total value, day change, top holdings)
- News headlines widget (FDA alerts, trials, market news)
- Catalyst calendar widget (upcoming FDA decisions)
- Automatic data refresh (15-minute intervals)
- App Groups support for native iOS widgets

**Usage:**
```typescript
import { widgetDataProvider } from '../services/widgetDataProvider';

// Start periodic refresh
widgetDataProvider.startPeriodicRefresh(15); // 15 minutes

// Manual data export
await widgetDataProvider.exportForWidgets();
```

**iOS Widget Development:**
Create a Widget Extension in Xcode and read data from the shared container:
```swift
if let defaults = UserDefaults(suiteName: "group.com.bioterminal.app") {
  if let widgetData = defaults.string(forKey: "biotech-widget-data") {
    // Parse JSON and display in widget
  }
}
```

### 6. Advanced Charts - Candlestick & Technical Indicators

**Files Created:**
- `mobile/src/components/CandlestickChart.tsx` - Candlestick chart with volume
- `mobile/src/components/TechnicalIndicators.tsx` - RSI, MACD, volume indicators

**Features:**
- Interactive candlestick charts using Plotly.js
- Technical indicators:
  - SMA (Simple Moving Average)
  - EMA (Exponential Moving Average)
  - Bollinger Bands
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
- Volume bars with color coding
- Responsive design for mobile
- Touch-optimized interactions

**Usage:**
```typescript
import { CandlestickChart } from '../components/CandlestickChart';
import { TechnicalIndicators } from '../components/TechnicalIndicators';

<CandlestickChart
  data={priceData}
  title="VRTX Stock Price"
  showVolume={true}
  technicalIndicators={{
    sma: [{ period: 20 }, { period: 50 }],
    ema: [{ period: 12 }],
    bollinger: { period: 20, stdDev: 2 },
  }}
/>

<TechnicalIndicators
  data={priceData}
  indicators={['rsi', 'macd', 'volume']}
  height={400}
/>
```

## API Endpoints

### Notifications API
```
POST /api/notifications/register
POST /api/notifications/subscribe/fda
POST /api/notifications/subscribe/price
POST /api/notifications/unsubscribe
GET  /api/notifications/subscriptions/:deviceId
POST /api/notifications/test
```

### Widgets API
```
GET /api/widgets/portfolio-summary
GET /api/widgets/news-headlines?limit=5
GET /api/widgets/catalyst-calendar?days=7
```

## Configuration

### Capacitor Configuration
Updated `mobile/capacitor.config.ts`:
```typescript
plugins: {
  PushNotifications: {
    presentationOptions: ['badge', 'sound', 'alert']
  },
  LocalNotifications: {
    smallIcon: 'ic_stat_icon_config_sample',
    iconColor: '#00ff88'
  }
}
```

### PWA Manifest
Created `mobile/public/manifest.json` with:
- App metadata and icons
- Display mode: standalone
- Orientation: portrait
- Shortcuts for quick access
- Screenshots for app store

## Testing

### Local Testing
1. Build the mobile app:
   ```bash
   npm run build:mobile
   ```

2. Start the backend:
   ```bash
   cd backend && npm run dev
   ```

3. Test in browser:
   ```bash
   cd mobile && npm run dev
   ```

4. Test voice input: Click microphone button in AI chat
5. Test offline mode: Turn off network and refresh
6. Test WebSocket: Monitor console for connection logs

### iOS Device Testing
1. Build and sync:
   ```bash
   npm run build:mobile
   cd mobile && npm run cap:sync:ios
   ```

2. Open in Xcode:
   ```bash
   npm run cap:open:ios
   ```

3. Configure signing and run on device

4. Test push notifications with test endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/notifications/test \
     -H "Content-Type: application/json" \
     -d '{"deviceId": "your-device-id", "message": "Test notification"}'
   ```

## Performance Considerations

### Service Worker
- Static assets cached immediately on install
- API responses cached after first fetch
- Cache size limited to prevent storage issues
- Old caches cleaned up automatically

### WebSocket
- Auto-reconnection with exponential backoff
- Heartbeat interval: 30 seconds
- Inactive connections cleaned up after 60 seconds
- Multiple stream subscriptions supported

### IndexedDB
- Data timestamped for freshness checks
- Automatic cleanup of stale data
- Separate object stores for different data types
- Optimized for mobile performance

## Security

### Push Notifications
- Token stored securely on backend
- APNs requires app signature verification
- No sensitive data in notification payloads
- Deep links validated before navigation

### Service Worker
- HTTPS required in production
- No caching of authentication tokens
- API routes excluded from caching
- Strict CORS policies

### WebSocket
- Authentication via JWT tokens (placeholder)
- Per-client subscription tracking
- Rate limiting (future enhancement)
- Input validation on all messages

## Future Enhancements

1. **Enhanced AI Chat**
   - Integration with OpenAI/Anthropic APIs
   - Context-aware responses
   - Chat history persistence
   - Multi-turn conversations

2. **Advanced Notifications**
   - Custom notification sounds
   - Notification grouping
   - Rich media attachments
   - Interactive notifications

3. **Offline Improvements**
   - Conflict resolution for offline edits
   - Differential sync
   - Pre-caching strategies
   - Background sync API

4. **Chart Enhancements**
   - Drawing tools (trendlines, annotations)
   - More technical indicators
   - Chart templates
   - Export to image

5. **iOS Widget Improvements**
   - Medium and large widget sizes
   - Interactive widgets (iOS 17+)
   - Widget configuration
   - Live Activities integration

## Troubleshooting

### Voice Input Not Working
- Check browser compatibility (Chrome, Safari, Edge)
- Ensure HTTPS (required for Web Speech API)
- Check microphone permissions
- Try refreshing the page

### Push Notifications Not Received
- Verify APNs configuration in Xcode
- Check device token registration
- Ensure app is not in background-only mode
- Check notification permissions

### Service Worker Issues
- Clear browser cache and reload
- Check browser console for errors
- Verify sw.js is accessible
- Ensure HTTPS in production

### WebSocket Connection Fails
- Verify backend is running on port 3001
- Check CORS configuration
- Ensure firewall allows WebSocket connections
- Monitor browser console for errors

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Plotly.js Charts](https://plotly.com/javascript/)
