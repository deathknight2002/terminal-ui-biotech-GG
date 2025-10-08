/**
 * Genetic Engineering & Biotechnology News (GEN) Scraper
 * Scrapes research updates, scientific breakthroughs, and technology news
 * 
 * Rate Limits: Respectful crawling - max 1 req/2s
 * Source: https://www.genengnews.com
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface GenEngNewsArticle {
  id: string;
  title: string;
  url: string;
  author: string;
  publishedDate: string;
  summary: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  researchArea?: string;
  institution?: string;
}

export interface GenEngNewsSearchParams {
  query?: string;
  category?: 'crispr' | 'gene-therapy' | 'synthetic-biology' | 'proteomics' | 'all';
  maxResults?: number;
  researchArea?: string;
}

export class GenEngNewsScraper {
  private readonly baseUrl: string = 'https://www.genengnews.com';
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<GenEngNewsArticle[]>;
  
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

    this.circuitBreaker = new CircuitBreaker('genengnews', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5,
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<GenEngNewsArticle[]>({
      maxSize: 200,
      defaultTTL: 1800000, // 30 minutes
    });

    logger.info('🧬 GEN News scraper initialized');
  }

  /**
   * Get latest research updates
   */
  async getLatestNews(maxResults: number = 20): Promise<GenEngNewsArticle[]> {
    const cacheKey = `latest:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached GEN articles');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching latest ${maxResults} articles from GEN News...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/news', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { limit: maxResults },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Fetched ${articles.length} articles from GEN News`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Get research news by topic
   */
  async getResearchNews(topic: string, maxResults: number = 20): Promise<GenEngNewsArticle[]> {
    const cacheKey = `research:${topic}:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug(`📦 Returning cached research articles for ${topic}`);
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching research news on ${topic} from GEN News...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/topics/research', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: { topic, limit: maxResults },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.rateLimiter.recordSuccess();
        this.cache.set(cacheKey, articles);
        
        logger.info(`✅ Fetched ${articles.length} research articles on ${topic}`);
        return articles;
      },
      RetryPatterns.NETWORK_ERROR
    );

    return result;
  }

  /**
   * Search articles
   */
  async searchArticles(params: GenEngNewsSearchParams): Promise<GenEngNewsArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached search results');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Searching GEN News: "${params.query || 'all'}"`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return await this.client.get('/search', {
            headers: { 'User-Agent': this.getRandomUserAgent() },
            params: {
              q: params.query,
              category: params.category !== 'all' ? params.category : undefined,
              research_area: params.researchArea,
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
  private parseArticles(html: string, maxResults: number): GenEngNewsArticle[] {
    const articles: GenEngNewsArticle[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      $('.article-item, .news-item, .post-item').each((index, element) => {
        if (articles.length >= maxResults) return false;
        
        const $element = $(element);
        const title = $element.find('.article-title, h2, h3, .entry-title').first().text().trim();
        const url = $element.find('a').first().attr('href') || '';
        const author = $element.find('.author, .byline, .posted-by').first().text().trim() || 'GEN Staff';
        const publishedDate = $element.find('.date, .published, time, .entry-date').first().text().trim() || new Date().toISOString();
        const summary = $element.find('.summary, .excerpt, p, .entry-summary').first().text().trim();
        const category = $element.find('.category, .cat-links').first().text().trim() || 'Research';
        const imageUrl = $element.find('img').first().attr('src');
        const researchArea = $element.find('.research-area, .topic').first().text().trim();
        const institution = $element.find('.institution, .university').first().text().trim();
        
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
            researchArea,
            institution,
          });
        }
      });
    } catch (error) {
      logger.error('Failed to parse GEN News articles:', error);
      this.rateLimiter.recordError();
      throw error;
    }
    
    return articles;
  }

  /**
   * Parse search results
   */
  private parseSearchResults(html: string, maxResults: number): GenEngNewsArticle[] {
    return this.parseArticles(html, maxResults);
  }

  /**
   * Extract article ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)[-\/]/) || url.match(/id[=\/](\d+)/) || url.match(/\/([a-z0-9-]+)\/?$/);
    return match ? match[1] : `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract tags from article
   */
  private extractTags($element: any): string[] {
    const tags: string[] = [];
    
    $element.find('.tag, .label, .badge, .tag-links a').each((_: number, tag: any) => {
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
    logger.info('🧹 GEN News cache cleared');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('🔄 GEN News circuit breaker reset');
  }
}
