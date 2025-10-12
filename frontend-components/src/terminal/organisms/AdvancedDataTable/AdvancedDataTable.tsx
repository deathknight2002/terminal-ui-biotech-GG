import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Copy, Search, Filter } from 'lucide-react';
import { exportToCSV, exportToJSON, copyToClipboard } from '../../../../../src/utils/exportUtils';
import './AdvancedDataTable.css';

export interface Column<T = any> {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (row: T, value: any) => React.ReactNode;
  format?: (value: any) => string;
}

export interface AdvancedDataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  title?: string;
  maxHeight?: number;
  striped?: boolean;
  hoverable?: boolean;
  exportable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pageSize?: number;
  cornerBrackets?: boolean;
  className?: string;
}

export const AdvancedDataTable = <T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  title,
  maxHeight = 600,
  striped = true,
  hoverable = true,
  exportable = true,
  searchable = true,
  filterable = true,
  sortable = true,
  pageSize = 50,
  cornerBrackets = false,
  className = '',
}: AdvancedDataTableProps<T>) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchQuery && searchable) {
      result = result.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    if (filterable) {
      Object.entries(columnFilters).forEach(([key, filterValue]) => {
        if (filterValue) {
          result = result.filter(row =>
            String(row[key]).toLowerCase().includes(filterValue.toLowerCase())
          );
        }
      });
    }
    return result;
  }, [data, searchQuery, columnFilters, searchable, filterable]);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortable) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection, sortable]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(sortedData, columns.map(c => c.key), `${title || 'data'}.csv`);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    exportToJSON(sortedData, `${title || 'data'}.json`);
    setShowExportMenu(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      await copyToClipboard(sortedData, 'csv');
      setShowExportMenu(false);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleColumnFilter = (columnKey: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [columnKey]: value }));
    setCurrentPage(1);
  };

  return (
    <div className={`advanced-data-table ${cornerBrackets ? 'corner-brackets' : ''} ${className}`}>
      {(title || searchable || exportable) && (
        <div className="table-header">
          {title && <h3 className="table-title">{title}</h3>}
          <div className="table-controls">
            {searchable && (
              <div className="search-control">
                <Search size={16} />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="search-input" />
              </div>
            )}
            {exportable && (
              <div className="export-control">
                <button className="export-button" onClick={() => setShowExportMenu(!showExportMenu)}>
                  <Download size={16} /> EXPORT
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button onClick={handleExportCSV}><Download size={14} /> Export CSV</button>
                    <button onClick={handleExportJSON}><Download size={14} /> Export JSON</button>
                    <button onClick={handleCopyToClipboard}><Copy size={14} /> Copy to Clipboard</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="table-container" style={{ maxHeight: `${maxHeight}px` }}>
        <table className={`data-table ${striped ? 'striped' : ''} ${hoverable ? 'hoverable' : ''}`}>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.key} style={{ width: column.width ? `${column.width}px` : 'auto', textAlign: column.align || 'left' }} className={sortable && column.sortable !== false ? 'sortable' : ''}>
                  <div className="th-content">
                    <div className="th-label" onClick={() => column.sortable !== false && handleSort(column.key)}>
                      {column.header}
                      {sortable && column.sortable !== false && (
                        <span className="sort-icon">
                          {sortColumn === column.key ? (sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : (<ArrowUpDown size={14} />)}
                        </span>
                      )}
                    </div>
                    {filterable && column.filterable !== false && (
                      <div className="column-filter">
                        <Filter size={12} />
                        <input type="text" placeholder="Filter..." value={columnFilters[column.key] || ''} onChange={(e) => handleColumnFilter(column.key, e.target.value)} onClick={(e) => e.stopPropagation()} className="filter-input" />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan={columns.length} className="empty-state">No data available</td></tr>
            ) : (
              paginatedData.map(row => (
                <tr key={keyExtractor(row)}>
                  {columns.map(column => {
                    const value = row[column.key];
                    const formatted = column.format ? column.format(value) : value;
                    const rendered = column.render ? column.render(row, value) : formatted;
                    return (<td key={column.key} style={{ textAlign: column.align || 'left' }}>{rendered}</td>);
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="table-footer">
          <div className="pagination-info">Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} rows</div>
          <div className="pagination-controls">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="pagination-button">‹‹</button>
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="pagination-button">‹</button>
            <span className="page-indicator">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="pagination-button">›</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="pagination-button">››</button>
          </div>
        </div>
      )}
    </div>
  );
};
