# iOS Glass UI Architecture

## Overview

This document outlines the architecture and implementation strategy for native iOS Glass UI components in the Biotech Terminal mobile application. The Glass UI provides a sophisticated glassmorphism aesthetic matching iOS 18+ design patterns.

## Architecture Strategy

### Hybrid Approach

The Biotech Terminal uses a **hybrid architecture**:

1. **Web Layer (Primary)**: React/TypeScript Glass UI components running in Capacitor WebView
2. **Native Layer (Supplementary)**: SwiftUI Glass UI components for native iOS experiences

### When to Use Native vs Web Glass UI

**Use Native SwiftUI Glass UI when:**
- Creating splash screens or launch experiences
- Building native overlays (notifications, modals)
- Implementing native navigation shells
- Requiring native performance for complex blur effects
- Integrating with iOS system features (Face ID, widgets, etc.)

**Use Web Glass UI when:**
- Building data visualization dashboards
- Creating complex pharmaceutical intelligence UIs
- Implementing business logic with React
- Sharing components across platforms

## Component Architecture

### SwiftUI Glass Component Structure

```
mobile/ios/App/App/
├── GlassUI/
│   ├── Components/
│   │   ├── GlassCardView.swift           # Glass card container
│   │   ├── GlassButton.swift             # Glass styled button
│   │   ├── GlassContainerView.swift      # Glass panel container
│   │   ├── GlassNavigationBar.swift      # Glass navigation bar
│   │   └── GlassModalView.swift          # Glass modal/sheet
│   ├── Styles/
│   │   ├── GlassStyle.swift              # Core glass styling
│   │   ├── BlurStyle+Extensions.swift    # Blur effect utilities
│   │   └── ColorPalette.swift            # Brand colors
│   ├── Utilities/
│   │   ├── GlassModifiers.swift          # Reusable view modifiers
│   │   └── PerformanceMonitor.swift      # GPU performance tracking
│   └── Examples/
│       └── GlassUIShowcase.swift         # Demo/preview views
```

## Design System

### Material System

iOS Glass UI uses native `Material` types for optimal performance:

```swift
enum GlassMaterial {
    case ultraThin      // Lightest blur - background elements
    case thin           // Light blur - secondary containers
    case regular        // Standard blur - primary containers  
    case thick          // Heavy blur - prominent modals
    case chrome         // Metallic blur - navigation bars
}
```

### Color Palette

Matches the web Glass UI terminal aesthetic:

```swift
struct GlassColorPalette {
    // Primary Accent (matching web theme)
    static let accent = Color("AccentAmber")     // #FF9500
    
    // Glass Tints
    static let glassTint = Color.white.opacity(0.1)
    static let glassBorder = Color.white.opacity(0.2)
    static let glassHighlight = Color.white.opacity(0.4)
    
    // Status Colors
    static let success = Color.green
    static let warning = Color.orange  
    static let error = Color.red
    static let info = Color.blue
}
```

### Typography

Uses SF Pro (system default) for native feel:

```swift
struct GlassTypography {
    static let title = Font.system(.title, design: .rounded).weight(.semibold)
    static let headline = Font.system(.headline, design: .default).weight(.medium)
    static let body = Font.system(.body, design: .default)
    static let caption = Font.system(.caption, design: .monospaced)
}
```

## Performance Considerations

### GPU Optimization

1. **Limit Blur Layers**: Maximum 3-4 blur layers on screen simultaneously
2. **Use Material System**: Prefer native `Material` over custom blur effects
3. **Reduce Transparency**: Use 0.1-0.3 opacity for glass tints, not 0.5+
4. **Cache Blur Effects**: Reuse blur views when possible

### Performance Budget

- **Target FPS**: 60fps on iPhone 11 and newer
- **GPU Usage**: <30% during glass animations
- **Memory**: <50MB additional for glass effects
- **Energy**: Minimal impact on battery life

### Monitoring

```swift
// Track GPU performance in debug mode
#if DEBUG
PerformanceMonitor.shared.trackGlassEffects()
#endif
```

## Accessibility

### VoiceOver Support

All Glass UI components must provide:

```swift
.accessibilityLabel("Drug Pipeline Card")
.accessibilityHint("Shows phase progression for compound XYZ-123")
.accessibilityAddTraits(.isButton)  // If interactive
```

### Dynamic Type

Support iOS Dynamic Type for all text:

```swift
Text("PDUFA Date")
    .font(.headline)
    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
```

