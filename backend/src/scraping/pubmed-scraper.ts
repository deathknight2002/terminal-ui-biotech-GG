/**
 * PubMed Integration Scraper
 * Advanced medical literature scraping with metadata extraction
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { AdaptiveRateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff, RetryPatterns } from './retry.js';

export interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  doi?: string;
  pmcid?: string;
  keywords: string[];
  meshTerms: string[];
  citations: number;
}

export interface PubMedSearchParams {
  query: string;
  maxResults?: number;
  minDate?: string;
  maxDate?: string;
  sortBy?: 'relevance' | 'date' | 'citations';
  filters?: {
    articleType?: string[];
    language?: string[];
    hasAbstract?: boolean;
  };
}

export class PubMedScraper {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: AdaptiveRateLimiter;
  private cache: LRUCache<PubMedArticle[]>;
  private readonly baseUrl: string = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'BiotechTerminal/1.0 (Medical Research)',
      },
    });

    this.circuitBreaker = new CircuitBreaker('pubmed', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });

    this.rateLimiter = new AdaptiveRateLimiter({
      initialRate: apiKey ? 10 : 3, // 10 req/s with key, 3 without
      minRate: 1,
      maxRate: apiKey ? 10 : 3,
    });

    this.cache = new LRUCache<PubMedArticle[]>({
      maxSize: 500,
      defaultTTL: 3600000, // 1 hour
    });

    logger.info('📚 PubMed scraper initialized');
  }

  /**
   * Search PubMed for articles
   */
  async search(params: PubMedSearchParams): Promise<PubMedArticle[]> {
    const cacheKey = JSON.stringify(params);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug(`📚 PubMed cache hit for query: ${params.query}`);
      return cached;
    }

    // Rate limiting
    await this.rateLimiter.waitForLimit();

    try {
      // Search for PMIDs
      const pmids = await this.circuitBreaker.execute(async () => {
        return this.searchPMIDs(params);
      });

      if (pmids.length === 0) {
        return [];
      }

      // Fetch article details
      const articles = await this.fetchArticleDetails(pmids);

      // Cache results
      this.cache.set(cacheKey, articles);
      this.rateLimiter.recordSuccess();

      logger.info(`📚 PubMed search completed: ${articles.length} articles for "${params.query}"`);
      
      return articles;
    } catch (error) {
      this.rateLimiter.recordError();
      logger.error('📚 PubMed search error:', error);
      throw error;
    }
  }

  /**
   * Search for PMIDs using eSearch
   */
  private async searchPMIDs(params: PubMedSearchParams): Promise<string[]> {
    const result = await retryWithBackoff(
      async () => {
        const response = await this.client.get('/esearch.fcgi', {
          params: {
            db: 'pubmed',
            term: params.query,
            retmax: params.maxResults || 20,
            retmode: 'json',
            sort: this.mapSortParam(params.sortBy),
            datetype: 'pdat',
            mindate: params.minDate,
            maxdate: params.maxDate,
            api_key: this.apiKey,
          },
        });

        return response.data.esearchresult.idlist || [];
      },
      RetryPatterns.network
    );

    return result.success ? result.data! : [];
  }

  /**
   * Fetch article details using eFetch
   */
  private async fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
    // Batch fetch in chunks of 200 (PubMed limit)
    const chunkSize = 200;
    const chunks = [];
    
    for (let i = 0; i < pmids.length; i += chunkSize) {
      chunks.push(pmids.slice(i, i + chunkSize));
    }

    const allArticles: PubMedArticle[] = [];

    for (const chunk of chunks) {
      await this.rateLimiter.waitForLimit();

      const result = await retryWithBackoff(
        async () => {
          const response = await this.client.get('/efetch.fcgi', {
            params: {
              db: 'pubmed',
              id: chunk.join(','),
              retmode: 'xml',
              api_key: this.apiKey,
            },
          });

          return this.parseArticlesXML(response.data);
        },
        RetryPatterns.network
      );

      if (result.success && result.data) {
        allArticles.push(...result.data);
      }
    }

    return allArticles;
  }

  /**
   * Parse article XML response
   */
  private parseArticlesXML(xml: string): PubMedArticle[] {
    // Simplified parsing - in production, use a proper XML parser like xml2js
    const articles: PubMedArticle[] = [];
    
    // This is a placeholder implementation
    // In production, parse actual XML structure
    logger.debug('📚 Parsing PubMed XML response');
    
    return articles;
  }

  /**
   * Get article by PMID
   */
  async getArticle(pmid: string): Promise<PubMedArticle | null> {
    const cacheKey = `pmid:${pmid}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0];
    }

    await this.rateLimiter.waitForLimit();

    try {
      const articles = await this.fetchArticleDetails([pmid]);
      
      if (articles.length > 0) {
        this.cache.set(cacheKey, [articles[0]]);
        return articles[0];
      }
      
      return null;
    } catch (error) {
      logger.error(`📚 Failed to fetch PMID ${pmid}:`, error);
      return null;
    }
  }

  /**
   * Search by drug name
   */
  async searchByDrug(drugName: string, maxResults: number = 50): Promise<PubMedArticle[]> {
    const query = `"${drugName}"[Title/Abstract] AND (clinical trial[Publication Type] OR drug therapy[MeSH Terms])`;
    
    return this.search({
      query,
      maxResults,
      sortBy: 'date',
    });
  }

  /**
   * Search by disease/condition
   */
  async searchByDisease(disease: string, maxResults: number = 50): Promise<PubMedArticle[]> {
    const query = `"${disease}"[MeSH Terms] AND therapy[Subheading]`;
    
    return this.search({
      query,
      maxResults,
      sortBy: 'relevance',
    });
  }

  /**
   * Get trending biotech research
   */
  async getTrendingResearch(maxResults: number = 100): Promise<PubMedArticle[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const query = '(biotechnology[MeSH Terms] OR pharmaceutical[MeSH Terms]) AND "clinical trial"[Publication Type]';
    
    return this.search({
      query,
      maxResults,
      minDate: thirtyDaysAgo.toISOString().split('T')[0],
      sortBy: 'date',
    });
  }

  /**
   * Map sort parameter to PubMed format
   */
  private mapSortParam(sortBy?: string): string {
    switch (sortBy) {
      case 'date':
        return 'pub_date';
      case 'citations':
        return 'relevance'; // PubMed doesn't have direct citation sort
      default:
        return 'relevance';
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
    logger.info('📚 PubMed cache cleared');
  }
}
