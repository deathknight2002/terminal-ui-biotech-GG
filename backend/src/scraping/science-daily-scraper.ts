/**
 * Science Daily Biotech News Scraper
 * RSS feed parsing with HTML fallback for full articles
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface ScienceDailyArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  publishedDate: string;
  category: string;
  source: string;
  imageUrl?: string;
}

export interface ScienceDailySearchParams {
  category?: 'biotechnology' | 'genetics' | 'biochemistry' | 'medical';
  maxResults?: number;
  minDate?: string;
  maxDate?: string;
}

export class ScienceDailyScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<ScienceDailyArticle[]>;
  private readonly baseUrl: string = 'https://www.sciencedaily.com';
  private readonly rssBaseUrl: string = 'https://www.sciencedaily.com/rss';

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/1.0 (Research and Educational Purposes)',
        'Accept': 'application/rss+xml, application/xml, text/xml, text/html',
      },
    });

    this.circuitBreaker = new CircuitBreaker('sciencedaily', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 1, // 1 req/s conservative rate
      minRate: 0.5,
      maxRate: 2,
      window: 1000,
    });

    this.cache = new LRUCache<ScienceDailyArticle[]>({
      maxSize: 200,
      defaultTTL: 14400000, // 4 hours
    });

    logger.info('🧬 Science Daily scraper initialized');
  }

  /**
   * Get latest biotech news from RSS feed
   */
  async getLatestNews(params: ScienceDailySearchParams = {}): Promise<ScienceDailyArticle[]> {
    const cacheKey = `latest:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('🧬 Science Daily cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.fetchRSSFeed(params);
      });

      // Filter by date if specified
      let filteredArticles = articles;
      if (params.minDate || params.maxDate) {
        filteredArticles = this.filterByDate(articles, params.minDate, params.maxDate);
      }

      // Limit results
      const limitedArticles = filteredArticles.slice(0, params.maxResults || 20);

      this.cache.set(cacheKey, limitedArticles);
      this.rateLimiter.recordSuccess();

      logger.info(`🧬 Science Daily: Fetched ${limitedArticles.length} articles`);
      return limitedArticles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('🧬 Science Daily fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch RSS feed
   */
  private async fetchRSSFeed(params: ScienceDailySearchParams): Promise<ScienceDailyArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        // Determine RSS feed URL based on category
        const rssUrl = this.getRSSUrl(params.category);
        
        const response = await this.client.get(rssUrl);
        return this.parseRSS(response.data);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Get RSS feed URL for category
   */
  private getRSSUrl(category?: string): string {
    switch (category) {
      case 'biotechnology':
        return `${this.rssBaseUrl}/biotechnology.xml`;
      case 'genetics':
        return `${this.rssBaseUrl}/genes_cells/genetics.xml`;
      case 'biochemistry':
        return `${this.rssBaseUrl}/matter_energy/biochemistry.xml`;
      case 'medical':
        return `${this.rssBaseUrl}/health_medicine.xml`;
      default:
        return `${this.rssBaseUrl}/biotechnology.xml`;
    }
  }

  /**
   * Parse RSS feed XML
   */
  private async parseRSS(xml: string): Promise<ScienceDailyArticle[]> {
    try {
      const parsed = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
      });

      const articles: ScienceDailyArticle[] = [];
      const items = parsed.rss?.channel?.item || [];
      const itemsArray = Array.isArray(items) ? items : [items];

      for (const item of itemsArray) {
        try {
          const article: ScienceDailyArticle = {
            id: this.extractIdFromUrl(item.link || item.guid),
            title: item.title || 'Untitled',
            summary: this.stripHtml(item.description || ''),
            url: item.link || item.guid,
            publishedDate: item.pubDate || new Date().toISOString(),
            category: item.category || 'Biotechnology',
            source: 'Science Daily',
            imageUrl: item['media:thumbnail']?.url || item.enclosure?.url,
          };

          articles.push(article);
        } catch (error) {
          logger.warn('🧬 Failed to parse RSS item:', error);
        }
      }

      logger.debug(`🧬 Parsed ${articles.length} articles from RSS`);
      return articles;
    } catch (error) {
      logger.error('🧬 RSS parsing error:', error);
      throw error;
    }
  }

  /**
   * Get full article with HTML fallback
   */
  async getArticleWithContent(url: string): Promise<ScienceDailyArticle | null> {
    const cacheKey = `article:${url}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0];
    }

    await this.rateLimiter.waitForLimit();

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await this.client.get(url);
          return this.parseArticleHTML(response.data, url);
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
      logger.error('🧬 Failed to fetch article:', error);
      return null;
    }
  }

  /**
   * Parse article HTML for full content
   */
  private parseArticleHTML(html: string, url: string): ScienceDailyArticle {
    const $ = cheerio.load(html);
    
    const title = $('#headline, h1#story_headline').text().trim();
    const summary = $('#abstract, .article-abstract').text().trim();
    const content = $('#text, #story_text, .article-text').text().trim();
    const publishedDate = $('#date_posted, time').first().attr('datetime') || 
                         $('#date_posted, time').first().text().trim();
    const category = $('.breadcrumb a').last().text().trim();
    const imageUrl = $('#story_image img, .article-image img').first().attr('src');

    return {
      id: this.extractIdFromUrl(url),
      title: title || 'Untitled',
      summary: summary || content.substring(0, 500),
      content,
      url,
      publishedDate: publishedDate || new Date().toISOString(),
      category: category || 'Biotechnology',
      source: 'Science Daily',
      imageUrl: imageUrl || undefined,
    };
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Extract article ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/releases\/(\d+)\/(\d+)\.htm/);
    if (match) {
      return `${match[1]}_${match[2]}`;
    }
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  /**
   * Filter articles by date range
   */
  private filterByDate(
    articles: ScienceDailyArticle[],
    minDate?: string,
    maxDate?: string
  ): ScienceDailyArticle[] {
    return articles.filter(article => {
      const articleDate = new Date(article.publishedDate);
      
      if (minDate && articleDate < new Date(minDate)) {
        return false;
      }
      
      if (maxDate && articleDate > new Date(maxDate)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get recent biotechnology articles
   */
  async getRecentBiotech(maxResults: number = 50): Promise<ScienceDailyArticle[]> {
    return this.getLatestNews({
      category: 'biotechnology',
      maxResults,
    });
  }

  /**
   * Get recent genetics articles
   */
  async getRecentGenetics(maxResults: number = 50): Promise<ScienceDailyArticle[]> {
    return this.getLatestNews({
      category: 'genetics',
      maxResults,
    });
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
    logger.info('🧬 Science Daily cache cleared');
  }
}
