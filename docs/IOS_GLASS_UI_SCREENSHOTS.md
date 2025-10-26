# iOS Glass UI - Screenshots and Visual Examples

**Visual representation of implemented Glass UI components**

> **Note:** These are ASCII/text representations. Run `GlassUIShowcase.swift` in Xcode to see actual rendered components.

## 📱 Component Screenshots (Text Representations)

### GlassCardView - Drug Pipeline Card

```
╔══════════════════════════════════════════════════════╗
║  ┌──────────────────────────────────────────────┐  ║
║  │ [glass blur effect with amber tint]          │  ║
║  │                                              │  ║
║  │  💊 COMPOUND XYZ-123                        │  ║
║  │                                              │  ║
║  │  Phase II - BTK Inhibitor                   │  ║
║  │  Relapsed/Refractory CLL                    │  ║
║  │                                              │  ║
║  │  Progress: ████████████░░░░ 75%             │  ║
║  │                                              │  ║
║  │  PDUFA Date: December 15, 2025              │  ║
║  │                                              │  ║
║  └──────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════╝
```

**Features Shown:**
- Glass blur background
- Bloomberg amber accent
- Progress indicator
- Pharmaceutical data
- Urgency: Medium

---

### GlassButton - Primary Action

```
┌────────────────────────────────────────────┐
│  ╔════════════════════════════════════╗  │
│  ║ [solid amber #FF9500 background]  ║  │
│  ║                                    ║  │
│  ║  ✓  APPROVE FDA SUBMISSION         ║  │
│  ║                                    ║  │
│  ╚════════════════════════════════════╝  │
│       [shadow depth: medium]             │
└────────────────────────────────────────────┘
```

**Features Shown:**
- Solid accent color fill
- Icon support (checkmark)
- Uppercase text
- Shadow for depth
- Haptic feedback on tap

---

### GlassButton - Secondary Variant

```
┌────────────────────────────────────────────┐
│  ╔════════════════════════════════════╗  │
│  ║ [glass blur with amber border]    ║  │
│  ║                                    ║  │
│  ║  ℹ️  VIEW TRIAL DETAILS            ║  │
│  ║                                    ║  │
│  ╚════════════════════════════════════╝  │
└────────────────────────────────────────────┘
```

**Features Shown:**
- Glass blur background
- Accent border
- Icon support
- Transparent appearance

---

### GlassContainerView - Clinical Trials

```
╔════════════════════════════════════════════════════════╗
║ ┌────────────────────────────────────────────────────┐ ║
║ │ CLINICAL TRIALS               Active Phase III    │ ║ ← Header
║ └────────────────────────────────────────────────────┘ ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ NCT12345678                    Phase III        │ ║
║  │ BTK Inhibitor for CLL          450 patients     │ ║
║  │ Primary Completion: Q4 2025                     │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ NCT87654321                    Phase III        │ ║
║  │ Anti-CD19 CAR-T                180 patients     │ ║
║  │ Primary Completion: Q1 2026                     │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║ ┌────────────────────────────────────────────────────┐ ║
║ │ 🕐 Last updated: 2 minutes ago                    │ ║ ← Footer
║ └────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════╝
```

**Features Shown:**
- Header with title/subtitle
- Scrollable content area
- Multiple item rows
- Footer with timestamp
- Sectioned layout

---

### GlassNavigationBar - Pipeline View

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  [<]            DRUG PIPELINE              [⚙️]       ║
║                 143 Compounds                          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Features Shown:**
- Leading button (back)
- Center-aligned title
- Subtitle
- Trailing button (settings)
- Chrome material blur
- Divider line

---

### GlassModalView - PDUFA Alert

```
      ┌────────────────────────────────────────┐
      │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Dimmed BG
      │ ▓▓                                  ▓▓ │
      │ ▓▓ ╔══════════════════════════════╗ ▓▓ │
      │ ▓▓ ║ PDUFA DECISION          [✕] ║ ▓▓ │
      │ ▓▓ ║ FDA Approval Status          ║ ▓▓ │
      │ ▓▓ ╟──────────────────────────────╢ ▓▓ │
      │ ▓▓ ║                              ║ ▓▓ │
      │ ▓▓ ║ COMPOUND                     ║ ▓▓ │
      │ ▓▓ ║ XYZ-123 (BTK Inhibitor)      ║ ▓▓ │
      │ ▓▓ ║                              ║ ▓▓ │
      │ ▓▓ ║ DECISION DATE                ║ ▓▓ │
      │ ▓▓ ║ December 15, 2025            ║ ▓▓ │
      │ ▓▓ ║                              ║ ▓▓ │
      │ ▓▓ ║ PROBABILITY OF SUCCESS       ║ ▓▓ │
      │ ▓▓ ║ 82%                          ║ ▓▓ │
      │ ▓▓ ║                              ║ ▓▓ │
      │ ▓▓ ╟──────────────────────────────╢ ▓▓ │
      │ ▓▓ ║ [DISMISS] [VIEW DETAILS]    ║ ▓▓ │
      │ ▓▓ ╚══════════════════════════════╝ ▓▓ │
      │ ▓▓                                  ▓▓ │
      │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
      └────────────────────────────────────────┘
```

