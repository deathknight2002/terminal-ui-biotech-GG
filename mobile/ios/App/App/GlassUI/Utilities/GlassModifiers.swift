//
//  GlassModifiers.swift
//  App
//
//  Reusable view modifiers for glass effects
//

import SwiftUI

// MARK: - Glass Effect Modifier

/// Applies a complete glass effect with blur, tint, border, and shadow
public struct GlassEffectModifier: ViewModifier {
    
    @Environment(\.colorScheme) var colorScheme
    
    let material: GlassStyle.GlassMaterial
    let urgency: GlassStyle.Urgency
    let cornerRadius: CGFloat
    let showBorder: Bool
    let showShadow: Bool
    
    public func body(content: Content) -> some View {
        content
            .background(tintLayer)
            .background(material.blurMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(borderLayer)
            .conditionalModifier(showShadow) { view in
                view.shadow(
                    color: GlassStyle.Shadow.medium.color,
                    radius: GlassStyle.Shadow.medium.radius,
                    x: GlassStyle.Shadow.medium.x,
                    y: GlassStyle.Shadow.medium.y
                )
            }
    }
    
    private var tintLayer: some View {
        GlassStyle.Colors.glassTint(for: colorScheme)
            .opacity(urgency.tintOpacity)
    }
    
    @ViewBuilder
    private var borderLayer: some View {
        if showBorder {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .stroke(GlassStyle.Colors.glassBorder(for: colorScheme), lineWidth: 1)
        }
    }
}

// MARK: - Animated Glass Border Modifier

/// Animated border gradient for glass components
public struct AnimatedGlassBorderModifier: ViewModifier {
    
    @State private var animationRotation: Double = 0
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    
    let cornerRadius: CGFloat
    let lineWidth: CGFloat
    
    public func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(
                        AngularGradient(
                            colors: [
                                GlassStyle.Colors.accent.opacity(0.6),
                                GlassStyle.Colors.glassBorder(for: colorScheme),
                                GlassStyle.Colors.accent.opacity(0.6)
                            ],
                            center: .center,
                            angle: .degrees(animationRotation)
                        ),
                        lineWidth: lineWidth
                    )
            )
            .onAppear {
                if !reduceMotion {
                    withAnimation(.linear(duration: 3).repeatForever(autoreverses: false)) {
                        animationRotation = 360
                    }
                }
            }
    }
}

// MARK: - Shimmer Effect Modifier

/// Shimmer loading effect for glass components
public struct ShimmerModifier: ViewModifier {
    
    @State private var phase: CGFloat = 0
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    
    public func body(content: Content) -> some View {
        content
            .overlay(
                GeometryReader { geometry in
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0),
                            Color.white.opacity(0.3),
                            Color.white.opacity(0)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: geometry.size.width * 2)
                    .offset(x: -geometry.size.width + (phase * geometry.size.width * 2))
                }
                .clipped()
            )
            .onAppear {
                if !reduceMotion {
                    withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                        phase = 1
                    }
                }
            }
    }
}

// MARK: - Pulse Effect Modifier

/// Pulse animation for glass components
public struct PulseModifier: ViewModifier {
    
    @State private var isPulsing = false
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    
    let minOpacity: Double
    let maxOpacity: Double
    let duration: Double
    
    public func body(content: Content) -> some View {
        content
            .opacity(isPulsing ? maxOpacity : minOpacity)
            .onAppear {
                if !reduceMotion {
                    withAnimation(.easeInOut(duration: duration).repeatForever(autoreverses: true)) {
                        isPulsing = true
                    }
                }
            }
    }
}

// MARK: - Conditional Modifier Helper

extension View {
    /// Apply a modifier conditionally
    @ViewBuilder
    func conditionalModifier<T: View>(_ condition: Bool, transform: (Self) -> T) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

// MARK: - View Extensions

extension View {
    /// Apply glass effect with customizable parameters
    public func glassEffect(
        material: GlassStyle.GlassMaterial = .regular,
        urgency: GlassStyle.Urgency = .medium,
        cornerRadius: CGFloat = GlassStyle.CornerRadius.medium,
        showBorder: Bool = true,
        showShadow: Bool = true
    ) -> some View {
        self.modifier(
            GlassEffectModifier(
                material: material,
                urgency: urgency,
                cornerRadius: cornerRadius,
                showBorder: showBorder,
                showShadow: showShadow
            )
        )
    }
    
    /// Apply animated glass border
    public func animatedGlassBorder(
        cornerRadius: CGFloat = GlassStyle.CornerRadius.medium,
        lineWidth: CGFloat = 2
    ) -> some View {
        self.modifier(
            AnimatedGlassBorderModifier(
                cornerRadius: cornerRadius,
                lineWidth: lineWidth
            )
        )
    }
    
    /// Apply shimmer loading effect
    public func shimmer() -> some View {
        self.modifier(ShimmerModifier())
    }
    
    /// Apply pulse animation
    public func pulse(
        minOpacity: Double = 0.4,
        maxOpacity: Double = 1.0,
        duration: Double = 1.0
    ) -> some View {
        self.modifier(
            PulseModifier(
                minOpacity: minOpacity,
                maxOpacity: maxOpacity,
                duration: duration
            )
        )
    }
}

// MARK: - Preview

#if DEBUG
struct GlassModifiers_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            LinearGradient(
                colors: [Color.blue, Color.purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                // Standard glass effect
                Text("STANDARD GLASS")
                    .font(GlassStyle.Typography.headline)
                    .padding()
                    .glassEffect()
                
                // High urgency with thick blur
                Text("HIGH URGENCY")
                    .font(GlassStyle.Typography.headline)
                    .padding()
                    .glassEffect(material: .thick, urgency: .high)
                
                // Animated border
                Text("ANIMATED BORDER")
                    .font(GlassStyle.Typography.headline)
                    .padding()
                    .glassEffect()
                    .animatedGlassBorder()
                
                // Shimmer effect
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.1))
                    .frame(height: 60)
                    .shimmer()
                
                // Pulse effect
                Circle()
                    .fill(GlassStyle.Colors.accent)
                    .frame(width: 50, height: 50)
                    .pulse()
            }
            .padding()
        }
        .previewDevice("iPhone 14 Pro")
    }
}
#endif
