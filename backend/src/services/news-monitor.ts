/**
 * News Monitoring Service
 * Integrates with existing news scrapers to provide scheduled monitoring
 * and real-time alerts for biotech news and articles
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { getScrapingManager } from '../scraping/scraping-manager.js';
import { FierceBiotechArticle } from '../scraping/fierce-biotech-scraper.js';
import { LRUCache } from '../scraping/lru-cache.js';

export interface NewsArticle {
  id: string;
  source: 'fierce-biotech' | 'biospace' | 'science-daily' | 'endpoints';
  title: string;
  url: string;
  author: string;
  publishedDate: string;
  summary: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  importance: 'high' | 'medium' | 'low';
}

export interface NewsAlert {
  id: string;
  article: NewsArticle;
  keywords: string[];
  timestamp: Date;
  matched: boolean;
}

export interface NewsMonitoringConfig {
  fierceBiotech: {
    enabled: boolean;
    checkInterval: number;
    keywords: string[];
  };
  bioSpace: {
    enabled: boolean;
    checkInterval: number;
    keywords: string[];
  };
  scienceDaily: {
    enabled: boolean;
    checkInterval: number;
    keywords: string[];
  };
  endpointsNews: {
    enabled: boolean;
    checkInterval: number;
    keywords: string[];
  };
}

/**
 * News Monitoring Service
 * Coordinates scheduled monitoring of news sources
 */
export class NewsMonitoringService extends EventEmitter {
  private config: NewsMonitoringConfig;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private seenArticles: LRUCache<boolean>;
  private alerts: NewsAlert[] = [];
  private scrapingManager = getScrapingManager();

  // Default keywords to monitor
  private readonly defaultKeywords = [
    'FDA approval',
    'clinical trial',
    'breakthrough therapy',
    'Phase III',
    'Phase 3',
    'PDUFA',
    'orphan drug',
    'fast track',
    'priority review',
    'accelerated approval',
    'drug development',
    'merger',
    'acquisition',
    'partnership',
    'licensing deal',
    'IPO',
    'funding round',
    'clinical data',
    'pivotal trial',
    'biologics',
    'gene therapy',
    'cell therapy',
    'CAR-T',
    'immunotherapy',
    'oncology',
    'rare disease',
  ];

  constructor() {
    super();

    // Initialize configuration
    this.config = {
      fierceBiotech: {
        enabled: true,
        checkInterval: 600000, // 10 minutes
        keywords: this.defaultKeywords,
      },
      bioSpace: {
        enabled: true,
        checkInterval: 900000, // 15 minutes
        keywords: this.defaultKeywords,
      },
      scienceDaily: {
        enabled: true,
        checkInterval: 1800000, // 30 minutes
        keywords: this.defaultKeywords,
      },
      endpointsNews: {
        enabled: true,
        checkInterval: 900000, // 15 minutes
        keywords: this.defaultKeywords,
      },
    };

    // Cache for tracking seen articles (7 days)
    this.seenArticles = new LRUCache<boolean>({
      maxSize: 5000,
      defaultTTL: 604800000, // 7 days
    });

    logger.info('📰 News Monitoring Service initialized');
  }

  /**
   * Start monitoring all enabled sources
   */
  start(): void {
    logger.info('🚀 Starting news monitoring...');

    if (this.config.fierceBiotech.enabled) {
      this.startFierceBiotechMonitoring();
    }

    if (this.config.bioSpace.enabled) {
      this.startBioSpaceMonitoring();
    }

    if (this.config.scienceDaily.enabled) {
      this.startScienceDailyMonitoring();
    }

    if (this.config.endpointsNews.enabled) {
      this.startEndpointsNewsMonitoring();
    }

    logger.info('✅ News monitoring started');
  }

  /**
   * Stop all monitoring
   */
  stop(): void {
    for (const [source, interval] of this.intervals.entries()) {
      clearInterval(interval);
      logger.info(`⏸️ Stopped monitoring: ${source}`);
    }
    this.intervals.clear();
    logger.info('🛑 News monitoring stopped');
  }

