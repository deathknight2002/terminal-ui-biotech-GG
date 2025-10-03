import React, { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, disabled, ...props }, ref) => {
    return (
      <label className={clsx(styles.wrapper, disabled && styles.disabled, className)}>
        <span className={styles.checkbox}>
          <input
            ref={ref}
            type="checkbox"
            className={styles.input}
            disabled={disabled}
            {...props}
          />
          <span className={styles.box}>
            <svg className={styles.checkmark} viewBox="0 0 10 10" fill="none">
              <path
                d="M1 5L4 8L9 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </svg>
          </span>
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
