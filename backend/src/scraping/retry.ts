/**
 * Exponential Backoff with Jitter
 * Smart retry mechanisms with network resilience
 */

import { logger } from '../utils/logger.js';

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  onRetry?: (attempt: number, delay: number, error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalDelay: number;
}

/**
 * Calculate exponential backoff delay with optional jitter
 */
export function calculateBackoff(
  attempt: number,
  config: {
    initialDelay: number;
    maxDelay: number;
    factor: number;
    jitter: boolean;
  }
): number {
  const { initialDelay, maxDelay, factor, jitter } = config;
  
  // Calculate exponential delay
  let delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
  
  // Add jitter to prevent thundering herd
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  return Math.floor(delay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    jitter = true,
    onRetry,
  } = config;

  let lastError: any;
  let totalDelay = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const data = await fn();
      
      return {
        success: true,
        data,
        attempts: attempt + 1,
        totalDelay,
      };
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === maxAttempts - 1) {
        break;
      }

      // Calculate backoff delay
      const delay = calculateBackoff(attempt, {
        initialDelay,
        maxDelay,
        factor,
        jitter,
      });

      totalDelay += delay;

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, delay, error);
      }

      logger.debug(
        `Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms (total: ${totalDelay}ms)`
      );

      // Wait before retrying
      await delayFunc(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    totalDelay,
  };
}

/**
 * Retry with conditional logic
 */
export async function retryWithCondition<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: any, attempt: number) => boolean,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    jitter = true,
    onRetry,
  } = config;

  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!shouldRetry(error, attempt + 1) || attempt === maxAttempts - 1) {
        throw error;
      }

      // Calculate backoff delay
      const delayMs = calculateBackoff(attempt, {
        initialDelay,
        maxDelay,
        factor,
        jitter,
      });

      if (onRetry) {
        onRetry(attempt + 1, delayMs, error);
      }

      logger.debug(`Conditional retry ${attempt + 1}/${maxAttempts} after ${delayMs}ms`);

      await delayFunc(delayMs);
    }
  }

  throw lastError;
}

/**
 * Retry only on specific error types
 */
export async function retryOnError<T>(
  fn: () => Promise<T>,
  retryableErrors: Array<new (...args: any[]) => Error> | ((error: any) => boolean),
  config: RetryConfig = {}
): Promise<T> {
  const shouldRetry = (error: any): boolean => {
    if (typeof retryableErrors === 'function') {
      return retryableErrors(error);
    }
    
    return retryableErrors.some(ErrorType => error instanceof ErrorType);
  };

  return retryWithCondition(fn, shouldRetry, config);
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  config: RetryConfig = {}
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error('Retry timeout exceeded')), timeout)
  );

  const retryPromise = retryWithBackoff(fn, config).then(result => {
    if (result.success) {
      return result.data!;
    }
    throw result.error;
  });

  return Promise.race([retryPromise, timeoutPromise]);
}

/**
 * Batch retry - retry multiple operations
 */
export async function batchRetry<T>(
  operations: Array<() => Promise<T>>,
  config: RetryConfig = {}
): Promise<Array<RetryResult<T>>> {
  const results = await Promise.all(
    operations.map(op => retryWithBackoff(op, config))
  );
  
  return results;
}

/**
 * Delay utility
 */
function delayFunc(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry decorator for class methods
 */
export function Retry(config: RetryConfig = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await retryWithBackoff(
        () => originalMethod.apply(this, args),
        config
      );

      if (result.success) {
        return result.data;
      }

      throw result.error;
    };

    return descriptor;
  };
}

/**
 * Retry manager for tracking retry statistics
 */
export class RetryManager {
  private stats: Map<string, {
    totalAttempts: number;
    successfulRetries: number;
    failedRetries: number;
    totalDelay: number;
  }> = new Map();

  /**
   * Execute with retry tracking
   */
  async executeWithTracking<T>(
    name: string,
    fn: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const result = await retryWithBackoff(fn, {
      ...config,
      onRetry: (attempt, delay, error) => {
        this.recordRetry(name, delay);
        config.onRetry?.(attempt, delay, error);
      },
    });

    if (result.success) {
      this.recordSuccess(name, result.attempts, result.totalDelay);
      return result.data!;
    } else {
      this.recordFailure(name, result.attempts, result.totalDelay);
      throw result.error;
    }
  }

  /**
   * Record a retry attempt
   */
  private recordRetry(name: string, delay: number): void {
    const stats = this.getOrCreateStats(name);
    stats.totalAttempts++;
    stats.totalDelay += delay;
  }

  /**
   * Record a successful retry
   */
  private recordSuccess(name: string, attempts: number, totalDelay: number): void {
    const stats = this.getOrCreateStats(name);
    if (attempts > 1) {
      stats.successfulRetries++;
    }
  }

  /**
   * Record a failed retry
   */
  private recordFailure(name: string, attempts: number, totalDelay: number): void {
    const stats = this.getOrCreateStats(name);
    stats.failedRetries++;
  }

  /**
   * Get or create stats entry
   */
  private getOrCreateStats(name: string) {
    if (!this.stats.has(name)) {
      this.stats.set(name, {
        totalAttempts: 0,
        successfulRetries: 0,
        failedRetries: 0,
        totalDelay: 0,
      });
    }
    return this.stats.get(name)!;
  }

  /**
   * Get statistics for a specific operation
   */
  getStats(name: string) {
    return this.stats.get(name);
  }

  /**
   * Get all statistics
   */
  getAllStats() {
    return new Map(this.stats);
  }

  /**
   * Reset statistics
   */
  reset(name?: string): void {
    if (name) {
      this.stats.delete(name);
    } else {
      this.stats.clear();
    }
  }
}

/**
 * Common retry patterns for specific scenarios
 */
export const RetryPatterns = {
  /**
   * Network request retry pattern
   */
  network: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    jitter: true,
  },

  /**
   * Database operation retry pattern
   */
  database: {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 5000,
    factor: 1.5,
    jitter: true,
  },

  /**
   * API rate limit retry pattern
   */
  rateLimit: {
    maxAttempts: 10,
    initialDelay: 2000,
    maxDelay: 60000,
    factor: 2,
    jitter: false,
  },

  /**
   * Critical operation retry pattern
   */
  critical: {
    maxAttempts: 10,
    initialDelay: 500,
    maxDelay: 30000,
    factor: 2,
    jitter: true,
  },
};
