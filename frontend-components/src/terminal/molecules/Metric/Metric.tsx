import React from 'react';
import clsx from 'clsx';
import styles from './Metric.module.css';

export interface MetricProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  change,
  changeLabel,
  trend = 'neutral',
  className,
}) => {
  const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●';

  return (
    <div className={clsx(styles.metric, className)}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {change !== undefined && (
        <div className={clsx(styles.change, styles[`trend-${trend}`])}>
          <span>{trendSymbol}</span>
          <span>
            {change > 0 ? '+' : ''}
            {change}%
          </span>
          {changeLabel && <span>{changeLabel}</span>}
        </div>
      )}
    </div>
  );
};
