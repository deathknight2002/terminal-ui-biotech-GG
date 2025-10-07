/**
 * Scraping Manager
 * Orchestrates all scraping operations with health monitoring
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { WorkerPool } from './worker-pool.js';
import { CircuitBreakerManager } from './circuit-breaker.js';
import { PubMedScraper } from './pubmed-scraper.js';
import { FDAScraper } from './fda-scraper.js';
import { ClinicalTrialsScraper } from './clinical-trials-scraper.js';
import { FierceBiotechScraper } from './fierce-biotech-scraper.js';
import { ScienceDailyScraper } from './science-daily-scraper.js';
import { BioSpaceScraper } from './biospace-scraper.js';
import { EndpointsNewsScraper } from './endpoints-news-scraper.js';

export interface ScraperHealth {
  pubmed: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: number;
    stats: any;
  };
  fda: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: number;
    stats: any;
  };
  clinicalTrials: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: number;
    stats: any;
  };
  fierceBiotech: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: number;
    stats: any;
  };
  scienceDaily: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: number;
    stats: any;
  };
  bioSpace: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: number;
    stats: any;
  };
  endpointsNews: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: number;
    stats: any;
  };
  workerPool: {
    stats: any;
  };
}

export class ScrapingManager extends EventEmitter {
  private workerPool: WorkerPool;
  private circuitBreakerManager: CircuitBreakerManager;
  private pubmedScraper: PubMedScraper;
  private fdaScraper: FDAScraper;
  private clinicalTrialsScraper: ClinicalTrialsScraper;
  private fierceBiotechScraper: FierceBiotechScraper;
  private scienceDailyScraper: ScienceDailyScraper;
  private bioSpaceScraper: BioSpaceScraper;
  private endpointsNewsScraper: EndpointsNewsScraper;
  
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly healthCheckIntervalMs: number = 60000; // 1 minute
  
  private isInitialized: boolean = false;

  constructor(config?: {
    pubmedApiKey?: string;
    fdaApiKey?: string;
  }) {
    super();

    // Initialize worker pool
    this.workerPool = new WorkerPool({
      maxWorkers: undefined, // Auto-detect from CPU
      taskTimeout: 30000,
      maxRetries: 3,
    });

    // Initialize circuit breaker manager
    this.circuitBreakerManager = new CircuitBreakerManager({
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000,
    });

    // Initialize scrapers
    this.pubmedScraper = new PubMedScraper(config?.pubmedApiKey);
    this.fdaScraper = new FDAScraper(config?.fdaApiKey);
    this.clinicalTrialsScraper = new ClinicalTrialsScraper();
    this.fierceBiotechScraper = new FierceBiotechScraper();
    this.scienceDailyScraper = new ScienceDailyScraper();
    this.bioSpaceScraper = new BioSpaceScraper();
    this.endpointsNewsScraper = new EndpointsNewsScraper();

    // Setup event listeners
    this.setupEventListeners();

    logger.info('🚀 Scraping Manager initialized with 7 scrapers');
  }

  /**
   * Initialize the scraping manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('⚠️ Scraping Manager already initialized');
      return;
    }

    // Start health checks
    this.startHealthChecks();

    this.isInitialized = true;
    this.emit('initialized');
    
    logger.info('✅ Scraping Manager ready');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Worker pool events
    this.workerPool.on('task:completed', (data) => {
      this.emit('scraping:success', data);
    });

    this.workerPool.on('task:failed', (data) => {
      this.emit('scraping:failure', data);
    });

    // Circuit breaker events
    this.circuitBreakerManager.getBreaker('pubmed').on('stateChange', (data) => {
      logger.warn(`🔌 PubMed circuit breaker: ${data.oldState} → ${data.newState}`);
      this.emit('health:change', { service: 'pubmed', ...data });
    });

    this.circuitBreakerManager.getBreaker('fda').on('stateChange', (data) => {
      logger.warn(`🔌 FDA circuit breaker: ${data.oldState} → ${data.newState}`);
      this.emit('health:change', { service: 'fda', ...data });
    });

    this.circuitBreakerManager.getBreaker('clinicaltrials').on('stateChange', (data) => {
      logger.warn(`🔌 Clinical Trials circuit breaker: ${data.oldState} → ${data.newState}`);
      this.emit('health:change', { service: 'clinicalTrials', ...data });
    });
  }

  /**
   * Get PubMed scraper
   */
  getPubMedScraper(): PubMedScraper {
    return this.pubmedScraper;
  }

  /**
   * Get FDA scraper
   */
  getFDAScraper(): FDAScraper {
    return this.fdaScraper;
  }

  /**
   * Get Clinical Trials scraper
   */
  getClinicalTrialsScraper(): ClinicalTrialsScraper {
    return this.clinicalTrialsScraper;
  }

  /**
   * Get Fierce Biotech scraper
   */
  getFierceBiotechScraper(): FierceBiotechScraper {
    return this.fierceBiotechScraper;
  }

  /**
   * Get Science Daily scraper
   */
  getScienceDailyScraper(): ScienceDailyScraper {
    return this.scienceDailyScraper;
  }

  /**
   * Get BioSpace scraper
   */
  getBioSpaceScraper(): BioSpaceScraper {
    return this.bioSpaceScraper;
  }

  /**
   * Get Endpoints News scraper
   */
  getEndpointsNewsScraper(): EndpointsNewsScraper {
    return this.endpointsNewsScraper;
  }

  /**
   * Get worker pool
   */
  getWorkerPool(): WorkerPool {
    return this.workerPool;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckIntervalMs);

    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Perform health check on all scrapers
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getHealth();
      
      // Emit health update event
      this.emit('health:update', health);

      // Log unhealthy services
      const unhealthyServices = [];
      if (health.pubmed.status !== 'healthy') unhealthyServices.push('PubMed');
      if (health.fda.status !== 'healthy') unhealthyServices.push('FDA');
      if (health.clinicalTrials.status !== 'healthy') unhealthyServices.push('Clinical Trials');
      if (health.fierceBiotech.status !== 'healthy') unhealthyServices.push('Fierce Biotech');
      if (health.scienceDaily.status !== 'healthy') unhealthyServices.push('Science Daily');
      if (health.bioSpace.status !== 'healthy') unhealthyServices.push('BioSpace');
      if (health.endpointsNews.status !== 'healthy') unhealthyServices.push('Endpoints News');

      if (unhealthyServices.length > 0) {
        logger.warn(`⚠️ Unhealthy scraping services: ${unhealthyServices.join(', ')}`);
      }
    } catch (error) {
      logger.error('❌ Health check failed:', error);
    }
  }

  /**
   * Get health status of all scrapers
   */
  async getHealth(): Promise<ScraperHealth> {
    const now = Date.now();

    const health: ScraperHealth = {
      pubmed: {
        status: 'healthy',
        lastCheck: now,
        stats: this.pubmedScraper.getStats(),
      },
      fda: {
        status: 'healthy',
        lastCheck: now,
        stats: this.fdaScraper.getStats(),
      },
      clinicalTrials: {
        status: 'healthy',
        lastCheck: now,
        stats: this.clinicalTrialsScraper.getStats(),
      },
      fierceBiotech: {
        status: 'healthy',
        lastCheck: now,
        stats: this.fierceBiotechScraper.getHealth(),
      },
      scienceDaily: {
        status: 'healthy',
        lastCheck: now,
        stats: this.scienceDailyScraper.getHealth(),
      },
      bioSpace: {
        status: 'healthy',
        lastCheck: now,
        stats: this.bioSpaceScraper.getHealth(),
      },
      endpointsNews: {
        status: 'healthy',
        lastCheck: now,
        stats: this.endpointsNewsScraper.getHealth(),
      },
      workerPool: {
        stats: this.workerPool.getStats(),
      },
    };

    // Check circuit breaker states
    const pubmedBreaker = this.circuitBreakerManager.getBreaker('pubmed');
    const fdaBreaker = this.circuitBreakerManager.getBreaker('fda');
    const clinicalTrialsBreaker = this.circuitBreakerManager.getBreaker('clinicaltrials');

    if (!pubmedBreaker.isHealthy()) {
      health.pubmed.status = 'down';
    } else if (health.pubmed.stats.rateLimiter.errorRate > 0.1) {
      health.pubmed.status = 'degraded';
    }

    if (!fdaBreaker.isHealthy()) {
      health.fda.status = 'down';
    } else if (health.fda.stats.rateLimiter.errorRate > 0.1) {
      health.fda.status = 'degraded';
    }

    if (!clinicalTrialsBreaker.isHealthy()) {
      health.clinicalTrials.status = 'down';
    } else if (health.clinicalTrials.stats.rateLimiter.errorRate > 0.1) {
      health.clinicalTrials.status = 'degraded';
    }

    // Check new scrapers (they have getHealth methods)
    const fbHealth = this.fierceBiotechScraper.getHealth();
    health.fierceBiotech.status = fbHealth.status;

    const sdHealth = this.scienceDailyScraper.getHealth();
    health.scienceDaily.status = sdHealth.status;

    const bsHealth = this.bioSpaceScraper.getHealth();
    health.bioSpace.status = bsHealth.status;

    const enHealth = this.endpointsNewsScraper.getHealth();
    health.endpointsNews.status = enHealth.status;

    return health;
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      workerPool: this.workerPool.getStats(),
      circuitBreakers: this.circuitBreakerManager.getAllStats(),
      pubmed: this.pubmedScraper.getStats(),
      fda: this.fdaScraper.getStats(),
      clinicalTrials: this.clinicalTrialsScraper.getStats(),
      fierceBiotech: this.fierceBiotechScraper.getHealth(),
      scienceDaily: this.scienceDailyScraper.getHealth(),
      bioSpace: this.bioSpaceScraper.getHealth(),
      endpointsNews: this.endpointsNewsScraper.getHealth(),
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.pubmedScraper.clearCache();
    this.fdaScraper.clearCache();
    this.clinicalTrialsScraper.clearCache();
    this.fierceBiotechScraper.clearCache();
    this.scienceDailyScraper.clearCache();
    this.bioSpaceScraper.clearCache();
    this.endpointsNewsScraper.clearCache();
    
    logger.info('🗑️ All scraper caches cleared');
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers(): void {
    this.circuitBreakerManager.resetAll();
    logger.info('🔄 All circuit breakers reset');
  }

  /**
   * Shutdown the scraping manager
   */
  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down Scraping Manager...');

    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Shutdown worker pool
    await this.workerPool.shutdown();

    // Clear caches
    this.clearAllCaches();

    this.isInitialized = false;
    this.emit('shutdown');

    logger.info('✅ Scraping Manager shutdown complete');
  }
}

// Create singleton instance
let scrapingManagerInstance: ScrapingManager | null = null;

/**
 * Get or create the scraping manager singleton
 */
export function getScrapingManager(config?: {
  pubmedApiKey?: string;
  fdaApiKey?: string;
}): ScrapingManager {
  if (!scrapingManagerInstance) {
    scrapingManagerInstance = new ScrapingManager(config);
  }
  return scrapingManagerInstance;
}

/**
 * Initialize the global scraping manager
 */
export async function initializeScrapingManager(config?: {
  pubmedApiKey?: string;
  fdaApiKey?: string;
}): Promise<ScrapingManager> {
  const manager = getScrapingManager(config);
  await manager.initialize();
  return manager;
}
