/**
 * Common ETL Utilities
 * Shared functions for ETL pipelines including retry logic, hashing, and provenance
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Compute SHA-256 hash of data for change detection
 */
export function computeHash(data: any): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = parseInt(process.env.ETL_RETRY_ATTEMPTS || '3'),
    initialDelay = parseInt(process.env.ETL_RETRY_DELAY_MS || '5000'),
    maxDelay = 30000,
    factor = 2,
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        break;
      }
      
      const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, { error: lastError.message });
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch processor for handling large datasets
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }
  }
  
  return results;
}

/**
 * Normalize region code to ISO standard
 */
export function normalizeRegionCode(region: string): string {
  const regionMap: Record<string, string> = {
    'US': 'USA',
    'United States': 'USA',
    'UK': 'GBR',
    'United Kingdom': 'GBR',
    // Add more mappings as needed
  };
  
  return regionMap[region] || region.toUpperCase();
}

/**
 * Normalize age group to standard format
 */
export function normalizeAgeGroup(ageGroup: string): string {
  // Standardize age group formats
  const normalized = ageGroup.trim().replace(/\s+/g, '');
  
  // Common patterns
  if (normalized.match(/^0-18$/i)) return '0-18';
  if (normalized.match(/^19-44$/i)) return '19-44';
  if (normalized.match(/^45-64$/i)) return '45-64';
  if (normalized.match(/^65\+$/i)) return '65+';
  if (normalized.match(/^all$/i)) return 'All';
  
  return normalized;
}

/**
 * Normalize sex/gender field
 */
export function normalizeSex(sex: string): string {
  const s = sex.toLowerCase().trim();
  if (s === 'male' || s === 'm') return 'M';
  if (s === 'female' || s === 'f') return 'F';
  if (s === 'all' || s === 'both') return 'All';
  return sex;
}

/**
 * Validate numeric metric value
 */
export function validateMetricValue(value: any): number | null {
  if (value === null || value === undefined) return null;
  
  const num = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(num) || !isFinite(num)) return null;
  if (num < 0) return null; // Negative values don't make sense for most epidemiological metrics
  
  return num;
}

/**
 * Create provenance record data
 */
export interface ProvenanceData {
  sourceName: string;
  sourceUrl: string;
  sourceVersion?: string;
  sourceDatasetId?: string;
  retrievedAt: Date;
  hash: string;
  reliabilityScore?: number;
  notes?: string;
}

export function createProvenanceData(
  sourceName: string,
  sourceUrl: string,
  rawData: any,
  options: {
    sourceVersion?: string;
    sourceDatasetId?: string;
    reliabilityScore?: number;
    notes?: string;
  } = {}
): ProvenanceData {
  return {
    sourceName,
    sourceUrl,
    sourceVersion: options.sourceVersion,
    sourceDatasetId: options.sourceDatasetId,
    retrievedAt: new Date(),
    hash: computeHash(rawData),
    reliabilityScore: options.reliabilityScore,
    notes: options.notes,
  };
}

/**
 * Standard metric types
 */
export type MetricType = 
  | 'incidence'
  | 'mortality'
  | 'prevalence'
  | 'survival_5y'
  | 'daly'
  | 'yll'
  | 'yld';

/**
 * Standard data sources
 */
export type DataSourceType = 'SEER' | 'WHO' | 'CDC';

/**
 * ETL Result interface
 */
export interface ETLResult {
  source: DataSourceType;
  diseasesProcessed: number;
  metricsCreated: number;
  metricsUpdated: number;
  metricsSkipped: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

/**
 * Create ETL result summary
 */
export function createETLResult(
  source: DataSourceType,
  startTime: number,
  counts: {
    diseases: number;
    created: number;
    updated: number;
    skipped: number;
  },
  errors: string[] = []
): ETLResult {
  return {
    source,
    diseasesProcessed: counts.diseases,
    metricsCreated: counts.created,
    metricsUpdated: counts.updated,
    metricsSkipped: counts.skipped,
    errors,
    duration: Date.now() - startTime,
    timestamp: new Date(),
  };
}
