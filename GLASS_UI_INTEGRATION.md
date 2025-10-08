# Glass UI Integration Guide

## Quick Start

### Installation

The Glass UI components are part of the `@biotech-terminal/frontend-components` package. If you already have the package installed, you're ready to go!

```bash
npm install @biotech-terminal/frontend-components
```

### Basic Setup

1. **Import the enhanced glass styles:**

```tsx
import '@biotech-terminal/frontend-components/styles';
```

This automatically includes the new `glass-ui-enhanced.css` along with the existing theme.

2. **Wrap your app with the neural glass dashboard:**

```tsx
import React from 'react';

function App() {
  return (
    <div className="neural-glass-dashboard">
      {/* Your app content */}
    </div>
  );
}
```

## Component Integration

### Replacing Standard Panels with Glass Panels

**Before:**
```tsx
import { Panel } from '@biotech-terminal/frontend-components/terminal';

<Panel title="Market Data">
  <p>Content here</p>
</Panel>
```

**After:**
```tsx
import { GlassPanel } from '@biotech-terminal/frontend-components/terminal';

<GlassPanel urgency="high" texture="neural">
  <h3>Market Data</h3>
  <p>Content here</p>
</GlassPanel>
```

### Adding Clinical Trial Visualization

**Before (using basic timeline):**
```tsx
import { ClinicalTrialsTimeline } from '@biotech-terminal/frontend-components/biotech';

<ClinicalTrialsTimeline trials={trials} />
```

**After (using glass timeline with milestones):**
```tsx
import { ClinicalTrialGlassTimeline } from '@biotech-terminal/frontend-components/biotech';

<ClinicalTrialGlassTimeline
  phases={convertTrialsToPhases(trials)}
  enableFlowAnimation
  showMilestones
  onPhaseSelect={(phase) => console.log('Selected:', phase)}
/>
```

### Adding Alert System

**New Feature - No previous equivalent:**

```tsx
import { useGlassAlerts } from '@biotech-terminal/frontend-components/hooks';
import { CatalystGlassAlert } from '@biotech-terminal/frontend-components/biotech';

function MyComponent() {
  const { alerts, addAlert, dismissAlert } = useGlassAlerts(5);

  // Add an alert
  const handleNewEvent = (event) => {
    addAlert({
      title: 'FDA Decision',
      message: `PDUFA date for ${event.drug}`,
      priority: 'critical',
      type: 'fda',
      ticker: event.ticker,
    });
  };

  return (
    <div>
      {alerts.map((alert) => (
        <CatalystGlassAlert
          key={alert.id}
          alert={alert}
          autoDismiss={5000}
          onDismiss={dismissAlert}
        />
      ))}
    </div>
  );
}
```

## WebSocket Integration

### Real-Time Data Updates with Glass Ripple Effects

```tsx
import { useState, useEffect } from 'react';
import { GlassPanel } from '@biotech-terminal/frontend-components/terminal';
import { useGlassAlerts } from '@biotech-terminal/frontend-components/hooks';

function LiveMarketData() {
  const [data, setData] = useState(null);
  const [dataUpdated, setDataUpdated] = useState(false);
  const { addAlert } = useGlassAlerts();

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
      
      // Trigger ripple effect
      setDataUpdated(true);
      setTimeout(() => setDataUpdated(false), 600);
      
      // Add alert for significant changes
      if (newData.priceChange > 10) {
        addAlert({
          title: 'Significant Price Movement',
          message: `${newData.ticker} moved ${newData.priceChange}%`,
          priority: 'high',
          type: 'market',
          ticker: newData.ticker,
        });
      }
    };

    return () => ws.close();
  }, []);

  return (
    <GlassPanel 
      urgency="high" 
      texture="neural"
      showDataUpdate={dataUpdated}
    >
      <h3>Live Market Data</h3>
      {data && (
        <>
          <p>Price: ${data.price}</p>
          <p>Change: {data.priceChange}%</p>
        </>
      )}
    </GlassPanel>
  );
}
```

## Theming and Customization

### Customizing Transparency Levels

Override CSS variables in your app:

```css
:root {
  /* Make critical alerts even more visible */
  --glass-transparency-critical: 0.10;
  
  /* Adjust blur intensity for your brand */
  --glass-blur-intense: 28px;
  
  /* Custom sector colors */
  --aurora-oncology: #FF00FF;
}
```

### Creating Custom Surface Textures

```css
:root {
  --glass-texture-custom: linear-gradient(
    135deg,
    rgba(255, 0, 128, 0.15) 0%,
    rgba(128, 0, 255, 0.10) 100%
  );
}

.glass-surface-custom {
  background: var(--glass-texture-custom) !important;
}
```

Then use it:

```tsx
<GlassPanel urgency="high" texture="neural" className="glass-surface-custom">
  {/* Custom texture content */}
</GlassPanel>
```

## Performance Optimization

### Device-Specific Quality Settings

The Glass UI automatically adapts to device capabilities, but you can override:

```tsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Detect device performance
    const isHighPerformance = navigator.hardwareConcurrency > 4;
    
    if (!isHighPerformance) {
      // Reduce blur on lower-end devices
      document.documentElement.style.setProperty('--glass-blur-intense', '12px');
      document.documentElement.style.setProperty('--glass-blur-strong', '8px');
    }
  }, []);

  return <div className="neural-glass-dashboard">{/* App */}</div>;
}
```

### Disabling Animations for Performance

```css
/* Disable animations globally for testing/debugging */
.neural-glass-dashboard *,
.molecular-glass-grid *,
.clinical-trial-glass-timeline * {
  animation: none !important;
  transition: none !important;
}
```