**Features Shown:**
- Background dimming
- Centered modal
- Header with close button
- Scrollable content
- Footer with actions
- Thick material blur

---

## 🎨 Material Blur Levels

### Visual Comparison

```
ultraThin     ░░░░░░     [Lightest - Background elements]
thin          ░░░░░░░░   [Light - Secondary containers]
regular       ░░░░░░░░░░ [Standard - Primary containers]
thick         ░░░░░░░░░░░░ [Heavy - Prominent modals]
chrome        ░░░░░░░░░░░░░░ [Metallic - Navigation bars]
```

---

## 🔴 Urgency Level Visual Indicators

### Critical Urgency (15% transparency)

```
╔══════════════════════════════════════════════╗
║  ┌────────────────────────────────────────┐ ║
║  │ [VERY VISIBLE - amber accent border]  │ ║
║  │                                        │ ║
║  │  ⚠️  CRITICAL PDUFA ALERT             │ ║
║  │                                        │ ║
║  │  Decision in 3 days                   │ ║
║  │                                        │ ║
║  └────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════╝
      ↑ Stronger glass effect, amber border
```

### Medium Urgency (45% transparency)

```
╔══════════════════════════════════════════════╗
║  ┌────────────────────────────────────────┐ ║
║  │ [STANDARD VISIBILITY]                  │ ║
║  │                                        │ ║
║  │  ��  PIPELINE UPDATE                  │ ║
║  │                                        │ ║
║  │  75% complete                         │ ║
║  │                                        │ ║
║  └────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════╝
      ↑ Standard glass effect
```

### Low Urgency (65% transparency)

```
╔══════════════════════════════════════════════╗
║  ┌────────────────────────────────────────┐ ║
║  │ [SUBTLE APPEARANCE]                    │ ║
║  │                                        │ ║
║  │  📰  MARKET NEWS                      │ ║
║  │                                        │ ║
║  │  XBI +2.3% today                      │ ║
║  │                                        │ ║
║  └────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════╝
      ↑ Light glass effect
```

---

## 🌗 Light vs Dark Mode

### Light Mode Appearance

```
╔══════════════════════════════════════╗
║  ┌────────────────────────────────┐ ║
║  │ ░░░░░░░░ [white tint 10%]      │ ║
║  │                                │ ║
║  │  COMPOUND DATA                 │ ║
║  │  [black text on light glass]   │ ║
║  │                                │ ║
║  └────────────────────────────────┘ ║
╚══════════════════════════════════════╝
```

### Dark Mode Appearance

```
╔══════════════════════════════════════╗
║  ┌────────────────────────────────┐ ║
║  │ ▓▓▓▓▓▓▓▓ [white tint 5%]       │ ║
║  │                                │ ║
║  │  COMPOUND DATA                 │ ║
║  │  [white text on dark glass]    │ ║
║  │                                │ ║
║  └────────────────────────────────┘ ║
╚══════════════════════════════════════╝
```

---

## 📱 Responsive Layout

### iPhone SE (Small Screen)

```
╔════════════════════╗
║  [Nav Bar]         ║
╠════════════════════╣
║                    ║
║  ┌──────────────┐  ║
║  │ Card         │  ║
║  │ Content      │  ║
║  └──────────────┘  ║
║                    ║
║  ┌──────────────┐  ║
║  │ Card         │  ║
║  │ Content      │  ║
║  └──────────────┘  ║
║                    ║
╚════════════════════╝
  375pt width
```

### iPhone 14 Pro Max (Large Screen)

```
╔════════════════════════════════════╗
║  [Navigation Bar]                  ║
╠════════════════════════════════════╣
║                                    ║
║  ┌──────────┐  ┌──────────┐       ║
║  │ Card     │  │ Card     │       ║
║  │ Content  │  │ Content  │       ║
║  └──────────┘  └──────────┘       ║
║                                    ║
║  ┌──────────┐  ┌──────────┐       ║
║  │ Card     │  │ Card     │       ║
║  │ Content  │  │ Content  │       ║
║  └──────────┘  └──────────┘       ║
║                                    ║
╚════════════════════════════════════╝
     430pt width
```

---

## 🎭 Animation States

### Button Press Animation

