/**
 * BioSpace Scraper
 * Pharma news, job postings, and company information
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface BioSpaceArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedDate: string;
  type: 'news' | 'press-release' | 'job' | 'company';
  company?: string;
  location?: string;
  tags: string[];
}

export interface BioSpaceJobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  postedDate: string;
  description: string;
  jobType?: string;
  department?: string;
}

export interface BioSpaceCompanyInfo {
  id: string;
  name: string;
  description: string;
  location: string;
  website?: string;
  employees?: string;
  founded?: string;
  url: string;
}

export interface BioSpaceSearchParams {
  type?: 'news' | 'jobs' | 'companies';
  query?: string;
  maxResults?: number;
  location?: string;
}

export class BioSpaceScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<any>;
  private readonly baseUrl: string = 'https://www.biospace.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/1.0 (Research and Educational Purposes)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    this.circuitBreaker = new CircuitBreaker('biospace', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 1, // 1 req/s
      minRate: 0.5,
      maxRate: 2,
      window: 1000,
    });

    this.cache = new LRUCache<any>({
      maxSize: 300,
      defaultTTL: 14400000, // 4 hours
    });

    logger.info('💼 BioSpace scraper initialized');
  }

  /**
   * Get latest news and articles
   */
  async getLatestNews(params: BioSpaceSearchParams = {}): Promise<BioSpaceArticle[]> {
    const cacheKey = `news:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('💼 BioSpace news cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.fetchNews(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`💼 BioSpace: Fetched ${articles.length} news articles`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('💼 BioSpace news fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch news articles
   */
  private async fetchNews(params: BioSpaceSearchParams): Promise<BioSpaceArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        const url = params.query 
          ? `/search?q=${encodeURIComponent(params.query)}`
          : '/news';
        
        const response = await this.client.get(url);
        return this.parseNewsHTML(response.data, params.maxResults || 20);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse news articles from HTML
   */
  private parseNewsHTML(html: string, maxResults: number): BioSpaceArticle[] {
    const $ = cheerio.load(html);
    const articles: BioSpaceArticle[] = [];

    $('article, .news-item, .article-listing').slice(0, maxResults).each((_, element) => {
      try {
        const $article = $(element);
        
        const titleEl = $article.find('h2, h3, .title').first();
        const title = titleEl.text().trim();
        const urlPath = titleEl.find('a').attr('href') || $article.find('a').first().attr('href');
        
        if (!title || !urlPath) return;

        const url = urlPath.startsWith('http') ? urlPath : `${this.baseUrl}${urlPath}`;
        const id = this.extractIdFromUrl(url);
        
        const summary = $article.find('.summary, .excerpt, p').first().text().trim();
        const publishedDate = $article.find('time, .date').first().attr('datetime') || 
                            $article.find('time, .date').first().text().trim();
        
        const company = $article.find('.company-name, .company').first().text().trim();
        const location = $article.find('.location').first().text().trim();
        
        const tags: string[] = [];
        $article.find('.tag, .category').each((_, tagEl) => {
          const tag = $(tagEl).text().trim();
          if (tag) tags.push(tag);
        });

        // Determine article type
        let type: 'news' | 'press-release' | 'job' | 'company' = 'news';
        if (url.includes('/press-release/') || tags.includes('Press Release')) {
          type = 'press-release';
        }

        articles.push({
          id,
          title,
          summary: summary.substring(0, 500),
          url,
          publishedDate: publishedDate || new Date().toISOString(),
          type,
          company: company || undefined,
          location: location || undefined,
          tags,
        });
      } catch (error) {
        logger.warn('💼 Failed to parse article:', error);
      }
    });

    logger.debug(`💼 Parsed ${articles.length} news articles from HTML`);
    return articles;
  }

  /**
   * Get job postings
   */
  async getJobPostings(params: BioSpaceSearchParams = {}): Promise<BioSpaceJobPosting[]> {
    const cacheKey = `jobs:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('💼 BioSpace jobs cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const jobs = await this.circuitBreaker.execute(async () => {
        return this.fetchJobs(params);
      });

      this.cache.set(cacheKey, jobs);
      this.rateLimiter.recordSuccess();

      logger.info(`💼 BioSpace: Fetched ${jobs.length} job postings`);
      return jobs;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('💼 BioSpace jobs fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch job postings
   */
  private async fetchJobs(params: BioSpaceSearchParams): Promise<BioSpaceJobPosting[]> {
    const result = await retryWithBackoff(
      async () => {
        let url = '/jobs';
        if (params.query || params.location) {
          const queryParams = new URLSearchParams();
          if (params.query) queryParams.append('q', params.query);
          if (params.location) queryParams.append('l', params.location);
          url += `?${queryParams.toString()}`;
        }
        
        const response = await this.client.get(url);
        return this.parseJobsHTML(response.data, params.maxResults || 20);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse job postings from HTML
   */
  private parseJobsHTML(html: string, maxResults: number): BioSpaceJobPosting[] {
    const $ = cheerio.load(html);
    const jobs: BioSpaceJobPosting[] = [];

    $('.job-listing, .job-item, article.job').slice(0, maxResults).each((_, element) => {
      try {
        const $job = $(element);
        
        const titleEl = $job.find('h2, h3, .job-title').first();
        const title = titleEl.text().trim();
        const urlPath = titleEl.find('a').attr('href') || $job.find('a').first().attr('href');
        
        if (!title || !urlPath) return;

        const url = urlPath.startsWith('http') ? urlPath : `${this.baseUrl}${urlPath}`;
        const id = this.extractIdFromUrl(url);
        
        const company = $job.find('.company-name, .company').first().text().trim();
        const location = $job.find('.location, .job-location').first().text().trim();
        const postedDate = $job.find('time, .date, .posted-date').first().attr('datetime') || 
                          $job.find('time, .date, .posted-date').first().text().trim();
        const description = $job.find('.description, .job-description').first().text().trim();
        const jobType = $job.find('.job-type').first().text().trim();
        const department = $job.find('.department').first().text().trim();

        jobs.push({
          id,
          title,
          company: company || 'Not specified',
          location: location || 'Not specified',
          url,
          postedDate: postedDate || new Date().toISOString(),
          description: description.substring(0, 500),
          jobType: jobType || undefined,
          department: department || undefined,
        });
      } catch (error) {
        logger.warn('💼 Failed to parse job posting:', error);
      }
    });

    logger.debug(`💼 Parsed ${jobs.length} job postings from HTML`);
    return jobs;
  }

  /**
   * Get company information
   */
  async getCompanyInfo(companyName: string): Promise<BioSpaceCompanyInfo | null> {
    const cacheKey = `company:${companyName}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('💼 BioSpace company cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await this.client.get(`/company/${encodeURIComponent(companyName)}`);
          return this.parseCompanyHTML(response.data, companyName);
        },
        RetryPatterns.network
      );

      if (result.success && result.data) {
        this.cache.set(cacheKey, result.data);
        this.rateLimiter.recordSuccess();
        return result.data;
      }
      
      return null;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('💼 Failed to fetch company info:', error);
      return null;
    }
  }

  /**
   * Parse company information from HTML
   */
  private parseCompanyHTML(html: string, companyName: string): BioSpaceCompanyInfo {
    const $ = cheerio.load(html);
    
    const name = $('.company-name, h1').first().text().trim() || companyName;
    const description = $('.company-description, .about').first().text().trim();
    const location = $('.company-location, .location').first().text().trim();
    const website = $('.company-website a, .website a').first().attr('href');
    const employees = $('.employees, .company-size').first().text().trim();
    const founded = $('.founded, .year-founded').first().text().trim();
    
    return {
      id: Buffer.from(name).toString('base64').substring(0, 16),
      name,
      description: description.substring(0, 1000),
      location: location || 'Not specified',
      website: website || undefined,
      employees: employees || undefined,
      founded: founded || undefined,
      url: `${this.baseUrl}/company/${encodeURIComponent(companyName)}`,
    };
  }

  /**
   * Extract ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)\/?$|\/([a-zA-Z0-9-]+)\/?$/);
    if (match) {
      return match[1] || match[2];
    }
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  /**
   * Get press releases
   */
  async getPressReleases(maxResults: number = 20): Promise<BioSpaceArticle[]> {
    const articles = await this.getLatestNews({ maxResults: maxResults * 2 });
    return articles.filter(a => a.type === 'press-release').slice(0, maxResults);
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
    logger.info('💼 BioSpace cache cleared');
  }
}
