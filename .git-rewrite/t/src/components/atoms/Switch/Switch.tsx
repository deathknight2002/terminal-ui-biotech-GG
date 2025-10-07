import React, { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className, disabled, ...props }, ref) => {
    return (
      <label className={clsx(styles.wrapper, disabled && styles.disabled, className)}>
        <span className={styles.switch}>
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            className={styles.input}
            disabled={disabled}
            {...props}
          />
          <span className={styles.track}>
            <span className={styles.thumb} />
          </span>
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