  /**
   * Start Fierce Biotech monitoring
   */
  private startFierceBiotechMonitoring(): void {
    const source = 'fierce-biotech';
    const config = this.config.fierceBiotech;

    // Initial check
    this.checkFierceBiotech().catch(error => {
      logger.error(`Error in initial ${source} check:`, error);
    });

    // Scheduled checks
    const interval = setInterval(() => {
      this.checkFierceBiotech().catch(error => {
        logger.error(`Error checking ${source}:`, error);
      });
    }, config.checkInterval);

    this.intervals.set(source, interval);
    logger.info(`📡 Started ${source} monitoring (every ${config.checkInterval / 1000}s)`);
  }

  /**
   * Check Fierce Biotech for new articles
   */
  private async checkFierceBiotech(): Promise<void> {
    try {
      const scraper = this.scrapingManager.getFierceBiotechScraper();
      const articles = await scraper.getLatestNews(20);

      let newCount = 0;
      for (const article of articles) {
        if (!this.seenArticles.has(article.id)) {
          this.seenArticles.set(article.id, true);
          
          const newsArticle = this.convertFierceBiotechArticle(article);
          const matched = this.matchesKeywords(newsArticle);

          if (matched) {
            const alert: NewsAlert = {
              id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              article: newsArticle,
              keywords: this.extractMatchedKeywords(newsArticle),
              timestamp: new Date(),
              matched: true,
            };

            this.alerts.push(alert);
            
            // Keep only last 500 alerts
            if (this.alerts.length > 500) {
              this.alerts.shift();
            }

            this.emit('news:alert', alert);
            logger.info(`🔔 News alert: ${newsArticle.title} (${newsArticle.source})`);
          }

          this.emit('news:article', newsArticle);
          newCount++;
        }
      }

      if (newCount > 0) {
        logger.info(`📰 Fierce Biotech: ${newCount} new articles`);
      }
    } catch (error) {
      logger.error('Error checking Fierce Biotech:', error);
    }
  }

  /**
   * Start BioSpace monitoring
   */
  private startBioSpaceMonitoring(): void {
    const source = 'biospace';
    const config = this.config.bioSpace;

    // Initial check
    this.checkBioSpace().catch(error => {
      logger.error(`Error in initial ${source} check:`, error);
    });

    // Scheduled checks
    const interval = setInterval(() => {
      this.checkBioSpace().catch(error => {
        logger.error(`Error checking ${source}:`, error);
      });
    }, config.checkInterval);

    this.intervals.set(source, interval);
    logger.info(`📡 Started ${source} monitoring (every ${config.checkInterval / 1000}s)`);
  }

  /**
   * Check BioSpace for new articles
   */
  private async checkBioSpace(): Promise<void> {
    try {
      const scraper = this.scrapingManager.getBioSpaceScraper();
      const articles = await scraper.getLatestNews(20);

      let newCount = 0;
      for (const article of articles) {
        if (!this.seenArticles.has(article.id)) {
          this.seenArticles.set(article.id, true);
          
          const newsArticle: NewsArticle = {
            id: article.id,
            source: 'biospace',
            title: article.title,
            url: article.url,
            author: article.author,
            publishedDate: article.publishedDate,
            summary: article.summary,
            category: article.category,
            tags: article.tags,
            imageUrl: article.imageUrl,
            importance: this.determineImportance(article.title, article.summary),
          };

          const matched = this.matchesKeywords(newsArticle);

          if (matched) {
            const alert: NewsAlert = {
              id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              article: newsArticle,
              keywords: this.extractMatchedKeywords(newsArticle),
              timestamp: new Date(),
              matched: true,
            };

            this.alerts.push(alert);
            
            if (this.alerts.length > 500) {
              this.alerts.shift();
            }

            this.emit('news:alert', alert);
            logger.info(`🔔 News alert: ${newsArticle.title} (${newsArticle.source})`);
          }

          this.emit('news:article', newsArticle);
          newCount++;
        }
      }

      if (newCount > 0) {
        logger.info(`📰 BioSpace: ${newCount} new articles`);
      }
    } catch (error) {
      logger.error('Error checking BioSpace:', error);
    }
  }

