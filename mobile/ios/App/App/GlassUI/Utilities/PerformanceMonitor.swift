//
//  PerformanceMonitor.swift
//  App
//
//  Performance monitoring for Glass UI effects
//

import SwiftUI
import QuartzCore

/// Monitors and logs performance metrics for Glass UI components
///
/// Usage:
/// ```swift
/// #if DEBUG
/// PerformanceMonitor.shared.startMonitoring()
/// #endif
/// ```
public class PerformanceMonitor {
    
    // MARK: - Singleton
    
    public static let shared = PerformanceMonitor()
    
    private init() {}
    
    // MARK: - Properties
    
    private var displayLink: CADisplayLink?
    private var frameCount: Int = 0
    private var lastTimestamp: CFTimeInterval = 0
    private var fpsReadings: [Double] = []
    
    public private(set) var currentFPS: Double = 60.0
    public private(set) var averageFPS: Double = 60.0
    public private(set) var isMonitoring: Bool = false
    
    // MARK: - Monitoring
    
    /// Start monitoring FPS and performance
    public func startMonitoring() {
        guard !isMonitoring else { return }
        
        isMonitoring = true
        frameCount = 0
        lastTimestamp = CACurrentMediaTime()
        
        displayLink = CADisplayLink(target: self, selector: #selector(displayLinkDidFire))
        displayLink?.add(to: .main, forMode: .common)
        
        print("📊 [PerformanceMonitor] Started monitoring")
    }
    
    /// Stop monitoring
    public func stopMonitoring() {
        guard isMonitoring else { return }
        
        isMonitoring = false
        displayLink?.invalidate()
        displayLink = nil
        
        print("📊 [PerformanceMonitor] Stopped monitoring")
        printStatistics()
    }
    
    // MARK: - Frame Tracking
    
    @objc private func displayLinkDidFire(_ displayLink: CADisplayLink) {
        frameCount += 1
        
        let currentTime = CACurrentMediaTime()
        let elapsed = currentTime - lastTimestamp
        
        // Update FPS every second
        if elapsed >= 1.0 {
            currentFPS = Double(frameCount) / elapsed
            fpsReadings.append(currentFPS)
            
            // Keep last 60 readings (1 minute at 1 reading/second)
            if fpsReadings.count > 60 {
                fpsReadings.removeFirst()
            }
            
            // Calculate average
            averageFPS = fpsReadings.reduce(0, +) / Double(fpsReadings.count)
            
            // Log if performance is poor
            if currentFPS < 50 {
                print("⚠️ [PerformanceMonitor] Low FPS detected: \(String(format: "%.1f", currentFPS)) fps")
            }
            
            frameCount = 0
            lastTimestamp = currentTime
        }
    }
    
    // MARK: - Statistics
    
    private func printStatistics() {
        guard !fpsReadings.isEmpty else { return }
        
        let minFPS = fpsReadings.min() ?? 0
        let maxFPS = fpsReadings.max() ?? 0
        
        print("""
        
        📊 [PerformanceMonitor] Statistics:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Average FPS: \(String(format: "%.1f", averageFPS))
        Min FPS: \(String(format: "%.1f", minFPS))
        Max FPS: \(String(format: "%.1f", maxFPS))
        Total Readings: \(fpsReadings.count)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        """)
    }
    
    // MARK: - Glass Effect Performance
    
    /// Log glass effect usage for performance tracking
    public func logGlassEffectUsage(componentName: String, layerCount: Int) {
        #if DEBUG
        if layerCount > 4 {
            print("⚠️ [PerformanceMonitor] High glass layer count in \(componentName): \(layerCount) layers")
            print("   Consider reducing blur effects for better performance")
        }
        #endif
    }
    
    /// Check device capability for glass effects
    public func recommendedGlassMaterial() -> GlassStyle.GlassMaterial {
        let processorCount = ProcessInfo.processInfo.processorCount
        
        // Devices with fewer cores get lighter blur
        if processorCount < 6 {
            return .thin  // iPhone 8, X, XS, 11
        } else {
            return .regular  // iPhone 12 and newer
        }
    }
    
    /// Check if device can handle heavy glass effects
    public var canHandleHeavyGlassEffects: Bool {
        let processorCount = ProcessInfo.processInfo.processorCount
        let totalMemory = ProcessInfo.processInfo.physicalMemory
        
        // Require 6+ cores and 4GB+ RAM
        return processorCount >= 6 && totalMemory >= 4_000_000_000
    }
}

// MARK: - SwiftUI Integration

/// View modifier that monitors performance when attached
struct PerformanceMonitoringModifier: ViewModifier {
    
