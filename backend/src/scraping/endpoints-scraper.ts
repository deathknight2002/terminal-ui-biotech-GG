/**
 * Endpoints News Scraper
 * Biotech industry news, FDA approvals, and clinical trial updates
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface EndpointsArticle {
  id: string;
  title: string;
  url: string;
  summary: string;
  content?: string;
  publishDate: string;
  category: string[];
  tags: string[];
  author?: string;
  imageUrl?: string;
  isPremium?: boolean;
}

export interface EndpointsSearchParams {
  query?: string;
  category?: 'fda' | 'clinical-trials' | 'ma' | 'biotech';
  limit?: number;
}

export class EndpointsNewsScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<EndpointsArticle[]>;
  private readonly baseUrl: string = 'https://endpts.com';

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    this.circuitBreaker = new CircuitBreaker('endpoints', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5,
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<EndpointsArticle[]>({
      maxSize: 200,
      defaultTTL: 3600000,
    });

    logger.info('📰 Endpoints News scraper initialized');
  }

  /**
   * Get latest biotech news
   */
  async getLatestNews(limit: number = 20): Promise<EndpointsArticle[]> {
    const cacheKey = `latest:${limit}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📰 Endpoints News cache hit for latest');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.scrapeLatestArticles(limit);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`📰 Endpoints News: ${articles.length} latest articles fetched`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📰 Endpoints News latest error:', error);
      throw error;
    }
  }

  /**
   * Scrape latest articles
   */
  private async scrapeLatestArticles(limit: number): Promise<EndpointsArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        const response = await this.client.get(this.baseUrl);
        return this.parseArticleList(response.data, limit);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse article list
   */
  private parseArticleList(html: string, limit: number): EndpointsArticle[] {
    const $ = cheerio.load(html);
    const articles: EndpointsArticle[] = [];

    $('article, .post, .article-item').slice(0, limit).each((_, element) => {
      try {
        const $article = $(element);
        
        const title = $article.find('h2, h3, .title').first().text().trim();
        const url = this.normalizeUrl($article.find('a').first().attr('href') || '');
        const summary = $article.find('.excerpt, .summary, p').first().text().trim();
        const imageUrl = $article.find('img').first().attr('src');
        const publishDateStr = $article.find('time').first().attr('datetime') || 
                               $article.find('.date').first().text().trim();
        const author = $article.find('.author').first().text().trim();

        // Check if premium content
        const isPremium = $article.find('.premium, .subscriber-only').length > 0;

        // Extract categories
        const categories: string[] = [];
        $article.find('.category, .tag').each((_, el) => {
          const cat = $(el).text().trim();
          if (cat) categories.push(cat);
        });

        if (title && url) {
          articles.push({
            id: this.generateArticleId(url),
            title,
            url,
            summary: summary || '',
            publishDate: this.parseDate(publishDateStr),
            category: categories,
            tags: [],
            author: author || undefined,
            imageUrl: imageUrl ? this.normalizeUrl(imageUrl) : undefined,
            isPremium,
          });
        }
      } catch (error) {
        logger.debug('📰 Failed to parse article element:', error);
      }
    });

    return articles;
  }

  /**
   * Search articles
   */
  async search(params: EndpointsSearchParams): Promise<EndpointsArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📰 Endpoints News cache hit for search');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.performSearch(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`📰 Endpoints News search: ${articles.length} articles found`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📰 Endpoints News search error:', error);
      throw error;
    }
  }

  /**
   * Perform search
   */
  private async performSearch(params: EndpointsSearchParams): Promise<EndpointsArticle[]> {
    if (!params.query && !params.category) {
      return this.getLatestNews(params.limit || 20);
    }

    const result = await retryWithBackoff(
      async () => {
        let url = this.baseUrl;
        
        if (params.category) {
          url += `/${params.category}`;
        }
        
        if (params.query) {
          url += `/search`;
        }

        const response = await this.client.get(url, {
          params: params.query ? { q: params.query } : {},
        });

        return this.parseArticleList(response.data, params.limit || 20);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Get FDA approval news
   */
  async getFDANews(limit: number = 20): Promise<EndpointsArticle[]> {
    return this.search({
      category: 'fda',
      limit,
    });
  }

  /**
   * Get clinical trial news
   */
  async getClinicalTrialNews(limit: number = 20): Promise<EndpointsArticle[]> {
    return this.search({
      category: 'clinical-trials',
      limit,
    });
  }

  /**
   * Get M&A news
   */
  async getMandANews(limit: number = 20): Promise<EndpointsArticle[]> {
    return this.search({
      category: 'ma',
      limit,
    });
  }

  /**
   * Get article by URL
   */
  async getArticle(url: string): Promise<EndpointsArticle | null> {
    const cacheKey = `article:${url}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0];
    }

    await this.rateLimiter.waitForLimit();

    try {
      const article = await this.circuitBreaker.execute(async () => {
        return this.scrapeFullArticle(url);
      });

      if (article) {
        this.cache.set(cacheKey, [article]);
        this.rateLimiter.recordSuccess();
      }

      return article;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error(`📰 Failed to fetch article ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape full article
   */
  private async scrapeFullArticle(url: string): Promise<EndpointsArticle | null> {
    const result = await retryWithBackoff(
      async () => {
        const response = await this.client.get(url);
        return this.parseFullArticle(response.data, url);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : null;
  }

  /**
   * Parse full article
   */
  private parseFullArticle(html: string, url: string): EndpointsArticle | null {
    const $ = cheerio.load(html);

    try {
      const title = $('h1, .article-title').first().text().trim();
      const summary = $('meta[property="og:description"]').attr('content') || 
                     $('.summary, .excerpt').first().text().trim();
      const content = $('article .content, .article-body').first().text().trim();
      const author = $('.author, .byline').first().text().trim();
      const publishDateStr = $('time').first().attr('datetime') || 
                            $('meta[property="article:published_time"]').attr('content') || '';
      const imageUrl = $('meta[property="og:image"]').attr('content');

      const isPremium = $('.premium-content, .subscriber-only').length > 0;

      const categories: string[] = [];
      $('.category, .tag').each((_, el) => {
        const cat = $(el).text().trim();
        if (cat) categories.push(cat);
      });

      const tags: string[] = [];
      $('meta[property="article:tag"]').each((_, el) => {
        const tag = $(el).attr('content');
        if (tag) tags.push(tag);
      });

      if (!title) return null;

      return {
        id: this.generateArticleId(url),
        title,
        url,
        summary: summary || '',
        content: content || undefined,
        publishDate: this.parseDate(publishDateStr),
        category: categories,
        tags,
        author: author || undefined,
        imageUrl: imageUrl ? this.normalizeUrl(imageUrl) : undefined,
        isPremium,
      };
    } catch (error) {
      logger.error('📰 Failed to parse full article:', error);
      return null;
    }
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return this.baseUrl + url;
    return this.baseUrl + '/' + url;
  }

  private generateArticleId(url: string): string {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    return lastPart.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }

  private parseDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  getStats() {
    return {
      cache: this.cache.getStats(),
      rateLimiter: this.rateLimiter.getStats(),
      circuitBreaker: this.circuitBreaker.getStats(),
    };
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('📰 Endpoints News cache cleared');
  }
}
