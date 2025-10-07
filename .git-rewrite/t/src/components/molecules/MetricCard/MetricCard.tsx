import React from 'react';
import clsx from 'clsx';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'flat';
  change?: number;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'revenue' | 'expense' | 'milestone' | 'royalty';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  trend,
  change,
  icon,
  variant = 'primary',
  size = 'md',
  animated = true,
  className,
  onClick
}: MetricCardProps) {
  const isClickable = Boolean(onClick);
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1_000_000) {
        return `$${(val / 1_000_000).toFixed(1)}M`;
      }
      if (val >= 1_000) {
        return `$${(val / 1_000).toFixed(0)}K`;
      }
      if (val < 1 && val > 0) {
        return `$${val.toFixed(2)}`;
      }
      return `$${val.toLocaleString()}`;
    }
    return val;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <span className="trend-icon">↗</span>;
      case 'down':
        return <span className="trend-icon">↘</span>;
      case 'flat':
        return <span className="trend-icon">→</span>;
      default:
        return null;
    }
  };

  const formatChange = (changeValue: number) => {
    const sign = changeValue > 0 ? '+' : '';
    return `${sign}${changeValue.toFixed(1)}%`;
  };

  const cardContent = (
    <>
      {/* Header with icon and label */}
      <div className="metric-header">
        {icon && <div className="metric-icon">{icon}</div>}
        <span className="metric-label">{label}</span>
      </div>

      {/* Main value */}
      <div className="metric-value">
        {formatValue(value)}
      </div>

      {/* Trend and change indicator */}
      {(trend || change !== undefined) && (
        <div className="metric-trend">
          {getTrendIcon()}
          {change !== undefined && (
            <span className={clsx(
              'metric-change',
              `metric-change--${trend || 'flat'}`
            )}>
              {formatChange(change)}
            </span>
          )}
        </div>
      )}

      {/* Glow effect for animated cards */}
      {animated && <div className="metric-glow" />}
    </>
  );

  const cardClasses = clsx(
    'metric-card',
    `metric-card--${variant}`,
    `metric-card--${size}`,
    {
      'metric-card--animated': animated,
      'metric-card--clickable': isClickable,
      [`metric-card--trend-${trend}`]: trend,
    },
    className
  );

  if (isClickable) {
    return (
      <button
        className={cardClasses}
        onClick={onClick}
        type="button"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
  );
}
