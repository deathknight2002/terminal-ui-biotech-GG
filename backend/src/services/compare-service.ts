/**
 * Compare Service
 * Provides multi-disease analytics and comparison functionality
 */

import { getPrismaClient } from '../db';
import { logger } from '../utils/logger';

/**
 * Comparison result for a single disease
 */
export interface DiseaseComparison {
  diseaseId: string;
  name: string;
  icd10: string;
  metrics: {
    [metricType: string]: {
      value: number | null;
      unit: string | null;
      year: number | null;
      source: string;
    };
  };
}

/**
 * Trend data point
 */
export interface TrendPoint {
  year: number;
  value: number;
  source?: string;
}

/**
 * Compare multiple diseases across specified metrics
 */
export async function compareDiseases(
  diseaseIds: string[],
  metricTypes: string[],
  options?: {
    region?: string;
    ageGroup?: string;
    sex?: string;
    standardized?: boolean;
  }
): Promise<{
  diseases: DiseaseComparison[];
  meta: {
    region: string;
    ageGroup: string;
    sex: string;
    standardized: boolean;
    sources: string[];
    warnings: string[];
  };
}> {
  const prisma = getPrismaClient();
  
  try {
    const diseases = await prisma.disease.findMany({
      where: {
        id: { in: diseaseIds },
      },
      include: {
        metrics: {
          where: {
            metricType: { in: metricTypes },
            ...(options?.region && { regionCode: options.region }),
            ...(options?.ageGroup && { ageGroup: options.ageGroup }),
            ...(options?.sex && { sex: options.sex }),
          },
          orderBy: {
            year: 'desc',
          },
          take: 1, // Get most recent for each metric type
        },
      },
    });

    const warnings: string[] = [];
    const sources = new Set<string>();

    const comparisons: DiseaseComparison[] = diseases.map(disease => {
      const metrics: { [key: string]: any } = {};
      
      for (const metricType of metricTypes) {
        const metric = disease.metrics.find(m => m.metricType === metricType);
        
        if (metric) {
          metrics[metricType] = {
            value: metric.valueNumeric,
            unit: metric.unit,
            year: metric.year,
            source: metric.source,
          };
          sources.add(metric.source);
        } else {
          metrics[metricType] = {
            value: null,
            unit: null,
            year: null,
            source: null,
          };
          warnings.push(`No ${metricType} data available for ${disease.name}`);
        }
      }

      return {
        diseaseId: disease.id,
        name: disease.name,
        icd10: disease.icd10,
        metrics,
      };
    });

    // Check for unit mismatches
    for (const metricType of metricTypes) {
      const units = new Set(
        comparisons
          .map(c => c.metrics[metricType]?.unit)
          .filter(u => u !== null)
      );
      
      if (units.size > 1) {
        warnings.push(`Unit mismatch detected for ${metricType}: ${Array.from(units).join(', ')}`);
      }
    }

    return {
      diseases: comparisons,
      meta: {
        region: options?.region || 'All',
        ageGroup: options?.ageGroup || 'All',
        sex: options?.sex || 'All',
        standardized: options?.standardized || false,
        sources: Array.from(sources),
        warnings,
      },
    };
  } catch (error) {
    logger.error('Error comparing diseases', { diseaseIds, metricTypes, error });
    throw error;
  }
}

/**
 * Get trend data for a disease over time
 */
