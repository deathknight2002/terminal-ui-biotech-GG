/**
 * Adaptive Rate Limiting System
 * Dynamic throttling based on server response patterns
 */

import { logger } from '../utils/logger.js';

export interface RateLimiterConfig {
  initialRate?: number;
  minRate?: number;
  maxRate?: number;
  window?: number;
  adaptiveThreshold?: number;
  recoveryFactor?: number;
  backoffFactor?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  waitTime: number;
  currentRate: number;
  requestCount: number;
}

export class AdaptiveRateLimiter {
  private currentRate: number;
  private minRate: number;
  private maxRate: number;
  private window: number;
  private adaptiveThreshold: number;
  private recoveryFactor: number;
  private backoffFactor: number;
  
  private requestTimestamps: number[] = [];
  private successCount: number = 0;
  private errorCount: number = 0;
  private lastAdaptation: number = Date.now();
  private readonly adaptationInterval: number = 60000; // 1 minute

  constructor(config: RateLimiterConfig = {}) {
    this.currentRate = config.initialRate || 10; // requests per second
    this.minRate = config.minRate || 1;
    this.maxRate = config.maxRate || 100;
    this.window = config.window || 1000; // 1 second
    this.adaptiveThreshold = config.adaptiveThreshold || 0.1; // 10% error rate
    this.recoveryFactor = config.recoveryFactor || 1.2;
    this.backoffFactor = config.backoffFactor || 0.5;

    logger.info(`⏱️ Adaptive Rate Limiter initialized: ${this.currentRate} req/s`);
  }

  /**
   * Check if a request is allowed
   */
  async checkLimit(): Promise<RateLimitResult> {
    const now = Date.now();
    
    // Clean up old timestamps outside the window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.window
    );

    const requestCount = this.requestTimestamps.length;
    const allowed = requestCount < this.currentRate;

    if (!allowed) {
      const oldestRequest = this.requestTimestamps[0] || now;
      const waitTime = this.window - (now - oldestRequest);
      
      return {
        allowed: false,
        waitTime: Math.max(0, waitTime),
        currentRate: this.currentRate,
        requestCount,
      };
    }

    this.requestTimestamps.push(now);

    return {
      allowed: true,
      waitTime: 0,
      currentRate: this.currentRate,
      requestCount: requestCount + 1,
    };
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.successCount++;
    this.adaptRate();
  }

  /**
   * Record a failed request
   */
  recordError(): void {
    this.errorCount++;
    this.adaptRate();
  }

  /**
   * Adapt the rate based on success/error patterns
   */
  private adaptRate(): void {
    const now = Date.now();
    
    // Only adapt at specified intervals
    if (now - this.lastAdaptation < this.adaptationInterval) {
      return;
    }

    const totalRequests = this.successCount + this.errorCount;
    if (totalRequests === 0) return;

    const errorRate = this.errorCount / totalRequests;

    if (errorRate > this.adaptiveThreshold) {
      // Too many errors, reduce rate
      const newRate = Math.max(
        this.minRate,
        Math.floor(this.currentRate * this.backoffFactor)
      );
      
      if (newRate !== this.currentRate) {
        logger.warn(
          `📉 Rate limiting: Reducing rate from ${this.currentRate} to ${newRate} req/s (error rate: ${(errorRate * 100).toFixed(2)}%)`
        );
        this.currentRate = newRate;
      }
    } else if (errorRate < this.adaptiveThreshold / 2 && this.currentRate < this.maxRate) {
      // Low error rate, increase rate
      const newRate = Math.min(
        this.maxRate,
        Math.floor(this.currentRate * this.recoveryFactor)
      );
      
      if (newRate !== this.currentRate) {
        logger.info(
          `📈 Rate limiting: Increasing rate from ${this.currentRate} to ${newRate} req/s (error rate: ${(errorRate * 100).toFixed(2)}%)`
        );
        this.currentRate = newRate;
      }
    }

    // Reset counters
    this.successCount = 0;
    this.errorCount = 0;
    this.lastAdaptation = now;
  }

  /**
   * Wait for rate limit availability
   */
  async waitForLimit(): Promise<void> {
    const result = await this.checkLimit();
    
    if (!result.allowed && result.waitTime > 0) {
      logger.debug(`⏳ Rate limit reached, waiting ${result.waitTime}ms`);
      await this.delay(result.waitTime);
      return this.waitForLimit(); // Recursive wait
    }
  }

  /**
   * Get current rate limiter statistics
   */
  getStats() {
    return {
      currentRate: this.currentRate,
      minRate: this.minRate,
      maxRate: this.maxRate,
      successCount: this.successCount,
      errorCount: this.errorCount,
      totalRequests: this.successCount + this.errorCount,
      errorRate: this.errorCount / Math.max(1, this.successCount + this.errorCount),
      recentRequestCount: this.requestTimestamps.length,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requestTimestamps = [];
    this.successCount = 0;
    this.errorCount = 0;
    this.lastAdaptation = Date.now();
    logger.info('🔄 Rate limiter reset');
  }

  /**
   * Manually set the rate
   */
  setRate(rate: number): void {
    this.currentRate = Math.max(this.minRate, Math.min(this.maxRate, rate));
    logger.info(`⚙️ Rate manually set to ${this.currentRate} req/s`);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Token Bucket Rate Limiter (alternative algorithm)
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume a token
   */
  async consume(count: number = 1): Promise<boolean> {
    this.refillTokens();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  /**
   * Wait and consume tokens
   */
  async waitAndConsume(count: number = 1): Promise<void> {
    while (!(await this.consume(count))) {
      await this.delay(100);
    }
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get available tokens
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
