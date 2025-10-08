/**
 * BioSpace Scraper
 * Scrapes biotech and pharmaceutical industry news, job postings, and company updates
 * 
 * Rate Limits: Respectful crawling - max 1 req/2s
 * Source: https://www.biospace.com
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
  url: string;
  author: string;
  publishedDate: string;
  summary: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  company?: string;
}

export interface BioSpaceSearchParams {
  query?: string;
  category?: 'industry' | 'careers' | 'clinical-trials' | 'drug-development' | 'all';
  maxResults?: number;
}

export class BioSpaceScraper {
  private readonly baseUrl: string = 'https://www.biospace.com';
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<BioSpaceArticle[]>;
  
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

    this.circuitBreaker = new CircuitBreaker('biospace', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5,
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<BioSpaceArticle[]>({
      maxSize: 200,
      defaultTTL: 1800000, // 30 minutes
    });

    logger.info('🧬 BioSpace scraper initialized');
  }

  /**
   * Get latest industry news
   */
  async getLatestNews(maxResults: number = 20): Promise<BioSpaceArticle[]> {
    const cacheKey = `latest:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached BioSpace articles');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching latest ${maxResults} articles from BioSpace...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return this.client.get('/news', {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
            },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.cache.set(cacheKey, articles);
        this.rateLimiter.recordSuccess();
        
        logger.info(`✅ Successfully fetched ${articles.length} BioSpace articles`);
        return articles;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
        onRetry: (attempt, delay, error) => {
          logger.warn(`🔄 Retry attempt ${attempt} for BioSpace:`, error?.message);
          this.rateLimiter.recordError();
        },
      }
    );

    if (result.success) {
      return result.data!;
    } else {
      throw result.error || new Error('Failed to fetch BioSpace articles');
    }
  }

  /**
   * Search for articles
   */
  async searchArticles(params: BioSpaceSearchParams): Promise<BioSpaceArticle[]> {
    const { query = '', maxResults = 20, category = 'all' } = params;
    const cacheKey = `search:${query}:${category}:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached search results');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Searching BioSpace for: "${query}"`);
        
        const searchUrl = `/search?q=${encodeURIComponent(query)}`;
        const response = await this.circuitBreaker.execute(async () => {
          return this.client.get(searchUrl, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
            },
          });
        });

        const articles = this.parseSearchResults(response.data, maxResults);
        
        this.cache.set(cacheKey, articles);
        this.rateLimiter.recordSuccess();
        
        logger.info(`✅ Found ${articles.length} articles for query: "${query}"`);
        return articles;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
        onRetry: (attempt, delay, error) => {
          logger.warn(`🔄 Retry attempt ${attempt} for search:`, error?.message);
          this.rateLimiter.recordError();
        },
      }
    );

    if (result.success) {
      return result.data!;
    } else {
      throw result.error || new Error('Failed to search articles');
    }
  }

  /**
   * Get articles by company
   */
  async getCompanyNews(companyName: string, maxResults: number = 20): Promise<BioSpaceArticle[]> {
    const cacheKey = `company:${companyName}:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached company news');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching news for company: ${companyName}`);
        
        const url = `/company/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, '-'))}`;
        const response = await this.circuitBreaker.execute(async () => {
          return this.client.get(url, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
            },
          });
        });

        const articles = this.parseArticles(response.data, maxResults);
        
        this.cache.set(cacheKey, articles);
        this.rateLimiter.recordSuccess();
        
        logger.info(`✅ Found ${articles.length} articles for company: ${companyName}`);
        return articles;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
        onRetry: (attempt, delay, error) => {
          logger.warn(`🔄 Retry attempt ${attempt} for company news:`, error?.message);
          this.rateLimiter.recordError();
        },
      }
    );

    if (result.success) {
      return result.data!;
    } else {
      throw result.error || new Error('Failed to fetch company news');
    }
  }

  /**
   * Parse articles from HTML
   */
  private parseArticles(html: string, maxResults: number): BioSpaceArticle[] {
    const $ = cheerio.load(html);
    const articles: BioSpaceArticle[] = [];

    $('.article, article, .news-item, .story, .post').each((index, element) => {
      if (articles.length >= maxResults) return false;

      try {
        const $article = $(element);
        const $title = $article.find('h2, h3, .article-title, .headline').first();
        const $link = $title.find('a').first().length > 0 
          ? $title.find('a').first() 
          : $article.find('a').first();
        
        const title = $title.text().trim();
        const url = $link.attr('href');
        
        if (!title || !url) return;

        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const id = this.extractIdFromUrl(fullUrl);

        const article: BioSpaceArticle = {
          id,
          title,
          url: fullUrl,
          author: $article.find('.author, .byline, [rel="author"]').first().text().trim() || 'BioSpace Staff',
          publishedDate: $article.find('.date, .publish-date, time').first().attr('datetime') 
            || $article.find('.date, .publish-date, time').first().text().trim()
            || new Date().toISOString(),
          summary: $article.find('.summary, .excerpt, .description, p').first().text().trim() || '',
          category: $article.find('.category, .section').first().text().trim() || 'Industry News',
          tags: this.extractTags($article),
          imageUrl: $article.find('img').first().attr('src') || undefined,
          company: $article.find('.company-name, .organization').first().text().trim() || undefined,
        };

        articles.push(article);
      } catch (error) {
        logger.debug('Failed to parse article:', error);
      }
    });

    return articles;
  }

  /**
   * Parse search results
   */
  private parseSearchResults(html: string, maxResults: number): BioSpaceArticle[] {
    const $ = cheerio.load(html);
    const articles: BioSpaceArticle[] = [];

    $('.search-result, .result-item, .article').each((index, element) => {
      if (articles.length >= maxResults) return false;

      try {
        const $result = $(element);
        const $title = $result.find('h2, h3, .title').first();
        const $link = $title.find('a').first().length > 0 
          ? $title.find('a').first() 
          : $result.find('a').first();
        
        const title = $title.text().trim();
        const url = $link.attr('href');
        
        if (!title || !url) return;

        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const id = this.extractIdFromUrl(fullUrl);

        const article: BioSpaceArticle = {
          id,
          title,
          url: fullUrl,
          author: $result.find('.author, .byline').first().text().trim() || 'BioSpace Staff',
          publishedDate: $result.find('.date, time').first().attr('datetime') 
            || $result.find('.date, time').first().text().trim()
            || new Date().toISOString(),
          summary: $result.find('.summary, .snippet').first().text().trim() || '',
          category: 'Search Result',
          tags: this.extractTags($result),
          imageUrl: $result.find('img').first().attr('src') || undefined,
        };

        articles.push(article);
      } catch (error) {
        logger.debug('Failed to parse search result:', error);
      }
    });

    return articles;
  }

  /**
   * Extract article ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const matches = url.match(/\/article\/([^\/]+)/);
    if (matches) return matches[1];
    
    const lastPart = url.split('/').pop();
    return lastPart || url;
  }

  /**
   * Extract tags from article
   */
  private extractTags($element: any): string[] {
    const tags: string[] = [];
    $element.find('.tag, .topic, .label').each((_: any, tag: any) => {
      if (tagText) tags.push(tagText);
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
      rateLimiter: this.rateLimiter.getStats(),
      cache: {
        size: this.cache.getStats().size,
        stats: this.cache.getStats(),
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('🧹 BioSpace cache cleared');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('🔄 BioSpace circuit breaker reset');
  }
}
