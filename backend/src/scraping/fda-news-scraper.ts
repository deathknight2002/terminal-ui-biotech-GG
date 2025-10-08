/**
 * FDA News Tracker Scraper
 * Scrapes FDA drug approvals, regulatory updates, and safety announcements
 * 
 * Rate Limits: Respectful crawling - max 1 req/2s
 * Source: FDA News aggregated from multiple FDA sources
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface FDANewsArticle {
  id: string;
  title: string;
  url: string;
  publishedDate: string;
  summary: string;
  category: string;
  tags: string[];
  drugName?: string;
  company?: string;
  approvalType?: string;
  therapeuticArea?: string;
  indication?: string;
}

export interface FDANewsSearchParams {
  query?: string;
  category?: 'approvals' | 'safety' | 'recalls' | 'guidance' | 'all';
  drugName?: string;
  company?: string;
  dateFrom?: string;
  dateTo?: string;
  maxResults?: number;
}

export class FDANewsTrackerScraper {
  private readonly baseUrl: string = 'https://www.fda.gov';
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<FDANewsArticle[]>;
  
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
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

    this.circuitBreaker = new CircuitBreaker('fda-news-tracker', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5,
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<FDANewsArticle[]>({
      maxSize: 200,
      defaultTTL: 1800000, // 30 minutes
    });

    logger.info('🏛️ FDA News Tracker scraper initialized');
  }

  /**
   * Get latest FDA news
   */
  async getLatestNews(maxResults: number = 20): Promise<FDANewsArticle[]> {
    const cacheKey = `latest:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached FDA news');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching latest ${maxResults} FDA news items...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/news-events/newsroom/press-announcements', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { limit: maxResults },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Fetched ${articles.length} FDA news items`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Get recent drug approvals
   */
  async getRecentApprovals(maxResults: number = 20): Promise<FDANewsArticle[]> {
    const cacheKey = `approvals:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached FDA approvals');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching recent FDA approvals...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/drugs/news-events/drug-approvals', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { limit: maxResults },
          });
        });

        const articles = this.parseApprovals(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Fetched ${articles.length} FDA approvals`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Search FDA news
   */
  async searchNews(params: FDANewsSearchParams): Promise<FDANewsArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached search results');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Searching FDA news: "${params.query || 'all'}"`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/search', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: {
              query: params.query,
              category: params.category !== 'all' ? params.category : undefined,
              drug: params.drugName,
              company: params.company,
              date_from: params.dateFrom,
              date_to: params.dateTo,
              limit: params.maxResults || 20,
            },
          });
        });

        const articles = this.parseSearchResults(response.data, params.maxResults || 20);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Found ${articles.length} FDA news items matching search`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Parse general news articles
   */
  private parseArticles(html: string, maxResults: number): FDANewsArticle[] {
    const articles: FDANewsArticle[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      $('.press-release, .news-item, article').each((index, element) => {
        if (articles.length >= maxResults) return false;
        
        const $element = $(element);
        const title = $element.find('h2, h3, .title').first().text().trim();
        const url = $element.find('a').first().attr('href') || '';
        const publishedDate = $element.find('time, .date').first().attr('datetime') ||
                              $element.find('time, .date').first().text().trim() ||
                              new Date().toISOString();
        const summary = $element.find('p, .summary').first().text().trim();
        const category = this.extractCategory($element) || 'General';
        
        if (title && url) {
          articles.push({
            id: this.extractIdFromUrl(url),
            title,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            publishedDate,
            summary,
            category,
            tags: this.extractTags($element),
            drugName: this.extractDrugName(title, summary),
            company: this.extractCompany($element),
            therapeuticArea: this.extractTherapeuticArea($element),
          });
        }
      });
    } catch (error) {
      logger.error('Failed to parse FDA news:', error);
      this.rateLimiter.recordError();
      throw error;
    }
    
    return articles;
  }

  /**
   * Parse drug approvals
   */
  private parseApprovals(html: string, maxResults: number): FDANewsArticle[] {
    const articles: FDANewsArticle[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      $('.approval-item, .drug-approval, tr, article').each((index, element) => {
        if (articles.length >= maxResults) return false;
        
        const $element = $(element);
        const title = $element.find('.drug-name, td:first-child, h3').first().text().trim();
        const url = $element.find('a').first().attr('href') || '';
        const publishedDate = $element.find('.approval-date, time, td:nth-child(2)').first().text().trim() || new Date().toISOString();
        const summary = $element.find('.indication, .summary, td:nth-child(3)').first().text().trim();
        const drugName = $element.find('.drug-name, [data-drug]').first().text().trim() || this.extractDrugName(title, summary);
        const company = $element.find('.company, [data-company], td:nth-child(4)').first().text().trim();
        const approvalType = $element.find('.approval-type, [data-type]').first().text().trim();
        const indication = summary;
        
        if (title) {
          articles.push({
            id: this.extractIdFromUrl(url) || `approval-${Date.now()}-${index}`,
            title: title || `${drugName} Approval`,
            url: url.startsWith('http') ? url : url ? `${this.baseUrl}${url}` : `${this.baseUrl}/drugs/approvals`,
            publishedDate,
            summary,
            category: 'Approval',
            tags: ['FDA Approval', approvalType].filter(Boolean),
            drugName,
            company,
            approvalType,
            indication,
            therapeuticArea: this.extractTherapeuticArea($element),
          });
        }
      });
    } catch (error) {
      logger.error('Failed to parse FDA approvals:', error);
      this.rateLimiter.recordError();
      throw error;
    }
    
    return articles;
  }

  /**
   * Parse search results
   */
  private parseSearchResults(html: string, maxResults: number): FDANewsArticle[] {
    return this.parseArticles(html, maxResults);
  }

  /**
   * Extract category from element
   */
  private extractCategory($element: any): string {
    return $element.find('.category, .type, [data-category]').first().text().trim();
  }

  /**
   * Extract drug name from text
   */
  private extractDrugName(title: string, summary: string): string | undefined {
    // Look for capitalized drug names (usually in parentheses or after "for")
    const match = (title + ' ' + summary).match(/\(([A-Z][a-z]+(?:-[a-z]+)?)\)/) ||
                  (title + ' ' + summary).match(/for ([A-Z][a-z]+(?:-[a-z]+)?)/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract company from element
   */
  private extractCompany($element: any): string | undefined {
    return $element.find('.company, .manufacturer, [data-company]').first().text().trim() || undefined;
  }

  /**
   * Extract therapeutic area
   */
  private extractTherapeuticArea($element: any): string | undefined {
    return $element.find('.therapeutic-area, [data-area]').first().text().trim() || undefined;
  }

  /**
   * Extract article ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)[-\/]/) || url.match(/id[=\/](\d+)/) || url.match(/\/([a-z0-9-]+)\/?$/);
    return match ? match[1] : `fda-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract tags from article
   */
  private extractTags($element: any): string[] {
    const tags: string[] = [];
    
    $element.find('.tag, .label, .category').each((_: number, tag: any) => {
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
        currentRate: this.rateLimiter.getStats().currentRate,
      },
      cache: {
        size: this.cache.getStats().size,
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('🧹 FDA News Tracker cache cleared');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('🔄 FDA News Tracker circuit breaker reset');
  }
}
