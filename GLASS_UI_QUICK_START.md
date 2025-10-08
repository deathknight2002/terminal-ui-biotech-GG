# 🚀 Quick Start Guide - Glass UI October 2025

## 📋 What's New

The **October 2025 Glass UI Concept** has been fully implemented for the Biotech Terminal Platform, featuring:

✨ **Adaptive Glass Panels** - Data-driven transparency (15%-85%)  
🧬 **Molecular Visualizations** - 3D structure backgrounds  
🔬 **Clinical Trial Timelines** - Liquid-flow phase progression  
🔔 **Smart Alerts** - Priority-based catalyst notifications  
🌌 **Aurora Backgrounds** - Sector-specific theming  
📱 **Responsive Design** - Mobile to workstation optimization  

## ⚡ 30-Second Setup

```bash
# 1. Import the styles (automatic with existing import)
import '@biotech-terminal/frontend-components/styles';

# 2. Wrap your app
<div className="neural-glass-dashboard">
  {/* Your app */}
</div>

# 3. Use components
import { GlassPanel } from '@biotech-terminal/frontend-components/terminal';

<GlassPanel urgency="high" texture="neural">
  <h3>Your Content</h3>
</GlassPanel>
```

## 🎯 Core Concepts

### 1. Urgency Levels (Visual Hierarchy)

| Level | Transparency | Use Case | Example |
|-------|--------------|----------|---------|
| `critical` | 15% | Life-critical alerts | FDA rejection, safety halt |
| `high` | 25% | Important updates | Trial results, approvals |
| `medium` | 45% | Standard info | Routine progress |
| `low` | 65% | Background data | Historical context |

### 2. Surface Textures (Domain Matching)

- **`neural`** - AI/ML predictions, neural networks
- **`molecular`** - Chemical structures, compounds
- **`crystalline`** - Financial data, market crystallization

### 3. Alert Types

- **`fda`** ⚕️ - Regulatory events
- **`trial`** 🔬 - Clinical updates
- **`market`** 📈 - Market intelligence
- **`regulatory`** ⚖️ - Policy changes
- **`clinical`** 🏥 - Clinical data

## 🔥 Most Common Use Cases

### Use Case 1: Critical Alert

```tsx
import { GlassPanel } from '@biotech-terminal/frontend-components/terminal';

<GlassPanel urgency="critical" texture="neural">
  <h3>⚠️ FDA DECISION PENDING</h3>
  <p>PDUFA date: 2025-12-15</p>
  <p>Asset: ARYAZ-123</p>
</GlassPanel>
```

### Use Case 2: Live Market Data with Updates

```tsx
import { useState, useEffect } from 'react';
import { GlassPanel } from '@biotech-terminal/frontend-components/terminal';

function LiveData() {
  const [data, setData] = useState(null);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (e) => {
      setData(JSON.parse(e.data));
      setUpdated(true);
      setTimeout(() => setUpdated(false), 600);
    };
  }, []);

  return (
    <GlassPanel urgency="high" showDataUpdate={updated}>
      <h3>Market Data</h3>
      <p>Price: ${data?.price}</p>
    </GlassPanel>
  );
}
```

### Use Case 3: Catalyst Alerts

```tsx
import { useGlassAlerts } from '@biotech-terminal/frontend-components/hooks';
import { CatalystGlassAlert } from '@biotech-terminal/frontend-components/biotech';

function AlertSystem() {
  const { alerts, addAlert, dismissAlert } = useGlassAlerts(5);

  const handleEvent = () => {
    addAlert({
      title: 'FDA Approval',
      message: 'PDUFA date approaching',
      priority: 'critical',
      type: 'fda',
      ticker: 'XYZ',
    });
  };

  return (
    <>
      <button onClick={handleEvent}>Trigger Alert</button>
      {alerts.map(alert => (
        <CatalystGlassAlert
          key={alert.id}
          alert={alert}
          autoDismiss={5000}
          onDismiss={dismissAlert}
        />
      ))}
    </>
  );
}
```

### Use Case 4: Clinical Trial Progress

```tsx
import { ClinicalTrialGlassTimeline } from '@biotech-terminal/frontend-components/biotech';

const phases = [
  {
    phase: 'phase-2',
    name: 'Phase II',
    completion: 75,
    status: 'active',
    milestone: {
      name: 'Safety Review',
      probability: 0.89,
      date: '2025-Q2'
    }
  },
  // ... more phases
];

<ClinicalTrialGlassTimeline
  phases={phases}
  enableFlowAnimation
  showMilestones
  onPhaseSelect={(phase) => console.log(phase)}
/>
```

