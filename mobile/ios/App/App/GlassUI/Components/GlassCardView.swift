//
//  GlassCardView.swift
//  App
//
//  Reusable glass card component for displaying content with glassmorphism effect
//

import SwiftUI

/// A glass-styled card container with adaptive transparency and blur
///
/// Example usage:
/// ```swift
/// GlassCardView(urgency: .medium) {
///     VStack(alignment: .leading, spacing: 8) {
///         Text("DRUG PIPELINE")
///             .font(GlassStyle.Typography.headline)
///         Text("Phase II - 75% Complete")
///             .font(GlassStyle.Typography.body)
///     }
/// }
/// ```
public struct GlassCardView<Content: View>: View {
    
    // MARK: - Properties
    
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    
    private let content: Content
    private let urgency: GlassStyle.Urgency
    private let material: GlassStyle.GlassMaterial
    private let padding: CGFloat
    private let cornerRadius: CGFloat
    private let showBorder: Bool
    private let showShadow: Bool
    
    // MARK: - Initialization
    
    /// Creates a glass card with customizable styling
    /// - Parameters:
    ///   - urgency: Transparency level (default: .medium)
    ///   - material: Blur intensity (default: .regular)
    ///   - padding: Internal padding (default: 16)
    ///   - cornerRadius: Corner radius (default: 12)
    ///   - showBorder: Whether to show border (default: true)
    ///   - showShadow: Whether to show shadow (default: true)
    ///   - content: Content to display inside the card
    public init(
        urgency: GlassStyle.Urgency = .medium,
        material: GlassStyle.GlassMaterial = .regular,
        padding: CGFloat = GlassStyle.Spacing.md,
        cornerRadius: CGFloat = GlassStyle.CornerRadius.medium,
        showBorder: Bool = true,
        showShadow: Bool = true,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.urgency = urgency
        self.material = material
        self.padding = padding
        self.cornerRadius = cornerRadius
        self.showBorder = showBorder
        self.showShadow = showShadow
    }
    
    // MARK: - Body
    
    public var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity)
            .background(glassTint)
            .background(material.blurMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(borderOverlay)
            .conditionalShadow(showShadow)
    }
    
    // MARK: - Private Views
    
    private var glassTint: some View {
        GlassStyle.Colors.glassTint(for: colorScheme)
            .opacity(urgency.tintOpacity)
    }
    
    @ViewBuilder
    private var borderOverlay: some View {
        if showBorder {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .stroke(borderColor, lineWidth: 1)
        }
    }
    
    private var borderColor: Color {
        urgency == .critical
            ? GlassStyle.Colors.accent.opacity(0.4)
            : GlassStyle.Colors.glassBorder(for: colorScheme)
    }
}

// MARK: - View Modifiers

private extension View {
    @ViewBuilder
    func conditionalShadow(_ show: Bool) -> some View {
        if show {
            self.shadow(
                color: GlassStyle.Shadow.medium.color,
                radius: GlassStyle.Shadow.medium.radius,
                x: GlassStyle.Shadow.medium.x,
                y: GlassStyle.Shadow.medium.y
            )
        } else {
            self
        }
    }
}

// MARK: - Preview

#if DEBUG
struct GlassCardView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            // Background gradient to showcase glass effect
            LinearGradient(
                colors: [Color.blue, Color.purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 20) {
                // Critical urgency card
                GlassCardView(urgency: .critical) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(GlassStyle.Colors.warning)
                            Text("CRITICAL ALERT")
                                .font(GlassStyle.Typography.headline)
                        }
                        Text("PDUFA date: 3 days remaining")
                            .font(GlassStyle.Typography.body)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Medium urgency card
                GlassCardView(urgency: .medium) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("DRUG PIPELINE")
                            .font(GlassStyle.Typography.headline)
                        HStack {
                            Text("Phase II")
                                .font(GlassStyle.Typography.body)
                            Spacer()
                            Text("75%")
                                .font(GlassStyle.Typography.caption)
                                .foregroundColor(GlassStyle.Colors.success)
                        }
                    }
                }
                
                // Low urgency card
                GlassCardView(urgency: .low, material: .thin) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("MARKET UPDATE")
                            .font(GlassStyle.Typography.caption)
                            .foregroundColor(.secondary)
                        Text("XBI +2.3% today")
                            .font(GlassStyle.Typography.body)
                    }
                }
            }
            .padding()
        }
        .previewDevice("iPhone 14 Pro")
        .previewDisplayName("Glass Cards - Light Mode")
        
        ZStack {
            // Background gradient to showcase glass effect
            LinearGradient(
                colors: [Color.indigo, Color.black],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 20) {
                GlassCardView(urgency: .critical) {
                    VStack(alignment: .leading) {
                        Text("CRITICAL")
                            .font(GlassStyle.Typography.headline)
                        Text("Emergency notification")
                            .font(GlassStyle.Typography.body)
                    }
                }
                
                GlassCardView(urgency: .medium) {
                    Text("Standard glass card")
                }
            }
            .padding()
        }
        .preferredColorScheme(.dark)
        .previewDevice("iPhone 14 Pro")
        .previewDisplayName("Glass Cards - Dark Mode")
    }
}
#endif
