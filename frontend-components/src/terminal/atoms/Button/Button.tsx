import React, { forwardRef } from 'react';
import clsx from 'clsx';
import type { Variant, Size } from '../../types';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * @default 'secondary'
   */
  variant?: Variant;

  /**
   * Size of the button
   * @default 'md'
   */
  size?: Size;

  /**
   * Whether button text should be uppercase
   * @default true
   */
  uppercase?: boolean;

  /**
   * Whether button should fill container width
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Whether button is in loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Icon to display (left or right of text)
   */
  icon?: React.ReactNode;

  /**
   * Icon position
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';

  /**
   * Button content
   */
  children?: React.ReactNode;
}

/**
 * Button component - Terminal UI styled button
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   DEPLOY MISSION
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      uppercase = true,
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = clsx(
      styles.button,
      styles[variant],
      size !== 'md' && styles[size],
      uppercase && styles.uppercase,
      fullWidth && styles.fullWidth,
      loading && styles.loading,
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <progress className={styles.spinner} aria-label="Loading" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className={styles.icon}>{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && (
              <span className={styles.icon}>{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