### Use Case 5: Molecular Compound Analysis

```tsx
import { MolecularGlassGrid } from '@biotech-terminal/frontend-components/biotech';

<MolecularGlassGrid show3DStructure showConnections>
  <h3>BTK Inhibitor</h3>
  <div>MW: 450.5 g/mol</div>
  <div>LogP: 3.2</div>
</MolecularGlassGrid>
```

## 🎨 Customization Quick Tips

### Change Transparency

```css
/* In your CSS */
:root {
  --glass-transparency-critical: 0.10;  /* Default: 0.15 */
}
```

### Change Blur Intensity

```css
:root {
  --glass-blur-intense: 28px;  /* Default: 24px */
}
```

### Custom Sector Color

```css
:root {
  --aurora-oncology: #FF00FF;  /* Your brand color */
}
```

## 📱 Device-Specific Behavior

- **Mobile** - Simplified patterns, 4-8px blur
- **Tablet** - Balanced quality, 6-16px blur
- **Desktop** - Full features, 8-24px blur
- **Workstation** - Maximum quality, 12-32px blur

*All automatic - no configuration needed!*

## ♿ Accessibility Built-In

- ✅ WCAG AAA contrast ratios
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Reduced motion respect (`prefers-reduced-motion`)
- ✅ Screen reader compatible

## 🔍 See It In Action

Run the interactive demo:

```bash
# Navigate to the terminal app
cd terminal

# Start dev server
npm run dev

# Visit: http://localhost:3000/glass-demo
```

Or view the example:

```bash
# Navigate to examples
cd examples

# Run the showcase
npm run dev
```

## 📚 Full Documentation

- **API Reference**: `GLASS_UI_README.md` (11,600 chars)
- **Integration Guide**: `GLASS_UI_INTEGRATION.md` (11,000 chars)
- **Visual Showcase**: `GLASS_UI_VISUAL_SHOWCASE.md` (14,300 chars)

## 🎯 Decision Tree

**Need to show urgent data?**
→ Use `GlassPanel` with `urgency="critical"`

**Have real-time WebSocket updates?**
→ Use `GlassPanel` with `showDataUpdate={true}`

**Tracking clinical trial progress?**
→ Use `ClinicalTrialGlassTimeline`

**Need to notify users?**
→ Use `CatalystGlassAlert` + `useGlassAlerts` hook

**Showing chemical compounds?**
→ Use `MolecularGlassGrid`

**Just want better-looking panels?**
→ Use `GlassPanel` with default settings

## ⚠️ Common Gotchas

### Issue: Blur not visible
**Fix**: Check browser support for `backdrop-filter`
```css
-webkit-backdrop-filter: blur(24px);
backdrop-filter: blur(24px);
```

### Issue: Text hard to read
**Fix**: Use lower urgency (higher transparency) or add text shadow
```css
text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
```

### Issue: Too many alerts
**Fix**: Limit queue size
```tsx
const { alerts } = useGlassAlerts(3); // Max 3 alerts
```

### Issue: Performance lag on mobile
**Fix**: Already handled! Auto-reduces blur and animations.

## 🚀 Pro Tips

1. **Start with `medium` urgency** - Adjust up/down as needed
2. **Match texture to content** - `molecular` for chemistry, `neural` for AI
3. **Use `showDataUpdate` sparingly** - Only for real-time panels
4. **Auto-dismiss low priority** - `autoDismiss={8000}` for `low` alerts
5. **Test on mobile early** - Ensure readability at reduced quality

## 🎉 You're Ready!

Start with one component, see how it looks, then expand:

```tsx
// Step 1: Wrap app
<div className="neural-glass-dashboard">

// Step 2: Add one panel
  <GlassPanel urgency="medium" texture="neural">
    <h3>My First Glass Panel</h3>
    <p>It's beautiful! ✨</p>
  </GlassPanel>

</div>
```

## 💬 Need Help?

- Check `GLASS_UI_INTEGRATION.md` for detailed integration steps
- See `GLASS_UI_README.md` for complete API reference
- View `GLASS_UI_VISUAL_SHOWCASE.md` for design concepts
- Run `terminal/src/pages/GlassUIDemoPage.tsx` for interactive examples

## 📊 Quick Stats

- **5 React Components**
- **1 Custom Hook**
- **1,000+ Lines of CSS**
- **4 Urgency Levels**
- **3 Surface Textures**
- **5 Alert Types**
- **4 Device Tiers**
- **60 FPS Performance**

Happy building with Glass UI! 🧬✨

---

*October 2025 Glass UI Concept - Biotech Terminal Platform*
