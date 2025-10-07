/**
 * Fierce Biotech News Scraper
 * Biotech industry news aggregation with rate limiting
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
  summary: string;
  content?: string;
  author?: string;
  publishDate: string;
  category: string[];
  tags: string[];
  imageUrl?: string;
  companies?: string[];
}

export interface FierceBiotechSearchParams {
  query?: string;
  category?: string;
  limit?: number;
  page?: number;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export class FierceBiotechScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<FierceBiotechArticle[]>;
  private readonly baseUrl: string = 'https://www.fiercebiotech.com';

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    });

    this.circuitBreaker = new CircuitBreaker('fiercebiotech', {
      failureThreshold: 5,
      resetTimeout: 120000, // 2 minutes
    });

    // Conservative rate limiting: 1 request per 2 seconds to respect the site
    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5, // 0.5 requests per second
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<FierceBiotechArticle[]>({
      maxSize: 200,
      defaultTTL: 3600000, // 1 hour cache
    });

    logger.info('🔥 Fierce Biotech scraper initialized');
  }

  /**
   * Get latest biotech news articles
   */
  async getLatestNews(limit: number = 20): Promise<FierceBiotechArticle[]> {
    const cacheKey = `latest:${limit}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🔥 Fierce Biotech cache hit for latest news');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.scrapeLatestArticles(limit);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`🔥 Fierce Biotech: ${articles.length} latest articles fetched`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🔥 Fierce Biotech latest news error:', error);
      throw error;
    }
  }

  /**
   * Scrape latest articles from homepage
   */
  private async scrapeLatestArticles(limit: number): Promise<FierceBiotechArticle[]> {
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
   * Parse article list from HTML
   */
  private parseArticleList(html: string, limit: number): FierceBiotechArticle[] {
    const $ = cheerio.load(html);
    const articles: FierceBiotechArticle[] = [];

    // Fierce Biotech uses various article selectors
    const articleSelectors = [
      'article.article',
      'div.article-item',
      'div.story',
      'div.article',
      'article',
    ];

    let $articles = $('');
    for (const selector of articleSelectors) {
      $articles = $(selector);
      if ($articles.length > 0) break;
    }

    $articles.slice(0, limit).each((_, element) => {
      try {
        const $article = $(element);
        
        // Extract article data
        const title = $article.find('h2, h3, .article-title, .headline').first().text().trim();
        const url = this.normalizeUrl($article.find('a').first().attr('href') || '');
        const summary = $article.find('.article-summary, .excerpt, .summary, p').first().text().trim();
        const imageUrl = $article.find('img').first().attr('src');
        const publishDateStr = $article.find('time, .date, .publish-date').first().attr('datetime') || 
                               $article.find('time, .date, .publish-date').first().text().trim();

        if (title && url) {
          articles.push({
            id: this.generateArticleId(url),
            title,
            url,
            summary: summary || '',
            publishDate: this.parseDate(publishDateStr),
            category: this.extractCategories($article),
            tags: [],
            imageUrl: imageUrl ? this.normalizeUrl(imageUrl) : undefined,
          });
        }
      } catch (error) {
        logger.debug('🔥 Failed to parse article element:', error);
      }
    });

    return articles;
  }

  /**
   * Search for articles by query
   */
  async search(params: FierceBiotechSearchParams): Promise<FierceBiotechArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🔥 Fierce Biotech cache hit for search');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.performSearch(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`🔥 Fierce Biotech search: ${articles.length} articles found for "${params.query}"`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🔥 Fierce Biotech search error:', error);
      throw error;
    }
  }

  /**
   * Perform search request
   */
  private async performSearch(params: FierceBiotechSearchParams): Promise<FierceBiotechArticle[]> {
    if (!params.query) {
      return this.getLatestNews(params.limit || 20);
    }

    const result = await retryWithBackoff(
      async () => {
        // Fierce Biotech search endpoint
        const searchUrl = `${this.baseUrl}/search`;
        const response = await this.client.get(searchUrl, {
          params: {
            q: params.query,
            page: params.page || 1,
          },
        });

        return this.parseArticleList(response.data, params.limit || 20);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
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
      logger.error(`🔥 Failed to fetch article ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape full article content
   */
  private async scrapeFullArticle(url: string): Promise<FierceBiotechArticle | null> {
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
   * Parse full article from HTML
   */
  private parseFullArticle(html: string, url: string): FierceBiotechArticle | null {
    const $ = cheerio.load(html);

    try {
      const title = $('h1, .article-title, .headline').first().text().trim();
      const summary = $('meta[property="og:description"]').attr('content') || 
                     $('.article-summary, .excerpt').first().text().trim();
      const content = $('article .article-body, .article-content, .content').first().text().trim();
      const author = $('.author, .byline, [rel="author"]').first().text().trim();
      const publishDateStr = $('time').first().attr('datetime') || 
                            $('meta[property="article:published_time"]').attr('content') || '';
      const imageUrl = $('meta[property="og:image"]').attr('content') || 
                      $('article img').first().attr('src');

      // Extract categories and tags
      const categories: string[] = [];
      $('.category, .tag, .article-category').each((_, el) => {
        const cat = $(el).text().trim();
        if (cat) categories.push(cat);
      });

      const tags: string[] = [];
      $('meta[property="article:tag"]').each((_, el) => {
        const tag = $(el).attr('content');
        if (tag) tags.push(tag);
      });

      // Extract mentioned companies
      const companies: string[] = [];
      const companyRegex = /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(?:Inc|Corp|Ltd|LLC|Pharmaceuticals|Therapeutics|Biosciences|Biotech)/g;
      const contentText = content || summary;
      let match;
      while ((match = companyRegex.exec(contentText)) !== null) {
        companies.push(match[0]);
      }

      if (!title) {
        return null;
      }

      return {
        id: this.generateArticleId(url),
        title,
        url,
        summary: summary || '',
        content: content || undefined,
        author: author || undefined,
        publishDate: this.parseDate(publishDateStr),
        category: categories,
        tags,
        imageUrl: imageUrl ? this.normalizeUrl(imageUrl) : undefined,
        companies: companies.length > 0 ? Array.from(new Set(companies)) : undefined,
      };
    } catch (error) {
      logger.error('🔥 Failed to parse full article:', error);
      return null;
    }
  }

  /**
   * Get articles by category
   */
  async getByCategory(category: string, limit: number = 20): Promise<FierceBiotechArticle[]> {
    const cacheKey = `category:${category}:${limit}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug(`🔥 Fierce Biotech cache hit for category: ${category}`);
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.scrapeCategoryArticles(category, limit);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`🔥 Fierce Biotech: ${articles.length} articles from category "${category}"`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error(`🔥 Fierce Biotech category error for "${category}":`, error);
      throw error;
    }
  }

  /**
   * Scrape articles from a specific category
   */
  private async scrapeCategoryArticles(category: string, limit: number): Promise<FierceBiotechArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        const categoryUrl = `${this.baseUrl}/${category.toLowerCase()}`;
        const response = await this.client.get(categoryUrl);
        return this.parseArticleList(response.data, limit);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Extract categories from article element
   */
  private extractCategories($article: cheerio.Cheerio<any>): string[] {
    const categories: string[] = [];
    
    $article.find('.category, .tag, .article-category, [data-category]').each((_, el) => {
      const cat = cheerio.load(el)('*').text().trim() || 
                  cheerio.load(el)('*').attr('data-category');
      if (cat) categories.push(cat);
    });

    return categories;
  }

  /**
   * Normalize URL to absolute
   */
  private normalizeUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return this.baseUrl + url;
    return this.baseUrl + '/' + url;
  }

  /**
   * Generate unique article ID from URL
   */
  private generateArticleId(url: string): string {
    // Extract last part of URL or use hash
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    return lastPart.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string): string {
    if (!dateStr) {
      return new Date().toISOString();
    }

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
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
    logger.info('🔥 Fierce Biotech cache cleared');
  }
}
