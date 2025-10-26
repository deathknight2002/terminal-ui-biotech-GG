//
//  GlassModalView.swift
//  App
//
//  Full-screen glass modal with slide-in animation
//

import SwiftUI

/// A glass-styled modal view with slide-in animation
///
/// Example usage:
/// ```swift
/// @State private var showModal = false
///
/// Button("Show Modal") {
///     showModal = true
/// }
/// .sheet(isPresented: $showModal) {
///     GlassModalView(
///         title: "CONFIRM ACTION",
///         isPresented: $showModal
///     ) {
///         Text("Are you sure?")
///     } footer: {
///         HStack {
///             GlassButton("CANCEL", style: .ghost) {
///                 showModal = false
///             }
///             GlassButton("CONFIRM", style: .primary) {
///                 // Handle confirmation
///                 showModal = false
///             }
///         }
///     }
/// }
/// ```
public struct GlassModalView<Content: View, Footer: View>: View {
    
    // MARK: - Properties
    
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.presentationMode) var presentationMode
    @Binding var isPresented: Bool
    
    private let title: String
    private let subtitle: String?
    private let showCloseButton: Bool
    private let content: Content
    private let footer: Footer?
    
    // MARK: - Initialization
    
    /// Creates a glass modal view
    /// - Parameters:
    ///   - title: Modal title
    ///   - subtitle: Optional subtitle
    ///   - isPresented: Binding to control modal visibility
    ///   - showCloseButton: Show X button in top-right (default: true)
    ///   - content: Main modal content
    ///   - footer: Optional footer with action buttons
    public init(
        title: String,
        subtitle: String? = nil,
        isPresented: Binding<Bool>,
        showCloseButton: Bool = true,
        @ViewBuilder content: () -> Content,
        @ViewBuilder footer: () -> Footer? = { nil }
    ) {
        self.title = title
        self.subtitle = subtitle
        self._isPresented = isPresented
        self.showCloseButton = showCloseButton
        self.content = content()
        self.footer = footer()
    }
    
    // MARK: - Body
    
    public var body: some View {
        ZStack {
            // Background dimming
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture {
                    dismiss()
                }
            
            // Modal content
            VStack(spacing: 0) {
                // Header
                header
                
                // Content
                ScrollView {
                    content
                        .padding(GlassStyle.Spacing.lg)
                }
                
                // Footer
                if let footer = footer {
                    footerView(footer)
                }
            }
            .background(modalBackground)
            .clipShape(RoundedRectangle(cornerRadius: GlassStyle.CornerRadius.extraLarge, style: .continuous))
            .overlay(borderOverlay)
            .shadow(
                color: GlassStyle.Shadow.intense.color,
                radius: GlassStyle.Shadow.intense.radius,
                x: GlassStyle.Shadow.intense.x,
                y: GlassStyle.Shadow.intense.y
            )
            .padding(.horizontal, GlassStyle.Spacing.lg)
            .frame(maxHeight: .infinity, alignment: .center)
        }
        .transition(.opacity.combined(with: .scale(scale: 0.95)))
    }
    
    // MARK: - Private Views
    
    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title.uppercased())
                    .font(GlassStyle.Typography.title)
                    .foregroundColor(.primary)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(GlassStyle.Typography.body)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if showCloseButton {
                Button(action: dismiss) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(GlassStyle.Spacing.lg)
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
    
    private func footerView<F: View>(_ footer: F) -> some View {
        footer
            .padding(GlassStyle.Spacing.lg)
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
    
    private var modalBackground: some View {
        ZStack {
            GlassStyle.GlassMaterial.thick.blurMaterial
            GlassStyle.Colors.glassTint(for: colorScheme)
                .opacity(0.1)
        }
    }
    
    private var borderOverlay: some View {
        RoundedRectangle(cornerRadius: GlassStyle.CornerRadius.extraLarge, style: .continuous)
            .stroke(
                LinearGradient(
                    colors: [
                        GlassStyle.Colors.glassBorder(for: colorScheme).opacity(0.8),
                        GlassStyle.Colors.glassBorder(for: colorScheme).opacity(0.2)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                lineWidth: 1.5
            )
    }
    
    // MARK: - Actions
    
    private func dismiss() {
        // Haptic feedback
        let impact = UIImpactFeedbackGenerator(style: .soft)
        impact.impactOccurred()
        
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            isPresented = false
        }
    }
}

// MARK: - Preview

#if DEBUG
struct GlassModalView_Previews: PreviewProvider {
    static var previews: some View {
        ModalPreviewContainer()
            .previewDevice("iPhone 14 Pro")
    }
    
    struct ModalPreviewContainer: View {
        @State private var showModal = true
        
        var body: some View {
            ZStack {
                LinearGradient(
                    colors: [Color.blue, Color.purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                Button("Show Modal") {
                    showModal = true
                }
                .opacity(showModal ? 0 : 1)
            }
            .overlay(
                Group {
                    if showModal {
                        GlassModalView(
                            title: "PDUFA DECISION",
                            subtitle: "FDA Approval Status",
                            isPresented: $showModal
                        ) {
                            VStack(alignment: .leading, spacing: 20) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("COMPOUND")
                                        .font(GlassStyle.Typography.caption)
                                        .foregroundColor(.secondary)
                                    Text("XYZ-123 (BTK Inhibitor)")
                                        .font(GlassStyle.Typography.headline)
                                }
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("DECISION DATE")
                                        .font(GlassStyle.Typography.caption)
                                        .foregroundColor(.secondary)
                                    Text("December 15, 2025")
                                        .font(GlassStyle.Typography.headline)
                                }
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("INDICATION")
                                        .font(GlassStyle.Typography.caption)
                                        .foregroundColor(.secondary)
                                    Text("Relapsed/Refractory CLL")
                                        .font(GlassStyle.Typography.body)
                                }
                                
                                Divider()
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("PROBABILITY OF SUCCESS")
                                        .font(GlassStyle.Typography.caption)
                                        .foregroundColor(.secondary)
                                    HStack {
                                        Text("82%")
                                            .font(GlassStyle.Typography.largeTitle)
                                            .foregroundColor(GlassStyle.Colors.success)
                                        Spacer()
                                    }
                                }
                            }
                        } footer: {
                            HStack(spacing: 12) {
                                GlassButton("DISMISS", style: .ghost) {
                                    showModal = false
                                }
                                
                                GlassButton("VIEW DETAILS", icon: "arrow.right", style: .primary) {
                                    showModal = false
                                }
                            }
                        }
                    }
                }
            )
        }
    }
}
#endif