### Reduce Motion

Respect user's motion preferences:

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

var animation: Animation? {
    reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.7)
}
```

### Contrast

Ensure WCAG AA compliance (4.5:1 for text):

```swift
// High contrast mode support
@Environment(\.accessibilityDifferentiateWithoutColor) var differentiateWithoutColor
@Environment(\.colorScheme) var colorScheme

var borderColor: Color {
    differentiateWithoutColor ? .primary : .white.opacity(0.2)
}
```

## Integration with Capacitor

### Communication Pattern

Native Glass UI can communicate with web layer via Capacitor plugins:

```swift
// Native to Web
NotificationCenter.default.post(
    name: .glassUIEvent,
    object: nil,
    userInfo: ["event": "modalClosed"]
)

// Web to Native (via Capacitor plugin)
@objc func showNativeGlassModal(_ call: CAPPluginCall) {
    let title = call.getString("title") ?? ""
    // Show native glass modal
}
```

### Consistent Styling

Native Glass UI should visually match web Glass UI:

- Same blur intensity levels
- Matching color palette (amber accent)
- Consistent border radius (12pt)
- Same shadow depths
- Matching animation timing

## Dark Mode Support

All Glass UI components automatically adapt:

```swift
@Environment(\.colorScheme) var colorScheme

var glassTintColor: Color {
    colorScheme == .dark
        ? Color.white.opacity(0.1)
        : Color.black.opacity(0.05)
}
```

## Testing Strategy

### Unit Tests

Test individual glass components:

```swift
import XCTest
@testable import App

class GlassCardViewTests: XCTestCase {
    func testGlassCardRendering() {
        let card = GlassCardView {
            Text("Test Content")
        }
        // Verify rendering
    }
}
```

### Visual Regression Tests

Use XCTest UI snapshots:

```swift
func testGlassCardAppearance() {
    let card = GlassCardView { Text("Test") }
    XCTAssertNoThrow(card.snapshot(size: CGSize(width: 300, height: 200)))
}
```

### Performance Tests

Measure glass effect performance:

```swift
func testGlassBlurPerformance() {
    measure {
        // Render glass components
    }
}
```

## Distribution

### Development Build

For personal testing:
1. Open project in Xcode
2. Select your device
3. Run (⌘R)

### TestFlight Distribution

For beta testing:
1. Archive build (Product → Archive)
2. Upload to App Store Connect
3. Create TestFlight build
4. Invite internal testers

### Production Release

When ready for App Store:
1. Ensure all Glass UI follows HIG
2. Test accessibility on real devices
3. Verify performance on oldest supported device (iPhone 11)
4. Submit for App Review

## Human Interface Guidelines Compliance

### Glass UI Best Practices per HIG

1. **Clarity**: Use blur to distinguish layers, not obscure content
2. **Depth**: Create visual hierarchy with blur intensity
3. **Restraint**: Limit glass effects to key interface elements
4. **Consistency**: Match iOS system glass materials when possible

### HIG Checklist

- [ ] Glass effects enhance, not distract from content
- [ ] Blur intensity appropriate for layer hierarchy
- [ ] Touch targets minimum 44x44pt
- [ ] Color contrast meets accessibility standards
- [ ] Animations respect reduce motion setting
- [ ] Works in both light and dark modes
- [ ] Text remains legible over glass backgrounds

## Future Enhancements

### Phase 2 Features

1. **Adaptive Blur**: Adjust based on device capability
2. **Live Blur**: Real-time blur of content behind modals
3. **Frosted Glass**: Noise texture overlay for premium feel
4. **Glass Morphing**: Animate between glass states
5. **Parallax Depth**: Motion-based depth perception

### iOS 19+ Features

When iOS 19 releases, consider:
- New visual effect APIs
- Enhanced material types
- Improved performance APIs
- Advanced accessibility features

## Resources

### Apple Documentation

- [UIVisualEffectView](https://developer.apple.com/documentation/uikit/uivisualeffectview)
- [Materials in SwiftUI](https://developer.apple.com/documentation/swiftui/material)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Internal Documentation

- [Web Glass UI README](../GLASS_UI_README.md)
- [Mobile App Setup](../mobile/README.md)
- [iOS PWA Guide](./IOS_PWA_GUIDE.md)

## Version History

- **v1.0** (October 2025) - Initial iOS Glass UI architecture
- Future versions will track component additions and updates
