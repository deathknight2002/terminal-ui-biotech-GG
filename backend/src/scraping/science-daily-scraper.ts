/**
 * Science Daily Scraper
 * Scrapes scientific news, research discoveries, and breakthrough studies
 * 
 * Rate Limits: Respectful crawling - max 1 req/2s
 * Source: https://www.sciencedaily.com
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface ScienceDailyArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  summary: string;
  category: string;
  topics: string[];
  imageUrl?: string;
  content?: string;
}

export interface ScienceDailySearchParams {
  query?: string;
  category?: 'health' | 'biology' | 'chemistry' | 'medicine' | 'all';
  maxResults?: number;
  dateFrom?: string;
}

export class ScienceDailyScraper {
  private readonly baseUrl: string = 'https://www.sciencedaily.com';
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<ScienceDailyArticle[]>;
  
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

    this.circuitBreaker = new CircuitBreaker('science-daily', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    // Conservative rate limiting
    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5, // 1 req per 2 seconds
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<ScienceDailyArticle[]>({
      maxSize: 200,
      defaultTTL: 1800000, // 30 minutes
    });

    logger.info('🔬 Science Daily scraper initialized');
  }

  /**
   * Get latest health and medicine news
   */
  async getHealthNews(maxResults: number = 20): Promise<ScienceDailyArticle[]> {
    return this.getNewsByCategory('health_medicine', maxResults);
  }

  /**
   * Get latest biotech news
   */
  async getBiotechNews(maxResults: number = 20): Promise<ScienceDailyArticle[]> {
    return this.getNewsByCategory('plants_animals/biotechnology', maxResults);
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(category: string, maxResults: number = 20): Promise<ScienceDailyArticle[]> {
    const cacheKey = `category:${category}:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached Science Daily articles');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Fetching ${category} articles from Science Daily...`);
        
        const url = `/news/${category}/`;
        const response = await this.circuitBreaker.execute(async () => {
          return this.client.get(url, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
            },
          });
        });

        const articles = this.parseArticles(response.data, maxResults, category);
        
        this.cache.set(cacheKey, articles);
        this.rateLimiter.recordSuccess();
        
        logger.info(`✅ Successfully fetched ${articles.length} Science Daily articles`);
        return articles;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
        onRetry: (attempt, delay, error) => {
          logger.warn(`🔄 Retry attempt ${attempt} for Science Daily:`, error?.message);
          this.rateLimiter.recordError();
        },
      }
    );
  }

  /**
   * Search for articles
   */
  async searchArticles(params: ScienceDailySearchParams): Promise<ScienceDailyArticle[]> {
    const { query = '', maxResults = 20 } = params;
    const cacheKey = `search:${query}:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached search results');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info(`🔍 Searching Science Daily for: "${query}"`);
        
        const searchUrl = `/search/?keyword=${encodeURIComponent(query)}`;
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
   * Get top stories
   */
  async getTopStories(maxResults: number = 10): Promise<ScienceDailyArticle[]> {
    const cacheKey = `top:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📦 Returning cached top stories');
      return cached;
    }

    const result = await retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForLimit();
        
        logger.info('🔍 Fetching top stories from Science Daily...');
        
        const response = await this.circuitBreaker.execute(async () => {
          return this.client.get('/', {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
            },
          });
        });

        const articles = this.parseArticles(response.data, maxResults, 'Top Stories');
        
        this.cache.set(cacheKey, articles);
        this.rateLimiter.recordSuccess();
        
        logger.info(`✅ Successfully fetched ${articles.length} top stories`);
        return articles;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
        onRetry: (attempt, delay, error) => {
          logger.warn(`🔄 Retry attempt ${attempt}:`, error?.message);
          this.rateLimiter.recordError();
        },
      }
    );
  }

  /**
   * Parse articles from HTML
   */
  private parseArticles(html: string, maxResults: number, category: string): ScienceDailyArticle[] {
    const $ = cheerio.load(html);
    const articles: ScienceDailyArticle[] = [];

    // Science Daily uses ID-based selectors
    $('#news-summaries-latest li, #news-summaries li, .latest-head, .story').each((index, element) => {
      if (articles.length >= maxResults) return false;

      try {
        const $article = $(element);
        const $link = $article.find('a').first();
        const title = $link.text().trim() || $article.find('h3, h2').first().text().trim();
        const url = $link.attr('href');
        
        if (!title || !url) return;

        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const id = this.extractIdFromUrl(fullUrl);

        const article: ScienceDailyArticle = {
          id,
          title,
          url: fullUrl,
          source: $article.find('.source, .citation').first().text().trim() || 'Science Daily',
          publishedDate: $article.find('.date, time').first().attr('datetime') 
            || $article.find('.date, time').first().text().trim()
            || new Date().toISOString(),
          summary: $article.find('.summary, .description, p').first().text().trim() || '',
          category,
          topics: this.extractTopics($article),
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
   * Parse search results
   */
  private parseSearchResults(html: string, maxResults: number): ScienceDailyArticle[] {
    const $ = cheerio.load(html);
    const articles: ScienceDailyArticle[] = [];

    $('.search-result, .search-item, article').each((index, element) => {
      if (articles.length >= maxResults) return false;

      try {
        const $result = $(element);
        const $link = $result.find('a, h2 a, h3 a').first();
        const title = $link.text().trim() || $result.find('h2, h3').first().text().trim();
        const url = $link.attr('href');
        
        if (!title || !url) return;

        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const id = this.extractIdFromUrl(fullUrl);

        const article: ScienceDailyArticle = {
          id,
          title,
          url: fullUrl,
          source: $result.find('.source').first().text().trim() || 'Science Daily',
          publishedDate: $result.find('.date, time').first().attr('datetime') 
            || $result.find('.date, time').first().text().trim()
            || new Date().toISOString(),
          summary: $result.find('.summary, .snippet').first().text().trim() || '',
          category: 'Search Result',
          topics: this.extractTopics($result),
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
    const matches = url.match(/releases\/(\d+)\/(\d+)\/(\d+)\.htm/);
    if (matches) {
      return `${matches[1]}${matches[2]}${matches[3]}`;
    }
    return url.split('/').pop()?.replace('.htm', '') || url;
  }

  /**
   * Extract topics from article
   */
  private extractTopics($element: any): string[] {
    const topics: string[] = [];
    $element.find('.topic, .tag, .category').each((_: any, topic: any) => {
      if (topicText) topics.push(topicText);
    });
    return topics;
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
    logger.info('🧹 Science Daily cache cleared');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('🔄 Science Daily circuit breaker reset');
  }
}
