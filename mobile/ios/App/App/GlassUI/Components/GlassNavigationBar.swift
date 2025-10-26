//
//  GlassNavigationBar.swift
//  App
//
//  Glass-styled navigation bar with iOS 18+ aesthetics
//

import SwiftUI

/// Custom glass navigation bar for iOS
///
/// Example usage:
/// ```swift
/// GlassNavigationBar(
///     title: "DRUG PIPELINE",
///     leading: {
///         Button(action: { }) {
///             Image(systemName: "chevron.left")
///         }
///     },
///     trailing: {
///         Button(action: { }) {
///             Image(systemName: "ellipsis.circle")
///         }
///     }
/// )
/// ```
public struct GlassNavigationBar<Leading: View, Trailing: View>: View {
    
    // MARK: - Properties
    
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.safeAreaInsets) var safeAreaInsets
    
    private let title: String
    private let subtitle: String?
    private let leading: Leading?
    private let trailing: Trailing?
    private let showDivider: Bool
    
    // MARK: - Initialization
    
    /// Creates a glass navigation bar
    /// - Parameters:
    ///   - title: Navigation bar title (uppercase recommended)
    ///   - subtitle: Optional subtitle text
    ///   - showDivider: Show bottom divider line (default: true)
    ///   - leading: Leading button/content
    ///   - trailing: Trailing button/content
    public init(
        title: String,
        subtitle: String? = nil,
        showDivider: Bool = true,
        @ViewBuilder leading: () -> Leading? = { nil },
        @ViewBuilder trailing: () -> Trailing? = { nil }
    ) {
        self.title = title
        self.subtitle = subtitle
        self.showDivider = showDivider
        self.leading = leading()
        self.trailing = trailing()
    }
    
    // MARK: - Body
    
    public var body: some View {
        VStack(spacing: 0) {
            // Navigation content
            HStack(spacing: GlassStyle.Spacing.md) {
                // Leading button
                if let leading = leading {
                    leading
                        .frame(width: 44, height: 44)
                } else {
                    Spacer()
                        .frame(width: 44)
                }
                
                // Title
                VStack(spacing: 2) {
                    Text(title.uppercased())
                        .font(GlassStyle.Typography.headline)
                        .foregroundColor(.primary)
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(GlassStyle.Typography.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
                
                // Trailing button
                if let trailing = trailing {
                    trailing
                        .frame(width: 44, height: 44)
                } else {
                    Spacer()
                        .frame(width: 44)
                }
            }
            .padding(.horizontal, GlassStyle.Spacing.md)
            .padding(.vertical, GlassStyle.Spacing.sm)
            .frame(height: 44)
            
            // Divider
            if showDivider {
                Rectangle()
                    .fill(GlassStyle.Colors.glassBorder(for: colorScheme))
                    .frame(height: 1)
                    .opacity(0.5)
            }
        }
        .background(navBarBackground)
    }
    
    // MARK: - Private Views
    
    private var navBarBackground: some View {
        ZStack {
            // Glass material
            GlassStyle.GlassMaterial.chrome.blurMaterial
            
            // Subtle tint
            GlassStyle.Colors.glassTint(for: colorScheme)
                .opacity(0.05)
        }
    }
}

// MARK: - Safe Area Insets Environment Key

private struct SafeAreaInsetsKey: EnvironmentKey {
    static var defaultValue: EdgeInsets = EdgeInsets()
}

extension EnvironmentValues {
    var safeAreaInsets: EdgeInsets {
        get { self[SafeAreaInsetsKey.self] }
        set { self[SafeAreaInsetsKey.self] = newValue }
    }
}

// MARK: - Preview

#if DEBUG
struct GlassNavigationBar_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 0) {
            // Navigation bar
            GlassNavigationBar(
                title: "DRUG PIPELINE",
                subtitle: "143 Compounds"
            ) {
                Button(action: {}) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(GlassStyle.Colors.accent)
                }
            } trailing: {
                Button(action: {}) {
                    Image(systemName: "ellipsis.circle")
                        .font(.system(size: 20, weight: .regular))
                        .foregroundColor(GlassStyle.Colors.accent)
                }
            }
            
            // Content area
            ZStack {
                LinearGradient(
                    colors: [Color.blue, Color.purple],
                    startPoint: .top,
                    endPoint: .bottom
                )
                
                ScrollView {
                    VStack(spacing: 20) {
                        ForEach(0..<10) { index in
                            GlassCardView {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("COMPOUND \(index + 1)")
                                        .font(GlassStyle.Typography.headline)
                                    Text("Phase II - Oncology")
                                        .font(GlassStyle.Typography.body)
                                        .foregroundColor(.secondary)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                    .padding()
                }
            }
            
            Spacer()
        }
        .ignoresSafeArea(edges: .bottom)
        .previewDevice("iPhone 14 Pro")
        .previewDisplayName("Glass Navigation Bar - Light")
        
        VStack(spacing: 0) {
            GlassNavigationBar(
                title: "CLINICAL TRIALS"
            ) {
                Button(action: {}) {
                    Image(systemName: "line.3.horizontal")
                        .foregroundColor(GlassStyle.Colors.accent)
                }
            } trailing: {
                Button(action: {}) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(GlassStyle.Colors.accent)
                }
            }
            
            ZStack {
                Color.black
                Text("Content")
                    .foregroundColor(.white)
            }
        }
        .preferredColorScheme(.dark)
        .previewDevice("iPhone 14 Pro")
        .previewDisplayName("Glass Navigation Bar - Dark")
    }
}
#endif
