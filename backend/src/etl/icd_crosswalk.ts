/**
 * ICD Crosswalk Utilities
 * Maps between ICD-10, ICD-11, and SNOMED CT codes
 */

import { getPrismaClient } from '../db';
import { logger } from '../utils/logger';

/**
 * Common ICD-10 to ICD-11 mappings for diseases
 * This is a starter set - expand as needed with official crosswalk tables
 */
const ICD10_TO_ICD11_MAP: Record<string, string> = {
  // Cancer codes
  'C34': '2C25', // Lung cancer
  'C50': '2C60', // Breast cancer
  'C18-C20': '2B90-2B93', // Colorectal cancer
  'C61': '2C82', // Prostate cancer
  'C25': '2C10', // Pancreatic cancer
  
  // Infectious diseases
  'U07.1': '1D6Y', // COVID-19
  'A15-A19': 'CA40', // Tuberculosis
  'B50-B54': '1F40', // Malaria
  'B20-B24': '1C60', // HIV/AIDS
  
  // Chronic diseases
  'E11': '5A11', // Type 2 diabetes
  'I25': 'BA80', // Coronary heart disease
  'J44': 'CA22', // COPD
  'G30': '8A20', // Alzheimer's disease
  'I64': '8B20', // Stroke
  
  // Other diseases
  'D57': '3A51', // Sickle cell disease
  'G71.0': '8C70.0', // Duchenne muscular dystrophy
};

/**
 * ICD-10 to SNOMED CT mappings (partial)
 */
const ICD10_TO_SNOMED_MAP: Record<string, string> = {
  'C34': '93880001', // Lung cancer
  'C50': '254837009', // Breast cancer
  'C61': '399068003', // Prostate cancer
  'E11': '44054006', // Type 2 diabetes
  'I25': '53741008', // Coronary artery disease
  'J44': '13645005', // COPD
  'G30': '26929004', // Alzheimer's disease
  'A15-A19': '56717001', // Tuberculosis
  'B20-B24': '86406008', // HIV disease
  'U07.1': '840539006', // COVID-19
};

/**
 * Get ICD-11 code from ICD-10 code
 */
export function getICD11FromICD10(icd10: string): string | null {
  return ICD10_TO_ICD11_MAP[icd10] || null;
}

/**
 * Get SNOMED CT code from ICD-10 code
 */
export function getSNOMEDFromICD10(icd10: string): string | null {
  return ICD10_TO_SNOMED_MAP[icd10] || null;
}

/**
 * Upsert crosswalk mapping to database
 */
export async function upsertCrosswalk(
  icd10?: string,
  icd11?: string,
  snomed?: string,
  notes?: string
): Promise<void> {
  if (!icd10 && !icd11 && !snomed) {
    logger.warn('Cannot create crosswalk with no codes provided');
    return;
  }

  const prisma = getPrismaClient();
  
  try {
    // Check if mapping exists
    const existing = await prisma.crosswalk.findFirst({
      where: {
        OR: [
          icd10 ? { icd10 } : {},
          icd11 ? { icd11 } : {},
          snomed ? { snomed } : {},
        ].filter(obj => Object.keys(obj).length > 0),
      },
    });

    if (existing) {
      // Update existing mapping
      await prisma.crosswalk.update({
        where: { id: existing.id },
        data: {
          icd10: icd10 || existing.icd10,
          icd11: icd11 || existing.icd11,
          snomed: snomed || existing.snomed,
          notes: notes || existing.notes,
        },
      });
      logger.debug('Updated crosswalk mapping', { icd10, icd11, snomed });
    } else {
      // Create new mapping
      await prisma.crosswalk.create({
        data: {
          icd10,
          icd11,
          snomed,
          notes,
        },
      });
      logger.debug('Created crosswalk mapping', { icd10, icd11, snomed });
    }
  } catch (error) {
    logger.error('Error upserting crosswalk', { error, icd10, icd11, snomed });
    throw error;
  }
}

/**
 * Initialize default crosswalk mappings
 */
export async function initializeCrosswalks(): Promise<void> {
  logger.info('Initializing ICD crosswalk mappings...');
  
  const mappings = Object.entries(ICD10_TO_ICD11_MAP).map(([icd10, icd11]) => ({
    icd10,
    icd11,
    snomed: ICD10_TO_SNOMED_MAP[icd10],
  }));

  for (const mapping of mappings) {
    try {
      await upsertCrosswalk(
        mapping.icd10,
        mapping.icd11,
        mapping.snomed,
        'Auto-generated from standard crosswalk'
      );
    } catch (error) {
      logger.error('Failed to initialize crosswalk', { mapping, error });
    }
  }

  logger.info(`Initialized ${mappings.length} crosswalk mappings`);
}

/**
 * Enrich disease with ICD-11 and SNOMED codes
 */
export interface DiseaseEnrichment {
  icd10: string;
  icd11?: string;
  snomed?: string;
}

export function enrichDiseaseWithCodes(icd10: string): DiseaseEnrichment {
  return {
    icd10,
    icd11: getICD11FromICD10(icd10) || undefined,
    snomed: getSNOMEDFromICD10(icd10) || undefined,
  };
}

/**
 * Validate ICD-10 code format
 */
export function isValidICD10(code: string): boolean {
  // Basic ICD-10 validation (letter followed by 2-3 digits, optional decimal and 1-2 more digits)
  const pattern = /^[A-Z]\d{2}(\.\d{1,2})?$/;
  return pattern.test(code);
}

/**
 * Normalize ICD-10 code format
 */
export function normalizeICD10(code: string): string {
  return code.toUpperCase().trim();
}