    let componentName: String
    
    func body(content: Content) -> some View {
        content
            .onAppear {
                #if DEBUG
                PerformanceMonitor.shared.logGlassEffectUsage(
                    componentName: componentName,
                    layerCount: 1
                )
                #endif
            }
    }
}

extension View {
    /// Monitor performance of this view
    public func monitorPerformance(componentName: String) -> some View {
        self.modifier(PerformanceMonitoringModifier(componentName: componentName))
    }
}

// MARK: - Device Capability

/// Helper struct for device capability checks
public struct DeviceCapability {
    
    /// Check if running on a simulator
    public static var isSimulator: Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }
    
    /// Get device model identifier
    public static var modelIdentifier: String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }
        return identifier
    }
    
    /// Recommended glass quality based on device
    public static var recommendedGlassQuality: GlassQuality {
        let processorCount = ProcessInfo.processInfo.processorCount
        
        if processorCount >= 8 {
            return .high      // iPhone 13 Pro and newer
        } else if processorCount >= 6 {
            return .medium    // iPhone 12, 13, 14
        } else {
            return .low       // iPhone 11 and older
        }
    }
    
    public enum GlassQuality {
        case low      // Minimal blur, high performance
        case medium   // Balanced
        case high     // Maximum visual quality
        
        public var material: GlassStyle.GlassMaterial {
            switch self {
            case .low: return .thin
            case .medium: return .regular
            case .high: return .thick
            }
        }
        
        public var maxSimultaneousLayers: Int {
            switch self {
            case .low: return 2
            case .medium: return 4
            case .high: return 6
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
struct PerformanceMonitor_Previews: PreviewProvider {
    static var previews: some View {
        PerformanceTestView()
            .previewDevice("iPhone 14 Pro")
    }
    
    struct PerformanceTestView: View {
        @State private var isMonitoring = false
        
        var body: some View {
            ZStack {
                LinearGradient(
                    colors: [Color.blue, Color.purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 20) {
                    Text("PERFORMANCE MONITOR")
                        .font(GlassStyle.Typography.title)
                    
                    if isMonitoring {
                        Text("FPS: \(String(format: "%.1f", PerformanceMonitor.shared.currentFPS))")
                            .font(GlassStyle.Typography.headline)
                        
                        Text("Average: \(String(format: "%.1f", PerformanceMonitor.shared.averageFPS))")
                            .font(GlassStyle.Typography.body)
                            .foregroundColor(.secondary)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Device Info")
                            .font(GlassStyle.Typography.headline)
                        
                        Text("Cores: \(ProcessInfo.processInfo.processorCount)")
                            .font(GlassStyle.Typography.caption)
                        
                        Text("Quality: \(String(describing: DeviceCapability.recommendedGlassQuality))")
                            .font(GlassStyle.Typography.caption)
                        
                        Text("Recommended: \(String(describing: PerformanceMonitor.shared.recommendedGlassMaterial()))")
                            .font(GlassStyle.Typography.caption)
                    }
                    .padding()
                    .glassEffect()
                    
                    GlassButton(isMonitoring ? "STOP MONITORING" : "START MONITORING", style: .primary) {
                        if isMonitoring {
                            PerformanceMonitor.shared.stopMonitoring()
                        } else {
                            PerformanceMonitor.shared.startMonitoring()
                        }
                        isMonitoring.toggle()
                    }
                }
                .padding()
            }
        }
    }
}
#endif
