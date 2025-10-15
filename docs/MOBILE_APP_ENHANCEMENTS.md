# Mobile App Enhancements - iOS-First Design

## Overview

This document describes the iOS-focused enhancements made to the Biotech Terminal mobile app, transforming it into a Bloomberg Terminal-style pharmaceutical intelligence tool with native iOS gestures, interactive visualizations, and AI assistance.

## New Features

### 1. Interactive Stock Charts

**Component**: `InteractiveStockChart`
**Location**: `mobile/src/components/InteractiveStockChart.tsx`

A professional financial chart component with Bloomberg Terminal aesthetics, featuring:

- **Multiple Time Ranges**: 1D, 1W, 1M, 3M, 6M, 1Y, YTD, ALL
- **Chart Types**: Line and Area charts with smooth animations
- **Interactive Tooltips**: Shows price and volume on hover/touch
- **Real-time Updates**: Price changes reflected instantly
- **Responsive Design**: Optimized for iPhone and iPad screens
- **Touch Optimized**: Pan and zoom gestures supported

**Usage Example**:
```tsx
import { InteractiveStockChart } from '../components/InteractiveStockChart';

<InteractiveStockChart
  data={stockData}
  symbol="VRTX"
  title="Vertex Pharmaceuticals"
  currentPrice={156.34}
  change={2.87}
  changePercent={1.87}
/>
```

**Features**:
- Gradient fills for positive/negative performance
- Clean, minimalist design following iOS HIG
- Smooth transitions between time ranges
- Auto-scaling Y-axis
- Date formatting optimized for mobile

### 2. AI Chat Interface

**Component**: `AIChatInterface`
**Location**: `mobile/src/components/AIChatInterface.tsx`

A conversational AI interface for pharmaceutical intelligence queries:

- **Message Bubbles**: iOS-style chat bubbles with timestamps
- **Streaming Support**: Token-by-token response display (ready for implementation)
- **Suggestion Chips**: Quick action buttons for common queries
- **Empty State**: Helpful onboarding for first-time users
- **Voice Input**: Placeholder button for speech-to-text
- **Auto-scroll**: Automatically scrolls to latest messages
- **Loading States**: Animated dots while AI is thinking

**Usage Example**:
```tsx
import { AIChatInterface } from '../components/AIChatInterface';

<AIChatInterface
  messages={messages}
  onSendMessage={handleSendMessage}
  isLoading={isLoading}
  enableVoiceInput={true}
/>
```

**Mock AI Responses**:
The chat includes intelligent mock responses for:
- Top biotech companies by market cap
- Phase III clinical trials
- FDA approval catalysts
- General biotech queries

### 3. Company Detail Page

**Page**: `MobileCompanyDetail`
**Location**: `mobile/src/pages/MobileCompanyDetail.tsx`
**Route**: `/company/:symbol`

Comprehensive company profile with:

- **Stock Chart**: Interactive price history
- **Key Metrics**: Market cap, P/E ratio, 52-week high/low
- **Drug Pipeline**: Visual progress bars for development programs
- **Recent News**: Latest headlines with sources
- **Real-time Updates**: Price refreshes every 5 seconds
- **Refresh Button**: Manual data refresh with animation

**Sample Company**: Vertex Pharmaceuticals (VRTX) with realistic data

### 4. Native iOS Gestures & Interactions

#### Pull-to-Refresh

**Hook**: `usePullToRefresh`
**Location**: `mobile/src/hooks/usePullToRefresh.ts`

Implements iOS-standard pull-to-refresh gesture:

```tsx
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const handleRefresh = async () => {
  // Refresh data
};

const { isRefreshing, pullDistance } = usePullToRefresh(handleRefresh);
```

**Features**:
- Detects scroll position at top
- Shows visual indicator during pull
- Haptic feedback on trigger
- Smooth animations
- Configurable threshold (80px default)

#### Haptic Feedback

**Hook**: `useHapticFeedback`
**Location**: `mobile/src/hooks/useHapticFeedback.ts`

Provides tactile feedback for user interactions:

