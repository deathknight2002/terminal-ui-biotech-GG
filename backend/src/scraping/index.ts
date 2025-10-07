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

// Streaming
export {
  createStreamPipeline,
  StreamPipelineBuilder,
  BatchTransformStream,
  FilterStream,
  MapStream,
  AggregateStream,
  JSONLinesParser,
  JSONLinesSerializer,
  CSVParser,
  RateLimitStream,
  StreamUtils,
} from './streaming.js';
export type { StreamPipelineConfig } from './streaming.js';

// HTTP/2
export { HTTP2ConnectionPool, getHTTP2Pool, closeHTTP2Pool } from './http2-pool.js';
export type { ConnectionPoolConfig, RequestOptions, PoolConnection } from './http2-pool.js';

// Performance monitoring
export { PerformanceMonitor, getPerformanceMonitor, shutdownPerformanceMonitor } from './performance-monitor.js';
export type { PerformanceMetric, EndpointHealth, PerformanceSnapshot } from './performance-monitor.js';

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

export { FierceBiotechScraper } from './fierce-biotech-scraper.js';
export type {
  FierceBiotechArticle,
  FierceBiotechSearchParams,
} from './fierce-biotech-scraper.js';

export { ScienceDailyScraper } from './science-daily-scraper.js';
export type {
  ScienceDailyArticle,
  ScienceDailySearchParams,
} from './science-daily-scraper.js';

export { BioSpaceScraper } from './biospace-scraper.js';
export type {
  BioSpaceArticle,
  BioSpaceSearchParams,
} from './biospace-scraper.js';

export { EndpointsNewsScraper } from './endpoints-news-scraper.js';
export type {
  EndpointsArticle,
  EndpointsSearchParams,
} from './endpoints-news-scraper.js';

export { PharmaNewsWireScraper } from './pharmanewswire-scraper.js';
export type {
  PharmaNewsWireArticle,
  PharmaNewsWireSearchParams,
} from './pharmanewswire-scraper.js';

export { GenEngNewsScraper } from './genengnews-scraper.js';
export type {
  GenEngNewsArticle,
  GenEngNewsSearchParams,
} from './genengnews-scraper.js';

export { BioPharmaDigestScraper } from './biopharmadive-scraper.js';
export type {
  BioPharmaDigestArticle,
  BioPharmaDigestSearchParams,
} from './biopharmadive-scraper.js';

export { FDANewsTrackerScraper } from './fda-news-scraper.js';
export type {
  FDANewsArticle,
  FDANewsSearchParams,
} from './fda-news-scraper.js';

export { BioSpaceJobsScraper } from './biospace-jobs-scraper.js';
export type {
  BioSpaceJobPosting,
  BioSpaceJobsSearchParams,
} from './biospace-jobs-scraper.js';

// Manager
export {
  ScrapingManager,
  getScrapingManager,
  initializeScrapingManager,
} from './scraping-manager.js';
export type { ScraperHealth } from './scraping-manager.js';
