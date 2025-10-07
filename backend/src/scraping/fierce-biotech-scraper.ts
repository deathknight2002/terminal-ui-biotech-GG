/**
 * Fierce Biotech News Scraper
 * Scrapes biotech industry news, drug development updates, and company announcements
 * 
 * Rate Limits: Respectful crawling - max 1 req/2s to avoid server load
 * Source: https://www.fiercebiotech.com
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface FierceBiotechArticle {
  id: string;
  title: string;
  url: string;
  author: string;
  publishedDate: string;
  summary: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  content?: string;
}

export interface FierceBiotechSearchParams {
  query?: string;
  category?: 'drug-discovery' | 'clinical' | 'regulatory' | 'manufacturing' | 'all';
  maxResults?: number;
  sortBy?: 'date' | 'relevance';
}

export class FierceBiotechScraper {
  private readonly baseUrl: string = 'https://www.fiercebiotech.com';
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<FierceBiotechArticle[]>;
  
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

    this.circuitBreaker = new CircuitBreaker('fierce-biotech', {
      failureThreshold: 5,
      resetTimeout: 120000, // 2 minutes
    });

    // Conservative rate limiting: max 1 request per 2 seconds
    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5, // 0.5 req/second = 1 req per 2 seconds
      minRate: 0.25, // Even slower if needed
      maxRate: 1, // Max 1 req/second
    });

    this.cache = new LRUCache<FierceBiotechArticle[]>({
      maxSize: 200,
      defaultTTL: 1800000, // 30 minutes
    });

    logger.info('📰 Fierce Biotech scraper initialized');
  }

  /**
   * Get latest biotech news articles
   */
  async getLatestNews(maxResults: number = 20): Promise<FierceBiotechArticle[]> {
    const cacheKey = `latest:${maxResults}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached Fierce Biotech articles');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching latest ${maxResults} articles from Fierce Biotech...`);
        
        const response = await this.circuitBreaker.execute(async () => {
          return this.client.get('/', {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
            },
          });
        });

        const articles = this.parseArticlesFromHomepage(response.data, maxResults);
        
        this.cache.set(cacheKey, articles);
        this.rateLimiter.recordSuccess();
        
        logger.info(`✅ Successfully fetched ${articles.length} Fierce Biotech articles`);
        return articles;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
        onRetry: (attempt, delay, error) => {
          logger.warn(`🔄 Retry attempt ${attempt} for Fierce Biotech:`, error?.message);
          this.rateLimiter.recordError();
        },
      }
    );

    if (result.success && result.data) {
      return result.data;
    }
    
    throw result.error || new Error('Failed to fetch Fierce Biotech articles');
  }

  /**
   * Search for articles by keyword
   */
  async searchArticles(params: FierceBiotechSearchParams): Promise<FierceBiotechArticle[]> {
    const { query = '', maxResults = 20, sortBy = 'date' } = params;
    const cacheKey = `search:${query}:${maxResults}:${sortBy}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached search results');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Searching Fierce Biotech for: "${query}"`);
        
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
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(
    category: string,
    maxResults: number = 20
  ): Promise<FierceBiotechArticle[]> {
    const cacheKey = `category:${category}:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached category articles');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching articles from category: ${category}`);
        
        const categoryUrl = `/${category}`;
        const response = await this.circuitBreaker.execute(async () => {
          return this.client.get(categoryUrl, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
            },
          });
        });

        const articles = this.parseArticlesFromHomepage(response.data, maxResults);
        
        this.cache.set(cacheKey, articles);
        this.rateLimiter.recordSuccess();
        
        logger.info(`✅ Found ${articles.length} articles in category: ${category}`);
        return articles;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
        onRetry: (attempt, delay, error) => {
          logger.warn(`🔄 Retry attempt ${attempt} for category:`, error?.message);
          this.rateLimiter.recordError();
        },
      }
    );
  }

  /**
   * Parse articles from homepage HTML
   */
  private parseArticlesFromHomepage(html: string, maxResults: number): FierceBiotechArticle[] {
    const $ = cheerio.load(html);
    const articles: FierceBiotechArticle[] = [];

    // Fierce Biotech uses various article selectors - adapt based on actual structure
    $('.article, article, .post, .story').each((index, element) => {
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

        const article: FierceBiotechArticle = {
          id,
          title,
          url: fullUrl,
          author: $article.find('.author, .byline, [itemprop="author"]').first().text().trim() || 'Unknown',
          publishedDate: $article.find('.date, .publish-date, time').first().attr('datetime') 
            || $article.find('.date, .publish-date, time').first().text().trim()
            || new Date().toISOString(),
          summary: $article.find('.summary, .excerpt, .description').first().text().trim() || '',
          category: $article.find('.category, .tag').first().text().trim() || 'General',
          tags: this.extractTags($article),
          imageUrl: $article.find('img').first().attr('src') || undefined,
        };

        articles.push(article);
      } catch (error) {
        logger.debug('Failed to parse article:', error);
      }
    });

    return articles;
  }

  /**
   * Parse search results HTML
   */
  private parseSearchResults(html: string, maxResults: number): FierceBiotechArticle[] {
    const $ = cheerio.load(html);
    const articles: FierceBiotechArticle[] = [];

    $('.search-result, .result, .article').each((index, element) => {
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

        const article: FierceBiotechArticle = {
          id,
          title,
          url: fullUrl,
          author: $result.find('.author, .byline').first().text().trim() || 'Unknown',
          publishedDate: $result.find('.date, time').first().attr('datetime') 
            || $result.find('.date, time').first().text().trim()
            || new Date().toISOString(),
          summary: $result.find('.summary, .snippet, .excerpt').first().text().trim() || '',
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
    const matches = url.match(/\/([^\/]+)$/);
    return matches ? matches[1] : url;
  }

  /**
   * Extract tags from article element
   */
  private extractTags($element: cheerio.Cheerio<cheerio.Element>): string[] {
    const tags: string[] = [];
    $element.find('.tag, .category-tag, .label').each((_, tag) => {
      const tagText = cheerio.load(tag).text().trim();
      if (tagText) tags.push(tagText);
    });
    return tags;
  }

  /**
   * Get random user agent for rotation
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
        size: this.cache.size(),
        stats: this.cache.getStats(),
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('🧹 Fierce Biotech cache cleared');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('🔄 Fierce Biotech circuit breaker reset');
  }
}
