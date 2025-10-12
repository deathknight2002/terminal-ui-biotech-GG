/**
 * Export utilities for terminal data
 * Supports CSV, JSON, and Excel-like formats
 */

export interface ExportOptions {
  filename?: string;
  format: 'csv' | 'json' | 'tsv';
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], columns?: string[], filename: string = 'export.csv'): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine columns from first data item if not provided
  const headers = columns || Object.keys(data[0]);
  
  // Build CSV content
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      // Handle different data types
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return `"${value}"`;
    });
    csvRows.push(row.join(','));
  });

  // Create and download file
  downloadFile(csvRows.join('\n'), filename, 'text/csv');
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any[], filename: string = 'export.json', pretty: boolean = true): void {
  const jsonStr = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  downloadFile(jsonStr, filename, 'application/json');
}

/**
 * Export data to TSV (Tab-Separated Values) format
 */
export function exportToTSV(data: any[], columns?: string[], filename: string = 'export.tsv'): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = columns || Object.keys(data[0]);
  
  const tsvRows: string[] = [];
  tsvRows.push(headers.join('\t'));
  
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    tsvRows.push(row.join('\t'));
  });

  downloadFile(tsvRows.join('\n'), filename, 'text/tab-separated-values');
}

/**
 * Generic export function that routes to specific format handlers
 */
export function exportData(data: any[], options: ExportOptions): void {
  const { format, filename } = options;
  
  switch (format) {
    case 'csv':
      exportToCSV(data, undefined, filename || 'export.csv');
      break;
    case 'json':
      exportToJSON(data, filename || 'export.json');
      break;
    case 'tsv':
      exportToTSV(data, undefined, filename || 'export.tsv');
      break;
    default:
      console.error(`Unsupported export format: ${format}`);
  }
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Copy data to clipboard in various formats
 */
export async function copyToClipboard(data: any[], format: 'csv' | 'json' | 'tsv' = 'csv'): Promise<void> {
  let content: string;
  
  switch (format) {
    case 'csv':
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(item => headers.map(h => item[h]).join(','))
      ];
      content = csvRows.join('\n');
      break;
    case 'json':
      content = JSON.stringify(data, null, 2);
      break;
    case 'tsv':
      const headersT = Object.keys(data[0]);
      const tsvRows = [
        headersT.join('\t'),
        ...data.map(item => headersT.map(h => item[h]).join('\t'))
      ];
      content = tsvRows.join('\n');
      break;
  }
  
  try {
    await navigator.clipboard.writeText(content);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    throw err;
  }
}

/**
 * Format number with comma separators
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = format === 'short'
    ? { month: 'numeric', day: 'numeric', year: '2-digit' }
    : format === 'medium'
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'long', day: 'numeric', year: 'numeric' };
  
  return d.toLocaleDateString('en-US', options);
}
