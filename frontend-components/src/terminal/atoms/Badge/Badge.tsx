import React from 'react';
import clsx from 'clsx';
import type { Status } from '@/types';
import styles from './Badge.module.css';

export interface BadgeProps {
  variant?: 'default' | 'primary' | Status;
  filled?: boolean;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  filled = false,
  dot = false,
  removable = false,
  onRemove,
  className,
  style,
  children,
}) => {
  return (
    <span
      className={clsx(
        styles.badge,
        styles[variant],
        filled && styles.filled,
        removable && styles.removable,
        className
      )}
      style={style}
    >
      {dot && <span className={styles.dot} />}
      {children}
      {removable && (
        <button
          type="button"
          className={styles['remove-button']}
          onClick={onRemove}
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
};
