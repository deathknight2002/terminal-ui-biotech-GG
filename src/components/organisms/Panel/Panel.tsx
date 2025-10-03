import React from 'react';
import clsx from 'clsx';
import styles from './Panel.module.css';

export interface PanelProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  cornerBrackets?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  actions,
  footer,
  noPadding = false,
  cornerBrackets = false,
  className,
  style,
  children,
}) => {
  return (
    <div className={clsx(styles.panel, cornerBrackets && styles['corner-brackets'], noPadding && styles['no-padding'], className)} style={style}>
      {(title || subtitle || actions) && (
        <div className={styles.header}>
          <div className={styles['title-section']}>
            {title && <div className={styles.title}>{title}</div>}
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};
