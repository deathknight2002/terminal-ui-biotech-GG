import React from 'react';
import clsx from 'clsx';
import styles from './Text.module.css';

export type TextVariant =
  | 'display-lg'
  | 'display'
  | 'heading-lg'
  | 'heading'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'body-lg'
  | 'body'
  | 'body-sm'
  | 'caption'
  | 'label'
  | 'code';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'accent';

export interface TextProps {
  /**
   * Text variant/size
   * @default 'body'
   */
  variant?: TextVariant;

  /**
   * Text color
   * @default 'primary'
   */
  color?: TextColor;

  /**
   * Font weight
   * @default 400
   */
  weight?: 400 | 600;

  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Truncate text with ellipsis
   * @default false
   */
  truncate?: boolean;

  /**
   * Transform text to uppercase
   * @default false
   */
  uppercase?: boolean;

  /**
   * Use tabular numbers (monospace digits)
   * @default false
   */
  tabularNums?: boolean;

  /**
   * HTML element to render as
   * @default 'p'
   */
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: React.CSSProperties;

  /**
   * Text content
   */
  children: React.ReactNode;
}

/**
 * Text component - Typography component with monospace font
 *
 * @example
 * ```tsx
 * <Text variant="heading" color="accent">
 *   AGENT DATA OVERVIEW
 * </Text>
 * ```
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  truncate = false,
  uppercase = false,
  tabularNums = false,
  as: Component = 'p',
  className,
  style,
  children,
}) => {
  const classes = clsx(
    styles.text,
    styles[variant],
    styles[color],
    weight && styles[`weight-${weight}`],
    styles[`align-${align}`],
    truncate && styles.truncate,
    uppercase && styles.uppercase,
    tabularNums && styles['tabular-nums'],
    className
  );

  return <Component className={classes} style={style}>{children}</Component>;
};
