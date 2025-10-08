import React from 'react';
import clsx from 'clsx';
import type { Status, Size } from '@/types';
import styles from './Progress.module.css';

export interface ProgressProps {
  value?: number;
  max?: number;
  variant?: 'default' | Status;
  size?: Size;
  indeterminate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  indeterminate = false,
  className,
  style,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={clsx(styles.progress, styles[size], className)}
      style={style}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={clsx(
          styles.bar,
          variant !== 'default' && styles[variant],
          indeterminate && styles.animated
        )}
        style={{ width: indeterminate ? '25%' : `${percentage}%` }}
      />
    </div>
  );
};
