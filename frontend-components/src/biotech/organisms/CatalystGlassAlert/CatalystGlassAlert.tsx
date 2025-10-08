import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import '../../../../src/styles/glass-ui-enhanced.css';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 'fda' | 'trial' | 'market' | 'regulatory' | 'clinical';

export interface CatalystAlert {
  /** Alert ID */
  id: string;
  
  /** Alert title */
  title: string;
  
  /** Alert message */
  message: string;
  
  /** Alert priority level */
  priority: AlertPriority;
  
  /** Alert type/category */
  type: AlertType;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Company/asset ticker */
  ticker?: string;
  
  /** Associated action */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface CatalystGlassAlertProps {
  /** Alert data */
  alert: CatalystAlert;
  
  /** Auto-dismiss after milliseconds */
  autoDismiss?: number;
  
  /** Show timestamp */
  showTimestamp?: boolean;
  
  /** Dismiss handler */
  onDismiss?: (alertId: string) => void;
  
  /** Click handler */
  onClick?: (alert: CatalystAlert) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * CatalystGlassAlert - Priority-based glass notification system
 * 
 * Features:
 * - Priority-based opacity and visual hierarchy
 * - Slide-in animation from right
 * - Auto-dismiss capability
 * - FDA, trial, market, and regulatory alert types
 * - Interactive actions
 * 
 * Perfect for real-time catalyst tracking, FDA announcements,
 * and market-moving events.
 * 
 * @example
 * ```tsx
 * <CatalystGlassAlert
 *   alert={{
 *     id: '1',
 *     title: 'FDA Approval Decision',
 *     message: 'PDUFA date approaching for XYZ-123',
 *     priority: 'critical',
 *     type: 'fda',
 *     timestamp: new Date(),
 *     ticker: 'XYZ'
 *   }}
 *   autoDismiss={5000}
 * />
 * ```
 */
export const CatalystGlassAlert: React.FC<CatalystGlassAlertProps> = ({
  alert,
  autoDismiss,
  showTimestamp = true,
  onDismiss,
  onClick,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss && autoDismiss > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(alert.id);
    }, 400); // Wait for animation
  };

  const handleClick = () => {
    onClick?.(alert);
  };

  const getAlertIcon = () => {
    const iconMap = {
      fda: '⚕️',
      trial: '🔬',
      market: '📈',
      regulatory: '⚖️',
      clinical: '🏥',
    };
    return iconMap[alert.type] || '📋';
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (!isVisible) return null;

  return (
    <div
      className={clsx('catalyst-glass-alert', className)}
      data-priority={alert.priority}
      onClick={handleClick}
      role="alert"
      aria-live="assertive"
    >
      <div className="alert-header">
        <span className="alert-icon" role="img" aria-label={alert.type}>
          {getAlertIcon()}
        </span>
        <span className="alert-title">{alert.title}</span>
        {alert.ticker && (
          <span className="alert-ticker">${alert.ticker}</span>
        )}
        <button
          className="alert-dismiss"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      </div>
      
      <div className="alert-body">
        <p className="alert-message">{alert.message}</p>
        
        <div className="alert-footer">
          {showTimestamp && (
            <span className="alert-timestamp">
              {formatTimestamp(alert.timestamp)}
            </span>
          )}
          
          {alert.action && (
            <button
              className="alert-action"
              onClick={(e) => {
                e.stopPropagation();
                alert.action?.onClick();
              }}
            >
              {alert.action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

CatalystGlassAlert.displayName = 'CatalystGlassAlert';
