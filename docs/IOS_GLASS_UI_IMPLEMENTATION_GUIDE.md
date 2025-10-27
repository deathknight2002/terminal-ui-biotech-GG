# iOS Glass UI - Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for implementing and using the native iOS Glass UI components in the Biotech Terminal mobile application.

## 📁 Component Structure

```
mobile/ios/App/App/GlassUI/
├── Components/
│   ├── GlassCardView.swift           # Glass card container
│   ├── GlassButton.swift             # Glass styled button
│   ├── GlassContainerView.swift      # Large glass container
│   ├── GlassNavigationBar.swift      # Custom navigation bar
│   └── GlassModalView.swift          # Full-screen glass modal
├── Styles/
│   └── GlassStyle.swift              # Core styling system
├── Utilities/
│   ├── GlassModifiers.swift          # Reusable view modifiers
│   └── PerformanceMonitor.swift      # Performance tracking
└── Examples/
    └── GlassUIShowcase.swift         # Complete demo
```

## 🚀 Quick Start

### 1. Import Glass UI

```swift
import SwiftUI
// Glass UI files are automatically available in the App target
```

### 2. Use a Glass Card

```swift
struct MyView: View {
    var body: some View {
        GlassCardView(urgency: .medium) {
            VStack(alignment: .leading, spacing: 8) {
                Text("DRUG PIPELINE")
                    .font(GlassStyle.Typography.headline)
                Text("Phase II - 75% Complete")
                    .font(GlassStyle.Typography.body)
            }
        }
    }
}
```

### 3. Use a Glass Button

```swift
GlassButton("APPROVE", icon: "checkmark.circle.fill", style: .primary) {
    // Handle approval
    print("Approved")
}
```

### 4. Create a Glass Modal

```swift
@State private var showModal = false

GlassButton("SHOW DETAILS") {
    showModal = true
}

// Present modal
if showModal {
    GlassModalView(
        title: "PDUFA ALERT",
        isPresented: $showModal
    ) {
        Text("Decision date: Dec 15, 2025")
    } footer: {
        GlassButton("DISMISS", style: .ghost) {
            showModal = false
        }
    }
}
```

## 📚 Component Reference

### GlassCardView

A glass-styled card container with adaptive transparency.

**Parameters:**
- `urgency`: `.critical`, `.high`, `.medium`, `.low` (default: `.medium`)
- `material`: `.ultraThin`, `.thin`, `.regular`, `.thick`, `.chrome` (default: `.regular`)
- `padding`: Internal padding (default: `16`)
- `cornerRadius`: Corner radius (default: `12`)
- `showBorder`: Display border (default: `true`)
- `showShadow`: Display shadow (default: `true`)

**Example:**
```swift
GlassCardView(urgency: .critical, material: .thick) {
    VStack {
        Text("Critical Alert")
        Text("PDUFA date in 3 days")
    }
}
```

### GlassButton

Glass-styled button with haptic feedback and animations.

**Styles:**
- `.primary` - Accent color with solid fill
- `.secondary` - Glass effect with border
- `.ghost` - Minimal styling, transparent
- `.danger` - Red/error color

**Parameters:**
- `title`: Button text (uppercase recommended)
- `icon`: Optional SF Symbol name
- `style`: Button style (default: `.primary`)
- `isLoading`: Show loading spinner (default: `false`)
- `isDisabled`: Disable interaction (default: `false`)
- `action`: Action closure

**Example:**
```swift
GlassButton("DELETE", icon: "trash", style: .danger) {
    // Handle deletion
}
```

### GlassContainerView

Large glass container with optional header and footer.

**Convenience Init:**
```swift
GlassContainerView(
    title: "CLINICAL TRIALS",
    subtitle: "Active Studies"
) {
    // Content
}
```

**Full Init:**
```swift
GlassContainerView(
    material: .regular
) {
    // Content
} header: {
    // Custom header
} footer: {
    // Custom footer
}
```

### GlassNavigationBar

Custom glass navigation bar for iOS.

**Example:**
```swift
GlassNavigationBar(
    title: "DRUG PIPELINE",
    subtitle: "143 Compounds"
) {
    Button(action: { /* back */ }) {
        Image(systemName: "chevron.left")
    }
} trailing: {
    Button(action: { /* menu */ }) {
        Image(systemName: "ellipsis.circle")
    }
}
```

### GlassModalView

Full-screen glass modal with slide-in animation.

**Example:**
```swift
@State private var showModal = false

GlassModalView(
    title: "PDUFA DECISION",
    subtitle: "FDA Approval Status",
    isPresented: $showModal
) {
    VStack {
        // Modal content
    }
} footer: {
    HStack {
        GlassButton("CANCEL", style: .ghost) {
            showModal = false
        }
        GlassButton("CONFIRM", style: .primary) {
            // Handle confirmation
            showModal = false
        }
    }
}
```

## 🎨 Styling System

### GlassStyle.Colors

```swift
GlassStyle.Colors.accent              // #FF9500 (Bloomberg amber)
GlassStyle.Colors.glassTintLight      // White 10%
GlassStyle.Colors.glassBorderLight    // White 20%
GlassStyle.Colors.success             // Green
GlassStyle.Colors.warning             // Orange
GlassStyle.Colors.error               // Red
GlassStyle.Colors.info                // Blue
```

### GlassStyle.Typography

```swift
GlassStyle.Typography.largeTitle      // Large title font
GlassStyle.Typography.title           // Title font
GlassStyle.Typography.headline        // Headline font
GlassStyle.Typography.body            // Body font
GlassStyle.Typography.caption         // Caption font (monospaced)
```

### GlassStyle.Spacing

