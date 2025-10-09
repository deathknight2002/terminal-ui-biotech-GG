/**
 * Drugs@FDA Connector
 * 
 * Connects to Drugs@FDA API for drug approvals, labels, and regulatory data
 * Normalizes data to DrugApprovalContract@1.0
 * 
 * API Docs: https://open.fda.gov/apis/drug/drugsfda/
 */

import { z } from 'zod';
import { DrugApprovalContract, DrugApprovalContractV1 } from '../contracts';

/**
 * Drugs@FDA API response schema
 */
const DrugProductSchema = z.object({
  product_number: z.string().optional(),
  brand_name: z.string(),
  active_ingredients: z.array(z.object({
    name: z.string(),
    strength: z.string().optional(),
  })).optional(),
  dosage_form: z.string().optional(),
  route: z.string().optional(),
  marketing_status: z.string().optional(),
});

const DrugApplicationSchema = z.object({
  application_number: z.string(),
  sponsor_name: z.string(),
  openfda: z.object({
    generic_name: z.array(z.string()).optional(),
    brand_name: z.array(z.string()).optional(),
  }).optional(),
  products: z.array(DrugProductSchema).optional(),
  submissions: z.array(z.object({
    submission_type: z.string().optional(),
    submission_number: z.string().optional(),
    submission_status: z.string().optional(),
    submission_status_date: z.string().optional(),
    submission_class_code: z.string().optional(),
    application_docs: z.array(z.object({
      id: z.string().optional(),
      url: z.string().optional(),
      date: z.string().optional(),
      type: z.string().optional(),
    })).optional(),
  })).optional(),
});

const DrugsAtFDAResponseSchema = z.object({
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
  results: z.array(DrugApplicationSchema),
});

type DrugApplication = z.infer<typeof DrugApplicationSchema>;
type DrugsAtFDAResponse = z.infer<typeof DrugsAtFDAResponseSchema>;

export interface DrugsAtFDASearchOptions {
  brandName?: string;
  genericName?: string;
  sponsorName?: string;
  applicationNumber?: string;
  limit?: number;
  skip?: number;
}

/**
 * Drugs@FDA API connector
 */
export class DrugsAtFDAConnector {
  private baseUrl = 'https://api.fda.gov/drug/drugsfda.json';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search Drugs@FDA database
   */
  async search(options: DrugsAtFDASearchOptions): Promise<DrugApprovalContract[]> {
    const query = this.buildQuery(options);
    const url = this.buildUrl(query, options.limit, options.skip);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Drugs@FDA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validated = DrugsAtFDAResponseSchema.parse(data);

      // Flatten products into individual approval records
      const contracts: DrugApprovalContract[] = [];
      
      for (const application of validated.results) {
        if (application.products && application.products.length > 0) {
          for (const product of application.products) {
            contracts.push(this.normalizeToContract(application, product));
          }
        } else {
          // Create contract without product details
          contracts.push(this.normalizeToContract(application));
        }
      }

      return contracts;
    } catch (error) {
      throw new Error(`Failed to fetch Drugs@FDA data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get drug approvals by brand name
   */
  async getByBrandName(brandName: string, limit = 100): Promise<DrugApprovalContract[]> {
    return this.search({ brandName, limit });
  }

  /**
   * Get drug approvals by generic name
   */
  async getByGenericName(genericName: string, limit = 100): Promise<DrugApprovalContract[]> {
    return this.search({ genericName, limit });
  }

  /**
   * Get drug approvals by sponsor
   */
  async getBySponsor(sponsorName: string, limit = 100): Promise<DrugApprovalContract[]> {
    return this.search({ sponsorName, limit });
  }

  /**
   * Get drug approval by application number
   */
  async getByApplicationNumber(applicationNumber: string): Promise<DrugApprovalContract[]> {
    return this.search({ applicationNumber, limit: 1 });
  }

  /**
   * Build search query for Drugs@FDA API
   */
  private buildQuery(options: DrugsAtFDASearchOptions): string {
    const conditions: string[] = [];

    if (options.brandName) {
      conditions.push(`openfda.brand_name:"${this.escapeQuery(options.brandName)}"`);
    }

    if (options.genericName) {
      conditions.push(`openfda.generic_name:"${this.escapeQuery(options.genericName)}"`);
    }

    if (options.sponsorName) {
      conditions.push(`sponsor_name:"${this.escapeQuery(options.sponsorName)}"`);
    }

    if (options.applicationNumber) {
      conditions.push(`application_number:"${this.escapeQuery(options.applicationNumber)}"`);
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
   * Normalize Drugs@FDA application to contract
   */
  private normalizeToContract(
    application: DrugApplication,
    product?: z.infer<typeof DrugProductSchema>
  ): DrugApprovalContract {
    // Get brand name
    const brandName = product?.brand_name 
      || application.openfda?.brand_name?.[0] 
      || 'Unknown';

    // Get generic name
    const genericName = application.openfda?.generic_name?.[0] 
      || product?.active_ingredients?.[0]?.name 
      || 'Unknown';

    // Get active ingredient
    const activeIngredient = product?.active_ingredients?.[0]?.name || genericName;

    // Get approval date from most recent submission
    let approvalDate = new Date().toISOString();
    if (application.submissions && application.submissions.length > 0) {
      const approvedSubmissions = application.submissions
        .filter(s => s.submission_status_date)
        .sort((a, b) => (b.submission_status_date || '').localeCompare(a.submission_status_date || ''));
      
      if (approvedSubmissions.length > 0) {
        const dateStr = approvedSubmissions[0].submission_status_date!;
        // Convert YYYYMMDD to ISO format
        if (dateStr.length === 8) {
          approvalDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        } else {
          approvalDate = dateStr;
        }
      }
    }

    // Determine approval type
    let approvalType = 'Standard';
    if (application.submissions && application.submissions.length > 0) {
      const firstSubmission = application.submissions[0];
      if (firstSubmission.submission_class_code === 'PRIORITY') {
        approvalType = 'Priority Review';
      } else if (firstSubmission.submission_class_code === 'BREAKTHROUGH') {
        approvalType = 'Breakthrough Therapy';
      } else if (firstSubmission.submission_type?.includes('ORIGINAL')) {
        approvalType = 'New Drug Application';
      } else if (firstSubmission.submission_type?.includes('SUPPLEMENT')) {
        approvalType = 'Supplemental Application';
      }
    }

    const contract: DrugApprovalContract = {
      version: '1.0',
      schema: 'drug-approval',
      data: {
        applicationNumber: application.application_number,
        sponsorName: application.sponsor_name,
        productNumber: product?.product_number,
        brandName,
        genericName,
        approvalDate,
        approvalType,
        activeIngredient,
        dosageForm: product?.dosage_form,
        route: product?.route,
      },
      metadata: {
        source: 'Drugs@FDA',
        timestamp: Date.now(),
      },
    };

    // Validate against schema
    return DrugApprovalContractV1.parse(contract);
  }

  /**
   * Set API key for higher rate limits
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}
