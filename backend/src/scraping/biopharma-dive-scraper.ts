/**
 * BioPharma Dive Scraper
 * Pharmaceutical industry news, pipeline updates, and M&A activity
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import * as Parser from 'rss-parser';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface BioPharmDiveArticle {
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
}

export interface BioPharmDiveSearchParams {
  query?: string;
  category?: 'pipeline' | 'ma' | 'regulation' | 'manufacturing';
  limit?: number;
}

export class BioPharmDiveScraper {
  private client: AxiosInstance;
  private rssParser: Parser;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<BioPharmDiveArticle[]>;
  private readonly baseUrl: string = 'https://www.biopharmadive.com';
  private readonly rssUrl: string = 'https://www.biopharmadive.com/feeds/news/';

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    this.rssParser = new Parser.default({
      customFields: {
        item: ['description', 'content:encoded'],
      },
    });

    this.circuitBreaker = new CircuitBreaker('biopharma-dive', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 0.5,
      minRate: 0.25,
      maxRate: 1,
    });

    this.cache = new LRUCache<BioPharmDiveArticle[]>({
      maxSize: 250,
      defaultTTL: 3600000,
    });

    logger.info('💊 BioPharma Dive scraper initialized');
  }

  /**
   * Get latest news via RSS
   */
  async getLatestNews(limit: number = 20): Promise<BioPharmDiveArticle[]> {
    const cacheKey = `latest:${limit}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('💊 BioPharma Dive cache hit for latest');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.fetchRSSFeed(limit);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`💊 BioPharma Dive: ${articles.length} latest articles fetched`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('💊 BioPharma Dive latest error:', error);
      throw error;
    }
  }

  /**
   * Fetch RSS feed
   */
  private async fetchRSSFeed(limit: number): Promise<BioPharmDiveArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        const response = await this.client.get(this.rssUrl);
        const feed = await this.rssParser.parseString(response.data);
        return this.parseRSSArticles(feed, limit);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse RSS articles
   */
  private parseRSSArticles(feed: any, limit: number): BioPharmDiveArticle[] {
    const articles: BioPharmDiveArticle[] = [];
    const items = feed.items || [];

    for (let i = 0; i < Math.min(items.length, limit); i++) {
      const item = items[i];
      
      try {
        const article: BioPharmDiveArticle = {
          id: this.generateArticleId(item.link || item.guid || ''),
          title: item.title || '',
          url: item.link || '',
          summary: this.cleanHTML(item.description || item.summary || ''),
          publishDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          category: item.categories || [],
          tags: [],
        };

        if (item['content:encoded']) {
          const imageUrl = this.extractImageFromContent(item['content:encoded']);
          if (imageUrl) {
            article.imageUrl = imageUrl;
          }
        }

        articles.push(article);
      } catch (error) {
        logger.debug('💊 Failed to parse RSS item:', error);
      }
    }

    return articles;
  }

  /**
   * Search articles
   */
  async search(params: BioPharmDiveSearchParams): Promise<BioPharmDiveArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('💊 BioPharma Dive cache hit for search');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.performSearch(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`💊 BioPharma Dive search: ${articles.length} articles found`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('💊 BioPharma Dive search error:', error);
      throw error;
    }
  }

  /**
   * Perform search
   */
  private async performSearch(params: BioPharmDiveSearchParams): Promise<BioPharmDiveArticle[]> {
    if (!params.query && !params.category) {
      return this.getLatestNews(params.limit || 20);
    }

    const result = await retryWithBackoff(
      async () => {
        let url = this.baseUrl;
        
        if (params.category) {
          url += `/${params.category}`;
        } else if (params.query) {
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
   * Parse article list from HTML
   */
  private parseArticleList(html: string, limit: number): BioPharmDiveArticle[] {
    const $ = cheerio.load(html);
    const articles: BioPharmDiveArticle[] = [];

    $('.feed__item, article, .article-item').slice(0, limit).each((_, element) => {
      try {
        const $article = $(element);
        
        const title = $article.find('h2, h3, .feed__title').first().text().trim();
        const url = this.normalizeUrl($article.find('a').first().attr('href') || '');
        const summary = $article.find('.feed__description, .excerpt').first().text().trim();
        const imageUrl = $article.find('img').first().attr('src');
        const publishDateStr = $article.find('time').first().attr('datetime') || 
                               $article.find('.feed__date').first().text().trim();

        if (title && url) {
          articles.push({
            id: this.generateArticleId(url),
            title,
            url,
            summary: summary || '',
            publishDate: this.parseDate(publishDateStr),
            category: [],
            tags: [],
            imageUrl: imageUrl ? this.normalizeUrl(imageUrl) : undefined,
          });
        }
      } catch (error) {
        logger.debug('💊 Failed to parse article element:', error);
      }
    });

    return articles;
  }

  /**
   * Get pipeline updates
   */
  async getPipelineUpdates(limit: number = 20): Promise<BioPharmDiveArticle[]> {
    return this.search({
      category: 'pipeline',
      limit,
    });
  }

  /**
   * Get M&A news
   */
  async getMandANews(limit: number = 20): Promise<BioPharmDiveArticle[]> {
    return this.search({
      category: 'ma',
      limit,
    });
  }

  /**
   * Get regulation news
   */
  async getRegulationNews(limit: number = 20): Promise<BioPharmDiveArticle[]> {
    return this.search({
      category: 'regulation',
      limit,
    });
  }

  /**
   * Get article by URL
   */
  async getArticle(url: string): Promise<BioPharmDiveArticle | null> {
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
      logger.error(`💊 Failed to fetch article ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape full article
   */
  private async scrapeFullArticle(url: string): Promise<BioPharmDiveArticle | null> {
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
  private parseFullArticle(html: string, url: string): BioPharmDiveArticle | null {
    const $ = cheerio.load(html);

    try {
      const title = $('h1, .article__title').first().text().trim();
      const summary = $('meta[property="og:description"]').attr('content') || 
                     $('.article__summary').first().text().trim();
      const content = $('article .article__body, .article__content').first().text().trim();
      const author = $('.article__author').first().text().trim();
      const publishDateStr = $('time').first().attr('datetime') || 
                            $('meta[property="article:published_time"]').attr('content') || '';
      const imageUrl = $('meta[property="og:image"]').attr('content');

      const categories: string[] = [];
      $('.article__topics a, .tag').each((_, el) => {
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
      };
    } catch (error) {
      logger.error('💊 Failed to parse full article:', error);
      return null;
    }
  }

  private extractImageFromContent(content: string): string | undefined {
    const $ = cheerio.load(content);
    const img = $('img').first().attr('src');
    return img ? this.normalizeUrl(img) : undefined;
  }

  private cleanHTML(html: string): string {
    const $ = cheerio.load(html);
    return $('body').text().trim();
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
    logger.info('💊 BioPharma Dive cache cleared');
  }
}
