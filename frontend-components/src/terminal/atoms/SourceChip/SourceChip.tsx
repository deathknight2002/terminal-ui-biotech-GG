import React from 'react';
import type { Citation, Provenance } from '../../../../../src/types/biotech';
import './SourceChip.css';

export interface SourceChipProps {
  /** Citation with provenance data */
  citation?: Citation;
  /** Legacy provenance object */
  provenance?: Provenance;
  /** Whether to show warning for missing provenance */
  showWarning?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * SourceChip - Display provenance information for data
 * 
 * Shows source domain and pull timestamp. Required for all evidence data.
 * Missing provenance displays a warning glyph.
 * 
 * @example
 * ```tsx
 * <SourceChip citation={{
 *   url: "https://platform.opentargets.org/target/ENSG00000113302",
 *   domain: "opentargets.org",
 *   pulledAt: "2024-01-15T10:30:00Z"
 * }} />
 * ```
 */
export function SourceChip({
  citation,
  provenance,
  showWarning = true,
  className = '',
  onClick
}: SourceChipProps) {
  // Extract data from either citation or provenance
  const domain = citation?.domain || provenance?.source.domain;
  const pulledAt = citation?.pulledAt || provenance?.source.pulledAt;
  const url = citation?.url || provenance?.source.url;
  
  // Show warning if no provenance data
  if (!domain || !pulledAt) {
    if (!showWarning) return null;
    
    return (
      <div className={`source-chip source-chip--missing ${className}`}>
        <span className="source-chip__warning" title="Missing provenance data">⚠</span>
        <span className="source-chip__text">NO SOURCE</span>
      </div>
    );
  }
  
  // Format timestamp
  const date = new Date(pulledAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <div 
      className={`source-chip ${onClick || url ? 'source-chip--clickable' : ''} ${className}`}
      onClick={handleClick}
      role={onClick || url ? 'button' : undefined}
      tabIndex={onClick || url ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && (onClick || url)) {
          e.preventDefault();
          handleClick();
        }
      }}
      title={url || undefined}
    >
      <span className="source-chip__domain">{domain}</span>
      <span className="source-chip__separator">·</span>
      <span className="source-chip__date">{formattedDate}</span>
    </div>
  );
}
