# iOS Glass UI Visual Guide

This guide provides visual representations of the Glass UI components and their structure.

## 🎨 Component Hierarchy

```
┌─────────────────────────────────────────────────┐
│           iOS Glass UI Components               │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
    ┌───▼───┐                   ┌────▼────┐
    │ Style │                   │Utilities│
    └───┬───┘                   └────┬────┘
        │                            │
        │         Components         │
        │              │             │
    ┌───▼──────────────▼─────────────▼───┐
    │                                     │
┌───▼────┐  ┌──────┐  ┌─────────┐  ┌────▼─────┐
│ Card   │  │Button│  │Container│  │Navigation│
└────────┘  └──────┘  └─────────┘  └──────────┘
                                          │
                                     ┌────▼────┐
                                     │  Modal  │
                                     └─────────┘
```

## 📱 GlassCardView Structure

```
╔═════════════════════════════════════════╗
║  ┌─────────────────────────────────┐   ║ ← Border (1pt)
║  │  [blur background]              │   ║
║  │  ┌───────────────────────────┐  │   ║
║  │  │                           │  │   ║ ← Padding (16pt)
║  │  │     Content Area          │  │   ║
║  │  │     • Text                │  │   ║
║  │  │     • Images              │  │   ║
║  │  │     • Custom Views        │  │   ║
║  │  │                           │  │   ║
║  │  └───────────────────────────┘  │   ║
║  │  [glass tint overlay]           │   ║
║  └─────────────────────────────────┘   ║
╚═════════════════════════════════════════╝
    ↑                                  ↑
Corner Radius (12pt)          Shadow (4pt radius)
```

## 🔘 GlassButton Variants

```
┌─────────────────────────────────────┐
│         PRIMARY BUTTON              │
│  ┌───────────────────────────────┐  │
│  │ [●] APPROVE FDA SUBMISSION    │  │ ← Solid accent fill
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        SECONDARY BUTTON             │
│  ╔═══════════════════════════════╗  │
│  ║ [i] View Details              ║  │ ← Glass blur + border
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          GHOST BUTTON               │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│    Dismiss                          │ ← Minimal border
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         DANGER BUTTON               │
│  ┌───────────────────────────────┐  │
│  │ [🗑] Delete Pipeline          │  │ ← Red fill
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 📦 GlassContainerView Layout

```
╔═══════════════════════════════════════════════╗
║ ┌───────────────────────────────────────────┐ ║
║ │ HEADER                          [subtitle]│ ║ ← Header section
║ └───────────────────────────────────────────┘ ║
║ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ║ ← Divider
║                                               ║
║   ┌─────────────────────────────────────┐   ║
║   │                                     │   ║
║   │      Main Content Area              │   ║ ← Content section
║   │      • Scrollable                   │   ║
║   │      • Custom layout                │   ║
║   │                                     │   ║
║   └─────────────────────────────────────┘   ║
║                                               ║
║ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ║ ← Divider
║ ┌───────────────────────────────────────────┐ ║
║ │ FOOTER            [Last updated: 2 min]   │ ║ ← Footer section
║ └───────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════╝
```

## 🧭 GlassNavigationBar Layout

```
╔═══════════════════════════════════════════════╗
║ [<]         DRUG PIPELINE          [⚙️]      ║
║            143 Compounds                      ║
╚═══════════════════════════════════════════════╝
 ↑             ↑           ↑                ↑
Back        Title      Subtitle         Settings
(44x44)   (center)    (center)          (44x44)
```

## 🪟 GlassModalView Structure

```
     ┌────────────────────────────────────┐
     │  ████████████████████████████████  │ ← Dimmed background
     │  █                              █  │
     │  █  ╔════════════════════════╗  █  │
     │  █  ║ TITLE           [✕]    ║  █  │ ← Header
     │  █  ║ Subtitle               ║  █  │
     │  █  ╟────────────────────────╢  █  │
     │  █  ║                        ║  █  │
     │  █  ║                        ║  █  │
     │  █  ║   Modal Content        ║  █  │ ← Content
     │  █  ║   (scrollable)         ║  █  │
     │  █  ║                        ║  █  │
     │  █  ║                        ║  █  │
     │  █  ╟────────────────────────╢  █  │
     │  █  ║ [Cancel]  [Confirm]    ║  █  │ ← Footer
     │  █  ╚════════════════════════╝  █  │
     │  █                              █  │
     │  ████████████████████████████████  │
     └────────────────────────────────────┘
```

## 🎨 Blur Material Levels

```
ultraThin     ░░░░░░  (Background elements)
thin          ░░░░░░░░  (Secondary containers)
regular       ░░░░░░░░░░  (Primary containers)
thick         ░░░░░░░░░░░░  (Modals)
chrome        ░░░░░░░░░░░░░░  (Navigation bars)
```

## 📊 Urgency Transparency Levels

```
Critical  ███████████████  85% opaque
High      ████████████░░░  75% opaque
Medium    ████████░░░░░░░  55% opaque
Low       ████░░░░░░░░░░░  35% opaque
```

## 🎯 Touch Target Sizes

```
Minimum Touch Target: 44 x 44 points

┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │      Button Content        │  │ ← Minimum 44pt height
│  │                            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
          44pt minimum
```

## 🌈 Color System

```
Primary Accent (Amber)
████████  #FF9500

Status Colors
Success    ████████  Green
Warning    ████████  Orange
Error      ████████  Red
Info       ████████  Blue

Glass Tints
Light Mode  ░░░░░░░░  White 10%
Dark Mode   ▓▓▓▓▓▓▓▓  White 5%

