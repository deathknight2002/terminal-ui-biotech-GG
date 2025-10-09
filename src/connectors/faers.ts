/**
 * openFDA FAERS Connector
 * 
 * Connects to FDA Adverse Event Reporting System (FAERS) via openFDA API
 * Normalizes data to FAERSContract@1.0
 * 
 * API Docs: https://open.fda.gov/apis/drug/event/
 */

import { z } from 'zod';
import { FAERSContract, FAERSContractV1 } from '../contracts';

/**
 * FAERS API response schema
 */
const FAERSResultSchema = z.object({
  safetyreportid: z.string(),
  patient: z.object({
    drug: z.array(z.object({
      medicinalproduct: z.string().optional(),
      drugcharacterization: z.string().optional(),
    })).optional(),
    reaction: z.array(z.object({
      reactionmeddrapt: z.string(),
    })).optional(),
  }).optional(),
  serious: z.string().optional(),
  seriousnessdeath: z.string().optional(),
  seriousnesslifethreatening: z.string().optional(),
  seriousnesshospitalization: z.string().optional(),
  seriousnessdisabling: z.string().optional(),
  receivedate: z.string().optional(),
  receiptdate: z.string().optional(),
  occurcountry: z.string().optional(),
  primarysource: z.object({
    qualification: z.string().optional(),
  }).optional(),
});

const FAERSResponseSchema = z.object({
  meta: z.object({
    disclaimer: z.string().optional(),
    terms: z.string().optional(),
    license: z.string().optional(),
    last_updated: z.string().optional(),
    results: z.object({
      skip: z.number(),
      limit: z.number(),
      total: z.number(),
    }).optional(),
  }).optional(),
  results: z.array(FAERSResultSchema),
});

type FAERSResult = z.infer<typeof FAERSResultSchema>;
type FAERSResponse = z.infer<typeof FAERSResponseSchema>;

export interface FAERSSearchOptions {
  drugName?: string;
  reaction?: string;
  country?: string;
  startDate?: string; // YYYYMMDD
  endDate?: string;   // YYYYMMDD
  limit?: number;
  skip?: number;
}

/**
 * openFDA FAERS API connector
 */
export class FAERSConnector {
  private baseUrl = 'https://api.fda.gov/drug/event.json';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search FAERS adverse events
   */
  async search(options: FAERSSearchOptions): Promise<FAERSContract[]> {
    const query = this.buildQuery(options);
    const url = this.buildUrl(query, options.limit, options.skip);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FAERS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validated = FAERSResponseSchema.parse(data);

      return validated.results.map(result => this.normalizeToContract(result));
    } catch (error) {
      throw new Error(`Failed to fetch FAERS data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get adverse events by drug name
   */
  async getByDrug(drugName: string, limit = 100): Promise<FAERSContract[]> {
    return this.search({ drugName, limit });
  }

  /**
   * Get adverse events by reaction (MedDRA term)
   */
  async getByReaction(reaction: string, limit = 100): Promise<FAERSContract[]> {
    return this.search({ reaction, limit });
  }

  /**
   * Get adverse events by country
   */
  async getByCountry(country: string, limit = 100): Promise<FAERSContract[]> {
    return this.search({ country, limit });
  }

  /**
   * Get adverse events in date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string,
    drugName?: string,
    limit = 100
  ): Promise<FAERSContract[]> {
    return this.search({ startDate, endDate, drugName, limit });
  }

  /**
   * Build search query for openFDA API
   */
  private buildQuery(options: FAERSSearchOptions): string {
    const conditions: string[] = [];

    if (options.drugName) {
      conditions.push(`patient.drug.medicinalproduct:"${this.escapeQuery(options.drugName)}"`);
    }

    if (options.reaction) {
      conditions.push(`patient.reaction.reactionmeddrapt:"${this.escapeQuery(options.reaction)}"`);
    }

    if (options.country) {
      conditions.push(`occurcountry:"${this.escapeQuery(options.country)}"`);
    }

    if (options.startDate && options.endDate) {
      conditions.push(`receivedate:[${options.startDate}+TO+${options.endDate}]`);
    } else if (options.startDate) {
      conditions.push(`receivedate:[${options.startDate}+TO+99991231]`);
    } else if (options.endDate) {
      conditions.push(`receivedate:[19900101+TO+${options.endDate}]`);
    }

    return conditions.join('+AND+');
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(query: string, limit = 100, skip = 0): string {
    const params = new URLSearchParams();
    
    if (query) {
      params.set('search', query);
    }
    
    params.set('limit', Math.min(limit, 1000).toString());
    
    if (skip > 0) {
      params.set('skip', skip.toString());
    }

    if (this.apiKey) {
      params.set('api_key', this.apiKey);
    }

    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Escape special characters in query
   */
  private escapeQuery(text: string): string {
    return text.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1');
  }

  /**
   * Normalize FAERS result to contract
   */
  private normalizeToContract(result: FAERSResult): FAERSContract {
    // Get primary drug name
    const drugName = result.patient?.drug?.[0]?.medicinalproduct || 'Unknown';

    // Get primary reaction
    const reaction = result.patient?.reaction?.[0]?.reactionmeddrapt || 'Unknown';

    // Determine seriousness code
    let seriousnessCode = 'Not Serious';
    if (result.seriousnessdeath === '1') {
      seriousnessCode = 'Death';
    } else if (result.seriousnesslifethreatening === '1') {
      seriousnessCode = 'Life Threatening';
    } else if (result.seriousnesshospitalization === '1') {
      seriousnessCode = 'Hospitalization';
    } else if (result.seriousnessdisabling === '1') {
      seriousnessCode = 'Disabling';
    } else if (result.serious === '1') {
      seriousnessCode = 'Serious';
    }

    // Format report date
    const reportDate = result.receivedate || result.receiptdate || new Date().toISOString().split('T')[0].replace(/-/g, '');

    const contract: FAERSContract = {
      version: '1.0',
      schema: 'faers-adverse-event',
      data: {
        safetyReportId: result.safetyreportid,
        drugName,
        reactionMeddrapt: reaction,
        seriousnessCode,
        occurCountry: result.occurcountry,
        primarySourceQualification: result.primarysource?.qualification,
        reportDate,
      },
      metadata: {
        source: 'openFDA',
        timestamp: Date.now(),
      },
    };

    // Validate against schema
    return FAERSContractV1.parse(contract);
  }

  /**
   * Set API key for higher rate limits
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}
