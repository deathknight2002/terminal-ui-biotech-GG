/**
 * Export Service
 * Provides CSV and JSON export functionality for epidemiological data
 */

import { getPrismaClient } from '../db';
import { logger } from '../utils/logger';

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Export filters
 */
export interface ExportFilters {
  diseaseIds?: string[];
  metricTypes?: string[];
  source?: string;
  regionCode?: string;
  fromYear?: number;
  toYear?: number;
  ageGroup?: string;
  sex?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  format: ExportFormat;
  data: string;
  filename: string;
  rowCount: number;
  metadata: {
    exportedAt: Date;
    filters: ExportFilters;
    sources: string[];
  };
}

/**
 * Export data to CSV format
 */
export async function exportToCSV(filters: ExportFilters): Promise<ExportResult> {
  const prisma = getPrismaClient();
  
  try {
    const where = buildWhereClause(filters);
    
    const metrics = await prisma.metric.findMany({
      where,
      include: {
        disease: true,
        provenance: true,
      },
      orderBy: [
        { disease: { name: 'asc' } },
        { metricType: 'asc' },
        { year: 'desc' },
      ],
    });

    const sources = new Set<string>();
    
    // Build CSV header
    const headers = [
      'Disease Name',
      'ICD-10',
      'ICD-11',
      'Category',
      'Metric Type',
      'Value',
      'Unit',
      'Year',
      'Sex',
      'Age Group',
      'Race/Ethnicity',
      'Region',
      'Region Level',
      'Source',
      'Source URL',
      'Reliability Score',
      'Retrieved At',
      'Notes',
    ];

    const rows = metrics.map(m => {
      sources.add(m.source);
      
      return [
        escapeCSV(m.disease.name),
        escapeCSV(m.disease.icd10),
        escapeCSV(m.disease.icd11 || ''),
        escapeCSV(m.disease.category),
        escapeCSV(m.metricType),
        m.valueNumeric !== null ? m.valueNumeric.toString() : '',
        escapeCSV(m.unit || ''),
        m.year !== null ? m.year.toString() : '',
        escapeCSV(m.sex || ''),
        escapeCSV(m.ageGroup || ''),
        escapeCSV(m.raceEthnicity || ''),
        escapeCSV(m.regionCode || ''),
        escapeCSV(m.regionLevel || ''),
        escapeCSV(m.source),
        escapeCSV(m.provenance?.sourceUrl || ''),
        m.provenance?.reliabilityScore !== null ? m.provenance.reliabilityScore.toString() : '',
        m.provenance?.retrievedAt ? m.provenance.retrievedAt.toISOString() : '',
        escapeCSV(m.provenance?.notes || ''),
      ];
    });

    // Build CSV content
    let csvContent = headers.join(',') + '\n';
    csvContent += rows.map(row => row.join(',')).join('\n');
    
    // Add footer with metadata
    csvContent += '\n\n';
    csvContent += `"Export Date","${new Date().toISOString()}"\n`;
    csvContent += `"Total Records","${metrics.length}"\n`;
    csvContent += `"Data Sources","${Array.from(sources).join(', ')}"\n`;
    csvContent += `"Citation","Data from SEER, WHO, and CDC. See source URLs for specific citations."\n`;

    const filename = `epidemiology_export_${Date.now()}.csv`;

    return {
      format: 'csv',
      data: csvContent,
      filename,
      rowCount: metrics.length,
      metadata: {
        exportedAt: new Date(),
        filters,
        sources: Array.from(sources),
      },
    };
  } catch (error) {
    logger.error('Error exporting to CSV', { filters, error });
    throw error;
  }
}

/**
 * Export data to JSON format
 */
