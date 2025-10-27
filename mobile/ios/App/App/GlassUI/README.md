# iOS Glass UI Components

**Native SwiftUI glassmorphism components for the Biotech Terminal iOS app**

## 🎨 Overview

A complete set of native iOS Glass UI components featuring:
- **Bloomberg-inspired aesthetics** with professional terminal design
- **Native iOS performance** using Material APIs
- **Adaptive blur effects** optimized for all devices
- **Full accessibility support** (VoiceOver, Dynamic Type, Reduce Motion)
- **Dark mode compatible** with automatic color adaptation

## ✨ Components

### Core Components (5)

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **GlassCardView** | Content cards | 4 urgency levels, 5 blur materials, adaptive transparency |
| **GlassButton** | Action buttons | 4 styles, haptic feedback, loading states |
| **GlassContainerView** | Large containers | Header/footer support, sectioned layout |
| **GlassNavigationBar** | Navigation | Custom glass nav bar, leading/trailing buttons |
| **GlassModalView** | Modals/sheets | Full-screen glass modal, slide animation |

### Styling System

- **GlassStyle.swift** - Core design system with colors, typography, spacing
- **GlassModifiers.swift** - Reusable view modifiers for glass effects
- **PerformanceMonitor.swift** - FPS tracking and device capability detection

### Examples

- **GlassUIShowcase.swift** - Interactive demo of all components

## 🚀 Quick Start

### Basic Usage

```swift
import SwiftUI

struct DrugPipelineView: View {
    var body: some View {
        GlassCardView(urgency: .medium) {
            VStack(alignment: .leading, spacing: 8) {
                Text("COMPOUND XYZ-123")
                    .font(GlassStyle.Typography.headline)
                Text("Phase II - BTK Inhibitor")
                    .font(GlassStyle.Typography.body)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
    }
}
```

### Button with Action

```swift
GlassButton("APPROVE FDA SUBMISSION", icon: "checkmark.circle.fill", style: .primary) {
    // Handle approval
    approveSubmission()
}
```

### Modal Dialog

```swift
@State private var showModal = false

GlassButton("SHOW DETAILS") {
    showModal = true
}

if showModal {
    GlassModalView(
        title: "PDUFA DECISION",
        subtitle: "FDA Approval Status",
        isPresented: $showModal
    ) {
        VStack(spacing: 16) {
            Text("Decision date: December 15, 2025")
            Text("Probability of Success: 82%")
                .foregroundColor(GlassStyle.Colors.success)
        }
    } footer: {
        HStack {
            GlassButton("DISMISS", style: .ghost) {
                showModal = false
            }
            GlassButton("VIEW FULL DETAILS", style: .primary) {
                // Navigate to details
            }
        }
    }
}
```

## 📐 Design System

### Materials (Blur Intensity)

```swift
.ultraThin      // Lightest blur - background elements
.thin           // Light blur - secondary containers
.regular        // Standard blur - primary containers (default)
.thick          // Heavy blur - prominent modals
.chrome         // Metallic blur - navigation bars
```

### Urgency Levels (Transparency)

```swift
.critical       // 15% transparency - maximum visibility
.high           // 25% transparency
.medium         // 45% transparency (default)
.low            // 65% transparency
```

### Color Palette

```swift
GlassStyle.Colors.accent              // #FF9500 (Bloomberg amber)
GlassStyle.Colors.success             // Green
GlassStyle.Colors.warning             // Orange
GlassStyle.Colors.error               // Red
GlassStyle.Colors.info                // Blue
GlassStyle.Colors.glassTint()         // Adaptive white tint
GlassStyle.Colors.glassBorder()       // Adaptive border color
```

### Typography

```swift
GlassStyle.Typography.largeTitle      // SF Pro Rounded Bold
GlassStyle.Typography.title           // SF Pro Rounded Semibold
GlassStyle.Typography.headline        // SF Pro Medium
GlassStyle.Typography.body            // SF Pro Regular
GlassStyle.Typography.caption         // SF Mono Regular
```

### Spacing

```swift
GlassStyle.Spacing.xs     // 4pt
GlassStyle.Spacing.sm     // 8pt
GlassStyle.Spacing.md     // 16pt
GlassStyle.Spacing.lg     // 24pt
GlassStyle.Spacing.xl     // 32pt
GlassStyle.Spacing.xxl    // 48pt
```

## 🎯 Component Examples

### Glass Card with Status

```swift
GlassCardView(urgency: .critical, material: .thick) {
    HStack {
        Image(systemName: "exclamationmark.triangle.fill")
            .foregroundColor(GlassStyle.Colors.warning)
        VStack(alignment: .leading) {
            Text("PDUFA DATE")
                .font(GlassStyle.Typography.caption)
            Text("3 Days Remaining")
                .font(GlassStyle.Typography.headline)
        }
    }
}
```

### Button Variations

```swift
// Primary action
GlassButton("APPROVE", style: .primary) { /* action */ }

// Secondary action
GlassButton("VIEW DETAILS", icon: "info.circle", style: .secondary) { /* action */ }

// Destructive action
GlassButton("DELETE", icon: "trash", style: .danger) { /* action */ }

// Loading state
GlassButton("LOADING", style: .primary, isLoading: true) { /* action */ }
```

### Container with Header/Footer

```swift
GlassContainerView(
    title: "CLINICAL TRIALS",
    subtitle: "Active Phase III Studies"
) {
    ForEach(trials) { trial in
        TrialRow(trial: trial)
    }
}
```

### Custom Navigation

