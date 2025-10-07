/**
 * BioSpace Scraper
 * Pharmaceutical industry news, jobs, and company information
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
  summary: string;
  content?: string;
  publishDate: string;
  category: string[];
  author?: string;
  companies?: string[];
  imageUrl?: string;
  type: 'news' | 'press-release' | 'job' | 'company-profile';
}

export interface BioSpaceSearchParams {
  query?: string;
  type?: 'news' | 'press-release' | 'jobs' | 'companies';
  limit?: number;
}

export class BioSpaceScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<BioSpaceArticle[]>;
  private readonly baseUrl: string = 'https://www.biospace.com';

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
      maxSize: 250,
      defaultTTL: 3600000,
    });

    logger.info('🧬 BioSpace scraper initialized');
  }

  /**
   * Get latest news articles
   */
  async getLatestNews(limit: number = 20): Promise<BioSpaceArticle[]> {
    const cacheKey = `news:latest:${limit}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🧬 BioSpace cache hit for latest news');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.scrapeLatestNews(limit);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`🧬 BioSpace: ${articles.length} latest articles fetched`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🧬 BioSpace latest news error:', error);
      throw error;
    }
  }

  /**
   * Scrape latest news articles
   */
  private async scrapeLatestNews(limit: number): Promise<BioSpaceArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        const response = await this.client.get(`${this.baseUrl}/news`);
        return this.parseArticleList(response.data, limit, 'news');
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse article list from HTML
   */
  private parseArticleList(
    html: string,
    limit: number,
    type: 'news' | 'press-release' | 'job' | 'company-profile'
  ): BioSpaceArticle[] {
    const $ = cheerio.load(html);
    const articles: BioSpaceArticle[] = [];

    const articleSelectors = [
      'article',
      '.article-item',
      '.news-item',
      '.content-item',
    ];

    let $articles = $('');
    for (const selector of articleSelectors) {
      $articles = $(selector);
      if ($articles.length > 0) break;
    }

    $articles.slice(0, limit).each((_, element) => {
      try {
        const $article = $(element);
        
        const title = $article.find('h2, h3, .title, .headline').first().text().trim();
        const url = this.normalizeUrl($article.find('a').first().attr('href') || '');
        const summary = $article.find('.summary, .excerpt, p').first().text().trim();
        const imageUrl = $article.find('img').first().attr('src');
        const publishDateStr = $article.find('time, .date').first().attr('datetime') || 
                               $article.find('time, .date').first().text().trim();
        const author = $article.find('.author, .byline').first().text().trim();

        if (title && url) {
          articles.push({
            id: this.generateArticleId(url),
            title,
            url,
            summary: summary || '',
            publishDate: this.parseDate(publishDateStr),
            category: [],
            author: author || undefined,
            imageUrl: imageUrl ? this.normalizeUrl(imageUrl) : undefined,
            type,
          });
        }
      } catch (error) {
        logger.debug('🧬 Failed to parse article element:', error);
      }
    });

    return articles;
  }

  /**
   * Search articles
   */
  async search(params: BioSpaceSearchParams): Promise<BioSpaceArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🧬 BioSpace cache hit for search');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.performSearch(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`🧬 BioSpace search: ${articles.length} articles found`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🧬 BioSpace search error:', error);
      throw error;
    }
  }

  /**
   * Perform search
   */
  private async performSearch(params: BioSpaceSearchParams): Promise<BioSpaceArticle[]> {
    if (!params.query) {
      return this.getLatestNews(params.limit || 20);
    }

    const result = await retryWithBackoff(
      async () => {
        const response = await this.client.get(`${this.baseUrl}/search`, {
          params: { q: params.query },
        });
        return this.parseArticleList(
          response.data,
          params.limit || 20,
          params.type || 'news'
        );
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Get article by URL
   */
  async getArticle(url: string): Promise<BioSpaceArticle | null> {
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
      logger.error(`🧬 Failed to fetch article ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape full article
   */
  private async scrapeFullArticle(url: string): Promise<BioSpaceArticle | null> {
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
  private parseFullArticle(html: string, url: string): BioSpaceArticle | null {
    const $ = cheerio.load(html);

    try {
      const title = $('h1, .article-title').first().text().trim();
      const summary = $('.summary, .excerpt').first().text().trim();
      const content = $('article .content, .article-body').first().text().trim();
      const author = $('.author, .byline').first().text().trim();
      const publishDateStr = $('time').first().attr('datetime') || 
                            $('meta[property="article:published_time"]').attr('content') || '';
      const imageUrl = $('meta[property="og:image"]').attr('content');

      const categories: string[] = [];
      $('.category, .tag').each((_, el) => {
        const cat = $(el).text().trim();
        if (cat) categories.push(cat);
      });

      // Extract company mentions
      const companies: string[] = [];
      const companyRegex = /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(?:Inc|Corp|Ltd|Pharmaceuticals|Therapeutics|Biotech)/g;
      let match;
      while ((match = companyRegex.exec(content)) !== null) {
        companies.push(match[0]);
      }

      if (!title) return null;

      return {
        id: this.generateArticleId(url),
        title,
        url,
        summary: summary || '',
        content: content || undefined,
        publishDate: this.parseDate(publishDateStr),
        category: categories,
        author: author || undefined,
        imageUrl: imageUrl ? this.normalizeUrl(imageUrl) : undefined,
        companies: companies.length > 0 ? Array.from(new Set(companies)) : undefined,
        type: 'news',
      };
    } catch (error) {
      logger.error('🧬 Failed to parse full article:', error);
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
    logger.info('🧬 BioSpace cache cleared');
  }
}
