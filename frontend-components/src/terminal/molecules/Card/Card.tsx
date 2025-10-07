import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  noPadding?: boolean;
  bordered?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  footer,
  noPadding = false,
  bordered = false,
  onClick,
  className,
  children,
}) => {
  return (
    <div
      className={clsx(
        styles.card,
        onClick && styles.clickable,
        bordered && styles.bordered,
        className
      )}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className={styles.header}>
          {title && <div className={styles.title}>{title}</div>}
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      )}
      <div className={clsx(styles.content, noPadding && styles['no-padding'])}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};
