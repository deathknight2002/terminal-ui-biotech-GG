/**
 * BioPharma Dive Scraper
 * Scrapes drug pipeline tracking, development updates, and therapeutic area news
 * 
 * Rate Limits: Respectful crawling - max 1 req/2s
 * Source: https://www.biopharmadive.com
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface BioPharmaDigestArticle {
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
  therapeuticArea?: string;
  pipelineStage?: string;
}

export interface BioPharmaDigestSearchParams {
  query?: string;
  category?: 'oncology' | 'rare-disease' | 'immunology' | 'neurology' | 'all';
  company?: string;
  therapeuticArea?: string;
  maxResults?: number;
}

export class BioPharmaDigestScraper {
  private readonly baseUrl: string = 'https://www.biopharmadive.com';
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<BioPharmaDigestArticle[]>;
  
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

    this.circuitBreaker = new CircuitBreaker('biopharmadive', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5,
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<BioPharmaDigestArticle[]>({
      maxSize: 200,
      defaultTTL: 1800000, // 30 minutes
    });

    logger.info('🔬 BioPharma Dive scraper initialized');
  }

  /**
   * Get latest pipeline news
   */
  async getLatestNews(maxResults: number = 20): Promise<BioPharmaDigestArticle[]> {
    const cacheKey = `latest:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached BioPharma Dive articles');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching latest ${maxResults} articles from BioPharma Dive...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/news', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { limit: maxResults },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Fetched ${articles.length} articles from BioPharma Dive`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Get pipeline updates
   */
  async getPipelineUpdates(maxResults: number = 20): Promise<BioPharmaDigestArticle[]> {
    const cacheKey = `pipeline:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached pipeline updates');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching pipeline updates from BioPharma Dive...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/news/pipeline', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { limit: maxResults },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Fetched ${articles.length} pipeline updates`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Search articles
   */
  async searchArticles(params: BioPharmaDigestSearchParams): Promise<BioPharmaDigestArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached search results');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Searching BioPharma Dive: "${params.query || 'all'}"`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/search', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: {
              q: params.query,
              category: params.category !== 'all' ? params.category : undefined,
              company: params.company,
              therapeutic_area: params.therapeuticArea,
              limit: params.maxResults || 20,
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
  private parseArticles(html: string, maxResults: number): BioPharmaDigestArticle[] {
    const articles: BioPharmaDigestArticle[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      $('.article, .feed__item, .news-item').each((index, element) => {
        if (articles.length >= maxResults) return false;
        
        const $element = $(element);
        const title = $element.find('.article__title, h2, h3, .feed__title').first().text().trim();
        const url = $element.find('a').first().attr('href') || '';
        const author = $element.find('.author, .byline, .feed__author').first().text().trim() || 'BioPharma Dive Staff';
        const publishedDate = $element.find('.published, time, .feed__date').first().attr('datetime') || 
                              $element.find('.published, time, .feed__date').first().text().trim() || 
                              new Date().toISOString();
        const summary = $element.find('.article__deck, .feed__description, p').first().text().trim();
        const category = $element.find('.topic, .category').first().text().trim() || 'Pipeline';
        const imageUrl = $element.find('img').first().attr('src');
        const company = $element.find('.company-tag, [data-company]').first().text().trim();
        const therapeuticArea = $element.find('.therapeutic-area, [data-therapeutic-area]').first().text().trim();
        const pipelineStage = $element.find('.pipeline-stage, [data-stage]').first().text().trim();
        
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
            therapeuticArea,
            pipelineStage,
          });
        }
      });
    } catch (error) {
      logger.error('Failed to parse BioPharma Dive articles:', error);
      this.rateLimiter.recordError();
      throw error;
    }
    
    return articles;
  }

  /**
   * Parse search results
   */
  private parseSearchResults(html: string, maxResults: number): BioPharmaDigestArticle[] {
    return this.parseArticles(html, maxResults);
  }

  /**
   * Extract article ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/news\/([a-z0-9-]+)/) || url.match(/\/(\d+)[-\/]/);
    return match ? match[1] : `bpd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract tags from article
   */
  private extractTags($element: any): string[] {
    const tags: string[] = [];
    
    $element.find('.tag, .label, .topic__link').each((_: number, tag: any) => {
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
    logger.info('🧹 BioPharma Dive cache cleared');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('🔄 BioPharma Dive circuit breaker reset');
  }
}