## Advanced Use Cases

### Sector-Specific Aurora Backgrounds

```tsx
function BiotechDashboard({ sector, sentiment }) {
  return (
    <div className="neural-glass-dashboard">
      <div 
        className="aurora-sector-background aurora-sentiment"
        data-sector={sector}
        data-sentiment={sentiment}
      >
        <div className="dashboard-content">
          {/* Your content */}
        </div>
      </div>
    </div>
  );
}

// Usage:
<BiotechDashboard sector="oncology" sentiment="bull" />
```

### Molecular Structure Visualization

```tsx
import { MolecularGlassGrid } from '@biotech-terminal/frontend-components/biotech';

function CompoundAnalysis({ compound }) {
  return (
    <MolecularGlassGrid
      show3DStructure
      showConnections
      animationSpeed="slow" // or "normal" | "fast"
    >
      <h3>{compound.name}</h3>
      <div className="compound-properties">
        <div>MW: {compound.molecularWeight} g/mol</div>
        <div>LogP: {compound.logP}</div>
        <div>H-Bond Donors: {compound.hDonors}</div>
        <div>H-Bond Acceptors: {compound.hAcceptors}</div>
      </div>
    </MolecularGlassGrid>
  );
}
```

### Dynamic Alert Priority

```tsx
import { useGlassAlerts } from '@biotech-terminal/frontend-components/hooks';

function SmartAlertSystem() {
  const { addAlert } = useGlassAlerts();

  const handleEvent = (event) => {
    // Determine priority based on event data
    let priority = 'low';
    
    if (event.type === 'fda_approval') {
      priority = 'critical';
    } else if (event.impactScore > 0.7) {
      priority = 'high';
    } else if (event.impactScore > 0.4) {
      priority = 'medium';
    }

    addAlert({
      title: event.title,
      message: event.description,
      priority,
      type: event.category,
      ticker: event.ticker,
      action: {
        label: 'View Analysis',
        onClick: () => navigateToAnalysis(event.id),
      },
    });
  };

  return <div>{/* Your component */}</div>;
}
```

## Migration Checklist

- [ ] Import glass-ui-enhanced.css styles
- [ ] Wrap app with `neural-glass-dashboard` div
- [ ] Replace standard panels with `GlassPanel` components
- [ ] Add urgency levels to prioritize content
- [ ] Integrate `useGlassAlerts` hook for notifications
- [ ] Convert clinical trial timelines to glass version
- [ ] Add molecular grids for compound visualization
- [ ] Configure WebSocket integration for real-time ripples
- [ ] Test on mobile devices and adjust blur intensity if needed
- [ ] Verify accessibility (ARIA labels, keyboard navigation)
- [ ] Test with reduced motion preference enabled

## Common Issues and Solutions

### Issue: Blur effect not visible
**Solution:** Ensure your browser supports `backdrop-filter`. Add webkit prefix:
```css
-webkit-backdrop-filter: blur(24px);
backdrop-filter: blur(24px);
```

### Issue: Performance lag on mobile
**Solution:** Reduce blur intensity and disable complex animations:
```tsx
@media (max-width: 768px) {
  .glass-panel-adaptive {
    backdrop-filter: blur(8px) !important;
  }
  
  .molecular-glass-grid::before,
  .molecular-glass-grid::after {
    display: none;
  }
}
```

### Issue: Text hard to read on glass panels
**Solution:** Increase text contrast or use darker urgency levels:
```tsx
// Instead of urgency="low" (65% transparency)
<GlassPanel urgency="medium">  {/* 45% transparency */}
```

Or add a text shadow:
```css
.glass-panel-adaptive h3,
.glass-panel-adaptive p {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
```

### Issue: Alerts stacking off-screen
**Solution:** Limit maximum alerts with `useGlassAlerts`:
```tsx
const { alerts, addAlert } = useGlassAlerts(3); // Max 3 alerts
```

## Best Practices

1. **Use urgency appropriately:**
   - `critical`: Life-threatening safety data, FDA rejections, major market crashes
   - `high`: Important trial results, significant regulatory updates
   - `medium`: Standard updates, routine trial progress
   - `low`: Background information, supplementary data

2. **Match textures to content:**
   - `neural`: AI/ML predictions, neural network visualizations
   - `molecular`: Chemical structures, compound analysis
   - `crystalline`: Financial data, market crystallization points

3. **Enable ripple effects selectively:**
   - Only for panels with real-time data updates
   - Avoid on static content

4. **Test accessibility:**
   - Ensure WCAG AAA contrast ratios
   - Test with screen readers
   - Verify keyboard navigation
   - Respect reduced motion preferences

5. **Monitor performance:**
   - Use Chrome DevTools Performance tab
   - Check for layout thrashing
   - Optimize animation frame rates
   - Consider device capabilities

## Examples Repository

Find complete working examples in:
- `examples/GlassUIExample.tsx` - Comprehensive component showcase
- `terminal/src/pages/GlassUIDemoPage.tsx` - Interactive demo page

## Support and Documentation

- Full API Reference: See `GLASS_UI_README.md`
- Component Documentation: Check individual component files
- Issues: Report on GitHub repository
- Questions: Ask in project discussions

## Next Steps

1. Review the interactive demo: `terminal/src/pages/GlassUIDemoPage.tsx`
2. Read the full documentation: `GLASS_UI_README.md`
3. Experiment with different urgency levels and textures
4. Integrate with your existing WebSocket data streams
5. Customize colors and transparency for your brand

Happy building with Glass UI! 🎨✨
