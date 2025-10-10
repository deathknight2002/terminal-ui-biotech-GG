import React from 'react';
import type { RefreshMode } from '../../../../../src/types/biotech';
import './RefreshModeToggle.css';

export interface RefreshModeToggleProps {
  mode: RefreshMode;
  onChange: (mode: RefreshMode) => void;
  lastRefreshed?: string;
  scheduledInterval?: number; // minutes for scheduled mode
  className?: string;
}

/**
 * RefreshModeToggle - Toggle between Manual, Scheduled, and Live refresh modes
 * 
 * Modes:
 * - Manual: Zero background network after load; refresh button updates data (DEFAULT)
 * - Scheduled: Pull every N minutes; show countdown; pause on user edit
 * - Live: Stream incremental updates; show change badges; offer "apply diff" before mutating
 */
export function RefreshModeToggle({
  mode,
  onChange,
  lastRefreshed,
  scheduledInterval = 10,
  className = '',
}: RefreshModeToggleProps) {
  const formatLastRefreshed = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`refresh-mode-toggle ${className}`}>
      <div className="refresh-mode-buttons">
        <button
          className={`mode-button ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => onChange('manual')}
          title="Manual refresh only - zero background network"
        >
          <span className="mode-icon">⟳</span>
          <span className="mode-label">MANUAL</span>
        </button>
        <button
          className={`mode-button ${mode === 'scheduled' ? 'active' : ''}`}
          onClick={() => onChange('scheduled')}
          title={`Scheduled refresh every ${scheduledInterval} minutes`}
        >
          <span className="mode-icon">⏱</span>
          <span className="mode-label">SCHEDULED</span>
        </button>
        <button
          className={`mode-button ${mode === 'live' ? 'active' : ''}`}
          onClick={() => onChange('live')}
          title="Live streaming updates with diff preview"
        >
          <span className="mode-icon">⚡</span>
          <span className="mode-label">LIVE</span>
        </button>
      </div>
      
      {lastRefreshed && (
        <div className="refresh-status">
          <span className="status-label">LAST REFRESH:</span>
          <span className="status-value">{formatLastRefreshed(lastRefreshed)}</span>
        </div>
      )}

      <div className="mode-description">
        {mode === 'manual' && (
          <p>
            <strong>Manual:</strong> Zero background network. Click refresh to update.
            {lastRefreshed && ` Updated ${formatLastRefreshed(lastRefreshed)}.`}
          </p>
        )}
        {mode === 'scheduled' && (
          <p>
            <strong>Scheduled:</strong> Auto-refresh every {scheduledInterval} minutes.
            Pauses on user edit.
          </p>
        )}
        {mode === 'live' && (
          <p>
            <strong>Live:</strong> Streaming updates. Review changes before applying to notes.
          </p>
        )}
      </div>
    </div>
  );
}
