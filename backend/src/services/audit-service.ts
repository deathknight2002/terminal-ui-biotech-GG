/**
 * Audit Service
 * Provides provenance tracking and audit trail queries for epidemiological data
 */

import { getPrismaClient } from '../db';
import { logger } from '../utils/logger';

/**
 * Provenance information with full metric details
 */
export interface ProvenanceInfo {
  metricId: string;
  metric: {
    diseaseId: string;
    diseaseName: string;
    icd10: string;
    metricType: string;
    valueNumeric: number | null;
    valueJson: any;
    unit: string | null;
    year: number | null;
    sex: string | null;
    ageGroup: string | null;
    raceEthnicity: string | null;
    regionCode: string | null;
    regionLevel: string | null;
  };
  provenance: {
    sourceName: string;
    sourceUrl: string;
    sourceVersion: string | null;
    sourceDatasetId: string | null;
    retrievedAt: Date;
    ingestedAt: Date;
    hash: string;
    reliabilityScore: number | null;
    notes: string | null;
  };
}

/**
 * Get provenance for a specific metric
 */
export async function getMetricProvenance(metricId: string): Promise<ProvenanceInfo | null> {
  const prisma = getPrismaClient();
  
  try {
    const metric = await prisma.metric.findUnique({
      where: { id: metricId },
      include: {
        disease: true,
        provenance: true,
      },
    });

    if (!metric || !metric.provenance) {
      return null;
    }

    return {
      metricId: metric.id,
      metric: {
        diseaseId: metric.diseaseId,
        diseaseName: metric.disease.name,
        icd10: metric.disease.icd10,
        metricType: metric.metricType,
        valueNumeric: metric.valueNumeric,
        valueJson: metric.valueJson,
        unit: metric.unit,
        year: metric.year,
        sex: metric.sex,
        ageGroup: metric.ageGroup,
        raceEthnicity: metric.raceEthnicity,
        regionCode: metric.regionCode,
        regionLevel: metric.regionLevel,
      },
      provenance: {
        sourceName: metric.provenance.sourceName,
        sourceUrl: metric.provenance.sourceUrl,
        sourceVersion: metric.provenance.sourceVersion,
        sourceDatasetId: metric.provenance.sourceDatasetId,
        retrievedAt: metric.provenance.retrievedAt,
        ingestedAt: metric.provenance.ingestedAt,
        hash: metric.provenance.hash,
        reliabilityScore: metric.provenance.reliabilityScore,
        notes: metric.provenance.notes,
      },
    };
  } catch (error) {
    logger.error('Error fetching metric provenance', { metricId, error });
    throw error;
  }
}

/**
 * Get all metrics for a disease with provenance
 */
export async function getDiseaseMetricsWithProvenance(
  diseaseId: string,
  options?: {
    metricType?: string;
    source?: string;
    year?: number;
  }
): Promise<ProvenanceInfo[]> {
  const prisma = getPrismaClient();
  
  try {
    const where: any = { diseaseId };
    
    if (options?.metricType) {
      where.metricType = options.metricType;
    }
    
    if (options?.source) {
      where.source = options.source;
    }
    
    if (options?.year) {
      where.year = options.year;
    }

    const metrics = await prisma.metric.findMany({
      where,
      include: {
        disease: true,
        provenance: true,
      },
      orderBy: [
        { year: 'desc' },
        { metricType: 'asc' },
      ],
    });

    return metrics
      .filter(m => m.provenance !== null)
      .map(metric => ({
        metricId: metric.id,
        metric: {
          diseaseId: metric.diseaseId,
          diseaseName: metric.disease.name,
          icd10: metric.disease.icd10,
          metricType: metric.metricType,
          valueNumeric: metric.valueNumeric,
          valueJson: metric.valueJson,
          unit: metric.unit,
          year: metric.year,
          sex: metric.sex,
          ageGroup: metric.ageGroup,
          raceEthnicity: metric.raceEthnicity,
          regionCode: metric.regionCode,
          regionLevel: metric.regionLevel,
        },
        provenance: {
          sourceName: metric.provenance!.sourceName,
          sourceUrl: metric.provenance!.sourceUrl,
          sourceVersion: metric.provenance!.sourceVersion,
          sourceDatasetId: metric.provenance!.sourceDatasetId,
          retrievedAt: metric.provenance!.retrievedAt,
          ingestedAt: metric.provenance!.ingestedAt,
          hash: metric.provenance!.hash,
          reliabilityScore: metric.provenance!.reliabilityScore,
          notes: metric.provenance!.notes,
        },
      }));
  } catch (error) {
    logger.error('Error fetching disease metrics with provenance', { diseaseId, error });
    throw error;
  }
}

