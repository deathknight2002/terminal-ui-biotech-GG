import React from 'react';
import clsx from 'clsx';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  dense?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  dense = false,
  className,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  return (
    <div className={clsx(styles['table-container'], className)}>
      <table className={clsx(styles.table, dense && styles.dense)}>
        <thead className={styles.header}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={styles['header-cell']}
                style={{
                  width: column.width,
                  textAlign: column.align || 'left',
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row, rowIndex)}
                className={clsx(
                  styles.row,
                  onRowClick && styles.clickable
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={styles.cell}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