  /**
   * Start Science Daily monitoring
   */
  private startScienceDailyMonitoring(): void {
    const source = 'science-daily';
    const config = this.config.scienceDaily;

    // Initial check
    this.checkScienceDaily().catch(error => {
      logger.error(`Error in initial ${source} check:`, error);
    });

    // Scheduled checks
    const interval = setInterval(() => {
      this.checkScienceDaily().catch(error => {
        logger.error(`Error checking ${source}:`, error);
      });
    }, config.checkInterval);

    this.intervals.set(source, interval);
    logger.info(`📡 Started ${source} monitoring (every ${config.checkInterval / 1000}s)`);
  }

  /**
   * Check Science Daily for new articles
   */
  private async checkScienceDaily(): Promise<void> {
    try {
      const scraper = this.scrapingManager.getScienceDailyScraper();
      const articles = await scraper.getHealthNews(20);

      let newCount = 0;
      for (const article of articles) {
        if (!this.seenArticles.has(article.id)) {
          this.seenArticles.set(article.id, true);
          
          const newsArticle: NewsArticle = {
            id: article.id,
            source: 'science-daily',
            title: article.title,
            url: article.url,
            author: article.source,
            publishedDate: article.publishedDate,
            summary: article.summary,
            category: article.category,
            tags: article.topics,
            imageUrl: article.imageUrl,
            importance: this.determineImportance(article.title, article.summary),
          };

          const matched = this.matchesKeywords(newsArticle);

          if (matched) {
            const alert: NewsAlert = {
              id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              article: newsArticle,
              keywords: this.extractMatchedKeywords(newsArticle),
              timestamp: new Date(),
              matched: true,
            };

            this.alerts.push(alert);
            
            if (this.alerts.length > 500) {
              this.alerts.shift();
            }

            this.emit('news:alert', alert);
            logger.info(`🔔 News alert: ${newsArticle.title} (${newsArticle.source})`);
          }

          this.emit('news:article', newsArticle);
          newCount++;
        }
      }

      if (newCount > 0) {
        logger.info(`📰 Science Daily: ${newCount} new articles`);
      }
    } catch (error) {
      logger.error('Error checking Science Daily:', error);
    }
  }

  /**
   * Start Endpoints News monitoring
   */
  private startEndpointsNewsMonitoring(): void {
    const source = 'endpoints-news';
    const config = this.config.endpointsNews;

    // Initial check
    this.checkEndpointsNews().catch(error => {
      logger.error(`Error in initial ${source} check:`, error);
    });

    // Scheduled checks
    const interval = setInterval(() => {
      this.checkEndpointsNews().catch(error => {
        logger.error(`Error checking ${source}:`, error);
      });
    }, config.checkInterval);

    this.intervals.set(source, interval);
    logger.info(`📡 Started ${source} monitoring (every ${config.checkInterval / 1000}s)`);
  }

  /**
   * Check Endpoints News for new articles
   */
  private async checkEndpointsNews(): Promise<void> {
    try {
      const scraper = this.scrapingManager.getEndpointsNewsScraper();
      const articles = await scraper.getLatestNews(20);

      let newCount = 0;
      for (const article of articles) {
        if (!this.seenArticles.has(article.id)) {
          this.seenArticles.set(article.id, true);
          
          const newsArticle: NewsArticle = {
            id: article.id,
            source: 'endpoints',
            title: article.title,
            url: article.url,
            author: article.author,
            publishedDate: article.publishedDate,
            summary: article.summary,
            category: article.category,
            tags: article.tags,
            imageUrl: article.imageUrl,
            importance: this.determineImportance(article.title, article.summary),
          };

          const matched = this.matchesKeywords(newsArticle);

          if (matched) {
            const alert: NewsAlert = {
              id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              article: newsArticle,
              keywords: this.extractMatchedKeywords(newsArticle),
              timestamp: new Date(),
              matched: true,
            };

            this.alerts.push(alert);
            
            if (this.alerts.length > 500) {
              this.alerts.shift();
            }

            this.emit('news:alert', alert);
            logger.info(`🔔 News alert: ${newsArticle.title} (${newsArticle.source})`);
          }

          this.emit('news:article', newsArticle);
          newCount++;
        }
      }

      if (newCount > 0) {
        logger.info(`📰 Endpoints News: ${newCount} new articles`);
      }
    } catch (error) {
      logger.error('Error checking Endpoints News:', error);
    }
  }