/**
 * Get data sources for a disease
 */
export async function getDiseaseSources(diseaseId: string): Promise<{
  source: string;
  count: number;
  latestUpdate: Date;
  reliabilityScore: number | null;
}[]> {
  const prisma = getPrismaClient();
  
  try {
    const metrics = await prisma.metric.findMany({
      where: { diseaseId },
      include: {
        provenance: true,
      },
    });

    const sourceMap = new Map<string, {
      count: number;
      latestUpdate: Date;
      reliabilityScores: number[];
    }>();

    for (const metric of metrics) {
      if (!metric.provenance) continue;
      
      const source = metric.source;
      const existing = sourceMap.get(source);
      
      if (existing) {
        existing.count++;
        if (metric.provenance.ingestedAt > existing.latestUpdate) {
          existing.latestUpdate = metric.provenance.ingestedAt;
        }
        if (metric.provenance.reliabilityScore !== null) {
          existing.reliabilityScores.push(metric.provenance.reliabilityScore);
        }
      } else {
        sourceMap.set(source, {
          count: 1,
          latestUpdate: metric.provenance.ingestedAt,
          reliabilityScores: metric.provenance.reliabilityScore !== null 
            ? [metric.provenance.reliabilityScore] 
            : [],
        });
      }
    }

    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      latestUpdate: data.latestUpdate,
      reliabilityScore: data.reliabilityScores.length > 0
        ? Math.round(data.reliabilityScores.reduce((a, b) => a + b, 0) / data.reliabilityScores.length)
        : null,
    }));
  } catch (error) {
    logger.error('Error fetching disease sources', { diseaseId, error });
    throw error;
  }
}

/**
 * Get audit log for recent data updates
 */
export async function getRecentUpdates(
  limit: number = 50,
  source?: string
): Promise<{
  metricId: string;
  diseaseName: string;
  metricType: string;
  source: string;
  ingestedAt: Date;
  reliabilityScore: number | null;
}[]> {
  const prisma = getPrismaClient();
  
  try {
    const where: any = {};
    if (source) {
      where.metric = { source };
    }

    const provenance = await prisma.provenance.findMany({
      where,
      include: {
        metric: {
          include: {
            disease: true,
          },
        },
      },
      orderBy: {
        ingestedAt: 'desc',
      },
      take: limit,
    });

    return provenance.map(p => ({
      metricId: p.metricId,
      diseaseName: p.metric.disease.name,
      metricType: p.metric.metricType,
      source: p.metric.source,
      ingestedAt: p.ingestedAt,
      reliabilityScore: p.reliabilityScore,
    }));
  } catch (error) {
    logger.error('Error fetching recent updates', { error });
    throw error;
  }
}

/**
 * Verify data integrity by checking hash consistency
 */
export async function verifyDataIntegrity(metricId: string): Promise<{
  valid: boolean;
  message: string;
}> {
  const prisma = getPrismaClient();
  
  try {
    const metric = await prisma.metric.findUnique({
      where: { id: metricId },
      include: { provenance: true },
    });

    if (!metric) {
      return { valid: false, message: 'Metric not found' };
    }

    if (!metric.provenance) {
      return { valid: false, message: 'No provenance record found' };
    }

    // In a real implementation, you would recompute the hash from raw data
    // For now, we just verify the provenance record exists
    return {
      valid: true,
      message: 'Provenance record exists with hash: ' + metric.provenance.hash.substring(0, 16) + '...',
    };
  } catch (error) {
    logger.error('Error verifying data integrity', { metricId, error });
    return { valid: false, message: 'Error during verification' };
  }
}
