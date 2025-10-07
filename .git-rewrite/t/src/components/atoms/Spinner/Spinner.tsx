import React from 'react';
import clsx from 'clsx';
import type { Size } from '../../../types';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: Size;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
}) => {
  return (
    <div
      className={clsx(styles.spinner, styles[size], className)}
      role="progressbar"
      aria-label="Loading"
    />
  );
};
