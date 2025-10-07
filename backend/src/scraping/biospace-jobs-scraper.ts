/**
 * BioSpace Jobs Scraper
 * Scrapes biotech and pharmaceutical job postings
 * 
 * Rate Limits: Respectful crawling - max 1 req/2s
 * Source: https://www.biospace.com/jobs
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface BioSpaceJobPosting {
  id: string;
  title: string;
  url: string;
  company: string;
  location: string;
  postedDate: string;
  description: string;
  jobType: string;
  experienceLevel: string;
  tags: string[];
  salary?: string;
  department?: string;
  therapeuticArea?: string;
}

export interface BioSpaceJobsSearchParams {
  query?: string;
  location?: string;
  company?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'all';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive' | 'all';
  therapeuticArea?: string;
  maxResults?: number;
}

export class BioSpaceJobsScraper {
  private readonly baseUrl: string = 'https://www.biospace.com';
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<BioSpaceJobPosting[]>;
  
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    this.circuitBreaker = new CircuitBreaker('biospace-jobs', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5,
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<BioSpaceJobPosting[]>({
      maxSize: 200,
      defaultTTL: 1800000, // 30 minutes
    });

    logger.info('💼 BioSpace Jobs scraper initialized');
  }

  /**
   * Get latest job postings
   */
  async getLatestJobs(maxResults: number = 20): Promise<BioSpaceJobPosting[]> {
    const cacheKey = `latest:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached BioSpace job postings');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching latest ${maxResults} job postings from BioSpace...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/jobs', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { limit: maxResults, sort: 'date' },
          });
        });

        const jobs = this.parseJobs(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, jobs);
        
        logger.info(`✅ Fetched ${jobs.length} job postings from BioSpace`);
        return jobs;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Search job postings
   */
  async searchJobs(params: BioSpaceJobsSearchParams): Promise<BioSpaceJobPosting[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached job search results');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Searching BioSpace jobs: "${params.query || 'all'}"`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/jobs/search', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: {
              q: params.query,
              location: params.location,
              company: params.company,
              job_type: params.jobType !== 'all' ? params.jobType : undefined,
              experience: params.experienceLevel !== 'all' ? params.experienceLevel : undefined,
              therapeutic_area: params.therapeuticArea,
              limit: params.maxResults || 20,
            },
          });
        });

        const jobs = this.parseSearchResults(response.data, params.maxResults || 20);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, jobs);
        
        logger.info(`✅ Found ${jobs.length} job postings matching search`);
        return jobs;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Parse job postings from HTML/JSON response
   */
  private parseJobs(html: string, maxResults: number): BioSpaceJobPosting[] {
    const jobs: BioSpaceJobPosting[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      $('.job-item, .job-listing, .job-card, article.job').each((index, element) => {
        if (jobs.length >= maxResults) return false;
        
        const $element = $(element);
        const title = $element.find('.job-title, h2, h3, .title').first().text().trim();
        const url = $element.find('a').first().attr('href') || '';
        const company = $element.find('.company, .employer, .company-name').first().text().trim();
        const location = $element.find('.location, .job-location, [data-location]').first().text().trim();
        const postedDate = $element.find('.posted-date, time, .date').first().attr('datetime') ||
                          $element.find('.posted-date, time, .date').first().text().trim() ||
                          new Date().toISOString();
        const description = $element.find('.description, .summary, p').first().text().trim();
        const jobType = $element.find('.job-type, .employment-type').first().text().trim() || 'Full-time';
        const experienceLevel = $element.find('.experience, .level, .seniority').first().text().trim() || 'Not specified';
        const salary = $element.find('.salary, .compensation').first().text().trim();
        const department = $element.find('.department, [data-department]').first().text().trim();
        const therapeuticArea = $element.find('.therapeutic-area, [data-area]').first().text().trim();
        
        if (title && company) {
          jobs.push({
            id: this.extractIdFromUrl(url),
            title,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            company,
            location,
            postedDate,
            description,
            jobType,
            experienceLevel,
            tags: this.extractTags($element),
            salary,
            department,
            therapeuticArea,
          });
        }
      });
    } catch (error) {
      logger.error('Failed to parse BioSpace job postings:', error);
      this.rateLimiter.recordError();
      throw error;
    }
    
    return jobs;
  }

  /**
   * Parse search results
   */
  private parseSearchResults(html: string, maxResults: number): BioSpaceJobPosting[] {
    return this.parseJobs(html, maxResults);
  }

  /**
   * Extract job ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/jobs\/(\d+)/) || url.match(/job[_-]?id[=\/](\d+)/) || url.match(/\/([a-z0-9-]+)\/?$/);
    return match ? match[1] : `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract tags from job posting
   */
  private extractTags($element: any): string[] {
    const tags: string[] = [];
    
    $element.find('.tag, .skill, .badge, .label').each((_: number, tag: any) => {
      const tagText = $(tag).text().trim();
      if (tagText) {
        tags.push(tagText);
      }
    });
    
    return tags;
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Get scraper health status
   */
  getHealth() {
    return {
      status: this.circuitBreaker.getState() === 'CLOSED' ? 'healthy' : 'degraded',
      circuitBreaker: {
        state: this.circuitBreaker.getState(),
        stats: this.circuitBreaker.getStats(),
      },
      rateLimiter: {
        currentRate: this.rateLimiter.getCurrentRate(),
      },
      cache: {
        size: this.cache.size(),
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('🧹 BioSpace Jobs cache cleared');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('🔄 BioSpace Jobs circuit breaker reset');
  }
}
