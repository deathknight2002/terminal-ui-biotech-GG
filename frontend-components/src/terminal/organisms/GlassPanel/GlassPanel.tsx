import React, { ReactNode } from 'react';
import clsx from 'clsx';
import '../../../../src/styles/glass-ui-enhanced.css';

export interface GlassPanelProps {
  /** Panel content */
  children: ReactNode;
  
  /** Urgency level affects transparency and visual prominence */
  urgency?: 'critical' | 'high' | 'medium' | 'low';
  
  /** Surface texture style */
  texture?: 'neural' | 'molecular' | 'crystalline';
  
  /** Enable real-time data update ripple effect */
  showDataUpdate?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
  
  /** Click handler */
  onClick?: () => void;
}

/**
 * GlassPanel - Adaptive glass panel with data-driven transparency
 * 
 * Features:
 * - Multi-level urgency styling (critical to low)
 * - Neural, molecular, and crystalline surface textures
 * - Real-time data update animations
 * - Responsive blur and transparency
 * 
 * @example
 * ```tsx
 * <GlassPanel urgency="high" texture="neural">
 *   <h3>Critical Market Alert</h3>
 *   <p>FDA approval decision pending...</p>
 * </GlassPanel>
 * ```
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  urgency = 'medium',
  texture = 'neural',
  showDataUpdate = false,
  className,
  style,
  onClick,
}) => {
  return (
    <div
      className={clsx(
        'glass-panel-adaptive',
        showDataUpdate && 'glass-data-update',
        className
      )}
      data-urgency={urgency}
      data-texture={texture}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

GlassPanel.displayName = 'GlassPanel';
