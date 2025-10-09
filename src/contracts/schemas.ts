/**
 * Data Contracts - Zod schemas for runtime validation
 * 
 * Provides type-safe validation for all external IO with versioned schemas
 */

import { z } from 'zod';

/**
 * Clinical Trial Contract v1.0
 */
export const ClinicalTrialContractV1 = z.object({
  version: z.literal('1.0'),
  schema: z.literal('clinical-trial'),
  data: z.object({
    nctId: z.string().regex(/^NCT\d{8}$/, 'Invalid NCT ID format'),
    title: z.string(),
    phase: z.enum(['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Not Applicable']).optional(),
    status: z.string(),
    conditions: z.array(z.string()),
    interventions: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    completionDate: z.string().optional(),
    enrollmentTarget: z.number().optional(),
    enrollmentActual: z.number().optional(),
    primaryEndpoint: z.string().optional(),
    sponsor: z.string().optional(),
    locations: z.array(z.object({
      facility: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string(),
    })).optional(),
    lastChanged: z.string(), // ISO 8601
  }),
  metadata: z.object({
    source: z.string(),
    timestamp: z.number(),
    lastUpdated: z.number().optional(),
  }),
});

export type ClinicalTrialContract = z.infer<typeof ClinicalTrialContractV1>;

/**
 * Drug/Asset Contract v1.0
 */
export const DrugContractV1 = z.object({
  version: z.literal('1.0'),
  schema: z.literal('drug'),
  data: z.object({
    id: z.string(),
    name: z.string(),
    genericName: z.string().optional(),
    brandNames: z.array(z.string()).optional(),
    indication: z.string(),
    phase: z.enum(['Discovery', 'Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved']),
    sponsor: z.string(),
    therapeuticArea: z.string(),
    mechanism: z.string().optional(),
    targets: z.array(z.string()).optional(),
    approvalDate: z.string().optional(),
  }),
  metadata: z.object({
    source: z.string(),
    timestamp: z.number(),
    confidence: z.number().min(0).max(1).optional(),
  }),
});

export type DrugContract = z.infer<typeof DrugContractV1>;

/**
 * FAERS Adverse Event Contract v1.0
 */
export const FAERSContractV1 = z.object({
  version: z.literal('1.0'),
  schema: z.literal('faers-adverse-event'),
  data: z.object({
    safetyReportId: z.string(),
    drugName: z.string(),
    reactionMeddrapt: z.string(),
    seriousnessCode: z.string().optional(),
    outcomeCoded: z.string().optional(),
    occurCountry: z.string().optional(),
    primarySourceQualification: z.string().optional(),
    reportDate: z.string(), // YYYYMMDD or ISO
  }),
  metadata: z.object({
    source: z.literal('openFDA'),
    timestamp: z.number(),
    datasetVersion: z.string().optional(),
  }),
});

export type FAERSContract = z.infer<typeof FAERSContractV1>;

/**
 * Drugs@FDA Approval Contract v1.0
 */
export const DrugApprovalContractV1 = z.object({
  version: z.literal('1.0'),
  schema: z.literal('drug-approval'),
  data: z.object({
    applicationNumber: z.string(),
    sponsorName: z.string(),
    productNumber: z.string().optional(),
    brandName: z.string(),
    genericName: z.string(),
    approvalDate: z.string(), // ISO 8601
    approvalType: z.string().optional(),
    activeIngredient: z.string().optional(),
    dosageForm: z.string().optional(),
    route: z.string().optional(),
  }),
  metadata: z.object({
    source: z.literal('Drugs@FDA'),
    timestamp: z.number(),
  }),
});

export type DrugApprovalContract = z.infer<typeof DrugApprovalContractV1>;

/**
 * Catalyst Event Contract v1.0
 */
export const CatalystContractV1 = z.object({
  version: z.literal('1.0'),
  schema: z.literal('catalyst'),
  data: z.object({
    id: z.string(),
    type: z.enum(['approval', 'trial_result', 'label_update', 'fda_action', 'partnership', 'other']),
    drugId: z.string().optional(),
    companyId: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    eventDate: z.string(), // ISO 8601
    impact: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),
    confidence: z.number().min(0).max(1).optional(),
  }),
  metadata: z.object({
    source: z.string(),
    timestamp: z.number(),
    detectedAt: z.number(),
  }),
});

export type CatalystContract = z.infer<typeof CatalystContractV1>;

/**
 * Contract Validators
 */
export const ContractValidators = {
  clinicalTrial: (data: unknown) => ClinicalTrialContractV1.parse(data),
  drug: (data: unknown) => DrugContractV1.parse(data),
  faers: (data: unknown) => FAERSContractV1.parse(data),
  drugApproval: (data: unknown) => DrugApprovalContractV1.parse(data),
  catalyst: (data: unknown) => CatalystContractV1.parse(data),
};

/**
 * Safe parse with error handling
 */
export function safeValidate<T>(
  validator: (data: unknown) => T,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = validator(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}