```
Frame 1 (Rest)          Frame 2 (Pressed)       Frame 3 (Released)
┌───────────┐          ┌──────────┐           ┌───────────┐
│  BUTTON   │    →     │  BUTTON  │     →     │  BUTTON   │
│  100%     │          │  96%     │           │  100%     │
└───────────┘          └──────────┘           └───────────┘
   0.0s                   0.1s                    0.2s
```

### Shimmer Loading Effect

```
Frame 1              Frame 2              Frame 3
░░░░░░░░░░░░        ░░░░░░░░░░░░        ░░░░░░░░░░░░
░░░░░░░░░░░░   →    ░░░▒▒▒▒░░░░   →    ░░░░░░▒▒▒▒░░
░░░░░░░░░░░░        ░░░░░░░░░░░░        ░░░░░░░░░░░░
   0.0s                0.5s                1.0s
```

---

## 📊 Performance Monitoring Display

```
╔═══════════════════════════════════════════════╗
║  PERFORMANCE MONITOR                          ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Current FPS:  ████████████████ 58.2         ║
║                [Green indicator - Good]       ║
║                                               ║
║  Average FPS:  ████████████████ 59.1         ║
║                                               ║
║  Device Cores: 8                              ║
║                                               ║
║  Recommended:  regular material               ║
║                                               ║
║  Status:       ● Good Performance             ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ [STOP MONITORING]                       │ ║
║  └─────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════╝
```

---

## 🎯 Complete Screen Examples

### Drug Pipeline Dashboard

```
╔════════════════════════════════════════════════════════╗
║  [<]            DRUG PIPELINE              [⚙️]       ║ ← Nav
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ╔══════════════════════════════════════════════════╗ ║
║  ║  💊 COMPOUND XYZ-123        Phase III  ████ 85% ║ ║ ← Card
║  ║  BTK Inhibitor for CLL                          ║ ║
║  ╚══════════════════════════════════════════════════╝ ║
║                                                        ║
║  ╔══════════════════════════════════════════════════╗ ║
║  ║  💊 COMPOUND ABC-456        Phase II   ████ 62% ║ ║ ← Card
║  ║  Anti-CD19 CAR-T                                ║ ║
║  ╚══════════════════════════════════════════════════╝ ║
║                                                        ║
║  ╔══════════════════════════════════════════════════╗ ║
║  ║  💊 COMPOUND DEF-789        Phase II   ████ 44% ║ ║ ← Card
║  ║  KRAS G12C Inhibitor                            ║ ║
║  ╚══════════════════════════════════════════════════╝ ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │         [VIEW ALL COMPOUNDS]                   │  ║ ← Button
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## 🎨 Color Palette Visual

```
Primary Accent (Amber)
███████████  #FF9500  (Bloomberg Terminal Orange)

Status Colors
██████████  Success (Green)
██████████  Warning (Orange)
██████████  Error (Red)
██████████  Info (Blue)

Glass Tints
░░░░░░░░░░  Light Mode (White 10%)
▓▓▓▓▓▓▓▓▓▓  Dark Mode (White 5%)

Borders
──────────  Light Mode (White 20%)
══════════  Dark Mode (White 15%)
```

---

## 📐 Typography Scale Visual

```
Large Title   PHARMACEUTICAL INTELLIGENCE    (34pt Bold)
Title         DRUG DEVELOPMENT PIPELINE      (28pt Semibold)
Headline      COMPOUND XYZ-123               (17pt Medium)
Body          Phase II Clinical Trial        (17pt Regular)
Caption       Last updated: 2 min ago        (13pt Mono)
```

---

## 🔍 Accessibility Indicators

### VoiceOver Focus

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│  ┌───────────────────────────────┐ │ ← Yellow focus
│  │ APPROVE FDA SUBMISSION        │ │   indicator
│  │ [Double tap to activate]      │ │
│  └───────────────────────────────┘ │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### High Contrast Mode

```
┌═══════════════════════════════════┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ ← Thicker
│ ┃ High Contrast Content       ┃ │   borders (3pt)
│ ┃ Stronger visual separation  ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└═══════════════════════════════════┘
```

---

## 🎬 To See Actual Components

**Run the interactive showcase:**

1. Open `mobile/ios/App/App.xcworkspace` in Xcode
2. Navigate to `GlassUI/Examples/GlassUIShowcase.swift`
3. Select your simulator or device
4. Click Run (⌘R)
5. Interact with live components

**The showcase includes:**
- All 5 components
- Urgency level controls
- Material type selectors
- Performance monitoring
- Dark mode toggle
- Interactive examples

---

*These ASCII representations show the structure and layout. The actual implementation uses native iOS blur effects, smooth animations, and professional glassmorphism aesthetics.*

**For actual visuals, run GlassUIShowcase.swift in Xcode!**