Borders
Light Mode  ─────────  White 20%
Dark Mode   ═════════  White 15%
```

## 📏 Spacing System

```
XS  ─    4pt
SM  ──   8pt
MD  ────  16pt
LG  ──────  24pt
XL  ────────  32pt
XXL ────────────  48pt
```

## 🔤 Typography Scale

```
Large Title  ━━━━━━━━━━  34pt Bold
Title        ━━━━━━━━  28pt Semibold
Headline     ━━━━━━  17pt Medium
Body         ━━━━  17pt Regular
Caption      ━━  13pt Monospaced
```

## 📱 Responsive Breakpoints

```
iPhone SE (3rd gen)      375 x 667 points
iPhone 14                390 x 844 points
iPhone 14 Pro            393 x 852 points
iPhone 14 Pro Max        430 x 932 points

Adapt blur intensity:
Small screens    → thin/regular
Large screens    → regular/thick
```

## 🎭 Dark Mode Adaptation

```
Light Mode                Dark Mode
┌──────────┐             ┌──────────┐
│ ░░░░░░░░ │             │ ▓▓▓▓▓▓▓▓ │
│ ░░TEXT░░ │      →      │ ▓▓TEXT▓▓ │
│ ░░░░░░░░ │             │ ▓▓▓▓▓▓▓▓ │
└──────────┘             └──────────┘
White tint               Darker tint
Border: 20%              Border: 15%
```

## 🔄 Animation States

```
Button Tap Animation
┌─────────┐    ┌────────┐    ┌─────────┐
│ Button  │ → │ Button │ →  │ Button  │
│ 100%    │    │ 96%   │     │ 100%    │
└─────────┘    └────────┘    └─────────┘
Rest           Pressed       Released
(0.0s)         (0.1s)        (0.2s)
```

## 📊 Performance Monitoring

```
FPS Monitoring Display
┌──────────────────────────────────┐
│ PERFORMANCE                      │
│                                  │
│ Current FPS:    ████████  58.2  │
│ Average FPS:    ████████  59.1  │
│ Device Cores:   ████████  8     │
│                                  │
│ Status: ● Good                   │
└──────────────────────────────────┘

Color coding:
Green  ● ≥55 FPS  Good
Orange ● 40-54    Warning
Red    ● <40      Poor
```

## 🏗️ Component Composition

```
Complex View Example:

╔═══════════════════════════════════╗ ← GlassNavigationBar
║ [<]      PIPELINE         [⚙️]    ║
╚═══════════════════════════════════╝
┌───────────────────────────────────┐
│ ╔═══════════════════════════════╗ │
│ ║ DRUG XYZ-123                  ║ │ ← GlassCardView
│ ║ Phase II - 75% Complete       ║ │
│ ╚═══════════════════════════════╝ │
│                                   │
│ ╔═══════════════════════════════╗ │
│ ║ COMPOUND ABC-456              ║ │ ← GlassCardView
│ ║ Phase III - 92% Complete      ║ │
│ ╚═══════════════════════════════╝ │
│                                   │
│ ┌───────────────────────────────┐ │
│ │    [View All Compounds]       │ │ ← GlassButton
│ └───────────────────────────────┘ │
└───────────────────────────────────┘
```

## 🎯 Accessibility Indicators

```
VoiceOver Focus
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│  ┌─────────────────────────┐ │
│  │ Button with VoiceOver   │ │ ← Yellow border
│  │ [Tap to activate]       │ │   (accessibility focus)
│  └─────────────────────────┘ │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘

High Contrast Mode
┌═══════════════════════════════┐
║ ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  ║ ← Stronger borders
║ ┃ High Contrast Content   ┃  ║   (3pt vs 1pt)
║ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
└═══════════════════════════════┘
```

## 📐 Safe Area Layout

```
iPhone with Notch
┌───────────────────────────────┐
│ ◀─── Safe Area Top (44pt) ───▶│
├───────────────────────────────┤
│                               │
│        Content Area           │
│                               │
│                               │
├───────────────────────────────┤
│ ◀── Safe Area Bottom (34pt)──▶│
└───────────────────────────────┘
```

## 🔍 Component States

```
Button States

[  NORMAL  ]  Default state
[~LOADING~]  Loading spinner
[×DISABLED×]  Grayed out
[✓PRESSED✓]  96% scale
```

## 🎨 Glass Effect Layers

```
Layer Stack (Bottom to Top)

4. Content Layer     ████████████  Text, images
3. Tint Overlay      ░░░░░░░░░░░░  Colored tint
2. Blur Layer        ▒▒▒▒▒▒▒▒▒▒▒▒  Material blur
1. Background        ▓▓▓▓▓▓▓▓▓▓▓▓  Gradient/image
```

## 📱 Device Adaptation

```
Device Quality Levels

iPhone 13 Pro+  → High    (thick material)
iPhone 12-14    → Medium  (regular material)
iPhone 11       → Low     (thin material)

Adaptation happens automatically via PerformanceMonitor
```

---

## 🎓 Usage Patterns

### Pattern 1: Card Grid
```
┌──────┐ ┌──────┐
│Card 1│ │Card 2│
└──────┘ └──────┘
┌──────┐ ┌──────┐
│Card 3│ │Card 4│
└──────┘ └──────┘
```

### Pattern 2: Vertical Stack
```
╔════════════╗
║   Card 1   ║
╚════════════╝
╔════════════╗
║   Card 2   ║
╚════════════╝
╔════════════╗
║   Card 3   ║
╚════════════╝
```

### Pattern 3: Modal Over Content
```
┌────────────────┐
│ ████████████   │ ← Dimmed
│ █ ╔══════╗ █   │
│ █ ║Modal ║ █   │ ← Focused
│ █ ╚══════╝ █   │
│ ████████████   │
└────────────────┘
```

---

**All diagrams use ASCII art for universal compatibility**

*Visual representations are approximations for documentation purposes*
