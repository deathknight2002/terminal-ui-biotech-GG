/**
 * ClinicalTrials.gov v2 Connector
 * 
 * Connects to ClinicalTrials.gov API v2 with modern JSON format
 * Normalizes data to ClinicalTrialContract@1.0
 */

import { z } from 'zod';
import { ClinicalTrialContract, ClinicalTrialContractV1 } from '../contracts';

/**
 * Trial search result from CT.gov API v2
 */
const CTGovTrialSchema = z.object({
  protocolSection: z.object({
    identificationModule: z.object({
      nctId: z.string(),
      briefTitle: z.string(),
      officialTitle: z.string().optional(),
    }),
    statusModule: z.object({
      overallStatus: z.string(),
      startDateStruct: z.object({
        date: z.string().optional(),
      }).optional(),
      completionDateStruct: z.object({
        date: z.string().optional(),
      }).optional(),
      lastUpdatePostDateStruct: z.object({
        date: z.string().optional(),
      }).optional(),
    }),
    sponsorCollaboratorsModule: z.object({
      leadSponsor: z.object({
        name: z.string(),
      }).optional(),
    }).optional(),
    designModule: z.object({
      phases: z.array(z.string()).optional(),
      enrollmentInfo: z.object({
        count: z.number().optional(),
      }).optional(),
    }).optional(),
    armsInterventionsModule: z.object({
      interventions: z.array(z.object({
        name: z.string(),
        type: z.string().optional(),
      })).optional(),
    }).optional(),
    conditionsModule: z.object({
      conditions: z.array(z.string()).optional(),
    }).optional(),
    contactsLocationsModule: z.object({
      locations: z.array(z.object({
        facility: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      })).optional(),
    }).optional(),
    outcomesModule: z.object({
      primaryOutcomes: z.array(z.object({
        measure: z.string(),
      })).optional(),
    }).optional(),
  }),
});

type CTGovTrial = z.infer<typeof CTGovTrialSchema>;

/**
 * ClinicalTrials.gov v2 API connector
 */
export class CTGovV2Connector {
  private baseUrl = 'https://clinicaltrials.gov/api/v2';
  private defaultPageSize = 50;
  private maxPageSize = 1000;

  /**
   * Search trials by condition/disease
   */
  async searchByCondition(
    condition: string,
    options?: {
      pageSize?: number;
      maxResults?: number;
    }
  ): Promise<ClinicalTrialContract[]> {
    const pageSize = Math.min(
      options?.pageSize || this.defaultPageSize,
      this.maxPageSize
    );

    const url = new URL(`${this.baseUrl}/studies`);
    url.searchParams.set('query.cond', condition);
    url.searchParams.set('pageSize', pageSize.toString());
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`CT.gov API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const studies = data.studies || [];

    return studies
      .slice(0, options?.maxResults)
      .map((study: any) => this.normalizeToContract(study));
  }

  /**
   * Search trials by drug/intervention
   */
  async searchByIntervention(
    intervention: string,
    options?: { pageSize?: number; maxResults?: number }
  ): Promise<ClinicalTrialContract[]> {
    const url = new URL(`${this.baseUrl}/studies`);
    url.searchParams.set('query.intr', intervention);
    url.searchParams.set('pageSize', (options?.pageSize || this.defaultPageSize).toString());
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`CT.gov API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const studies = data.studies || [];

    return studies
      .slice(0, options?.maxResults)
      .map((study: any) => this.normalizeToContract(study));
  }

  /**
   * Get trial by NCT ID
   */
  async getTrialByNCT(nctId: string): Promise<ClinicalTrialContract> {
    const url = `${this.baseUrl}/studies/${nctId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CT.gov API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeToContract(data);
  }

  /**
   * Search trials with advanced query
   */
  async searchAdvanced(
    query: {
      condition?: string;
      intervention?: string;
      sponsor?: string;
      phase?: string[];
      status?: string[];
    },
    options?: { pageSize?: number; maxResults?: number }
  ): Promise<ClinicalTrialContract[]> {
    const url = new URL(`${this.baseUrl}/studies`);
    
    if (query.condition) url.searchParams.set('query.cond', query.condition);
    if (query.intervention) url.searchParams.set('query.intr', query.intervention);
    if (query.sponsor) url.searchParams.set('query.lead', query.sponsor);
    if (query.phase) url.searchParams.set('filter.phase', query.phase.join(','));
    if (query.status) url.searchParams.set('filter.overallStatus', query.status.join(','));
    
    url.searchParams.set('pageSize', (options?.pageSize || this.defaultPageSize).toString());
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`CT.gov API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const studies = data.studies || [];

    return studies
      .slice(0, options?.maxResults)
      .map((study: any) => this.normalizeToContract(study));
  }

  /**
   * Normalize CT.gov response to ClinicalTrialContract
   */
  private normalizeToContract(study: any): ClinicalTrialContract {
    const parsed = CTGovTrialSchema.parse(study);
    const proto = parsed.protocolSection;

    // Normalize phase
    const phase = proto.designModule?.phases?.[0];
    const normalizedPhase = phase ? this.normalizePhase(phase) : undefined;

    // Get enrollment
    const enrollmentTarget = proto.designModule?.enrollmentInfo?.count;

    // Get primary endpoint
    const primaryEndpoint = proto.outcomesModule?.primaryOutcomes?.[0]?.measure;

    // Get dates
    const startDate = proto.statusModule.startDateStruct?.date;
    const completionDate = proto.statusModule.completionDateStruct?.date;
    const lastChanged = proto.statusModule.lastUpdatePostDateStruct?.date || new Date().toISOString();

    // Get sponsor
    const sponsor = proto.sponsorCollaboratorsModule?.leadSponsor?.name;

    // Get locations
    const locations = proto.contactsLocationsModule?.locations?.map(loc => ({
      facility: loc.facility,
      city: loc.city,
      state: loc.state,
      country: loc.country || 'Unknown',
    })) || [];

    const contract: ClinicalTrialContract = {
      version: '1.0',
      schema: 'clinical-trial',
      data: {
        nctId: proto.identificationModule.nctId,
        title: proto.identificationModule.briefTitle,
        phase: normalizedPhase,
        status: proto.statusModule.overallStatus,
        conditions: proto.conditionsModule?.conditions || [],
        interventions: proto.armsInterventionsModule?.interventions?.map(i => i.name) || [],
        startDate,
        completionDate,
        enrollmentTarget,
        primaryEndpoint,
        sponsor,
        locations: locations.length > 0 ? locations : undefined,
        lastChanged,
      },
      metadata: {
        source: 'clinicaltrials.gov-v2',
        timestamp: Date.now(),
        lastUpdated: Date.now(),
      },
    };

    // Validate the contract
    return ClinicalTrialContractV1.parse(contract);
  }

  /**
   * Normalize phase string to standard format
   */
  private normalizePhase(phase: string): 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV' | 'Not Applicable' | undefined {
    const normalized = phase.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (normalized.includes('PHASE1') || normalized === 'PHASE1') return 'Phase I';
    if (normalized.includes('PHASE2') || normalized === 'PHASE2') return 'Phase II';
    if (normalized.includes('PHASE3') || normalized === 'PHASE3') return 'Phase III';
    if (normalized.includes('PHASE4') || normalized === 'PHASE4') return 'Phase IV';
    if (normalized.includes('NOTAPPLICABLE') || normalized === 'NA') return 'Not Applicable';
    
    return undefined;
  }
}

// Singleton instance
export const ctgovConnector = new CTGovV2Connector();