export async function exportToJSON(filters: ExportFilters): Promise<ExportResult> {
  const prisma = getPrismaClient();
  
  try {
    const where = buildWhereClause(filters);
    
    const metrics = await prisma.metric.findMany({
      where,
      include: {
        disease: {
          select: {
            id: true,
            name: true,
            icd10: true,
            icd11: true,
            snomed: true,
            category: true,
            description: true,
          },
        },
        provenance: {
          select: {
            sourceName: true,
            sourceUrl: true,
            sourceVersion: true,
            retrievedAt: true,
            ingestedAt: true,
            reliabilityScore: true,
            notes: true,
          },
        },
      },
      orderBy: [
        { disease: { name: 'asc' } },
        { metricType: 'asc' },
        { year: 'desc' },
      ],
    });

    const sources = new Set<string>();
    metrics.forEach(m => sources.add(m.source));

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        totalRecords: metrics.length,
        filters,
        sources: Array.from(sources),
        citation: 'Data from SEER (National Cancer Institute), WHO Global Health Observatory, and CDC. See provenance for specific source URLs.',
      },
      data: metrics.map(m => ({
        disease: m.disease,
        metric: {
          id: m.id,
          type: m.metricType,
          value: m.valueNumeric,
          valueJson: m.valueJson,
          unit: m.unit,
          year: m.year,
          sex: m.sex,
          ageGroup: m.ageGroup,
          raceEthnicity: m.raceEthnicity,
          regionCode: m.regionCode,
          regionLevel: m.regionLevel,
          source: m.source,
        },
        provenance: m.provenance,
      })),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = `epidemiology_export_${Date.now()}.json`;

    return {
      format: 'json',
      data: jsonContent,
      filename,
      rowCount: metrics.length,
      metadata: {
        exportedAt: new Date(),
        filters,
        sources: Array.from(sources),
      },
    };
  } catch (error) {
    logger.error('Error exporting to JSON', { filters, error });
    throw error;
  }
}

/**
 * Export comparison data
 */
export async function exportComparison(
  diseaseIds: string[],
  metricTypes: string[],
  format: ExportFormat = 'csv'
): Promise<ExportResult> {
  const filters: ExportFilters = {
    diseaseIds,
    metricTypes,
  };

  if (format === 'csv') {
    return exportToCSV(filters);
  } else {
    return exportToJSON(filters);
  }
}

/**
 * Build Prisma where clause from filters
 */
function buildWhereClause(filters: ExportFilters): any {
  const where: any = {};

  if (filters.diseaseIds && filters.diseaseIds.length > 0) {
    where.diseaseId = { in: filters.diseaseIds };
  }

  if (filters.metricTypes && filters.metricTypes.length > 0) {
    where.metricType = { in: filters.metricTypes };
  }

  if (filters.source) {
    where.source = filters.source;
  }

  if (filters.regionCode) {
    where.regionCode = filters.regionCode;
  }

  if (filters.fromYear || filters.toYear) {
    where.year = {};
    if (filters.fromYear) {
      where.year.gte = filters.fromYear;
    }
    if (filters.toYear) {
      where.year.lte = filters.toYear;
    }
  }

  if (filters.ageGroup) {
    where.ageGroup = filters.ageGroup;
  }

  if (filters.sex) {
    where.sex = filters.sex;
  }

  return where;
}

/**
 * Escape CSV field
 */
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

/**
 * Generate export summary
 */
export async function getExportSummary(filters: ExportFilters): Promise<{
  estimatedRows: number;
  diseases: number;
  sources: string[];
  dateRange: {
    earliest: number | null;
    latest: number | null;
  };
}> {
  const prisma = getPrismaClient();
  
  try {
    const where = buildWhereClause(filters);
    
    const [count, metrics] = await Promise.all([
      prisma.metric.count({ where }),
      prisma.metric.findMany({
        where,
        select: {
          diseaseId: true,
          source: true,
          year: true,
        },
      }),
    ]);

    const diseases = new Set(metrics.map(m => m.diseaseId));
    const sources = new Set(metrics.map(m => m.source));
    const years = metrics.map(m => m.year).filter(y => y !== null) as number[];

    return {
      estimatedRows: count,
      diseases: diseases.size,
      sources: Array.from(sources),
      dateRange: {
        earliest: years.length > 0 ? Math.min(...years) : null,
        latest: years.length > 0 ? Math.max(...years) : null,
      },
    };
  } catch (error) {
    logger.error('Error getting export summary', { filters, error });
    throw error;
  }
}