```swift
VStack(spacing: 0) {
    GlassNavigationBar(
        title: "DRUG PIPELINE",
        subtitle: "143 Compounds"
    ) {
        Button(action: goBack) {
            Image(systemName: "chevron.left")
                .foregroundColor(GlassStyle.Colors.accent)
        }
    } trailing: {
        Button(action: showMenu) {
            Image(systemName: "ellipsis.circle")
                .foregroundColor(GlassStyle.Colors.accent)
        }
    }
    
    // Content below navigation
    ScrollView {
        // Pipeline content
    }
}
```

## 🔧 View Modifiers

### Apply Glass Effect

```swift
Text("Hello")
    .padding()
    .glassEffect(
        material: .regular,
        urgency: .medium,
        cornerRadius: 12
    )
```

### Animated Border

```swift
RoundedRectangle(cornerRadius: 12)
    .stroke(lineWidth: 2)
    .frame(height: 100)
    .animatedGlassBorder()
```

### Shimmer Loading

```swift
RoundedRectangle(cornerRadius: 8)
    .fill(Color.white.opacity(0.1))
    .frame(height: 60)
    .shimmer()
```

### Pulse Animation

```swift
Circle()
    .fill(GlassStyle.Colors.accent)
    .frame(width: 50, height: 50)
    .pulse(duration: 1.0)
```

## 📊 Performance

### Enable Monitoring (Debug Only)

```swift
#if DEBUG
import SwiftUI

struct MyApp: App {
    init() {
        PerformanceMonitor.shared.startMonitoring()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
#endif
```

### Device-Adaptive Materials

```swift
let recommendedMaterial = PerformanceMonitor.shared.recommendedGlassMaterial()

GlassCardView(material: recommendedMaterial) {
    // Content
}
```

### Check Device Capability

```swift
let quality = DeviceCapability.recommendedGlassQuality

switch quality {
case .low:
    // iPhone 11 and older - use .thin material
case .medium:
    // iPhone 12-14 - use .regular material
case .high:
    // iPhone 13 Pro+ - use .thick material
}
```

### Performance Budget

- **Target FPS:** 60fps on iPhone 11+
- **GPU Usage:** <30% during animations
- **Max Simultaneous Layers:** 
  - Low-end devices: 2 layers
  - Mid-range: 4 layers
  - High-end: 6 layers

## ♿ Accessibility

### VoiceOver

All components have built-in VoiceOver support:

```swift
GlassButton("SUBMIT") {
    // Automatically accessible
}

GlassCardView {
    // Content
}
.accessibilityLabel("Drug Pipeline Card")
.accessibilityHint("Shows phase progression")
```

### Dynamic Type

Typography automatically scales:

```swift
Text("Hello")
    .font(GlassStyle.Typography.body)
    // Scales from .xSmall to .xxxLarge
```

### Reduce Motion

Animations respect user preferences:

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

// Animations disabled when reduceMotion is true
```

### High Contrast

Border colors adapt automatically:

```swift
@Environment(\.colorScheme) var colorScheme
@Environment(\.accessibilityDifferentiateWithoutColor) var differentiateWithoutColor

// Stronger borders in high contrast mode
```

## 🎨 Customization

### Custom Colors

```swift
// Override accent color
extension GlassStyle.Colors {
    static let customAccent = Color.blue
}
```

### Custom Material

```swift
struct MyGlassView: View {
    var body: some View {
        Text("Custom")
            .padding()
            .background(Material.ultraThinMaterial)
            .background(Color.white.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
```

## 📱 Testing

### Preview in Xcode

```swift
#Preview {
    GlassCardView {
        Text("Preview")
    }
    .padding()
    .background(
        LinearGradient(
            colors: [.blue, .purple],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    )
}
```

### Test Checklist

- [ ] Test on iPhone 11 (minimum device)
- [ ] Test on iPhone 14 Pro (target device)
- [ ] Light mode appearance
- [ ] Dark mode appearance
- [ ] VoiceOver navigation
- [ ] Dynamic Type (largest size)
- [ ] Reduce Motion enabled
- [ ] FPS monitoring (>50 fps)
- [ ] GPU usage (<30%)

## 📖 Documentation

- **[Implementation Guide](../docs/IOS_GLASS_UI_IMPLEMENTATION_GUIDE.md)** - Detailed usage instructions
- **[Architecture](../docs/IOS_GLASS_UI_ARCHITECTURE.md)** - Design decisions and patterns
- **[iOS Native App Guide](../docs/IOS_NATIVE_APP_GUIDE.md)** - Setup and deployment

## 🎓 Demo App

Run the GlassUIShowcase to see all components:

1. Open `mobile/ios/App/App.xcodeproj` in Xcode
2. Navigate to `GlassUI/Examples/GlassUIShowcase.swift`
3. Run on simulator or device
4. Explore interactive examples
5. Test performance monitoring
6. Try different urgency/material combinations

## 🐛 Troubleshooting

### Low FPS

**Solution:** Use lighter materials
```swift
let material = PerformanceMonitor.shared.recommendedGlassMaterial()
```

### Blur Not Visible

**Check:** Background has sufficient contrast
```swift
// ✅ Good - gradient background
LinearGradient(colors: [.blue, .purple], ...)

// ❌ Bad - solid color
Color.white
```

### Animation Jank

**Solution:** Respect reduce motion
```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion
var animation: Animation? {
    reduceMotion ? nil : .spring()
}
```

## 🆘 Support

- **Issues:** Open a GitHub issue
- **Questions:** Check implementation guide
- **Examples:** Review GlassUIShowcase.swift

## 📄 License

MIT © Biotech Terminal Platform

---

**Built with SwiftUI for iOS 14.0+**

*"Bringing Bloomberg Terminal aesthetics to native iOS with SwiftUI glassmorphism."*
