//
//  GlassUIShowcase.swift
//  App
//
//  Comprehensive showcase of all Glass UI components
//

import SwiftUI

/// Interactive showcase demonstrating all Glass UI components
///
/// Use this view to:
/// - Preview all glass components
/// - Test different configurations
/// - Validate visual consistency
/// - Performance test glass effects
public struct GlassUIShowcase: View {
    
    // MARK: - State
    
    @State private var showModal = false
    @State private var selectedUrgency: GlassStyle.Urgency = .medium
    @State private var selectedMaterial: GlassStyle.GlassMaterial = .regular
    @State private var isMonitoring = false
    
    // MARK: - Body
    
    public var body: some View {
        ZStack {
            // Background
            backgroundGradient
            
            // Content
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection
                    
                    // Controls
                    controlsSection
                    
                    // Card Examples
                    cardSection
                    
                    // Button Examples
                    buttonSection
                    
                    // Container Example
                    containerSection
                    
                    // Performance Info
                    performanceSection
                }
                .padding()
            }
            .overlay(navigationBar, alignment: .top)
            
            // Modal
            if showModal {
                modalExample
            }
        }
    }
    
    // MARK: - Sections
    
    private var headerSection: some View {
        VStack(spacing: 8) {
            Text("🧬")
                .font(.system(size: 60))
            
            Text("GLASS UI SHOWCASE")
                .font(GlassStyle.Typography.largeTitle)
            
            Text("iOS Native Components")
                .font(GlassStyle.Typography.body)
                .foregroundColor(.secondary)
        }
        .padding(.top, 60)
    }
    
    private var controlsSection: some View {
        GlassCardView(urgency: .medium) {
            VStack(alignment: .leading, spacing: 16) {
                Text("CONTROLS")
                    .font(GlassStyle.Typography.headline)
                
                // Urgency Selector
                VStack(alignment: .leading, spacing: 8) {
                    Text("Urgency Level")
                        .font(GlassStyle.Typography.caption)
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 8) {
                        urgencyButton(.critical, "Critical")
                        urgencyButton(.high, "High")
                        urgencyButton(.medium, "Medium")
                        urgencyButton(.low, "Low")
                    }
                }
                
                // Material Selector
                VStack(alignment: .leading, spacing: 8) {
                    Text("Blur Material")
                        .font(GlassStyle.Typography.caption)
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 8) {
                        materialButton(.thin, "Thin")
                        materialButton(.regular, "Regular")
                        materialButton(.thick, "Thick")
                    }
                }
            }
        }
    }
    
    private var cardSection: some View {
        VStack(spacing: 16) {
            Text("GLASS CARDS")
                .font(GlassStyle.Typography.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            GlassCardView(urgency: selectedUrgency, material: selectedMaterial) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "pills.fill")
                            .foregroundColor(GlassStyle.Colors.accent)
                        Text("COMPOUND XYZ-123")
                            .font(GlassStyle.Typography.headline)
                    }
                    
                    Text("Phase III - BTK Inhibitor")
                        .font(GlassStyle.Typography.body)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Text("Progress")
                            .font(GlassStyle.Typography.caption)
                        Spacer()
                        Text("75%")
                            .font(GlassStyle.Typography.caption)
                            .foregroundColor(GlassStyle.Colors.success)
                    }
                }
            }
        }
    }
    
    private var buttonSection: some View {
        VStack(spacing: 16) {
            Text("GLASS BUTTONS")
                .font(GlassStyle.Typography.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 12) {
                GlassButton("PRIMARY BUTTON", icon: "checkmark.circle.fill", style: .primary) {
                    print("Primary tapped")
                }
                
                GlassButton("SECONDARY BUTTON", icon: "info.circle", style: .secondary) {
                    print("Secondary tapped")
                }
                
                GlassButton("GHOST BUTTON", style: .ghost) {
                    print("Ghost tapped")
                }
                
                GlassButton("SHOW MODAL", icon: "square.on.square", style: .primary) {
                    withAnimation {
                        showModal = true
                    }
                }
            }
        }
    }
    
    private var containerSection: some View {
        VStack(spacing: 16) {
            Text("GLASS CONTAINER")
                .font(GlassStyle.Typography.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            GlassContainerView(
                title: "CLINICAL TRIALS",
                subtitle: "Active Studies"
            ) {
                VStack(spacing: 12) {
                    trialRow(name: "Study NCT12345", phase: "Phase III", patients: 450)
                    trialRow(name: "Study NCT67890", phase: "Phase II", patients: 120)
                }
            }
        }
    }
    
    private var performanceSection: some View {
        VStack(spacing: 16) {
            Text("PERFORMANCE")
                .font(GlassStyle.Typography.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            GlassCardView {
                VStack(alignment: .leading, spacing: 12) {
                    if isMonitoring {
                        HStack {
                            Text("FPS:")
                                .font(GlassStyle.Typography.body)
                            Spacer()
                            Text(String(format: "%.1f", PerformanceMonitor.shared.currentFPS))
                                .font(GlassStyle.Typography.headline)
                                .foregroundColor(fpsColor)
                        }
                        
                        HStack {
                            Text("Average:")
                                .font(GlassStyle.Typography.body)
                            Spacer()
                            Text(String(format: "%.1f", PerformanceMonitor.shared.averageFPS))
                                .font(GlassStyle.Typography.body)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    HStack {
                        Text("Device Cores:")
                            .font(GlassStyle.Typography.caption)
                        Spacer()
                        Text("\(ProcessInfo.processInfo.processorCount)")
                            .font(GlassStyle.Typography.caption)
                    }
                    
                    HStack {
                        Text("Recommended:")
                            .font(GlassStyle.Typography.caption)
                        Spacer()
                        Text("\(String(describing: PerformanceMonitor.shared.recommendedGlassMaterial()))")
                            .font(GlassStyle.Typography.caption)
                    }
                    
                    GlassButton(
                        isMonitoring ? "STOP MONITORING" : "START MONITORING",
                        icon: isMonitoring ? "stop.circle" : "play.circle",
                        style: .secondary
                    ) {
                        toggleMonitoring()
                    }
                }
            }
        }
    }
    
    private var navigationBar: some View {
        GlassNavigationBar(
            title: "SHOWCASE"
        ) {
            Button(action: {}) {
                Image(systemName: "chevron.left")
                    .foregroundColor(GlassStyle.Colors.accent)
            }
        } trailing: {
            Button(action: {}) {
                Image(systemName: "gearshape")
                    .foregroundColor(GlassStyle.Colors.accent)
            }
        }
    }
    
    private var modalExample: some View {
        GlassModalView(
            title: "PDUFA ALERT",
            subtitle: "Regulatory Decision Pending",
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
                        .font(GlassStyle.Typography.body)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("PROBABILITY")
                        .font(GlassStyle.Typography.caption)
                        .foregroundColor(.secondary)
                    Text("82%")
                        .font(GlassStyle.Typography.largeTitle)
                        .foregroundColor(GlassStyle.Colors.success)
                }
            }
        } footer: {
            HStack(spacing: 12) {
                GlassButton("DISMISS", style: .ghost) {
                    withAnimation {
                        showModal = false
                    }
                }
                GlassButton("VIEW DETAILS", style: .primary) {
                    withAnimation {
                        showModal = false
                    }
                }
            }
        }
    }
    
    // MARK: - Helper Views
    
    private func urgencyButton(_ urgency: GlassStyle.Urgency, _ label: String) -> some View {
        Button(action: { selectedUrgency = urgency }) {
            Text(label)
                .font(GlassStyle.Typography.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    selectedUrgency == urgency
                        ? GlassStyle.Colors.accent.opacity(0.3)
                        : Color.clear
                )
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(
                            selectedUrgency == urgency
                                ? GlassStyle.Colors.accent
                                : Color.white.opacity(0.2),
                            lineWidth: 1
                        )
                )
        }
    }
    
    private func materialButton(_ material: GlassStyle.GlassMaterial, _ label: String) -> some View {
        Button(action: { selectedMaterial = material }) {
            Text(label)
                .font(GlassStyle.Typography.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    selectedMaterial == material
                        ? GlassStyle.Colors.accent.opacity(0.3)
                        : Color.clear
                )
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(
                            selectedMaterial == material
                                ? GlassStyle.Colors.accent
                                : Color.white.opacity(0.2),
                            lineWidth: 1
                        )
                )
        }
    }
    
    private func trialRow(name: String, phase: String, patients: Int) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .font(GlassStyle.Typography.body)
                Text(phase)
                    .font(GlassStyle.Typography.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text("\(patients) patients")
                .font(GlassStyle.Typography.caption)
        }
        .padding(12)
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    
    private var backgroundGradient: some View {
        LinearGradient(
            colors: [
                Color.blue.opacity(0.6),
                Color.purple.opacity(0.8),
                Color.indigo.opacity(0.9)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
    
    private var fpsColor: Color {
        let fps = PerformanceMonitor.shared.currentFPS
        if fps >= 55 {
            return GlassStyle.Colors.success
        } else if fps >= 40 {
            return GlassStyle.Colors.warning
        } else {
            return GlassStyle.Colors.error
        }
    }
    
    // MARK: - Actions
    
    private func toggleMonitoring() {
        if isMonitoring {
            PerformanceMonitor.shared.stopMonitoring()
        } else {
            PerformanceMonitor.shared.startMonitoring()
        }
        isMonitoring.toggle()
    }
}

// MARK: - Preview

#if DEBUG
struct GlassUIShowcase_Previews: PreviewProvider {
    static var previews: some View {
        GlassUIShowcase()
            .previewDevice("iPhone 14 Pro")
    }
}
#endif
