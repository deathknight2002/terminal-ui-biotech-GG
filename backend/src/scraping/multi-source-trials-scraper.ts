/**
 * Multi-Source Clinical Trials Scraper
 * Aggregates clinical trial data from multiple international sources
 * Sources:
 * - ClinicalTrials.gov (US)
 * - EU Clinical Trials Register
 * - WHO ICTRP (International Clinical Trials Registry Platform)
 * - Additional ClinicalTrials.gov endpoints for comprehensive coverage
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';
import { ClinicalTrial, TrialLocation, TrialSearchParams } from './clinical-trials-scraper.js';

export interface MultiSourceTrialConfig {
  targetCount?: number; // Target number of trials to fetch (default: 500)
  includeSources?: Array<'clinicaltrials.gov' | 'eu-ctr' | 'who-ictrp'>;
  maxConcurrentRequests?: number;
}

export interface TrialStats {
  total: number;
  bySource: Record<string, number>;
  byPhase: Record<string, number>;
  byStatus: Record<string, number>;
  byCountry: Record<string, number>;
  fetchTime: number;
}

export class MultiSourceTrialsScraper {
  private usClient: AxiosInstance;
  private euClient: AxiosInstance;
  private whoClient: AxiosInstance;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private rateLimiters: Map<string, AdaptiveRateLimiter>;
  private cache: LRUCache<ClinicalTrial[]>;
  private config: Required<MultiSourceTrialConfig>;

  constructor(config: MultiSourceTrialConfig = {}) {
    this.config = {
      targetCount: config.targetCount || 500,
      includeSources: config.includeSources || ['clinicaltrials.gov', 'eu-ctr', 'who-ictrp'],
      maxConcurrentRequests: config.maxConcurrentRequests || 5,
    };

    // Initialize ClinicalTrials.gov client
    this.usClient = axios.create({
      baseURL: 'https://clinicaltrials.gov/api/v2',
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/2.0 Multi-Source',
        'Accept': 'application/json',
      },
    });

    // Initialize EU CTR client
    this.euClient = axios.create({
      baseURL: 'https://www.clinicaltrialsregister.eu/ctr-search/rest',
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/2.0 Multi-Source',
        'Accept': 'application/json',
      },
    });

    // Initialize WHO ICTRP client
    this.whoClient = axios.create({
      baseURL: 'https://trialsearch.who.int',
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/2.0 Multi-Source',
        'Accept': 'application/json',
      },
    });

    // Circuit breakers for each source
    this.circuitBreakers = new Map([
      ['clinicaltrials.gov', new CircuitBreaker('clinicaltrials-gov', { failureThreshold: 5, resetTimeout: 60000 })],
      ['eu-ctr', new CircuitBreaker('eu-ctr', { failureThreshold: 5, resetTimeout: 60000 })],
      ['who-ictrp', new CircuitBreaker('who-ictrp', { failureThreshold: 5, resetTimeout: 60000 })],
    ]);

    // Rate limiters for each source
    this.rateLimiters = new Map([
      ['clinicaltrials.gov', new AdaptiveRateLimiter({ initialRate: 10, minRate: 2, maxRate: 20 })],
      ['eu-ctr', new AdaptiveRateLimiter({ initialRate: 5, minRate: 1, maxRate: 10 })],
      ['who-ictrp', new AdaptiveRateLimiter({ initialRate: 5, minRate: 1, maxRate: 10 })],
    ]);

    // Shared cache
    this.cache = new LRUCache<ClinicalTrial[]>({
      maxSize: 1000, // Increased cache size for more trials
      defaultTTL: 7200000, // 2 hours
    });

    logger.info(`🧪 Multi-source clinical trials scraper initialized (target: ${this.config.targetCount} trials)`);
  }

  /**
   * Fetch trials from all configured sources
   */
  async fetchAllTrials(params: TrialSearchParams = {}): Promise<ClinicalTrial[]> {
    const startTime = Date.now();
    const allTrials: ClinicalTrial[] = [];
    const errors: Array<{ source: string; error: any }> = [];

    // Calculate how many trials to fetch from each source
    const trialsPerSource = Math.ceil(this.config.targetCount / this.config.includeSources.length);

    // Define valid source identifiers (not URLs, just enum-like constants for source selection)
    // These are configuration keys, not URL substrings, so no URL validation is needed
    const CLINICALTRIALS_GOV = 'clinicaltrials.gov';
    const EU_CTR = 'eu-ctr';
    const WHO_ICTRP = 'who-ictrp';

    // Fetch from ClinicalTrials.gov
    if (this.config.includeSources.includes(CLINICALTRIALS_GOV)) {
      try {
        logger.info(`🧪 Fetching trials from ClinicalTrials.gov (target: ${trialsPerSource})`);
        const usTrials = await this.fetchFromClinicalTrialsGov(params, trialsPerSource);
        allTrials.push(...usTrials);
        logger.info(`✅ Fetched ${usTrials.length} trials from ClinicalTrials.gov`);
      } catch (error) {
        logger.error('❌ Error fetching from ClinicalTrials.gov:', error);
        errors.push({ source: CLINICALTRIALS_GOV, error });
      }
    }

    // Fetch from EU CTR
    if (this.config.includeSources.includes(EU_CTR)) {
      try {
        logger.info(`🧪 Fetching trials from EU Clinical Trials Register (target: ${trialsPerSource})`);
        const euTrials = await this.fetchFromEUCTR(params, trialsPerSource);
        allTrials.push(...euTrials);
        logger.info(`✅ Fetched ${euTrials.length} trials from EU CTR`);
      } catch (error) {
        logger.error('❌ Error fetching from EU CTR:', error);
        errors.push({ source: EU_CTR, error });
      }
    }

    // Fetch from WHO ICTRP
    if (this.config.includeSources.includes(WHO_ICTRP)) {
      try {
        logger.info(`🧪 Fetching trials from WHO ICTRP (target: ${trialsPerSource})`);
        const whoTrials = await this.fetchFromWHOICTRP(params, trialsPerSource);
        allTrials.push(...whoTrials);
        logger.info(`✅ Fetched ${whoTrials.length} trials from WHO ICTRP`);
      } catch (error) {
        logger.error('❌ Error fetching from WHO ICTRP:', error);
        errors.push({ source: WHO_ICTRP, error });
      }
    }

    // Deduplicate trials based on NCT ID or equivalent
    const uniqueTrials = this.deduplicateTrials(allTrials);

    const fetchTime = Date.now() - startTime;
    logger.info(`🎯 Total unique trials fetched: ${uniqueTrials.length} from ${this.config.includeSources.length} sources in ${fetchTime}ms`);

    if (errors.length > 0) {
      logger.warn(`⚠️ Encountered ${errors.length} errors during fetch`);
    }

    return uniqueTrials;
  }

  /**
   * Fetch trials from ClinicalTrials.gov with pagination
   */
  private async fetchFromClinicalTrialsGov(params: TrialSearchParams, targetCount: number): Promise<ClinicalTrial[]> {
    const rateLimiter = this.rateLimiters.get('clinicaltrials.gov')!;
    const circuitBreaker = this.circuitBreakers.get('clinicaltrials.gov')!;
    const allTrials: ClinicalTrial[] = [];
    
    let pageToken: string | undefined = undefined;
    const pageSize = 100; // Max allowed by API
    const maxPages = Math.ceil(targetCount / pageSize);

    for (let page = 0; page < maxPages; page++) {
      await rateLimiter.waitForLimit();

      try {
        const trials = await circuitBreaker.execute(async () => {
          const queryParams = this.buildClinicalTrialsGovQuery(params, pageSize, pageToken);
          
          const response = await this.usClient.get('/studies', {
            params: queryParams,
          });

          const parsedTrials = this.parseClinicalTrialsGovResponse(response.data);
          
          // Extract next page token
          pageToken = response.data.nextPageToken;
          
          return parsedTrials;
        });

        allTrials.push(...trials);
        rateLimiter.recordSuccess();

        // Check if we have enough trials or no more pages
        if (allTrials.length >= targetCount || !pageToken) {
          break;
        }

        logger.debug(`📄 ClinicalTrials.gov page ${page + 1}: ${trials.length} trials (total: ${allTrials.length})`);
      } catch (error) {
        rateLimiter.recordError();
        logger.error(`❌ Error fetching page ${page + 1} from ClinicalTrials.gov:`, error);
        break; // Stop pagination on error
      }
    }

    return allTrials.slice(0, targetCount);
  }

  /**
   * Fetch trials from EU Clinical Trials Register
   */
  private async fetchFromEUCTR(params: TrialSearchParams, targetCount: number): Promise<ClinicalTrial[]> {
    const rateLimiter = this.rateLimiters.get('eu-ctr')!;
    const circuitBreaker = this.circuitBreakers.get('eu-ctr')!;
    const allTrials: ClinicalTrial[] = [];

    // EU CTR uses different query structure
    const pageSize = 50; // Conservative for EU API
    const maxPages = Math.ceil(targetCount / pageSize);

    for (let page = 0; page < maxPages; page++) {
      await rateLimiter.waitForLimit();

      try {
        const trials = await circuitBreaker.execute(async () => {
          // EU CTR search endpoint (simplified for demonstration)
          const searchParams = {
            query: this.buildEUCTRQuery(params),
            page: page + 1,
            limit: pageSize,
          };

          // Note: EU CTR API structure may vary, this is a generalized implementation
          const response = await this.euClient.get('/search', {
            params: searchParams,
          });

          return this.parseEUCTRResponse(response.data);
        });

        allTrials.push(...trials);
        rateLimiter.recordSuccess();

        if (allTrials.length >= targetCount || trials.length < pageSize) {
          break;
        }

        logger.debug(`📄 EU CTR page ${page + 1}: ${trials.length} trials (total: ${allTrials.length})`);
      } catch (error) {
        rateLimiter.recordError();
        logger.error(`❌ Error fetching page ${page + 1} from EU CTR:`, error);
        // EU CTR might have connectivity issues, continue with what we have
        break;
      }
    }

    return allTrials.slice(0, targetCount);
  }

  /**
   * Fetch trials from WHO ICTRP
   */
  private async fetchFromWHOICTRP(params: TrialSearchParams, targetCount: number): Promise<ClinicalTrial[]> {
    const rateLimiter = this.rateLimiters.get('who-ictrp')!;
    const circuitBreaker = this.circuitBreakers.get('who-ictrp')!;
    const allTrials: ClinicalTrial[] = [];

    const pageSize = 50;
    const maxPages = Math.ceil(targetCount / pageSize);

    for (let page = 0; page < maxPages; page++) {
      await rateLimiter.waitForLimit();

      try {
        const trials = await circuitBreaker.execute(async () => {
          // WHO ICTRP search (simplified implementation)
          const searchParams = {
            query: this.buildWHOICTRPQuery(params),
            skip: page * pageSize,
            limit: pageSize,
          };

          // Note: WHO ICTRP API may require different approach
          const response = await this.whoClient.get('/api/search', {
            params: searchParams,
          });

          return this.parseWHOICTRPResponse(response.data);
        });

        allTrials.push(...trials);
        rateLimiter.recordSuccess();

        if (allTrials.length >= targetCount || trials.length < pageSize) {
          break;
        }

        logger.debug(`📄 WHO ICTRP page ${page + 1}: ${trials.length} trials (total: ${allTrials.length})`);
      } catch (error) {
        rateLimiter.recordError();
        logger.error(`❌ Error fetching page ${page + 1} from WHO ICTRP:`, error);
        break;
      }
    }

    return allTrials.slice(0, targetCount);
  }

  /**
   * Build query for ClinicalTrials.gov
   */
  private buildClinicalTrialsGovQuery(params: TrialSearchParams, pageSize: number, pageToken?: string): any {
    const queryParams: any = {
      'format': 'json',
      'pageSize': pageSize,
    };

    if (pageToken) {
      queryParams.pageToken = pageToken;
    }

    // Build query string
    const queryParts: string[] = [];

    if (params.condition) {
      queryParts.push(`AREA[Condition]${params.condition}`);
    } else {
      // Default: fetch biotech-relevant trials
      queryParts.push('AREA[Condition](cancer OR oncology OR immunotherapy OR gene therapy OR rare disease OR CAR-T OR monoclonal antibody)');
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
    } else {
      // Default: active trials
      queryParts.push('AREA[OverallStatus](Recruiting OR Active, not recruiting OR Enrolling by invitation)');
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
   * Build query for EU CTR
   */
  private buildEUCTRQuery(params: TrialSearchParams): string {
    const parts: string[] = [];

    if (params.condition) {
      parts.push(params.condition);
    } else {
      parts.push('cancer oncology immunotherapy');
    }

    if (params.intervention) {
      parts.push(params.intervention);
    }

    return parts.join(' ');
  }

  /**
   * Build query for WHO ICTRP
   */
  private buildWHOICTRPQuery(params: TrialSearchParams): string {
    const parts: string[] = [];

    if (params.condition) {
      parts.push(params.condition);
    } else {
      parts.push('cancer OR oncology OR immunotherapy');
    }

    return parts.join(' ');
  }

  /**
   * Parse ClinicalTrials.gov response
   */
  private parseClinicalTrialsGovResponse(data: any): ClinicalTrial[] {
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
        nctId: identification.nctId || `US-${Date.now()}-${Math.random()}`,
        title: identification.briefTitle || identification.officialTitle || 'Untitled Study',
        status: this.normalizeStatus(statusModule.overallStatus || 'Unknown'),
        phase: this.normalizePhase(designModule.phases?.[0] || 'N/A'),
        condition: conditionsModule.conditions || [],
        intervention: armsInterventionsModule.interventions?.map((i: any) => i.name) || [],
        sponsor: sponsorCollaboratorsModule.leadSponsor?.name || 'Unknown Sponsor',
        startDate: statusModule.startDateStruct?.date,
        completionDate: statusModule.completionDateStruct?.date,
        estimatedEnrollment: designModule.enrollmentInfo?.count,
        actualEnrollment: statusModule.overallStatus === 'Completed' ? designModule.enrollmentInfo?.count : undefined,
        primaryOutcome: outcomesModule.primaryOutcomes?.[0]?.measure || 'Not specified',
        secondaryOutcome: outcomesModule.secondaryOutcomes?.map((o: any) => o.measure) || [],
        studyType: designModule.studyType || 'Interventional',
        locations: this.parseLocations(contactsLocationsModule.locations || []),
        eligibilityCriteria: eligibilityModule.eligibilityCriteria,
        lastUpdateDate: statusModule.lastUpdateSubmitDate || new Date().toISOString(),
      };
    });
  }

  /**
   * Parse EU CTR response
   */
  private parseEUCTRResponse(data: any): ClinicalTrial[] {
    // EU CTR has different data structure
    // This is a simplified implementation
    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((trial: any) => ({
      nctId: trial.eudractNumber || `EU-${Date.now()}-${Math.random()}`,
      title: trial.fullTitle || trial.publicTitle || 'Untitled Study',
      status: this.normalizeStatus(trial.trialStatus || 'Unknown'),
      phase: this.normalizePhase(trial.phase || 'N/A'),
      condition: [trial.medicalCondition].filter(Boolean),
      intervention: trial.interventions || [],
      sponsor: trial.sponsorName || 'Unknown Sponsor',
      startDate: trial.trialStartDate,
      completionDate: trial.trialEndDate,
      estimatedEnrollment: trial.subjectsPlanned,
      primaryOutcome: trial.primaryObjective || 'Not specified',
      secondaryOutcome: trial.secondaryObjectives ? [trial.secondaryObjectives] : [],
      studyType: 'Interventional',
      locations: trial.countries?.map((country: string) => ({
        facility: 'EU Clinical Site',
        city: '',
        country: country,
      })) || [],
      lastUpdateDate: trial.lastUpdate || new Date().toISOString(),
    }));
  }

  /**
   * Parse WHO ICTRP response
   */
  private parseWHOICTRPResponse(data: any): ClinicalTrial[] {
    // WHO ICTRP has different data structure
    // This is a simplified implementation
    if (!data || !Array.isArray(data.trials)) {
      return [];
    }

    return data.trials.map((trial: any) => ({
      nctId: trial.trialId || `WHO-${Date.now()}-${Math.random()}`,
      title: trial.scientificTitle || trial.publicTitle || 'Untitled Study',
      status: this.normalizeStatus(trial.recruitmentStatus || 'Unknown'),
      phase: this.normalizePhase(trial.phase || 'N/A'),
      condition: trial.condition ? [trial.condition] : [],
      intervention: trial.interventions || [],
      sponsor: trial.primarySponsor || 'Unknown Sponsor',
      startDate: trial.dateRegistration,
      completionDate: trial.dateEnrollmentAnticipated,
      estimatedEnrollment: trial.targetSampleSize,
      primaryOutcome: trial.primaryOutcome || 'Not specified',
      secondaryOutcome: trial.secondaryOutcomes || [],
      studyType: trial.studyType || 'Interventional',
      locations: trial.countries?.map((country: string) => ({
        facility: 'International Site',
        city: '',
        country: country,
      })) || [],
      lastUpdateDate: trial.lastUpdated || new Date().toISOString(),
    }));
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
   * Normalize status across different sources
   */
  private normalizeStatus(status: string): ClinicalTrial['status'] {
    const statusMap: Record<string, ClinicalTrial['status']> = {
      'recruiting': 'Recruiting',
      'active': 'Active, not recruiting',
      'active, not recruiting': 'Active, not recruiting',
      'completed': 'Completed',
      'terminated': 'Terminated',
      'suspended': 'Suspended',
      'withdrawn': 'Withdrawn',
      'not yet recruiting': 'Not yet recruiting',
    };

    return statusMap[status.toLowerCase()] || 'Recruiting';
  }

  /**
   * Normalize phase across different sources
   */
  private normalizePhase(phase: string): ClinicalTrial['phase'] {
    const phaseMap: Record<string, ClinicalTrial['phase']> = {
      'early phase 1': 'Early Phase 1',
      'phase 1': 'Phase 1',
      'phase i': 'Phase 1',
      'phase 2': 'Phase 2',
      'phase ii': 'Phase 2',
      'phase 3': 'Phase 3',
      'phase iii': 'Phase 3',
      'phase 4': 'Phase 4',
      'phase iv': 'Phase 4',
      'n/a': 'N/A',
    };

    return phaseMap[phase.toLowerCase()] || 'N/A';
  }

  /**
   * Deduplicate trials based on NCT ID or equivalent
   */
  private deduplicateTrials(trials: ClinicalTrial[]): ClinicalTrial[] {
    const seen = new Set<string>();
    const unique: ClinicalTrial[] = [];

    for (const trial of trials) {
      // Use NCT ID as primary deduplication key
      const key = trial.nctId.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(trial);
      }
    }

    return unique;
  }

  /**
   * Get statistics about fetched trials
   */
  getStats(trials: ClinicalTrial[]): TrialStats {
    const stats: TrialStats = {
      total: trials.length,
      bySource: {},
      byPhase: {},
      byStatus: {},
      byCountry: {},
      fetchTime: 0,
    };

    for (const trial of trials) {
      // Count by source (based on NCT ID prefix)
      const source = trial.nctId.startsWith('NCT') ? 'ClinicalTrials.gov' :
                    trial.nctId.startsWith('EU-') ? 'EU CTR' :
                    trial.nctId.startsWith('WHO-') ? 'WHO ICTRP' : 'Other';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;

      // Count by phase
      stats.byPhase[trial.phase] = (stats.byPhase[trial.phase] || 0) + 1;

      // Count by status
      stats.byStatus[trial.status] = (stats.byStatus[trial.status] || 0) + 1;

      // Count by country
      for (const location of trial.locations) {
        stats.byCountry[location.country] = (stats.byCountry[location.country] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('🧪 Multi-source trials cache cleared');
  }
}
