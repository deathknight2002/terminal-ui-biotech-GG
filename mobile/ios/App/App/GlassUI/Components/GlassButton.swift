//
//  GlassButton.swift
//  App
//
//  Glass-styled button component with haptic feedback and animations
//

import SwiftUI

/// A glass-styled button with adaptive styling and animations
///
/// Example usage:
/// ```swift
/// GlassButton("APPROVE") {
///     print("Button tapped")
/// }
/// 
/// GlassButton("Cancel", style: .secondary, icon: "xmark") {
///     // Handle cancel
/// }
/// ```
public struct GlassButton: View {
    
    // MARK: - Button Style
    
    public enum ButtonStyle {
        case primary    // Accent color with solid fill
        case secondary  // Glass effect with border
        case ghost      // Minimal styling, transparent
        case danger     // Red/error color
        
        var backgroundColor: Color {
            switch self {
            case .primary: return GlassStyle.Colors.accent
            case .secondary: return Color.clear
            case .ghost: return Color.clear
            case .danger: return GlassStyle.Colors.error
            }
        }
        
        var foregroundColor: Color {
            switch self {
            case .primary, .danger: return .white
            case .secondary, .ghost: return GlassStyle.Colors.accent
            }
        }
    }
    
    // MARK: - Properties
    
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @State private var isPressed = false
    
    private let title: String
    private let icon: String?
    private let style: ButtonStyle
    private let isLoading: Bool
    private let isDisabled: Bool
    private let action: () -> Void
    
    // MARK: - Initialization
    
    /// Creates a glass button
    /// - Parameters:
    ///   - title: Button text (uppercase recommended)
    ///   - icon: Optional SF Symbol name
    ///   - style: Visual style (default: .primary)
    ///   - isLoading: Show loading spinner (default: false)
    ///   - isDisabled: Disable interaction (default: false)
    ///   - action: Action to perform on tap
    public init(
        _ title: String,
        icon: String? = nil,
        style: ButtonStyle = .primary,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.style = style
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }
    
    // MARK: - Body
    
    public var body: some View {
        Button(action: handleTap) {
            HStack(spacing: GlassStyle.Spacing.sm) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: style.foregroundColor))
                        .scaleEffect(0.8)
                } else if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                }
                
                Text(title.uppercased())
                    .font(GlassStyle.Typography.headline)
                    .fontWeight(.semibold)
            }
            .foregroundColor(style.foregroundColor)
            .padding(.horizontal, GlassStyle.Spacing.lg)
            .padding(.vertical, GlassStyle.Spacing.md)
            .frame(maxWidth: .infinity)
            .background(buttonBackground)
            .clipShape(RoundedRectangle(cornerRadius: GlassStyle.CornerRadius.medium, style: .continuous))
            .overlay(borderOverlay)
            .scaleEffect(isPressed ? 0.96 : 1.0)
            .opacity(isDisabled ? 0.5 : 1.0)
            .animation(buttonAnimation, value: isPressed)
        }
        .disabled(isDisabled || isLoading)
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    withAnimation(.easeInOut(duration: 0.1)) {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    withAnimation(.easeInOut(duration: 0.1)) {
                        isPressed = false
                    }
                }
        )
        .accessibilityLabel(title)
        .accessibilityAddTraits(.isButton)
        .accessibilityHint(isLoading ? "Loading" : "")
    }
    
    // MARK: - Private Views
    
    @ViewBuilder
    private var buttonBackground: some View {
        Group {
            if style == .primary || style == .danger {
                style.backgroundColor
            } else if style == .secondary {
                GlassStyle.GlassMaterial.thin.blurMaterial
            } else {
                Color.clear
            }
        }
    }
    
    @ViewBuilder
    private var borderOverlay: some View {
        if style == .secondary {
            RoundedRectangle(cornerRadius: GlassStyle.CornerRadius.medium, style: .continuous)
                .stroke(GlassStyle.Colors.accent, lineWidth: 1.5)
        } else if style == .ghost {
            RoundedRectangle(cornerRadius: GlassStyle.CornerRadius.medium, style: .continuous)
                .stroke(GlassStyle.Colors.glassBorder(for: colorScheme), lineWidth: 1)
        }
    }
    
    private var buttonAnimation: Animation? {
        reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.6)
    }
    
    // MARK: - Actions
    
    private func handleTap() {
        // Haptic feedback
        let impact = UIImpactFeedbackGenerator(style: .medium)
        impact.impactOccurred()
        
        action()
    }
}

// MARK: - Preview

#if DEBUG
struct GlassButton_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            LinearGradient(
                colors: [Color.blue, Color.purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 20) {
                GlassButton("APPROVE FDA SUBMISSION", icon: "checkmark.circle.fill", style: .primary) {
                    print("Primary button tapped")
                }
                
                GlassButton("View Details", icon: "info.circle", style: .secondary) {
                    print("Secondary button tapped")
                }
                
                GlassButton("Dismiss", style: .ghost) {
                    print("Ghost button tapped")
                }
                
                GlassButton("Delete Pipeline", icon: "trash", style: .danger) {
                    print("Danger button tapped")
                }
                
                GlassButton("Loading...", style: .primary, isLoading: true) {
                    print("Loading button tapped")
                }
                
                GlassButton("Disabled", style: .primary, isDisabled: true) {
                    print("Disabled button tapped")
                }
            }
            .padding()
        }
        .previewDevice("iPhone 14 Pro")
        .previewDisplayName("Glass Buttons - Light")
        
        ZStack {
            LinearGradient(
                colors: [Color.black, Color.indigo],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 20) {
                GlassButton("PRIMARY", style: .primary) {}
                GlassButton("SECONDARY", style: .secondary) {}
                GlassButton("GHOST", style: .ghost) {}
            }
            .padding()
        }
        .preferredColorScheme(.dark)
        .previewDevice("iPhone 14 Pro")
        .previewDisplayName("Glass Buttons - Dark")
    }
}
#endif
