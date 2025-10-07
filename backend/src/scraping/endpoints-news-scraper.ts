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

export interface EndpointsNewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedDate: string;
  author?: string;
  category: string;
  articleType: 'news' | 'fda-approval' | 'clinical-trial' | 'financing' | 'pipeline';
  tags: string[];
  companies: string[];
  imageUrl?: string;
}

export interface EndpointsFDAApproval {
  id: string;
  drugName: string;
  company: string;
  indication: string;
  approvalType: string;
  url: string;
  approvalDate: string;
  summary: string;
}

export interface EndpointsClinicalTrial {
  id: string;
  title: string;
  drugName?: string;
  company: string;
  phase: string;
  indication: string;
  url: string;
  publishedDate: string;
  summary: string;
}

export interface EndpointsNewsSearchParams {
  type?: 'news' | 'fda' | 'clinical-trials' | 'financing' | 'pipeline';
  query?: string;
  maxResults?: number;
}

export class EndpointsNewsScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<any>;
  private readonly baseUrl: string = 'https://endpts.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/1.0 (Research and Educational Purposes)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    this.circuitBreaker = new CircuitBreaker('endpointsnews', {
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

    logger.info('📰 Endpoints News scraper initialized');
  }

  /**
   * Get latest biotech news
   */
  async getLatestNews(params: EndpointsNewsSearchParams = {}): Promise<EndpointsNewsArticle[]> {
    const cacheKey = `news:${JSON.stringify(params)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📰 Endpoints News cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.circuitBreaker.execute(async () => {
        return this.fetchArticles(params);
      });

      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`📰 Endpoints News: Fetched ${articles.length} articles`);
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📰 Endpoints News fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch articles
   */
  private async fetchArticles(params: EndpointsNewsSearchParams): Promise<EndpointsNewsArticle[]> {
    const result = await retryWithBackoff(
      async () => {
        let url = '/';
        
        if (params.type) {
          switch (params.type) {
            case 'fda':
              url = '/fda-approvals';
              break;
            case 'clinical-trials':
              url = '/clinical-trials';
              break;
            case 'financing':
              url = '/financing';
              break;
            case 'pipeline':
              url = '/pipeline';
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
  ): EndpointsNewsArticle[] {
    const $ = cheerio.load(html);
    const articles: EndpointsNewsArticle[] = [];

    $('article, .post, .article-item').slice(0, maxResults).each((_, element) => {
      try {
        const $article = $(element);
        
        const titleEl = $article.find('h2, h3, .entry-title').first();
        const title = titleEl.text().trim();
        const urlPath = titleEl.find('a').attr('href') || $article.find('a').first().attr('href');
        
        if (!title || !urlPath) return;

        const url = urlPath.startsWith('http') ? urlPath : `${this.baseUrl}${urlPath}`;
        const id = this.extractIdFromUrl(url);
        
        const summary = $article.find('.excerpt, .summary, p').first().text().trim();
        const publishedDate = $article.find('time, .date').first().attr('datetime') || 
                            $article.find('time, .date').first().text().trim();
        
        const author = $article.find('.author, .byline').first().text().trim();
        const category = $article.find('.category, .topic').first().text().trim();
        const imageUrl = $article.find('img').first().attr('src');
        
        const tags: string[] = [];
        $article.find('.tag, .tags a').each((_, tagEl) => {
          const tag = $(tagEl).text().trim();
          if (tag) tags.push(tag);
        });

        const companies: string[] = [];
        $article.find('.company-tag, .companies a').each((_, companyEl) => {
          const company = $(companyEl).text().trim();
          if (company) companies.push(company);
        });

        // Determine article type
        let type: 'news' | 'fda-approval' | 'clinical-trial' | 'financing' | 'pipeline' = 'news';
        if (articleType) {
          if (articleType === 'fda') type = 'fda-approval';
          else if (articleType === 'clinical-trials') type = 'clinical-trial';
          else type = articleType as any;
        } else if (url.includes('/fda-') || title.toLowerCase().includes('fda') || title.toLowerCase().includes('approval')) {
          type = 'fda-approval';
        } else if (url.includes('/trial') || title.toLowerCase().includes('trial')) {
          type = 'clinical-trial';
        } else if (url.includes('/financing') || title.toLowerCase().includes('financing') || title.toLowerCase().includes('funding')) {
          type = 'financing';
        } else if (url.includes('/pipeline')) {
          type = 'pipeline';
        }

        articles.push({
          id,
          title,
          summary: summary.substring(0, 500),
          url,
          publishedDate: publishedDate || new Date().toISOString(),
          author: author || undefined,
          category: category || 'Biotech',
          articleType: type,
          tags,
          companies,
          imageUrl: imageUrl || undefined,
        });
      } catch (error) {
        logger.warn('📰 Failed to parse article:', error);
      }
    });

    logger.debug(`📰 Parsed ${articles.length} articles from HTML`);
    return articles;
  }

  /**
   * Get FDA approval news
   */
  async getFDAApprovals(maxResults: number = 20): Promise<EndpointsFDAApproval[]> {
    const cacheKey = `fda:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📰 Endpoints FDA approvals cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const approvals = await this.circuitBreaker.execute(async () => {
        return this.fetchFDAApprovals(maxResults);
      });

      this.cache.set(cacheKey, approvals);
      this.rateLimiter.recordSuccess();

      logger.info(`📰 Endpoints News: Fetched ${approvals.length} FDA approvals`);
      return approvals;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📰 Endpoints FDA approvals fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch FDA approvals
   */
  private async fetchFDAApprovals(maxResults: number): Promise<EndpointsFDAApproval[]> {
    const articles = await this.fetchArticles({ type: 'fda', maxResults });
    
    return articles
      .filter(a => a.articleType === 'fda-approval')
      .map(article => ({
        id: article.id,
        drugName: this.extractDrugName(article.title),
        company: article.companies[0] || this.extractCompanyName(article.title),
        indication: this.extractIndication(article.summary),
        approvalType: this.extractApprovalType(article.title + ' ' + article.summary),
        url: article.url,
        approvalDate: article.publishedDate,
        summary: article.summary,
      }));
  }

  /**
   * Get clinical trial news
   */
  async getClinicalTrialNews(maxResults: number = 20): Promise<EndpointsClinicalTrial[]> {
    const cacheKey = `trials:${maxResults}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('📰 Endpoints clinical trials cache hit');
      return cached;
    }

    await this.rateLimiter.waitForLimit();

    try {
      const trials = await this.circuitBreaker.execute(async () => {
        return this.fetchClinicalTrials(maxResults);
      });

      this.cache.set(cacheKey, trials);
      this.rateLimiter.recordSuccess();

      logger.info(`📰 Endpoints News: Fetched ${trials.length} clinical trial updates`);
      return trials;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📰 Endpoints clinical trials fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch clinical trial news
   */
  private async fetchClinicalTrials(maxResults: number): Promise<EndpointsClinicalTrial[]> {
    const articles = await this.fetchArticles({ type: 'clinical-trials', maxResults });
    
    return articles
      .filter(a => a.articleType === 'clinical-trial')
      .map(article => ({
        id: article.id,
        title: article.title,
        drugName: this.extractDrugName(article.title),
        company: article.companies[0] || this.extractCompanyName(article.title),
        phase: this.extractPhase(article.title + ' ' + article.summary) || 'Unknown',
        indication: this.extractIndication(article.summary) || 'Unknown',
        url: article.url,
        publishedDate: article.publishedDate,
        summary: article.summary,
      }));
  }

  /**
   * Extract drug name from text
   */
  private extractDrugName(text: string): string {
    // Look for capitalized drug names or patterns
    const match = text.match(/\b([A-Z][a-z]+[A-Z][a-z]+)\b/);
    return match ? match[1] : 'Unknown';
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
  private extractIndication(text: string): string {
    const match = text.match(/for\s+([\w\s]+?)(?:\.|,|\s+in\s+)/i);
    return match ? match[1].trim() : 'Unknown';
  }

  /**
   * Extract clinical phase from text
   */
  private extractPhase(text: string): string | undefined {
    const match = text.match(/Phase\s+([I]{1,3}|1|2|3)/i);
    return match ? `Phase ${match[1]}` : undefined;
  }

  /**
   * Extract approval type from text
   */
  private extractApprovalType(text: string): string {
    if (text.toLowerCase().includes('accelerated')) return 'Accelerated Approval';
    if (text.toLowerCase().includes('breakthrough')) return 'Breakthrough Designation';
    if (text.toLowerCase().includes('orphan')) return 'Orphan Drug';
    if (text.toLowerCase().includes('priority')) return 'Priority Review';
    return 'Standard Approval';
  }

  /**
   * Extract ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/([a-zA-Z0-9-]+)\/?$/);
    if (match) {
      return match[1];
    }
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  /**
   * Get financing news
   */
  async getFinancingNews(maxResults: number = 20): Promise<EndpointsNewsArticle[]> {
    return this.getLatestNews({ type: 'financing', maxResults });
  }

  /**
   * Get pipeline updates
   */
  async getPipelineUpdates(maxResults: number = 20): Promise<EndpointsNewsArticle[]> {
    return this.getLatestNews({ type: 'pipeline', maxResults });
  }

  /**
   * Search news
   */
  async search(query: string, maxResults: number = 20): Promise<EndpointsNewsArticle[]> {
    return this.getLatestNews({ query, maxResults });
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
    logger.info('📰 Endpoints News cache cleared');
  }
}
