import React from 'react';
import './CredenceBadge.css';

/**
 * Credence Badge Types
 */
export type CredenceType = 
  | 'db-lock'           // Database lock - trial data locked
  | 'sap-lock'          // Statistical Analysis Plan locked
  | 'adjudication'      // Endpoint adjudication complete
  | 'federal-register'  // Federal Register posting (AdComm confirmed)
  | 'pdufa-letter'      // PDUFA action date confirmed by FDA
  | 'chmp-agenda'       // CHMP meeting agenda published
  | 'filing-accepted'   // Regulatory filing accepted for review
  | 'biomarker-only'    // Surrogate endpoint (needs confirmation)
  | 'post-hoc'          // Post-hoc analysis (lower credence)
  | 'unblinded'         // Open-label study (bias risk);

/**
 * Credence Badge Props
 */
export interface CredenceBadgeProps {
  /** Type of credence indicator */
  type: CredenceType;
  /** Optional custom label (overrides default) */
  label?: string;
  /** Source URL for verification */
  sourceUrl?: string;
  /** Date when credence was established */
  date?: string;
  /** Show as small badge */
  compact?: boolean;
  /** Show tooltip with details */
  showTooltip?: boolean;
}

/**
 * Credence Badge Component
 * 
 * Displays data credibility indicators for catalysts and evidence:
 * - DB-lock: Database locked, unblinding imminent
 * - SAP-lock: Statistical Analysis Plan finalized
 * - Adjudication: Endpoint adjudication complete
 * - Federal Register: AdComm meeting confirmed
 * - etc.
 * 
 * Automatically upgrades dateConfidence when credence indicators appear.
 * 
 * Example:
 * ```tsx
 * <CredenceBadge 
 *   type="db-lock" 
 *   sourceUrl="https://clinicaltrials.gov/study/NCT12345678"
 *   date="2026-03-15"
 * />
 * <CredenceBadge type="federal-register" label="AdComm Confirmed" />
 * ```
 */
export const CredenceBadge: React.FC<CredenceBadgeProps> = ({
  type,
  label,
  sourceUrl,
  date,
  compact = false,
  showTooltip = true,
}) => {
  // Default labels and descriptions for each type
  const credenceInfo: Record<CredenceType, { label: string; desc: string; confidence: 'high' | 'medium' | 'low' }> = {
    'db-lock': {
      label: 'DB-LOCK',
      desc: 'Database locked; primary analysis imminent',
      confidence: 'high',
    },
    'sap-lock': {
      label: 'SAP-LOCK',
      desc: 'Statistical Analysis Plan finalized and locked',
      confidence: 'high',
    },
    'adjudication': {
      label: 'ADJUDICATION',
      desc: 'Endpoint adjudication committee completed review',
      confidence: 'high',
    },
    'federal-register': {
      label: 'FED. REGISTER',
      desc: 'Federal Register posting confirms meeting date',
      confidence: 'high',
    },
    'pdufa-letter': {
      label: 'PDUFA LETTER',
      desc: 'FDA PDUFA action date confirmed in official letter',
      confidence: 'high',
    },
    'chmp-agenda': {
      label: 'CHMP AGENDA',
      desc: 'EMA CHMP meeting agenda published',
      confidence: 'high',
    },
    'filing-accepted': {
      label: 'FILING ACCEPTED',
      desc: 'Regulatory filing accepted for review (NDA/BLA/MAA)',
      confidence: 'high',
    },
    'biomarker-only': {
      label: 'BIOMARKER',
      desc: 'Surrogate endpoint; confirmatory trial required',
      confidence: 'medium',
    },
    'post-hoc': {
      label: 'POST-HOC',
      desc: 'Post-hoc analysis; not pre-specified',
      confidence: 'low',
    },
    'unblinded': {
      label: 'UNBLINDED',
      desc: 'Open-label study; potential bias',
      confidence: 'medium',
    },
  };

  const info = credenceInfo[type];
  const displayLabel = label || info.label;
  const confidence = info.confidence;

  const badge = (
    <div 
      className={`credence-badge credence-badge--${confidence} ${compact ? 'credence-badge--compact' : ''}`}
      title={showTooltip ? info.desc : undefined}
    >
      <span className="credence-badge__icon">
        {confidence === 'high' ? '🔒' : confidence === 'medium' ? '⚠️' : '⚡'}
      </span>
      <span className="credence-badge__label">{displayLabel}</span>
      {date && !compact && (
        <span className="credence-badge__date">{formatDate(date)}</span>
      )}
    </div>
  );

  if (sourceUrl) {
    return (
      <a 
        href={sourceUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="credence-badge__link"
      >
        {badge}
      </a>
    );
  }

  return badge;
};

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Credence Badge Group - Display multiple badges
 */
export interface CredenceBadgeGroupProps {
  badges: Array<Omit<CredenceBadgeProps, 'compact'>>;
  compact?: boolean;
  maxVisible?: number; // Show only first N badges, rest in "+X more"
}

export const CredenceBadgeGroup: React.FC<CredenceBadgeGroupProps> = ({
  badges,
  compact = false,
  maxVisible,
}) => {
  const visibleBadges = maxVisible ? badges.slice(0, maxVisible) : badges;
  const hiddenCount = maxVisible ? badges.length - maxVisible : 0;

  return (
    <div className="credence-badge-group">
      {visibleBadges.map((badgeProps, idx) => (
        <CredenceBadge key={idx} {...badgeProps} compact={compact} />
      ))}
      {hiddenCount > 0 && (
        <div className="credence-badge-group__more" title={`${hiddenCount} more credence indicators`}>
          +{hiddenCount} more
        </div>
      )}
    </div>
  );
};