```tsx
import { useHapticFeedback } from '../hooks/useHapticFeedback';

const { triggerHaptic, vibrateSelection } = useHapticFeedback();

// On button press
await triggerHaptic('light'); // or 'medium', 'heavy'

// On success/error
await triggerHaptic('success'); // or 'warning', 'error'
```

**Feedback Types**:
- **Light**: Button taps, navigation
- **Medium**: Pull-to-refresh trigger
- **Heavy**: Significant actions
- **Success**: Completion confirmation
- **Warning**: Caution alerts
- **Error**: Error notifications

#### Biometric Authentication

**Hook**: `useBiometricAuth`
**Location**: `mobile/src/hooks/useBiometricAuth.ts`

Face ID / Touch ID authentication for app security:

```tsx
import { useBiometricAuth } from '../hooks/useBiometricAuth';

const { isAvailable, biometryType, authenticate } = useBiometricAuth();

// Check availability
const available = await checkAvailability();

// Authenticate
const result = await authenticate('Unlock Biotech Terminal');
if (result.success) {
  // Grant access
}
```

**Features**:
- Auto-detects Face ID or Touch ID
- Fallback to device passcode
- Clear error messages
- Works on iOS 11.0+

### 5. Updated Navigation

**Updated Tab Bar**: Added AI Chat tab replacing Financial tab

New tabs:
1. Dashboard - Portfolio overview
2. Pipeline - Drug development
3. Trials - Clinical trials
4. AI Chat - Conversational assistant ⭐ NEW
5. Intelligence - Market intel

## Technical Stack

### Chart Library
- **Recharts**: Chosen for React compatibility and mobile optimization
- Why not Victory? Recharts has better documentation and smaller bundle size
- Alternative considered: Plotly.js (too heavy for mobile)

### Capacitor Plugins
- `@capacitor/haptics` - Tactile feedback
- `@capacitor/keyboard` - Keyboard management
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/push-notifications` - Push notifications (configured)
- `@capacitor/local-notifications` - Local alerts
- `@capacitor/share` - Native share sheet
- `@aparajita/capacitor-biometric-auth` - Face ID/Touch ID

### State Management
- React hooks (useState, useEffect, useCallback)
- React Router for navigation
- TanStack React Query for data fetching

## Design Principles

### iOS Human Interface Guidelines Compliance

1. **Typography**:
   - SF Pro Display for headings (system font)
   - SF Mono for code/numbers
   - 34pt for large titles
   - 20pt for section headers

2. **Colors**:
   - Dark theme with glassmorphism
   - System colors for status (green/red/yellow)
   - 60% opacity for secondary text
   - 10% opacity for backgrounds

3. **Spacing**:
   - 16px base padding
   - 12px between components
   - Safe area insets respected
   - Bottom tab bar: 49pt height

4. **Animations**:
   - 0.2s for quick transitions
   - 0.3s for standard animations
   - Ease-out timing function
   - Spring animations for elastic feel

5. **Touch Targets**:
   - Minimum 44x44pt (iPhone)
   - 60x60pt preferred for primary actions
   - Visual feedback on touch
   - Haptic feedback on interaction

### Accessibility

- WCAG AA contrast ratios (7:1+)
- VoiceOver support (aria-labels)
- Dynamic Type support
- Color-blind safe palette
- Reduce motion support (prefers-reduced-motion)

## Performance Optimizations

1. **Code Splitting**: Dynamic imports for heavy components
2. **Image Optimization**: WebP format, lazy loading
3. **Bundle Size**: 
   - Main bundle: 588 KB (gzipped: 178 KB)
   - Consider splitting Recharts into separate chunk
4. **Memory Management**: Cleanup intervals and listeners
5. **Rendering**: React.memo for expensive components

## Testing Strategy

### Manual Testing Checklist

#### Interactive Charts
- [ ] Time range buttons work correctly
- [ ] Chart type toggle (Line/Area) works
- [ ] Tooltips show correct data
- [ ] Chart scales appropriately
- [ ] Touch interactions feel responsive

#### AI Chat
- [ ] Messages send successfully
- [ ] Loading state displays
- [ ] Suggestion chips work
- [ ] Auto-scroll to bottom
- [ ] Voice button displays (even if not functional)

#### Gestures
- [ ] Pull-to-refresh triggers at correct distance
- [ ] Haptic feedback fires on interactions
- [ ] Biometric prompt appears correctly
- [ ] Smooth animations throughout

#### Navigation
- [ ] All tabs navigate correctly
- [ ] Back button works in detail pages
- [ ] Deep links work (if configured)

### Automated Testing

```bash
# Run mobile app tests
cd mobile
npm test

