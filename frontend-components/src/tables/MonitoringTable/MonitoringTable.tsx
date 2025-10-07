import React from 'react';
import clsx from 'clsx';
import styles from './MonitoringTable.module.css';
import type { Status } from '../../../types';

export interface MonitoringRow {
  id: string;
  label: string;
  description: string;
  status?: Status;
  progress?: number;
  actionLabel?: string;
  actionVariant?: 'primary' | 'secondary' | 'danger';
  meta?: string;
}

export interface MonitoringTableProps {
  rows: MonitoringRow[];
  onAction?: (rowId: string) => void;
  className?: string;
}

export const MonitoringTable: React.FC<MonitoringTableProps> = ({
  rows,
  onAction,
  className,
}) => {
  return (
    <div className={clsx(styles.monitoringTable, className)}>
      {rows.map((row) => (
        <div
          key={row.id}
          className={clsx(
            styles.row,
            row.status && styles[row.status]
          )}
        >
          <div className={styles.main}>
            <div className={styles.header}>
              <span className={styles.label}>{row.label}</span>
              {row.meta && <span className={styles.meta}>{row.meta}</span>}
            </div>
            <div className={styles.description}>{row.description}</div>
            {row.progress !== undefined && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${row.progress}%` }}
                />
              </div>
            )}
          </div>
          {row.actionLabel && (
            <button
              className={clsx(
                styles.actionButton,
                row.actionVariant && styles[`action-${row.actionVariant}`]
              )}
              onClick={() => onAction?.(row.id)}
            >
              {row.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
