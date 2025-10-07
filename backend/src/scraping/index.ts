/**
 * Scraping Infrastructure Module
 * High-performance asynchronous scraping with advanced patterns
 */

// Core components
export { WorkerPool } from './worker-pool.js';
export type { WorkerTask, WorkerPoolConfig } from './worker-pool.js';

export { AdaptiveRateLimiter, TokenBucketRateLimiter } from './rate-limiter.js';
export type { RateLimiterConfig, RateLimitResult } from './rate-limiter.js';

export { LRUCache, MultiTierCache, createCacheKey } from './lru-cache.js';
export type { CacheEntry, CacheConfig } from './lru-cache.js';

export { CircuitBreaker, CircuitBreakerManager, CircuitState } from './circuit-breaker.js';
export type { CircuitBreakerConfig, CircuitBreakerStats } from './circuit-breaker.js';

export {
  retryWithBackoff,
  retryWithCondition,
  retryOnError,
  retryWithTimeout,
  batchRetry,
  calculateBackoff,
  Retry,
  RetryManager,
  RetryPatterns,
} from './retry.js';
export type { RetryConfig, RetryResult } from './retry.js';

// Scrapers
export { PubMedScraper } from './pubmed-scraper.js';
export type { PubMedArticle, PubMedSearchParams } from './pubmed-scraper.js';

export { FDAScraper } from './fda-scraper.js';
export type {
  FDADrugApproval,
  FDAAdverseEvent,
  FDARecall,
  FDASearchParams,
} from './fda-scraper.js';

export { ClinicalTrialsScraper } from './clinical-trials-scraper.js';
export type {
  ClinicalTrial,
  TrialLocation,
  TrialSearchParams,
} from './clinical-trials-scraper.js';

// Manager
export {
  ScrapingManager,
  getScrapingManager,
  initializeScrapingManager,
} from './scraping-manager.js';
export type { ScraperHealth } from './scraping-manager.js';
