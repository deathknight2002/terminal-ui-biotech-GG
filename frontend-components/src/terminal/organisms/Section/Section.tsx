import React from 'react';
import clsx from 'clsx';
import styles from './Section.module.css';

export interface SectionProps {
  title: string;
  variant?: 'default' | 'warning' | 'danger' | 'success' | 'info';
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Section: React.FC<SectionProps> = ({
  title,
  variant = 'default',
  children,
  noPadding = false,
  className,
  style,
}) => {
  return (
    <div className={clsx(styles.section, className)} style={style}>
      <div className={clsx(styles.header, styles[variant])}>
        {title}
      </div>
      <div className={clsx(styles.content, noPadding && styles.noPadding)}>
        {children}
      </div>
    </div>
  );
};
