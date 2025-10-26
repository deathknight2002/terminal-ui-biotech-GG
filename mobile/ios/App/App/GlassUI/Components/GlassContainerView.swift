//
//  GlassContainerView.swift
//  App
//
//  Large glass container for complex content layouts
//

import SwiftUI

/// A large glass container with optional header and footer
///
/// Example usage:
/// ```swift
/// GlassContainerView(
///     title: "CLINICAL TRIALS",
///     subtitle: "Q4 2025"
/// ) {
///     VStack {
///         // Trial data
///     }
/// } footer: {
///     Text("Last updated: 2 min ago")
/// }
/// ```
public struct GlassContainerView<Content: View, Header: View, Footer: View>: View {
    
    // MARK: - Properties
    
    @Environment(\.colorScheme) var colorScheme
    
    private let content: Content
    private let header: Header?
    private let footer: Footer?
    private let material: GlassStyle.GlassMaterial
    private let padding: CGFloat
    private let cornerRadius: CGFloat
    private let showBorder: Bool
    
    // MARK: - Initialization
    
    /// Creates a glass container with optional header and footer
    public init(
        material: GlassStyle.GlassMaterial = .regular,
        padding: CGFloat = GlassStyle.Spacing.md,
        cornerRadius: CGFloat = GlassStyle.CornerRadius.large,
        showBorder: Bool = true,
        @ViewBuilder content: () -> Content,
        @ViewBuilder header: () -> Header? = { nil },
        @ViewBuilder footer: () -> Footer? = { nil }
    ) {
        self.content = content()
        self.header = header()
        self.footer = footer()
        self.material = material
        self.padding = padding
        self.cornerRadius = cornerRadius
        self.showBorder = showBorder
    }
    
    // MARK: - Convenience Initializers
    
    /// Creates a container with title header
    public init(
        title: String,
        subtitle: String? = nil,
        material: GlassStyle.GlassMaterial = .regular,
        @ViewBuilder content: () -> Content
    ) where Header == AnyView, Footer == EmptyView {
        self.content = content()
        self.header = AnyView(
            VStack(alignment: .leading, spacing: 4) {
                Text(title.uppercased())
                    .font(GlassStyle.Typography.headline)
                    .foregroundColor(.primary)
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(GlassStyle.Typography.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        )
        self.footer = nil
        self.material = .regular
        self.padding = GlassStyle.Spacing.md
        self.cornerRadius = GlassStyle.CornerRadius.large
        self.showBorder = true
    }
    
    // MARK: - Body
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let header = header {
                headerSection(header)
            }
            
            content
                .padding(padding)
            
            if let footer = footer {
                footerSection(footer)
            }
        }
        .background(glassTint)
        .background(material.blurMaterial)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        .overlay(borderOverlay)
        .shadow(
            color: GlassStyle.Shadow.medium.color,
            radius: GlassStyle.Shadow.medium.radius,
            x: GlassStyle.Shadow.medium.x,
            y: GlassStyle.Shadow.medium.y
        )
    }
    
    // MARK: - Private Views
    
    private func headerSection<H: View>(_ header: H) -> some View {
        header
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                GlassStyle.Colors.glassTint(for: colorScheme)
                    .opacity(0.3)
            )
            .overlay(
                Rectangle()
                    .fill(GlassStyle.Colors.glassBorder(for: colorScheme))
                    .frame(height: 1),
                alignment: .bottom
            )
    }
    
    private func footerSection<F: View>(_ footer: F) -> some View {
        footer
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                GlassStyle.Colors.glassTint(for: colorScheme)
                    .opacity(0.2)
            )
            .overlay(
                Rectangle()
                    .fill(GlassStyle.Colors.glassBorder(for: colorScheme))
                    .frame(height: 1),
                alignment: .top
            )
    }
    
    private var glassTint: some View {
        GlassStyle.Colors.glassTint(for: colorScheme)
            .opacity(0.1)
    }
    
    @ViewBuilder
    private var borderOverlay: some View {
        if showBorder {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .stroke(GlassStyle.Colors.glassBorder(for: colorScheme), lineWidth: 1)
        }
    }
}

// MARK: - Preview

#if DEBUG
struct GlassContainerView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            LinearGradient(
                colors: [Color.blue.opacity(0.6), Color.purple.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 20) {
                    // Container with title
                    GlassContainerView(
                        title: "DRUG PIPELINE",
                        subtitle: "Phase II & III Compounds"
                    ) {
                        VStack(spacing: 12) {
                            drugRow(name: "XYZ-123", phase: "Phase III", progress: 0.85)
                            drugRow(name: "ABC-456", phase: "Phase II", progress: 0.62)
                            drugRow(name: "DEF-789", phase: "Phase II", progress: 0.44)
                        }
                    }
                    
                    // Container with custom header and footer
                    GlassContainerView(
                        material: .regular
                    ) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("PDUFA CALENDAR")
                                .font(GlassStyle.Typography.headline)
                            
                            HStack {
                                VStack(alignment: .leading) {
                                    Text("Compound XYZ-123")
                                        .font(GlassStyle.Typography.body)
                                    Text("Decision Date: Dec 15, 2025")
                                        .font(GlassStyle.Typography.caption)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text("3 days")
                                    .font(GlassStyle.Typography.headline)
                                    .foregroundColor(GlassStyle.Colors.warning)
                            }
                        }
                    } header: {
                        HStack {
                            Image(systemName: "calendar.badge.exclamationmark")
                                .foregroundColor(GlassStyle.Colors.accent)
                            Text("UPCOMING EVENTS")
                                .font(GlassStyle.Typography.headline)
                        }
                    } footer: {
                        HStack {
                            Image(systemName: "clock")
                                .font(.caption)
                            Text("Last updated: 2 minutes ago")
                                .font(GlassStyle.Typography.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
            }
        }
        .previewDevice("iPhone 14 Pro")
        .previewDisplayName("Glass Containers")
    }
    
    static func drugRow(name: String, phase: String, progress: Double) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .font(GlassStyle.Typography.body)
                    .fontWeight(.medium)
                Text(phase)
                    .font(GlassStyle.Typography.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 80, height: 8)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(GlassStyle.Colors.success)
                    .frame(width: 80 * progress, height: 8)
            }
            
            Text("\(Int(progress * 100))%")
                .font(GlassStyle.Typography.caption)
                .foregroundColor(GlassStyle.Colors.success)
                .frame(width: 40, alignment: .trailing)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.white.opacity(0.05))
        )
    }
}
#endif
