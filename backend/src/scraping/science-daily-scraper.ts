/**
 * Science Daily Biotech Scraper
 * Scientific news aggregation with RSS and HTML parsing
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import * as Parser from 'rss-parser';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface ScienceDailyArticle {
  id: string;
  title: string;
  url: string;
  summary: string;
  content?: string;
  publishDate: string;
  category: string[];
  topics: string[];
  source?: string;
  imageUrl?: string;
}

export interface ScienceDailySearchParams {
  query?: string;
  category?: 'biotechnology' | 'health-medicine' | 'biology' | 'all';
  limit?: number;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export class ScienceDailyScraper {
  private client: AxiosInstance;
  private rssParser: Parser;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<ScienceDailyArticle[]>;
  private readonly baseUrl: string = 'https://www.sciencedaily.com';
  private readonly rssFeeds: Record<string, string> = {
    biotechnology: 'https://www.sciencedaily.com/rss/matter_energy/biotechnology.xml',
    'health-medicine': 'https://www.sciencedaily.com/rss/health_medicine.xml',
    biology: 'https://www.sciencedaily.com/rss/plants_animals.xml',
    all: 'https://www.sciencedaily.com/rss/all.xml',
  };

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    this.rssParser = new Parser.default({
      customFields: {
        item: ['description', 'content:encoded', 'dc:creator'],
      },
    });

    this.circuitBreaker = new CircuitBreaker('sciencedaily', {
      failureThreshold: 5,
      resetTimeout: 120000,
    });

    // Conservative rate limiting: 1 request per second
    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 1,
      minRate: 0.5,
      maxRate: 2,
    });

    this.cache = new LRUCache<ScienceDailyArticle[]>({
      maxSize: 300,
      defaultTTL: 14400000, // 4 hours cache for news
    });

    logger.info('🔬 Science Daily scraper initialized');
  }

  /**
   * Get latest biotechnology news
   */
  async getLatestBiotechNews(limit: number = 20): Promise<ScienceDailyArticle[]> {
    return this.getNewsByCategory('biotechnology', limit);
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(
    category: 'biotechnology' | 'health-medicine' | 'biology' | 'all',
    limit: number = 20
  ): Promise<ScienceDailyArticle[]> {
    const cacheKey = `category:${category}:${limit}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug(`🔬 Science Daily cache hit for category: ${category}`);
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.fetchRSSFeed(category, limit);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`🔬 Science Daily: ${articles.length} articles from "${category}"`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error(`🔬 Science Daily error for category "${category}":`, error);
      throw error;
    }
  }

  /**
   * Fetch and parse RSS feed
   */
  private async fetchRSSFeed(
    category: 'biotechnology' | 'health-medicine' | 'biology' | 'all',
    limit: number
  ): Promise<ScienceDailyArticle[]> {
    const feedUrl = this.rssFeeds[category];
    
    if (!feedUrl) {
      throw new Error(`Unknown category: ${category}`);
    }

    const result = await retryWithBackoff(
      async () => {
        const response = await this.client.get(feedUrl);
        const feed = await this.rssParser.parseString(response.data);
        return this.parseRSSArticles(feed, limit);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse RSS feed items to articles
   */
  private parseRSSArticles(feed: any, limit: number): ScienceDailyArticle[] {
    const articles: ScienceDailyArticle[] = [];

    const items = feed.items || [];
    
    for (let i = 0; i < Math.min(items.length, limit); i++) {
      const item = items[i];
      
      try {
        const article: ScienceDailyArticle = {
          id: this.generateArticleId(item.link || item.guid || ''),
          title: item.title || '',
          url: item.link || '',
          summary: this.cleanHTML(item.description || item.summary || ''),
          publishDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          category: this.extractCategories(item),
          topics: [],
          source: item['dc:creator'] || 'Science Daily',
        };

        // Try to extract image from content
        if (item['content:encoded']) {
          const imageUrl = this.extractImageFromContent(item['content:encoded']);
          if (imageUrl) {
            article.imageUrl = imageUrl;
          }
        }

        articles.push(article);
      } catch (error) {
        logger.debug('🔬 Failed to parse RSS item:', error);
      }
    }

    return articles;
  }

  /**
   * Search for articles
   */
  async search(params: ScienceDailySearchParams): Promise<ScienceDailyArticle[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🔬 Science Daily cache hit for search');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.performSearch(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`🔬 Science Daily search: ${articles.length} articles found`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🔬 Science Daily search error:', error);
      throw error;
    }
  }

  /**
   * Perform search request
   */
  private async performSearch(params: ScienceDailySearchParams): Promise<ScienceDailyArticle[]> {
    if (!params.query) {
      return this.getNewsByCategory(params.category || 'biotechnology', params.limit || 20);
    }

    const result = await retryWithBackoff(
      async () => {
        // Science Daily search endpoint
        const searchUrl = `${this.baseUrl}/search/`;
        const response = await this.client.get(searchUrl, {
          params: {
            word: params.query,
          },
        });

        return this.parseSearchResults(response.data, params.limit || 20);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse search results from HTML
   */
  private parseSearchResults(html: string, limit: number): ScienceDailyArticle[] {
    const $ = cheerio.load(html);
    const articles: ScienceDailyArticle[] = [];

    $('#news .latest-head').slice(0, limit).each((_, element) => {
      try {
        const $item = $(element);
        const $link = $item.find('a').first();
        const title = $link.text().trim();
        const url = this.normalizeUrl($link.attr('href') || '');
        const summary = $item.next('.latest-summary').text().trim();
        const dateStr = $item.parent().find('.date').first().text().trim();

        if (title && url) {
          articles.push({
            id: this.generateArticleId(url),
            title,
            url,
            summary: summary || '',
            publishDate: this.parseDate(dateStr),
            category: [],
            topics: [],
          });
        }
      } catch (error) {
        logger.debug('🔬 Failed to parse search result:', error);
      }
    });

    return articles;
  }

  /**
   * Get full article content
   */
  async getArticle(url: string): Promise<ScienceDailyArticle | null> {
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
      logger.error(`🔬 Failed to fetch article ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape full article content
   */
  private async scrapeFullArticle(url: string): Promise<ScienceDailyArticle | null> {
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
  private parseFullArticle(html: string, url: string): ScienceDailyArticle | null {
    const $ = cheerio.load(html);

    try {
      const title = $('#headline').text().trim() || $('h1#story_title').text().trim();
      const summary = $('#abstract').text().trim();
      const content = $('#story_text').text().trim();
      const publishDateStr = $('#date_posted').text().trim();
      const imageUrl = $('#story img').first().attr('src');

      // Extract topics
      const topics: string[] = [];
      $('#topic_menu a').each((_, el) => {
        topics.push($(el).text().trim());
      });

      // Extract categories
      const categories: string[] = [];
      $('.breadcrumb a').each((_, el) => {
        categories.push($(el).text().trim());
      });

      if (!title) {
        return null;
      }

      return {
        id: this.generateArticleId(url),
        title,
        url,
        summary: summary || '',
        content: content || undefined,
        publishDate: this.parseDate(publishDateStr),
        category: categories.filter(c => c && c !== 'Home'),
        topics,
        imageUrl: imageUrl ? this.normalizeUrl(imageUrl) : undefined,
      };
    } catch (error) {
      logger.error('🔬 Failed to parse full article:', error);
      return null;
    }
  }

  /**
   * Extract categories from RSS item
   */
  private extractCategories(item: any): string[] {
    const categories: string[] = [];
    
    if (item.categories) {
      if (Array.isArray(item.categories)) {
        categories.push(...item.categories);
      } else {
        categories.push(item.categories);
      }
    }

    return categories;
  }

  /**
   * Extract image URL from HTML content
   */
  private extractImageFromContent(content: string): string | undefined {
    const $ = cheerio.load(content);
    const img = $('img').first().attr('src');
    return img ? this.normalizeUrl(img) : undefined;
  }

  /**
   * Clean HTML tags from text
   */
  private cleanHTML(html: string): string {
    const $ = cheerio.load(html);
    return $('body').text().trim();
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
    logger.info('🔬 Science Daily cache cleared');
  }
}
