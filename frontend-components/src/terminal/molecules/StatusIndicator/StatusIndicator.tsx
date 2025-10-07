import React from 'react';
import clsx from 'clsx';
import type { Status } from '@/types';
import styles from './StatusIndicator.module.css';

export interface StatusIndicatorProps {
  status: Status;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  pulse = false,
  className,
}) => {
  return (
    <div className={clsx(styles.status, styles[status], className)}>
      <span className={clsx(styles.dot, pulse && styles.pulse)} />
      {label && <span>{label}</span>}
    </div>
  );
};