# Run specific test file
npm test -- InteractiveStockChart.test.tsx
```

## Deployment

### Building for iOS

```bash
# Build web assets
cd mobile
npm run build

# Sync to iOS
npm run cap:sync:ios

# Open in Xcode
npm run cap:open:ios
```

### Xcode Configuration

1. **Bundle Identifier**: `com.bioterminal.app`
2. **Team**: Select your Apple Developer team
3. **Deployment Target**: iOS 14.0+
4. **Capabilities**:
   - Face ID Usage Description
   - Push Notifications
   - Background Modes (if needed)

### App Store Submission (Optional)

If planning to distribute via App Store:
1. Add app icons (all required sizes)
2. Add launch screen
3. Configure metadata in App Store Connect
4. Submit for review

For personal use:
- Use free Apple Developer account
- Install directly on device via Xcode
- No App Store submission required

## Future Enhancements

### High Priority
1. **Real Backend Integration**:
   - Connect AI chat to actual backend API
   - Stream responses token-by-token
   - Add conversation context/memory

2. **Voice Input**:
   - Implement speech-to-text
   - Use Web Speech API or Capacitor plugin
   - Visual feedback during recording

3. **Push Notifications**:
   - FDA approval alerts
   - Phase trial results
   - Portfolio price changes

### Medium Priority
4. **Offline Mode**:
   - Cache company data locally
   - IndexedDB for message history
   - Queue actions when offline

5. **Widgets**:
   - Portfolio summary widget
   - Top news headlines widget
   - Live price ticker widget

6. **Advanced Charts**:
   - Candlestick charts
   - Technical indicators (RSI, MACD)
   - Compare multiple stocks
   - Drawing tools

### Low Priority
7. **Customization**:
   - Theme selection (dark/light)
   - Custom watchlists
   - Notification preferences

8. **Social Features**:
   - Share charts as images
   - Export to PDF
   - Email reports

## Known Issues & Limitations

1. **Chart Bundle Size**: Recharts adds ~200KB to bundle
   - **Solution**: Consider lazy loading charts
   
2. **Voice Input**: Placeholder only, not functional
   - **Solution**: Implement Web Speech API

3. **Biometric Auth**: Only tested on iOS Simulator
   - **Solution**: Test on physical device

4. **Mock Data**: All AI responses are hardcoded
   - **Solution**: Connect to real backend API

5. **Haptics**: Don't work in browser, only in native app
   - **Expected**: This is a Capacitor limitation

## Resources

### Documentation
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Recharts Documentation](https://recharts.org/)
- [React Router v6](https://reactrouter.com/)

### Design References
- Bloomberg Terminal UI
- Yahoo Finance iOS app
- Robinhood iOS app
- Apple Stocks app

### Code Examples
- `mobile/src/pages/MobileDashboard.tsx` - Pull-to-refresh example
- `mobile/src/components/AIChatInterface.tsx` - Chat UI patterns
- `mobile/src/components/InteractiveStockChart.tsx` - Financial charts

## Support

For issues or questions:
1. Check existing documentation in `/docs`
2. Review code comments in source files
3. Test on iOS Simulator first
4. For native features, test on physical iOS device

## Changelog

### Version 1.1.0 (Current)
- ✅ Added interactive stock charts with time ranges
- ✅ Created AI chat interface with mock responses
- ✅ Implemented company detail page
- ✅ Added pull-to-refresh gesture
- ✅ Integrated haptic feedback
- ✅ Added biometric authentication hook
- ✅ Updated tab navigation
- ✅ Enhanced dashboard with portfolio chart

### Version 1.0.0 (Baseline)
- Basic mobile app structure
- Capacitor iOS integration
- Bottom tab navigation
- Simple dashboard view
