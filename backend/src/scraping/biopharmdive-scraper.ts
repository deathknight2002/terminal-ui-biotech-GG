/**
 * BioPharm Dive Scraper
 * Industry news, analysis, pipeline updates, and M&A activity
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface BioPharmDiveArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedDate: string;
  author?: string;
  category: string;
  articleType: 'news' | 'analysis' | 'pipeline' | 'ma' | 'regulatory';
  tags: string[];
  imageUrl?: string;
}

export interface BioPharmDivePipelineUpdate {
  id: string;
  title: string;
  drugName?: string;
  company: string;
  indication?: string;
  phase?: string;
  url: string;
  publishedDate: string;
  summary: string;
}

export interface BioPharmDiveMnAActivity {
  id: string;
  title: string;
  acquirer?: string;
  target?: string;
  dealValue?: string;
  url: string;
  publishedDate: string;
  summary: string;
}

export interface BioPharmDiveSearchParams {
  type?: 'news' | 'analysis' | 'pipeline' | 'ma' | 'regulatory';
  query?: string;
  maxResults?: number;
}

export class BioPharmDiveScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<any>;
  private readonly baseUrl: string = 'https://www.biopharmadive.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/1.0 (Research and Educational Purposes)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    this.circuitBreaker = new CircuitBreaker('biopharmdive', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: 1, // 1 req/s
      minRate: 0.5,
      maxRate: 2,
      window: 1000,
    });

    this.cache = new LRUCache<any>({
      maxSize: 300,
      defaultTTL: 14400000, // 4 hours
    });

    logger.info('📊 BioPharm Dive scraper initialized');
  }

  /**
   * Get latest industry news
   */
  async getLatestNews(params: BioPharmDiveSearchParams = {}): Promise<BioPharmDiveArticle[]> {
    const cacheKey = `news:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📊 BioPharm Dive cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.fetchArticles(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`📊 BioPharm Dive: Fetched ${articles.length} articles`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📊 BioPharm Dive fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch articles
   */
  private async fetchArticles(params: BioPharmDiveSearchParams): Promise<BioPharmDiveArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        let url = '/news';
        
        if (params.type) {
          switch (params.type) {
            case 'pipeline':
              url = '/topics/pipeline';
              break;
            case 'ma':
              url = '/topics/mergers-acquisitions';
              break;
            case 'regulatory':
              url = '/topics/regulatory';
              break;
            case 'analysis':
              url = '/analysis';
              break;
          }
        }
        
        if (params.query) {
          url = `/search?q=${encodeURIComponent(params.query)}`;
        }
        
        const response = await this.client.get(url);
        return this.parseArticlesHTML(response.data, params.maxResults || 20, params.type);
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Parse articles from HTML
   */
  private parseArticlesHTML(
    html: string,
    maxResults: number,
    articleType?: string
  ): BioPharmDiveArticle[] {
    const $ = cheerio.load(html);
    const articles: BioPharmDiveArticle[] = [];

    $('article, .feed__item, .article-item').slice(0, maxResults).each((_, element) => {
      try {
        const $article = $(element);
        
        const titleEl = $article.find('h2, h3, .feed__title').first();
        const title = titleEl.text().trim();
        const urlPath = titleEl.find('a').attr('href') || $article.find('a').first().attr('href');
        
        if (!title || !urlPath) return;

        const url = urlPath.startsWith('http') ? urlPath : `${this.baseUrl}${urlPath}`;
        const id = this.extractIdFromUrl(url);
        
        const summary = $article.find('.feed__description, .excerpt, p').first().text().trim();
        const publishedDate = $article.find('time, .feed__date').first().attr('datetime') || 
                            $article.find('time, .feed__date').first().text().trim();
        
        const author = $article.find('.author, .byline').first().text().trim();
        const category = $article.find('.feed__category, .category').first().text().trim();
        const imageUrl = $article.find('img').first().attr('src');
        
        const tags: string[] = [];
        $article.find('.tag, .topics a').each((_, tagEl) => {
          const tag = $(tagEl).text().trim();
          if (tag) tags.push(tag);
        });

        // Determine article type from URL or category
        let type: 'news' | 'analysis' | 'pipeline' | 'ma' | 'regulatory' = 'news';
        if (articleType) {
          type = articleType as any;
        } else if (url.includes('/analysis/')) {
          type = 'analysis';
        } else if (url.includes('pipeline') || tags.some(t => t.toLowerCase().includes('pipeline'))) {
          type = 'pipeline';
        } else if (url.includes('merger') || url.includes('acquisition') || tags.some(t => t.toLowerCase().includes('m&a'))) {
          type = 'ma';
        } else if (url.includes('regulatory') || tags.some(t => t.toLowerCase().includes('fda'))) {
          type = 'regulatory';
        }

        articles.push({
          id,
          title,
          summary: summary.substring(0, 500),
          url,
          publishedDate: publishedDate || new Date().toISOString(),
          author: author || undefined,
          category: category || 'BioPharma',
          articleType: type,
          tags,
          imageUrl: imageUrl || undefined,
        });
      } catch (error) {
        logger.warn('📊 Failed to parse article:', error);
      }
    });

    logger.debug(`📊 Parsed ${articles.length} articles from HTML`);
    return articles;
  }

  /**
   * Get pipeline updates
   */
  async getPipelineUpdates(maxResults: number = 20): Promise<BioPharmDivePipelineUpdate[]> {
    const cacheKey = `pipeline:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📊 BioPharm Dive pipeline cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const updates = await this.circuitBreaker.execute(async () => {
        return this.fetchPipelineUpdates(maxResults);
      });

      this.cache.set(cacheKey, updates);
      this.rateLimiter.recordSuccess();

      logger.info(`📊 BioPharm Dive: Fetched ${updates.length} pipeline updates`);
      return updates;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📊 BioPharm Dive pipeline fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch pipeline updates
   */
  private async fetchPipelineUpdates(maxResults: number): Promise<BioPharmDivePipelineUpdate[]> {
    const articles = await this.fetchArticles({ type: 'pipeline', maxResults });
    
    return articles.map(article => ({
      id: article.id,
      title: article.title,
      drugName: this.extractDrugName(article.title),
      company: this.extractCompanyName(article.title),
      indication: this.extractIndication(article.summary),
      phase: this.extractPhase(article.title + ' ' + article.summary),
      url: article.url,
      publishedDate: article.publishedDate,
      summary: article.summary,
    }));
  }

  /**
   * Get M&A activity
   */
  async getMnAActivity(maxResults: number = 20): Promise<BioPharmDiveMnAActivity[]> {
    const cacheKey = `ma:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📊 BioPharm Dive M&A cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const activity = await this.circuitBreaker.execute(async () => {
        return this.fetchMnAActivity(maxResults);
      });

      this.cache.set(cacheKey, activity);
      this.rateLimiter.recordSuccess();

      logger.info(`📊 BioPharm Dive: Fetched ${activity.length} M&A activities`);
      return activity;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📊 BioPharm Dive M&A fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch M&A activity
   */
  private async fetchMnAActivity(maxResults: number): Promise<BioPharmDiveMnAActivity[]> {
    const articles = await this.fetchArticles({ type: 'ma', maxResults });
    
    return articles.map(article => ({
      id: article.id,
      title: article.title,
      acquirer: this.extractAcquirer(article.title),
      target: this.extractTarget(article.title),
      dealValue: this.extractDealValue(article.summary),
      url: article.url,
      publishedDate: article.publishedDate,
      summary: article.summary,
    }));
  }

  /**
   * Extract drug name from text
   */
  private extractDrugName(text: string): string | undefined {
    // Look for capitalized drug names or patterns
    const match = text.match(/\b([A-Z][a-z]+[A-Z][a-z]+)\b/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract company name from text
   */
  private extractCompanyName(text: string): string {
    // Look for common pharma company patterns
    const match = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Pharma|Therapeutics|Bio|Inc|Corp))?)\b/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Extract indication from text
   */
  private extractIndication(text: string): string | undefined {
    const match = text.match(/for\s+([\w\s]+?)(?:\.|,|\s+in\s+)/i);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract clinical phase from text
   */
  private extractPhase(text: string): string | undefined {
    const match = text.match(/Phase\s+([I]{1,3}|1|2|3)/i);
    return match ? `Phase ${match[1]}` : undefined;
  }

  /**
   * Extract acquirer from M&A text
   */
  private extractAcquirer(text: string): string | undefined {
    const match = text.match(/^([^,]+?)\s+(?:acquires|buys|purchases|to\s+acquire)/i);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract target from M&A text
   */
  private extractTarget(text: string): string | undefined {
    const match = text.match(/(?:acquires|buys|purchases)\s+([^,]+?)(?:\s+for|\s+in|\.|,)/i);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract deal value from text
   */
  private extractDealValue(text: string): string | undefined {
    const match = text.match(/\$[\d.]+\s*(?:billion|million|B|M)/i);
    return match ? match[0] : undefined;
  }

  /**
   * Extract ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/news\/([a-zA-Z0-9-]+)/);
    if (match) {
      return match[1];
    }
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  /**
   * Get regulatory news
   */
  async getRegulatoryNews(maxResults: number = 20): Promise<BioPharmDiveArticle[]> {
    return this.getLatestNews({ type: 'regulatory', maxResults });
  }

  /**
   * Get analysis articles
   */
  async getAnalysis(maxResults: number = 20): Promise<BioPharmDiveArticle[]> {
    return this.getLatestNews({ type: 'analysis', maxResults });
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
    logger.info('📊 BioPharm Dive cache cleared');
  }
}
