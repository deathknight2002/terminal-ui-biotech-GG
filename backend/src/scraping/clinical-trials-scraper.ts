/**
 * ClinicalTrials.gov Scraper
 * Trial data aggregation with status monitoring
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface ClinicalTrial {
  nctId: string;
  title: string;
  status: 'Recruiting' | 'Active, not recruiting' | 'Completed' | 'Terminated' | 'Suspended' | 'Withdrawn' | 'Not yet recruiting';
  phase: 'Early Phase 1' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'N/A';
  condition: string[];
  intervention: string[];
  sponsor: string;
  startDate?: string;
  completionDate?: string;
  estimatedEnrollment?: number;
  actualEnrollment?: number;
  primaryOutcome: string;
  secondaryOutcome?: string[];
  studyType: string;
  locations: TrialLocation[];
  eligibilityCriteria?: string;
  lastUpdateDate: string;
}

export interface TrialLocation {
  facility: string;
  city: string;
  state?: string;
  country: string;
  status?: string;
}

export interface TrialSearchParams {
  condition?: string;
  intervention?: string;
  sponsor?: string;
  phase?: string[];
  status?: string[];
  location?: string;
  minStartDate?: string;
  maxStartDate?: string;
  pageSize?: number;
  pageToken?: string;
}

export class ClinicalTrialsScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<ClinicalTrial[]>;
  private readonly baseUrl: string = 'https://clinicaltrials.gov/api/v2';
  
  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/1.0',
        'Accept': 'application/json',
      },
    });

    this.circuitBreaker = new CircuitBreaker('clinicaltrials', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 10, // Conservative rate
      minRate: 2,
      maxRate: 20,
    });

    this.cache = new LRUCache<ClinicalTrial[]>({
      maxSize: 500,
      defaultTTL: 7200000, // 2 hours
    });

    logger.info('🧪 ClinicalTrials scraper initialized');
  }

  /**
   * Search clinical trials
   */
  async search(params: TrialSearchParams): Promise<ClinicalTrial[]> {
    const cacheKey = JSON.stringify(params);
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🧪 Clinical trials cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const trials = await this.circuitBreaker.execute(async () => {
        return this.fetchTrials(params);
      });

      this.cache.set(cacheKey, trials);
      this.rateLimiter.recordSuccess();

      logger.info(`🧪 Clinical trials fetched: ${trials.length} records`);
      return trials;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🧪 Clinical trials search error:', error);
      throw error;
    }
  }

  /**
   * Fetch trials from API
   */
  private async fetchTrials(params: TrialSearchParams): Promise<ClinicalTrial[]> {
    const result = await retryWithBackoff(
      async () => {
        const queryParams = this.buildQueryParams(params);
        
        const response = await this.client.get('/studies', {
          params: queryParams,
        });

        return this.parseTrials(response.data);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Build query parameters
   */
  private buildQueryParams(params: TrialSearchParams): any {
    const queryParams: any = {
      'format': 'json',
      'pageSize': params.pageSize || 100,
    };

    if (params.pageToken) {
      queryParams.pageToken = params.pageToken;
    }

    // Build query string
    const queryParts: string[] = [];

    if (params.condition) {
      queryParts.push(`AREA[Condition]${params.condition}`);
    }

    if (params.intervention) {
      queryParts.push(`AREA[Intervention]${params.intervention}`);
    }

    if (params.sponsor) {
      queryParts.push(`AREA[Sponsor]${params.sponsor}`);
    }

    if (params.phase && params.phase.length > 0) {
      queryParts.push(`AREA[Phase]${params.phase.join(' OR ')}`);
    }

    if (params.status && params.status.length > 0) {
      queryParts.push(`AREA[OverallStatus]${params.status.join(' OR ')}`);
    }

    if (params.location) {
      queryParts.push(`AREA[LocationCountry]${params.location}`);
    }

    if (queryParts.length > 0) {
      queryParams.query = queryParts.join(' AND ');
    }

    return queryParams;
  }

  /**
   * Parse trials response
   */
  private parseTrials(data: any): ClinicalTrial[] {
    if (!data.studies) return [];

    return data.studies.map((study: any) => {
      const protocolSection = study.protocolSection || {};
      const identification = protocolSection.identificationModule || {};
      const statusModule = protocolSection.statusModule || {};
      const designModule = protocolSection.designModule || {};
      const conditionsModule = protocolSection.conditionsModule || {};
      const armsInterventionsModule = protocolSection.armsInterventionsModule || {};
      const sponsorCollaboratorsModule = protocolSection.sponsorCollaboratorsModule || {};
      const outcomesModule = protocolSection.outcomesModule || {};
      const contactsLocationsModule = protocolSection.contactsLocationsModule || {};
      const eligibilityModule = protocolSection.eligibilityModule || {};

      return {
        nctId: identification.nctId || '',
        title: identification.briefTitle || identification.officialTitle || '',
        status: statusModule.overallStatus || 'Unknown',
        phase: designModule.phases?.[0] || 'N/A',
        condition: conditionsModule.conditions || [],
        intervention: armsInterventionsModule.interventions?.map((i: any) => i.name) || [],
        sponsor: sponsorCollaboratorsModule.leadSponsor?.name || '',
        startDate: statusModule.startDateStruct?.date,
        completionDate: statusModule.completionDateStruct?.date,
        estimatedEnrollment: designModule.enrollmentInfo?.count,
        actualEnrollment: statusModule.overallStatus === 'Completed' ? designModule.enrollmentInfo?.count : undefined,
        primaryOutcome: outcomesModule.primaryOutcomes?.[0]?.measure || '',
        secondaryOutcome: outcomesModule.secondaryOutcomes?.map((o: any) => o.measure) || [],
        studyType: designModule.studyType || '',
        locations: this.parseLocations(contactsLocationsModule.locations || []),
        eligibilityCriteria: eligibilityModule.eligibilityCriteria,
        lastUpdateDate: statusModule.lastUpdateSubmitDate || '',
      };
    });
  }

  /**
   * Parse location data
   */
  private parseLocations(locations: any[]): TrialLocation[] {
    return locations.map(loc => ({
      facility: loc.facility || '',
      city: loc.city || '',
      state: loc.state,
      country: loc.country || '',
      status: loc.status,
    }));
  }

  /**
   * Get trial by NCT ID
   */
  async getTrial(nctId: string): Promise<ClinicalTrial | null> {
    const cacheKey = `trial:${nctId}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0];
    }

    await this.rateLimiter.waitForLimit();

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await this.client.get(`/studies/${nctId}`, {
            params: { format: 'json' },
          });

          const trials = this.parseTrials({ studies: [response.data] });
          return trials.length > 0 ? trials[0] : null;
        },
        RetryPatterns.network
      );

      if (result.success && result.data) {
        this.cache.set(cacheKey, [result.data]);
        return result.data;
      }

      return null;
    } catch (error) {
      logger.error(`🧪 Failed to fetch trial ${nctId}:`, error);
      return null;
    }
  }

  /**
   * Search trials by drug
   */
  async searchByDrug(drugName: string, maxResults: number = 50): Promise<ClinicalTrial[]> {
    return this.search({
      intervention: drugName,
      pageSize: maxResults,
    });
  }

  /**
   * Search trials by condition
   */
  async searchByCondition(condition: string, maxResults: number = 50): Promise<ClinicalTrial[]> {
    return this.search({
      condition,
      pageSize: maxResults,
    });
  }

  /**
   * Search trials by sponsor
   */
  async searchBySponsor(sponsor: string, maxResults: number = 50): Promise<ClinicalTrial[]> {
    return this.search({
      sponsor,
      pageSize: maxResults,
    });
  }

  /**
   * Get active oncology trials
   */
  async getActiveOncologyTrials(maxResults: number = 100): Promise<ClinicalTrial[]> {
    return this.search({
      condition: 'cancer',
      status: ['Recruiting', 'Active, not recruiting'],
      phase: ['Phase 2', 'Phase 3'],
      pageSize: maxResults,
    });
  }

  /**
   * Get recent trial updates
   */
  async getRecentUpdates(days: number = 30, maxResults: number = 100): Promise<ClinicalTrial[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.search({
      pageSize: maxResults,
      // Note: ClinicalTrials.gov API v2 doesn't directly support date filtering in simple queries
      // Would need to filter results post-fetch
    });
  }

  /**
   * Get trial statistics
   */
  async getTrialStats(params: TrialSearchParams): Promise<{
    total: number;
    byPhase: Record<string, number>;
    byStatus: Record<string, number>;
    byCountry: Record<string, number>;
  }> {
    const trials = await this.search(params);

    const stats = {
      total: trials.length,
      byPhase: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byCountry: {} as Record<string, number>,
    };

    trials.forEach(trial => {
      // Phase distribution
      stats.byPhase[trial.phase] = (stats.byPhase[trial.phase] || 0) + 1;

      // Status distribution
      stats.byStatus[trial.status] = (stats.byStatus[trial.status] || 0) + 1;

      // Country distribution
      trial.locations.forEach(loc => {
        stats.byCountry[loc.country] = (stats.byCountry[loc.country] || 0) + 1;
      });
    });

    return stats;
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
    logger.info('🧪 Clinical trials cache cleared');
  }
}
