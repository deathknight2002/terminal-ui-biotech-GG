/**
 * Fierce Biotech News Scraper
 * HTML parsing for biotech news with rate limiting and caching
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
  summary: string;
  url: string;
  publishedDate: string;
  author?: string;
  category?: string;
  tags: string[];
  imageUrl?: string;
}

export interface FierceBiotechSearchParams {
  category?: string;
  query?: string;
  maxResults?: number;
  page?: number;
}

export class FierceBiotechScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<FierceBiotechArticle[]>;
  private readonly baseUrl: string = 'https://www.fiercebiotech.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/1.0 (Research and Educational Purposes)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    this.circuitBreaker = new CircuitBreaker('fiercebiotech', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });

    // Rate limiting: 1 request per 2 seconds to respect site
    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5, // 0.5 req/s = 1 req per 2 seconds
      minRate: 0.25,
      maxRate: 1,
      window: 1000,
    });

    this.cache = new LRUCache<FierceBiotechArticle[]>({
      maxSize: 200,
      defaultTTL: 14400000, // 4 hours
    });

    logger.info('🔬 Fierce Biotech scraper initialized');
  }

  /**
   * Get latest biotech news
   */
  async getLatestNews(params: FierceBiotechSearchParams = {}): Promise<FierceBiotechArticle[]> {
    const cacheKey = `latest:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🔬 Fierce Biotech cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.fetchArticles(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`🔬 Fierce Biotech: Fetched ${articles.length} articles`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🔬 Fierce Biotech fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch articles from Fierce Biotech
   */
  private async fetchArticles(params: FierceBiotechSearchParams): Promise<FierceBiotechArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        const url = params.query 
          ? `/search?q=${encodeURIComponent(params.query)}`
          : '/news';
        
        const response = await this.client.get(url);
        return this.parseArticlesHTML(response.data, params.maxResults || 20);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse articles from HTML
   */
  private parseArticlesHTML(html: string, maxResults: number): FierceBiotechArticle[] {
    const $ = cheerio.load(html);
    const articles: FierceBiotechArticle[] = [];

    // Parse article listings - adjust selectors based on actual site structure
    $('article, .article-item, .post').slice(0, maxResults).each((_, element) => {
      try {
        const $article = $(element);
        
        // Extract article data
        const titleEl = $article.find('h2, h3, .title, .article-title').first();
        const title = titleEl.text().trim();
        const urlPath = titleEl.find('a').attr('href') || $article.find('a').first().attr('href');
        
        if (!title || !urlPath) return;

        const url = urlPath.startsWith('http') ? urlPath : `${this.baseUrl}${urlPath}`;
        const id = this.extractIdFromUrl(url);
        
        const summary = $article.find('.summary, .excerpt, .description, p').first().text().trim();
        const publishedDate = $article.find('time, .date, .published').first().attr('datetime') || 
                            $article.find('time, .date, .published').first().text().trim();
        
        const author = $article.find('.author, .byline').text().trim();
        const category = $article.find('.category, .tag').first().text().trim();
        const imageUrl = $article.find('img').first().attr('src');
        
        // Extract tags
        const tags: string[] = [];
        $article.find('.tag, .tags a').each((_, tagEl) => {
          const tag = $(tagEl).text().trim();
          if (tag) tags.push(tag);
        });

        articles.push({
          id,
          title,
          summary: summary.substring(0, 500), // Limit summary length
          url,
          publishedDate: publishedDate || new Date().toISOString(),
          author: author || undefined,
          category: category || undefined,
          tags,
          imageUrl: imageUrl || undefined,
        });
      } catch (error) {
        logger.warn('🔬 Failed to parse article:', error);
      }
    });

    logger.debug(`🔬 Parsed ${articles.length} articles from HTML`);
    return articles;
  }

  /**
   * Extract article ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)\/?$|\/([a-zA-Z0-9-]+)\/?$/);
    if (match) {
      return match[1] || match[2];
    }
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  /**
   * Get article by URL
   */
  async getArticle(url: string): Promise<FierceBiotechArticle | null> {
    const cacheKey = `article:${url}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0];
    }

    await this.rateLimiter.waitForLimit();

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await this.client.get(url.replace(this.baseUrl, ''));
          return this.parseArticleDetail(response.data, url);
        },
        RetryPatterns.network
      );

      if (result.success && result.data) {
        this.cache.set(cacheKey, [result.data]);
        this.rateLimiter.recordSuccess();
        return result.data;
      }
      
      return null;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🔬 Failed to fetch article:', error);
      return null;
    }
  }

  /**
   * Parse article detail page
   */
  private parseArticleDetail(html: string, url: string): FierceBiotechArticle {
    const $ = cheerio.load(html);
    
    const title = $('h1, .article-title').first().text().trim();
    const summary = $('article p, .article-body p').first().text().trim().substring(0, 500);
    const publishedDate = $('time, .date').first().attr('datetime') || 
                         $('time, .date').first().text().trim();
    const author = $('.author, .byline').text().trim();
    const category = $('.category').first().text().trim();
    const imageUrl = $('article img, .article-image img').first().attr('src');
    
    const tags: string[] = [];
    $('.tag, .tags a').each((_, tagEl) => {
      const tag = $(tagEl).text().trim();
      if (tag) tags.push(tag);
    });

    return {
      id: this.extractIdFromUrl(url),
      title: title || 'Untitled',
      summary,
      url,
      publishedDate: publishedDate || new Date().toISOString(),
      author: author || undefined,
      category: category || undefined,
      tags,
      imageUrl: imageUrl || undefined,
    };
  }

  /**
   * Search articles
   */
  async search(query: string, maxResults: number = 20): Promise<FierceBiotechArticle[]> {
    return this.getLatestNews({ query, maxResults });
  }

  /**
   * Get articles by category
   */
  async getByCategory(category: string, maxResults: number = 20): Promise<FierceBiotechArticle[]> {
    return this.getLatestNews({ category, maxResults });
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
    logger.info('🔬 Fierce Biotech cache cleared');
  }
}