export async function getDiseaseTrend(
  diseaseId: string,
  metricType: string,
  options?: {
    region?: string;
    fromYear?: number;
    toYear?: number;
    ageGroup?: string;
    sex?: string;
    standardized?: boolean;
  }
): Promise<{
  disease: {
    id: string;
    name: string;
    icd10: string;
  };
  trend: TrendPoint[];
  meta: {
    metricType: string;
    region: string;
    ageGroup: string;
    sex: string;
    standardized: boolean;
    sources: string[];
    warnings: string[];
  };
}> {
  const prisma = getPrismaClient();
  
  try {
    const disease = await prisma.disease.findUnique({
      where: { id: diseaseId },
    });

    if (!disease) {
      throw new Error(`Disease not found: ${diseaseId}`);
    }

    const where: any = {
      diseaseId,
      metricType,
      year: { not: null },
    };

    if (options?.region) {
      where.regionCode = options.region;
    }

    if (options?.fromYear || options?.toYear) {
      where.year = {};
      if (options.fromYear) {
        where.year.gte = options.fromYear;
      }
      if (options.toYear) {
        where.year.lte = options.toYear;
      }
    }

    if (options?.ageGroup) {
      where.ageGroup = options.ageGroup;
    }

    if (options?.sex) {
      where.sex = options.sex;
    }

    const metrics = await prisma.metric.findMany({
      where,
      orderBy: {
        year: 'asc',
      },
    });

    const warnings: string[] = [];
    const sources = new Set<string>();

    const trend: TrendPoint[] = metrics
      .filter(m => m.valueNumeric !== null && m.year !== null)
      .map(m => {
        sources.add(m.source);
        return {
          year: m.year!,
          value: m.valueNumeric!,
          source: m.source,
        };
      });

    if (trend.length === 0) {
      warnings.push(`No trend data available for ${disease.name} ${metricType}`);
    }

    // Check for gaps in time series
    if (trend.length > 1) {
      const years = trend.map(t => t.year).sort((a, b) => a - b);
      for (let i = 1; i < years.length; i++) {
        if (years[i] - years[i - 1] > 1) {
          warnings.push(`Data gap detected between ${years[i - 1]} and ${years[i]}`);
        }
      }
    }

    if (options?.standardized && !options?.ageGroup) {
      warnings.push('Age standardization requested but age group not specified - results may not be age-standardized');
    }

    return {
      disease: {
        id: disease.id,
        name: disease.name,
        icd10: disease.icd10,
      },
      trend,
      meta: {
        metricType,
        region: options?.region || 'All',
        ageGroup: options?.ageGroup || 'All',
        sex: options?.sex || 'All',
        standardized: options?.standardized || false,
        sources: Array.from(sources),
        warnings,
      },
    };
  } catch (error) {
    logger.error('Error fetching disease trend', { diseaseId, metricType, error });
    throw error;
  }
}

/**
 * Detect outliers in metric values using z-score
 */
export async function detectOutliers(
  diseaseId: string,
  metricType: string,
  threshold: number = 2.0
): Promise<{
  outliers: Array<{
    metricId: string;
    value: number;
    year: number | null;
    zScore: number;
    regionCode: string | null;
  }>;
  stats: {
    mean: number;
    stdDev: number;
    count: number;
  };
}> {
  const prisma = getPrismaClient();
  
  try {
    const metrics = await prisma.metric.findMany({
      where: {
        diseaseId,
        metricType,
        valueNumeric: { not: null },
      },
    });

    if (metrics.length < 3) {
      return {
        outliers: [],
        stats: { mean: 0, stdDev: 0, count: metrics.length },
      };
    }

    const values = metrics.map(m => m.valueNumeric!);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const outliers = metrics
      .map(m => {
        const zScore = stdDev > 0 ? (m.valueNumeric! - mean) / stdDev : 0;
        return {
          metricId: m.id,
          value: m.valueNumeric!,
          year: m.year,
          zScore,
          regionCode: m.regionCode,
        };
      })
      .filter(o => Math.abs(o.zScore) > threshold);

    return {
      outliers,
      stats: {
        mean,
        stdDev,
        count: metrics.length,
      },
    };
  } catch (error) {
    logger.error('Error detecting outliers', { diseaseId, metricType, error });
    throw error;
  }
}

/**
 * Get summary statistics for a disease across regions
 */
export async function getRegionalComparison(
  diseaseId: string,
  metricType: string,
  year?: number
): Promise<{
  disease: {
    id: string;
    name: string;
  };
  regional: Array<{
    region: string;
    regionLevel: string;
    value: number;
    unit: string | null;
  }>;
  summary: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
}> {
  const prisma = getPrismaClient();
  
  try {
    const disease = await prisma.disease.findUnique({
      where: { id: diseaseId },
    });

    if (!disease) {
      throw new Error(`Disease not found: ${diseaseId}`);
    }

    const where: any = {
      diseaseId,
      metricType,
      valueNumeric: { not: null },
      regionCode: { not: null },
    };

    if (year) {
      where.year = year;
    }

    const metrics = await prisma.metric.findMany({
      where,
      orderBy: {
        valueNumeric: 'asc',
      },
    });

    const regional = metrics.map(m => ({
      region: m.regionCode!,
      regionLevel: m.regionLevel || 'unknown',
      value: m.valueNumeric!,
      unit: m.unit,
    }));

    const values = metrics.map(m => m.valueNumeric!);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = values.length > 0 
      ? values[Math.floor(values.length / 2)]
      : 0;

    return {
      disease: {
        id: disease.id,
        name: disease.name,
      },
      regional,
      summary: {
        min,
        max,
        mean,
        median,
      },
    };
  } catch (error) {
    logger.error('Error fetching regional comparison', { diseaseId, metricType, error });
    throw error;
  }
}
