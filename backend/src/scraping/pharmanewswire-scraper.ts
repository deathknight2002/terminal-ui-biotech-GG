/**
 * PharmaNewsWire Scraper
 * Scrapes pharmaceutical industry news, market updates, and company announcements
 * 
 * Rate Limits: Respectful crawling - max 1 req/2s
 * Source: https://www.pharmanewswire.com (simulated - using RSS/API pattern)
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface PharmaNewsWireArticle {
  id: string;
  title: string;
  url: string;
  author: string;
  publishedDate: string;
  summary: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  company?: string;
  market?: string;
}

export interface PharmaNewsWireSearchParams {
  query?: string;
  category?: 'market-analysis' | 'mergers-acquisitions' | 'regulatory' | 'clinical-data' | 'all';
  maxResults?: number;
  dateFrom?: string;
  dateTo?: string;
}

export class PharmaNewsWireScraper {
  private readonly baseUrl: string = 'https://www.pharmanewswire.com';
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<PharmaNewsWireArticle[]>;
  
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

    this.circuitBreaker = new CircuitBreaker('pharmanewswire', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5,
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<PharmaNewsWireArticle[]>({
      maxSize: 200,
      defaultTTL: 1800000, // 30 minutes
    });

    logger.info('💊 PharmaNewsWire scraper initialized');
  }

  /**
   * Get latest pharmaceutical industry news
   */
  async getLatestNews(maxResults: number = 20): Promise<PharmaNewsWireArticle[]> {
    const cacheKey = `latest:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached PharmaNewsWire articles');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching latest ${maxResults} articles from PharmaNewsWire...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/news/latest', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { limit: maxResults },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Fetched ${articles.length} articles from PharmaNewsWire`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(
    category: 'market-analysis' | 'mergers-acquisitions' | 'regulatory' | 'clinical-data',
    maxResults: number = 20
  ): Promise<PharmaNewsWireArticle[]> {
    const cacheKey = `category:${category}:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug(`📦 Returning cached ${category} articles`);
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching ${category} news from PharmaNewsWire...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get(`/news/category/${category}`, {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { limit: maxResults },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Fetched ${articles.length} ${category} articles`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Search articles
   */
  async searchArticles(params: PharmaNewsWireSearchParams): Promise<PharmaNewsWireArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached search results');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Searching PharmaNewsWire: "${params.query || 'all'}"`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/search', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: {
              q: params.query,
              category: params.category !== 'all' ? params.category : undefined,
              limit: params.maxResults || 20,
              date_from: params.dateFrom,
              date_to: params.dateTo,
            },
          });
        });

        const articles = this.parseSearchResults(response.data, params.maxResults || 20);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Found ${articles.length} articles matching search`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Parse articles from HTML/JSON response
   */
  private parseArticles(html: string, maxResults: number): PharmaNewsWireArticle[] {
    const articles: PharmaNewsWireArticle[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      $('.article-item, .news-item').each((index, element) => {
        if (articles.length >= maxResults) return false;
        
        const $element = $(element);
        const title = $element.find('.article-title, h2, h3').first().text().trim();
        const url = $element.find('a').first().attr('href') || '';
        const author = $element.find('.author, .byline').first().text().trim() || 'PharmaNewsWire Staff';
        const publishedDate = $element.find('.date, .published, time').first().text().trim() || new Date().toISOString();
        const summary = $element.find('.summary, .excerpt, p').first().text().trim();
        const category = $element.find('.category, .tag').first().text().trim() || 'General';
        const imageUrl = $element.find('img').first().attr('src');
        const company = $element.find('.company-tag').first().text().trim();
        
        if (title && url) {
          articles.push({
            id: this.extractIdFromUrl(url),
            title,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            author,
            publishedDate,
            summary,
            category,
            tags: this.extractTags($element),
            imageUrl,
            company,
            market: $element.find('.market-tag').first().text().trim() || undefined,
          });
        }
      });
    } catch (error) {
      logger.error('Failed to parse PharmaNewsWire articles:', error);
      this.rateLimiter.recordError();
      throw error;
    }
    
    return articles;
  }

  /**
   * Parse search results
   */
  private parseSearchResults(html: string, maxResults: number): PharmaNewsWireArticle[] {
    // Similar parsing logic for search results
    return this.parseArticles(html, maxResults);
  }

  /**
   * Extract article ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)[-\/]/) || url.match(/id[=\/](\d+)/);
    return match ? match[1] : `pharma-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract tags from article
   */
  private extractTags($element: any): string[] {
    const tags: string[] = [];
    
    $element.find('.tag, .label, .badge').each((_: number, tag: any) => {
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
    logger.info('🧹 PharmaNewsWire cache cleared');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('🔄 PharmaNewsWire circuit breaker reset');
  }
}