```swift
GlassStyle.Spacing.xs     // 4pt
GlassStyle.Spacing.sm     // 8pt
GlassStyle.Spacing.md     // 16pt
GlassStyle.Spacing.lg     // 24pt
GlassStyle.Spacing.xl     // 32pt
GlassStyle.Spacing.xxl    // 48pt
```

## 🔧 View Modifiers

### Glass Effect Modifier

```swift
Text("Hello")
    .padding()
    .glassEffect(
        material: .regular,
        urgency: .medium,
        cornerRadius: 12,
        showBorder: true,
        showShadow: true
    )
```

### Animated Glass Border

```swift
RoundedRectangle(cornerRadius: 12)
    .fill(Color.clear)
    .frame(height: 100)
    .animatedGlassBorder(cornerRadius: 12, lineWidth: 2)
```

### Shimmer Effect

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
    .pulse(minOpacity: 0.4, maxOpacity: 1.0, duration: 1.0)
```

## 📊 Performance Optimization

### Enable Performance Monitoring

```swift
#if DEBUG
PerformanceMonitor.shared.startMonitoring()
#endif

// In your view
.onDisappear {
    #if DEBUG
    PerformanceMonitor.shared.stopMonitoring()
    #endif
}
```

### Check Device Capability

```swift
let quality = DeviceCapability.recommendedGlassQuality

switch quality {
case .low:
    // Use .thin material
case .medium:
    // Use .regular material
case .high:
    // Use .thick material
}
```

### Adaptive Material Selection

```swift
let material = PerformanceMonitor.shared.recommendedGlassMaterial()

GlassCardView(material: material) {
    // Content
}
```

## ♿ Accessibility

### VoiceOver Support

All Glass UI components have built-in VoiceOver support:

```swift
GlassButton("SUBMIT") {
    // Automatically includes .accessibilityLabel("SUBMIT")
    // and .accessibilityAddTraits(.isButton)
}
```

### Dynamic Type

Glass UI respects Dynamic Type settings:

```swift
Text("Hello")
    .font(GlassStyle.Typography.body)
    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
```

### Reduce Motion

Animations automatically disabled when Reduce Motion is enabled:

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

var animation: Animation? {
    reduceMotion ? nil : .spring()
}
```

## 🎯 Best Practices

### 1. Limit Glass Layers

**❌ Don't:**
```swift
GlassCardView {
    GlassCardView {
        GlassCardView {
            // Too many layers!
        }
    }
}
```

**✅ Do:**
```swift
GlassCardView {
    VStack {
        // Content with standard views
    }
}
```

### 2. Use Appropriate Urgency

```swift
// Critical alerts
GlassCardView(urgency: .critical) { /* PDUFA alert */ }

// Standard content
GlassCardView(urgency: .medium) { /* Drug info */ }

// Background info
GlassCardView(urgency: .low) { /* Market update */ }
```

### 3. Choose Right Material

```swift
// Navigation bars
GlassNavigationBar() // Uses .chrome material

// Primary content
GlassCardView(material: .regular) { /* Content */ }

// Background elements
GlassCardView(material: .thin) { /* Background */ }
```

### 4. Performance Testing

Always test on real devices:

```swift
#if DEBUG
// Enable monitoring during development
PerformanceMonitor.shared.startMonitoring()
#endif
```

## 🐛 Troubleshooting

### Issue: Low FPS with glass effects

**Solution:**
```swift
// Use lighter material
let material = PerformanceMonitor.shared.recommendedGlassMaterial()

// Reduce simultaneous glass layers
let maxLayers = DeviceCapability.recommendedGlassQuality.maxSimultaneousLayers
```

### Issue: Blur not visible

**Check:**
1. Background has contrast (not solid color)
2. Using appropriate material intensity
3. Tint opacity not too high

```swift
// Ensure visible background
ZStack {
    LinearGradient(/* gradient */)  // ✅ Good
    Color.white                       // ❌ Bad
}
```

### Issue: Animation jank

**Solution:**
```swift
// Respect reduce motion
@Environment(\.accessibilityReduceMotion) var reduceMotion

var animation: Animation? {
    reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.7)
}
```

## 📱 Testing Checklist

- [ ] Test on iPhone 11 (minimum supported device)
- [ ] Test on iPhone 14 Pro (target device)
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Test with VoiceOver enabled
- [ ] Test with Reduce Motion enabled
- [ ] Test with largest Dynamic Type size
- [ ] Verify FPS stays above 50 with glass effects
- [ ] Check GPU usage in Instruments
- [ ] Test on real device, not just simulator

## 🎓 Advanced Usage

### Custom Glass Effect

```swift
struct CustomGlassView: View {
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        Text("Custom")
            .padding()
            .background(
                ZStack {
                    Material.regularMaterial
                    GlassStyle.Colors.glassTint(for: colorScheme)
                        .opacity(0.2)
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
```

### Performance Monitoring Hook

```swift
struct MyView: View {
    var body: some View {
        GlassCardView {
            // Content
        }
        .monitorPerformance(componentName: "MyView")
    }
}
```

## 📖 Related Documentation

- [iOS Glass UI Architecture](./IOS_GLASS_UI_ARCHITECTURE.md)
- [iOS Native App Guide](./IOS_NATIVE_APP_GUIDE.md)
- [iOS PWA Guide](./IOS_PWA_GUIDE.md)
- [Web Glass UI README](../GLASS_UI_README.md)

## 🆘 Support

For issues or questions:
1. Check the GlassUIShowcase.swift example
2. Review architecture documentation
3. Test with PerformanceMonitor enabled
4. Open an issue on GitHub
