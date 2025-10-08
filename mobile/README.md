# Biotech Terminal Mobile App

iOS-style mobile application for pharmaceutical intelligence with advanced glass dynamic UI inspired by iOS 26 design patterns.

## Features

### 🎨 iOS 26 Glass Dynamic UI
- **Advanced Glassmorphism**: Adaptive blur effects with crystalline surfaces
- **Aurora Backgrounds**: Dynamic gradient animations
- **Touch-Optimized**: Native-feeling gestures and interactions
- **Safe Area Support**: Full iPhone notch and home indicator compatibility

### 📱 Mobile Pages
1. **Dashboard**: Real-time market summary, catalysts, and quick actions
2. **Pipeline**: Drug development tracking with phase visualization
3. **Clinical Trials**: Active trials with enrollment progress
4. **Financial**: Key metrics, valuation models, and revenue forecasts
5. **Intelligence**: Market news, competitive analysis, and AI insights

### 🎯 Key Features
- Bottom tab bar navigation with iOS-style animations
- Swipe gestures and touch feedback
- Responsive glass panels optimized for mobile screens
- Real-time data updates with visual indicators
- Performance-optimized blur effects for mobile devices

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies (from root)
npm install

# Or install just mobile workspace
cd mobile && npm install
```

### Development

```bash
# Run mobile dev server (from root)
npm run dev:mobile

# Or run from mobile directory
cd mobile && npm run dev
```

The mobile app will be available at `http://localhost:3002`

### Building

```bash
# Build mobile app (from root)
npm run build:mobile

# Or build from mobile directory
cd mobile && npm run build
```

## Backend Integration

The mobile app uses the same backend structure as the terminal app:

- **Python FastAPI** (port 8000): Data providers, database models
- **Node.js Express** (port 3001): Real-time WebSocket, market data

No changes to the backend are required - the mobile app connects to the existing APIs.

## Design Philosophy

### iOS-Inspired Design
- **SF Pro Display** typography system
- **System colors** (Blue, Green, Orange, Red, Purple, Pink, Teal)
- **Native interactions** with spring animations
- **Accessibility** with reduced motion support

### Glass UI Implementation
- **Adaptive blur**: Reduces on lower-end devices
- **Layered transparency**: Multiple glass surfaces with depth
- **Crystalline textures**: Neural, molecular, and crystalline patterns
- **Aurora effects**: Dynamic gradient backgrounds

## Performance Optimization

### Mobile-Specific Optimizations
- Reduced blur intensity on devices with fewer cores
- Disabled complex animations on low-end devices
- Touch-optimized hit targets (minimum 44x44pt)
- Lazy loading for off-screen content

### Best Practices
```css
/* Reduced blur for mobile */
@media (max-width: 430px) {
  .mobile-glass-panel {
    backdrop-filter: blur(16px);
  }
}
```

## Viewport Configuration

The app is optimized for iPhone screens with proper safe area handling:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

## Testing on iOS

### Local Testing
1. Enable "Develop" menu in Safari (Settings → Advanced)
2. Connect iPhone via USB
3. Open mobile app in Safari on iPhone
4. Use Safari Developer Tools from Mac

### Production Testing
1. Build the app: `npm run build:mobile`
2. Deploy to a hosting service (Vercel, Netlify, etc.)
3. Open on iPhone Safari or add to Home Screen

## Component Library Integration

The mobile app uses the same frontend-components library as the terminal:

```typescript
import '@biotech-terminal/frontend-components/styles';
```

All biotech components are mobile-responsive and touch-optimized.

## File Structure

```
mobile/
├── src/
│   ├── components/      # Mobile-specific components
│   │   ├── MobileLayout.tsx
│   │   └── MobileTabBar.tsx
│   ├── pages/          # Mobile page views
│   │   ├── MobileDashboard.tsx
│   │   ├── MobilePipeline.tsx
│   │   ├── MobileTrials.tsx
│   │   ├── MobileFinancial.tsx
│   │   └── MobileIntelligence.tsx
│   ├── hooks/          # Custom React hooks
│   ├── styles/         # Mobile-specific styles
│   │   ├── ios-theme.css
│   │   └── mobile-glass.css
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Contributing

This mobile app follows the same contribution guidelines as the main terminal application. See the root README for details.

## License

MIT License - Same as the parent Biotech Terminal Platform
