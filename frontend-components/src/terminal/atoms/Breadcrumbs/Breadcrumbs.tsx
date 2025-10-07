import React from 'react';
import clsx from 'clsx';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = '/',
  className,
  style,
}) => {
  return (
    <nav aria-label="Breadcrumb" className={clsx(styles.breadcrumbs, className)} style={style}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className={styles.item}>
              {isLast ? (
                <span className={clsx(styles.link, styles.current)} aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <a href={item.href} className={styles.link}>
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button onClick={item.onClick} className={styles.link}>
                  {item.label}
                </button>
              ) : (
                <span className={styles.link}>{item.label}</span>
              )}
              {!isLast && <span className={styles.separator}>{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
