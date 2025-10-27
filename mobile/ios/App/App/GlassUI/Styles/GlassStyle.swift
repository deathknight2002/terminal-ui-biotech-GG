//
//  GlassStyle.swift
//  App
//
//  iOS Glass UI Core Styling System
//  Provides reusable glass effect styling for native iOS components
//

import SwiftUI

/// Core glass styling system for iOS native components
/// Provides glassmorphism effects matching the web Glass UI aesthetic
public struct GlassStyle {
    
    // MARK: - Material Types
    
    /// Glass material blur intensity levels
    public enum GlassMaterial {
        case ultraThin      // Lightest blur - background elements
        case thin           // Light blur - secondary containers
        case regular        // Standard blur - primary containers
        case thick          // Heavy blur - prominent modals
        case chrome         // Metallic blur - navigation bars
        
        var blurMaterial: Material {
            switch self {
            case .ultraThin: return .ultraThinMaterial
            case .thin: return .thinMaterial
            case .regular: return .regularMaterial
            case .thick: return .thickMaterial
            case .chrome: return .bar
            }
        }
    }
    
    // MARK: - Urgency Levels
    
    /// Transparency levels based on data urgency (matching web Glass UI)
    public enum Urgency {
        case critical   // 15% transparency - maximum visibility
        case high       // 25% transparency
        case medium     // 45% transparency - default
        case low        // 65% transparency
        
        var opacity: Double {
            switch self {
            case .critical: return 0.15
            case .high: return 0.25
            case .medium: return 0.45
            case .low: return 0.65
            }
        }
        
        var tintOpacity: Double {
            switch self {
            case .critical: return 0.3
            case .high: return 0.2
            case .medium: return 0.15
            case .low: return 0.1
            }
        }
    }
    
    // MARK: - Color Palette
    
    /// Glass UI color palette matching web terminal aesthetic
    public struct Colors {
        // Primary Accent (Bloomberg-style amber)
        public static let accent = Color(red: 1.0, green: 0.584, blue: 0.0) // #FF9500
        
        // Glass Tints (light mode)
        public static let glassTintLight = Color.white.opacity(0.1)
        public static let glassBorderLight = Color.white.opacity(0.2)
        public static let glassHighlightLight = Color.white.opacity(0.4)
        
        // Glass Tints (dark mode)
        public static let glassTintDark = Color.white.opacity(0.05)
        public static let glassBorderDark = Color.white.opacity(0.15)
        public static let glassHighlightDark = Color.white.opacity(0.3)
        
        // Status Colors
        public static let success = Color.green
        public static let warning = Color.orange
        public static let error = Color.red
        public static let info = Color.blue
        
        // Adaptive colors
        public static func glassTint(for colorScheme: ColorScheme) -> Color {
            colorScheme == .dark ? glassTintDark : glassTintLight
        }
        
        public static func glassBorder(for colorScheme: ColorScheme) -> Color {
            colorScheme == .dark ? glassBorderDark : glassBorderLight
        }
        
        public static func glassHighlight(for colorScheme: ColorScheme) -> Color {
            colorScheme == .dark ? glassHighlightDark : glassHighlightLight
        }
    }
    
    // MARK: - Typography
    
    /// Typography system using SF Pro
    public struct Typography {
        public static let title = Font.system(.title, design: .rounded).weight(.semibold)
        public static let headline = Font.system(.headline, design: .default).weight(.medium)
        public static let body = Font.system(.body, design: .default)
        public static let caption = Font.system(.caption, design: .monospaced)
        public static let largeTitle = Font.system(.largeTitle, design: .rounded).weight(.bold)
    }
    
    // MARK: - Spacing
    
    /// Consistent spacing system
    public struct Spacing {
        public static let xs: CGFloat = 4
        public static let sm: CGFloat = 8
        public static let md: CGFloat = 16
        public static let lg: CGFloat = 24
        public static let xl: CGFloat = 32
        public static let xxl: CGFloat = 48
    }
    
    // MARK: - Corner Radius
    
    /// Corner radius values for different component sizes
    public struct CornerRadius {
        public static let small: CGFloat = 8
        public static let medium: CGFloat = 12
        public static let large: CGFloat = 16
        public static let extraLarge: CGFloat = 24
    }
    
    // MARK: - Shadow
    
    /// Shadow depth system for glass layering
    public struct Shadow {
        public static let light = (color: Color.black.opacity(0.1), radius: CGFloat(4), x: CGFloat(0), y: CGFloat(2))
        public static let medium = (color: Color.black.opacity(0.15), radius: CGFloat(8), x: CGFloat(0), y: CGFloat(4))
        public static let heavy = (color: Color.black.opacity(0.2), radius: CGFloat(16), x: CGFloat(0), y: CGFloat(8))
        public static let intense = (color: Color.black.opacity(0.25), radius: CGFloat(24), x: CGFloat(0), y: CGFloat(12))
    }
}

// MARK: - View Extension for Easy Application

extension View {
    /// Apply glass effect with material and tint
    public func glassEffect(
        material: GlassStyle.GlassMaterial = .regular,
        tint: Color = GlassStyle.Colors.glassTintLight,
        cornerRadius: CGFloat = GlassStyle.CornerRadius.medium
    ) -> some View {
        self
            .background(material.blurMaterial)
            .background(tint)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
    
    /// Apply glass border
    public func glassBorder(
        color: Color = GlassStyle.Colors.glassBorderLight,
        width: CGFloat = 1,
        cornerRadius: CGFloat = GlassStyle.CornerRadius.medium
    ) -> some View {
        self.overlay(
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .stroke(color, lineWidth: width)
        )
    }
    
    /// Apply glass shadow
    public func glassShadow(depth: (color: Color, radius: CGFloat, x: CGFloat, y: CGFloat) = GlassStyle.Shadow.medium) -> some View {
        self.shadow(color: depth.color, radius: depth.radius, x: depth.x, y: depth.y)
    }
}
