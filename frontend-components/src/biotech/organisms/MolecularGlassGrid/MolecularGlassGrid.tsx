import React, { ReactNode } from 'react';
import clsx from 'clsx';
import '../../../../src/styles/glass-ui-enhanced.css';

export interface MolecularGlassGridProps {
  /** Grid content */
  children: ReactNode;
  
  /** Enable 3D molecular structure background */
  show3DStructure?: boolean;
  
  /** Enable connection lines between molecules */
  showConnections?: boolean;
  
  /** Animation speed (slow, normal, fast) */
  animationSpeed?: 'slow' | 'normal' | 'fast';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * MolecularGlassGrid - Glass panel with molecular structure backgrounds
 * 
 * Features:
 * - 3D molecular structure patterns as background
 * - Animated connection lines between molecular nodes
 * - Configurable animation speeds
 * - Chemical bond visualization
 * 
 * Perfect for drug compound analysis, molecular similarity clustering,
 * and pharmaceutical research visualizations.
 * 
 * @example
 * ```tsx
 * <MolecularGlassGrid show3DStructure showConnections>
 *   <h3>Compound Analysis</h3>
 *   <p>Molecular weight: 450.5 g/mol</p>
 * </MolecularGlassGrid>
 * ```
 */
export const MolecularGlassGrid: React.FC<MolecularGlassGridProps> = ({
  children,
  show3DStructure = true,
  showConnections = true,
  animationSpeed = 'normal',
  className,
  style,
}) => {
  const animationDuration = {
    slow: '45s',
    normal: '30s',
    fast: '15s',
  }[animationSpeed];

  const customStyle = {
    ...style,
    ...(animationSpeed !== 'normal' && {
      '--molecular-animation-duration': animationDuration,
    } as React.CSSProperties),
  };

  return (
    <div
      className={clsx('molecular-glass-grid', className)}
      data-show-structure={show3DStructure}
      data-show-connections={showConnections}
      style={customStyle}
    >
      {children}
    </div>
  );
};

MolecularGlassGrid.displayName = 'MolecularGlassGrid';
