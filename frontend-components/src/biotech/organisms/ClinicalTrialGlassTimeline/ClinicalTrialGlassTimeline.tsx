import React from 'react';
import clsx from 'clsx';
import '../../../../src/styles/glass-ui-enhanced.css';

export type PhaseType = 'preclinical' | 'phase-1' | 'phase-2' | 'phase-3' | 'filed' | 'approved';

export interface TrialPhase {
  /** Phase identifier */
  phase: PhaseType;
  
  /** Phase name/label */
  name: string;
  
  /** Completion percentage (0-100) */
  completion: number;
  
  /** Phase status */
  status: 'active' | 'completed' | 'upcoming';
  
  /** FDA milestone data */
  milestone?: {
    /** Milestone name */
    name: string;
    
    /** Approval probability (0-1) */
    probability: number;
    
    /** Expected date */
    date?: string;
  };
}

export interface ClinicalTrialGlassTimelineProps {
  /** Trial phases data */
  phases: TrialPhase[];
  
  /** Enable liquid flow animation */
  enableFlowAnimation?: boolean;
  
  /** Show FDA milestone markers */
  showMilestones?: boolean;
  
  /** Phase selection handler */
  onPhaseSelect?: (phase: TrialPhase) => void;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * ClinicalTrialGlassTimeline - Interactive timeline with glass tube visualization
 * 
 * Features:
 * - Phase progression glass tubes with liquid-like data flow
 * - FDA milestone markers with approval probability halos
 * - Interactive phase selection
 * - Completion percentage visualization
 * - Risk assessment gradients
 * 
 * @example
 * ```tsx
 * <ClinicalTrialGlassTimeline
 *   phases={[
 *     { phase: 'phase-1', name: 'Phase I', completion: 100, status: 'completed' },
 *     { phase: 'phase-2', name: 'Phase II', completion: 65, status: 'active', 
 *       milestone: { name: 'FDA Review', probability: 0.75, date: '2025-Q3' } }
 *   ]}
 *   showMilestones
 * />
 * ```
 */
export const ClinicalTrialGlassTimeline: React.FC<ClinicalTrialGlassTimelineProps> = ({
  phases,
  enableFlowAnimation = true,
  showMilestones = true,
  onPhaseSelect,
  className,
  style,
}) => {
  return (
    <div
      className={clsx('clinical-trial-glass-timeline', className)}
      style={style}
    >
      {phases.map((phase) => (
        <div
          key={phase.phase}
          className={clsx(
            'trial-phase-tube',
            enableFlowAnimation && 'animate-flow'
          )}
          data-phase={phase.phase}
          data-status={phase.status}
          style={{ '--fill-level': `${phase.completion}%` } as React.CSSProperties}
          onClick={() => onPhaseSelect?.(phase)}
          role="button"
          tabIndex={0}
          aria-label={`${phase.name} - ${phase.completion}% complete`}
        >
          <div className="phase-content">
            <div className="phase-label">{phase.name}</div>
            <div className="phase-completion">{phase.completion}%</div>
            {phase.status === 'active' && (
              <div className="phase-status-badge">In Progress</div>
            )}
          </div>
          
          {showMilestones && phase.milestone && (
            <div 
              className="fda-milestone-marker"
              title={`${phase.milestone.name} - ${Math.round(phase.milestone.probability * 100)}% probability`}
            >
              <div className="milestone-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="currentColor"
                    opacity="0.8"
                  />
                </svg>
              </div>
              {phase.milestone.date && (
                <div className="milestone-date">{phase.milestone.date}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

ClinicalTrialGlassTimeline.displayName = 'ClinicalTrialGlassTimeline';