  /**
   * Convert Fierce Biotech article to common format
   */
  private convertFierceBiotechArticle(article: FierceBiotechArticle): NewsArticle {
    return {
      id: article.id,
      source: 'fierce-biotech',
      title: article.title,
      url: article.url,
      author: article.author,
      publishedDate: article.publishedDate,
      summary: article.summary,
      category: article.category,
      tags: article.tags,
      imageUrl: article.imageUrl,
      importance: this.determineImportance(article.title, article.summary),
    };
  }

  /**
   * Check if article matches configured keywords
   */
  private matchesKeywords(article: NewsArticle): boolean {
    const keywords = this.config[article.source === 'fierce-biotech' ? 'fierceBiotech' :
                                   article.source === 'biospace' ? 'bioSpace' :
                                   article.source === 'science-daily' ? 'scienceDaily' :
                                   'endpointsNews'].keywords;

    const text = `${article.title} ${article.summary}`.toLowerCase();
    
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Extract matched keywords from article
   */
  private extractMatchedKeywords(article: NewsArticle): string[] {
    const keywords = this.config[article.source === 'fierce-biotech' ? 'fierceBiotech' :
                                   article.source === 'biospace' ? 'bioSpace' :
                                   article.source === 'science-daily' ? 'scienceDaily' :
                                   'endpointsNews'].keywords;

    const text = `${article.title} ${article.summary}`.toLowerCase();
    
    return keywords.filter(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Determine article importance based on content
   */
  private determineImportance(title: string, summary: string): 'high' | 'medium' | 'low' {
    const text = `${title} ${summary}`.toLowerCase();
    
    // High importance keywords
    const highImportance = [
      'fda approval',
      'breakthrough therapy',
      'phase iii success',
      'phase 3 success',
      'pivotal trial',
      'acquisition',
      'merger',
      'fast track designation',
      'priority review',
      'accelerated approval',
    ];

    // Medium importance keywords
    const mediumImportance = [
      'clinical trial',
      'phase ii',
      'phase 2',
      'partnership',
      'licensing',
      'funding',
      'ipo',
    ];

    if (highImportance.some(keyword => text.includes(keyword))) {
      return 'high';
    }

    if (mediumImportance.some(keyword => text.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 50): NewsAlert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get alerts by source
   */
  getAlertsBySource(source: NewsArticle['source'], limit: number = 20): NewsAlert[] {
    return this.alerts
      .filter(alert => alert.article.source === source)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get configuration
   */
  getConfig(): NewsMonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<NewsMonitoringConfig>): void {
    Object.assign(this.config, updates);
    logger.info('🔄 News monitoring configuration updated');
    this.emit('config:updated', this.config);
  }

  /**
   * Add keywords to a source
   */
  addKeywords(source: keyof NewsMonitoringConfig, keywords: string[]): void {
    this.config[source].keywords.push(...keywords);
    logger.info(`➕ Added ${keywords.length} keywords to ${source}`);
    this.emit('keywords:added', { source, keywords });
  }

  /**
   * Remove keywords from a source
   */
  removeKeywords(source: keyof NewsMonitoringConfig, keywords: string[]): void {
    this.config[source].keywords = this.config[source].keywords.filter(
      k => !keywords.includes(k)
    );
    logger.info(`➖ Removed ${keywords.length} keywords from ${source}`);
    this.emit('keywords:removed', { source, keywords });
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalAlerts: number;
    alertsBySource: Record<string, number>;
    topKeywords: { keyword: string; count: number }[];
    lastAlert?: Date;
  } {
    const alertsBySource: Record<string, number> = {};
    const keywordCounts: Record<string, number> = {};

    for (const alert of this.alerts) {
      const source = alert.article.source;
      alertsBySource[source] = (alertsBySource[source] || 0) + 1;

      for (const keyword of alert.keywords) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
    }

    const topKeywords = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const lastAlert = this.alerts.length > 0 
      ? this.alerts[this.alerts.length - 1].timestamp
      : undefined;

    return {
      totalAlerts: this.alerts.length,
      alertsBySource,
      topKeywords,
      lastAlert,
    };
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    logger.info('🗑️ News alerts cleared');
  }
}

// Singleton instance
let instance: NewsMonitoringService | null = null;

export function getNewsMonitor(): NewsMonitoringService {
  if (!instance) {
    instance = new NewsMonitoringService();
  }
  return instance;
}
