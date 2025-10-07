import '../../vendor/openbb/tables/index.css';

import { useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Table from '../../vendor/openbb/tables/components/Table/index';

export type OpenBBGridValue = string | number | boolean | null | undefined;

export interface OpenBBTablePayload {
  /** Column headers in display order */
  columns: string[];
  /** 2D row data matching the supplied columns */
  data: OpenBBGridValue[][];
  /** Optional title shown in the table header */
  title?: string;
  /** Light or dark theme preference */
  theme?: 'light' | 'dark';
  /** Original command location metadata (used in export footer) */
  command_location?: string;
}

export interface OpenBBTableProps {
  payload: OpenBBTablePayload;
  className?: string;
}

interface TransformedData {
  rows: Record<string, OpenBBGridValue>[];
  columns: string[];
  title: string;
  theme: 'light' | 'dark';
  commandLocation: string;
}

export const transformOpenBBTablePayload = (
  payload: OpenBBTablePayload,
): TransformedData => {
  const { columns, data, title, theme, command_location } = payload;

  const safeColumns = Array.isArray(columns) ? columns : [];
  const hydratedRows = (Array.isArray(data) ? data : []).map((row, rowIndex) => {
    const record: Record<string, OpenBBGridValue> = {};

    safeColumns.forEach((column, columnIndex) => {
      const value = Array.isArray(row) ? row[columnIndex] : undefined;
      const key = column ?? `col_${columnIndex}`;
      record[key] =
        value !== undefined && value !== null && value !== ''
          ? value
          : value === 0
            ? 0
            : '';
    });

    // Preserve row index for components expecting an index field.
    if (record.index === undefined && record.Index === undefined) {
      record.index = rowIndex + 1;
    }

    return record;
  });

  return {
    rows: hydratedRows,
    columns: safeColumns,
    title: title ?? 'INTERACTIVE TABLE',
    theme: theme === 'dark' ? 'dark' : 'light',
    commandLocation: command_location ?? '',
  };
};

export const OpenBBTable: React.FC<OpenBBTableProps> = ({ payload, className }) => {
  const transformed = useMemo(
    () => transformOpenBBTablePayload(payload),
    [payload],
  );

  if (!transformed.columns.length) {
    return null;
  }

  return (
    <div className={className}>
      <DndProvider backend={HTML5Backend}>
        <Table
          title={transformed.title}
          data={transformed.rows}
          columns={transformed.columns}
          initialTheme={transformed.theme}
          cmd={transformed.commandLocation}
        />
      </DndProvider>
    </div>
  );
};

export default OpenBBTable;
