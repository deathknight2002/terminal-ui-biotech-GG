import React from 'react';
import './StatusBanner.css';

export interface StatusBannerProps {
  /** Message to display */
  message: string;
  /** Variant of the banner */
  variant?: 'info' | 'warning' | 'error';
  /** Whether the banner is visible */
  visible: boolean;
  /** Callback when dismiss button is clicked */
  onDismiss: () => void;
}

/**
 * StatusBanner - Dismissible banner for API status messages
 * 
 * Used for 429/5xx errors to inform users that cached data is being shown
 * while the service is busy. Implements WCAG accessibility with role="status"
 * and aria-live="polite".
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({
  message,
  variant = 'warning',
  visible,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <div
      className={`status-banner status-banner--${variant}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="status-banner__content">
        <span className="status-banner__icon">
          {variant === 'error' && '⚠️'}
          {variant === 'warning' && '⏳'}
          {variant === 'info' && 'ℹ️'}
        </span>
        <span className="status-banner__message">{message}</span>
      </div>
      <button
        className="status-banner__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss status message"
        type="button"
      >
        ✕
      </button>
    </div>
  );
};
