/**
 * FDA Database Scraper
 * Regulatory data collection with compliance tracking
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface FDADrugApproval {
  applicationNumber: string;
  sponsorName: string;
  drugName: string;
  activeIngredient: string;
  approvalDate: string;
  type: 'NDA' | 'BLA' | 'ANDA';
  therapeuticArea: string;
  indication: string;
  status: 'Approved' | 'Tentative' | 'Withdrawn';
  reviewPriority?: 'Standard' | 'Priority' | 'Breakthrough' | 'Fast Track';
}

export interface FDAAdverseEvent {
  reportId: string;
  drugName: string;
  receiveDate: string;
  seriousness: string;
  outcome: string;
  reactions: string[];
  patientAge?: number;
  patientSex?: string;
}

export interface FDARecall {
  recallNumber: string;
  productDescription: string;
  company: string;
  recallClass: 'Class I' | 'Class II' | 'Class III';
  recallDate: string;
  reason: string;
  status: 'Ongoing' | 'Completed' | 'Terminated';
}

export interface FDASearchParams {
  search?: string;
  limit?: number;
  skip?: number;
  sort?: string;
}

export class FDAScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<any>;
  private readonly baseUrl: string = 'https://api.fda.gov';
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/1.0',
      },
    });

    this.circuitBreaker = new CircuitBreaker('fda', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: apiKey ? 240 : 40, // 240/min with key, 40/min without (per FDA limits)
      minRate: 10,
      maxRate: apiKey ? 240 : 40,
      window: 60000, // 1 minute window
    });

    this.cache = new LRUCache<any>({
      maxSize: 1000,
      defaultTTL: 3600000, // 1 hour
    });

    logger.info('🏛️ FDA scraper initialized');
  }

  /**
   * Search drug approvals
   */
  async searchDrugApprovals(params: FDASearchParams): Promise<FDADrugApproval[]> {
    const cacheKey = `approvals:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🏛️ FDA approvals cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const results = await this.circuitBreaker.execute(async () => {
        return this.fetchDrugApprovals(params);
      });

      this.cache.set(cacheKey, results);
      this.rateLimiter.recordSuccess();

      logger.info(`🏛️ FDA approvals fetched: ${results.length} records`);
      return results;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🏛️ FDA approvals error:', error);
      throw error;
    }
  }

  /**
   * Fetch drug approvals from FDA API
   */
  private async fetchDrugApprovals(params: FDASearchParams): Promise<FDADrugApproval[]> {
    const result = await retryWithBackoff(
      async () => {
        const queryParams: any = {
          limit: params.limit || 100,
          skip: params.skip || 0,
        };

        if (params.search) {
          queryParams.search = params.search;
        }

        if (params.sort) {
          queryParams.sort = params.sort;
        }

        if (this.apiKey) {
          queryParams.api_key = this.apiKey;
        }

        const response = await this.client.get('/drug/drugsfda.json', {
          params: queryParams,
        });

        return this.parseDrugApprovals(response.data);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse drug approval response
   */
  private parseDrugApprovals(data: any): FDADrugApproval[] {
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      applicationNumber: item.application_number || '',
      sponsorName: item.sponsor_name || '',
      drugName: item.products?.[0]?.brand_name || '',
      activeIngredient: item.products?.[0]?.active_ingredients?.[0]?.name || '',
      approvalDate: item.submissions?.[0]?.submission_status_date || '',
      type: this.determineApplicationType(item.application_number),
      therapeuticArea: '',
      indication: '',
      status: 'Approved',
    }));
  }

  /**
   * Search adverse events
   */
  async searchAdverseEvents(drugName: string, params: FDASearchParams = {}): Promise<FDAAdverseEvent[]> {
    const cacheKey = `adverse:${drugName}:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🏛️ FDA adverse events cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const results = await this.circuitBreaker.execute(async () => {
        return this.fetchAdverseEvents(drugName, params);
      });

      this.cache.set(cacheKey, results);
      this.rateLimiter.recordSuccess();

      logger.info(`🏛️ FDA adverse events fetched: ${results.length} records for ${drugName}`);
      return results;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🏛️ FDA adverse events error:', error);
      throw error;
    }
  }

  /**
   * Fetch adverse events
   */
  private async fetchAdverseEvents(drugName: string, params: FDASearchParams): Promise<FDAAdverseEvent[]> {
    const result = await retryWithBackoff(
      async () => {
        const search = `patient.drug.medicinalproduct:"${drugName}"`;
        
        const queryParams: any = {
          search,
          limit: params.limit || 100,
        };

        if (this.apiKey) {
          queryParams.api_key = this.apiKey;
        }

        const response = await this.client.get('/drug/event.json', {
          params: queryParams,
        });

        return this.parseAdverseEvents(response.data);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse adverse events response
   */
  private parseAdverseEvents(data: any): FDAAdverseEvent[] {
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      reportId: item.safetyreportid || '',
      drugName: item.patient?.drug?.[0]?.medicinalproduct || '',
      receiveDate: item.receivedate || '',
      seriousness: item.serious || '',
      outcome: item.patient?.reaction?.[0]?.reactionoutcome || '',
      reactions: item.patient?.reaction?.map((r: any) => r.reactionmeddrapt) || [],
      patientAge: item.patient?.patientonsetage,
      patientSex: item.patient?.patientsex,
    }));
  }

  /**
   * Search drug recalls
   */
  async searchRecalls(params: FDASearchParams = {}): Promise<FDARecall[]> {
    const cacheKey = `recalls:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🏛️ FDA recalls cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const results = await this.circuitBreaker.execute(async () => {
        return this.fetchRecalls(params);
      });

      this.cache.set(cacheKey, results);
      this.rateLimiter.recordSuccess();

      logger.info(`🏛️ FDA recalls fetched: ${results.length} records`);
      return results;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🏛️ FDA recalls error:', error);
      throw error;
    }
  }

  /**
   * Fetch recalls
   */
  private async fetchRecalls(params: FDASearchParams): Promise<FDARecall[]> {
    const result = await retryWithBackoff(
      async () => {
        const queryParams: any = {
          limit: params.limit || 100,
        };

        if (params.search) {
          queryParams.search = params.search;
        }

        if (this.apiKey) {
          queryParams.api_key = this.apiKey;
        }

        const response = await this.client.get('/drug/enforcement.json', {
          params: queryParams,
        });

        return this.parseRecalls(response.data);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse recalls response
   */
  private parseRecalls(data: any): FDARecall[] {
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      recallNumber: item.recall_number || '',
      productDescription: item.product_description || '',
      company: item.recalling_firm || '',
      recallClass: item.classification || 'Class III',
      recallDate: item.report_date || '',
      reason: item.reason_for_recall || '',
      status: item.status || 'Ongoing',
    }));
  }

  /**
   * Get recent approvals
   */
  async getRecentApprovals(days: number = 90): Promise<FDADrugApproval[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    return this.searchDrugApprovals({
      search: `submissions.submission_status_date:[${dateStr}+TO+99991231]`,
      limit: 100,
      sort: 'submissions.submission_status_date:desc',
    });
  }

  /**
   * Determine application type from number
   */
  private determineApplicationType(appNumber: string): 'NDA' | 'BLA' | 'ANDA' {
    if (!appNumber) return 'NDA';
    
    if (appNumber.startsWith('BLA')) return 'BLA';
    if (appNumber.startsWith('ANDA')) return 'ANDA';
    return 'NDA';
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      rateLimiter: this.rateLimiter.getStats(),
      circuitBreaker: this.circuitBreaker.getStats(),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('🏛️ FDA cache cleared');
  }
}
