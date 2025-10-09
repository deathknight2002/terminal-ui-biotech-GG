/**
 * Adaptive Cache - Intelligent caching with TTL management and predictive pre-fetching
 * 
 * Monitors access patterns and adapts cache behavior to optimize performance.
 * Implements LRU eviction, TTL management, and access frequency tracking.
 */

import { EventBus, EventTypes } from './event-bus';

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  maxSize: number;
  hitRate: number;
  averageAccessTime: number;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  enablePredictive?: boolean;
  evictionPolicy?: 'lru' | 'lfu' | 'ttl';
}

class AdaptiveCacheImpl {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    currentSize: 0,
    maxSize: 1000,
    hitRate: 0,
    averageAccessTime: 0,
  };
  private config: Required<CacheConfig>;
  private accessTimes: number[] = [];
  private maxAccessTimes = 100;
  private accessPatterns: Map<string, number[]> = new Map(); // Track when keys are accessed
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 300000, // 5 minutes
      enablePredictive: config.enablePredictive !== false,
      evictionPolicy: config.evictionPolicy || 'lru',
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | undefined {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateStats(performance.now() - startTime);
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateStats(performance.now() - startTime);
      return undefined;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.recordAccess(key);

    this.stats.hits++;
    this.updateStats(performance.now() - startTime);

    // Predictive pre-fetching hint
    if (this.config.enablePredictive) {
      this.triggerPredictiveFetch(key);
    }

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict if necessary
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 1,
      lastAccessed: Date.now(),
      size: this.estimateSize(value),
    };

    this.cache.set(key, entry);
    this.stats.currentSize = this.cache.size;

    // Notify cache update
    EventBus.publish(EventTypes.DATA_CACHED, {
      key,
      ttl: entry.ttl,
    }, { source: 'adaptive-cache', priority: 'low' });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessPatterns.clear();
    this.stats.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cached keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries for inspection
   */
  entries(): CacheEntry<any>[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get predicted next accesses based on patterns
   */
  getPredictions(limit = 5): string[] {
    if (!this.config.enablePredictive) return [];

    const now = Date.now();
    const predictions: Array<{ key: string; score: number }> = [];

    this.accessPatterns.forEach((times, key) => {
      if (times.length < 2) return;

      // Calculate average interval between accesses
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // Predict next access time
      const lastAccess = times[times.length - 1];
      const predictedNext = lastAccess + avgInterval;
      const timeSince = now - lastAccess;

      // Score based on how soon we predict the next access
      if (timeSince < avgInterval * 1.5) {
        const score = 1 - timeSince / avgInterval;
        predictions.push({ key, score });
      }
    });

    return predictions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(p => p.key);
  }

  /**
   * Adaptive TTL adjustment based on access patterns
   */
  adaptTTL(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return this.config.defaultTTL;

    const pattern = this.accessPatterns.get(key);
    if (!pattern || pattern.length < 3) {
      return entry.ttl;
    }

    // Calculate access frequency
    const now = Date.now();
    const recentAccesses = pattern.filter(t => now - t < 3600000); // Last hour
    const accessFrequency = recentAccesses.length;

    // Increase TTL for frequently accessed items
    if (accessFrequency > 10) {
      return Math.min(entry.ttl * 1.5, 3600000); // Max 1 hour
    } else if (accessFrequency < 2) {
      return Math.max(entry.ttl * 0.7, 60000); // Min 1 minute
    }

    return entry.ttl;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evict(): void {
    let keyToEvict: string | undefined;

    if (this.config.evictionPolicy === 'lru') {
      // Evict least recently used
      let oldestAccess = Infinity;
      this.cache.forEach((entry, key) => {
        if (entry.lastAccessed < oldestAccess) {
          oldestAccess = entry.lastAccessed;
          keyToEvict = key;
        }
      });
    } else if (this.config.evictionPolicy === 'lfu') {
      // Evict least frequently used
      let lowestCount = Infinity;
      this.cache.forEach((entry, key) => {
        if (entry.accessCount < lowestCount) {
          lowestCount = entry.accessCount;
          keyToEvict = key;
        }
      });
    } else if (this.config.evictionPolicy === 'ttl') {
      // Evict oldest entry
      let oldestTime = Infinity;
      this.cache.forEach((entry, key) => {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          keyToEvict = key;
        }
      });
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.stats.evictions++;
      this.stats.currentSize = this.cache.size;
    }
  }

  private updateStats(accessTime: number): void {
    this.accessTimes.push(accessTime);
    if (this.accessTimes.length > this.maxAccessTimes) {
      this.accessTimes.shift();
    }
    this.stats.averageAccessTime =
      this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length;

    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private recordAccess(key: string): void {
    if (!this.config.enablePredictive) return;

    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, []);
    }
    const pattern = this.accessPatterns.get(key)!;
    pattern.push(Date.now());

    // Keep only last 20 accesses
    if (pattern.length > 20) {
      pattern.shift();
    }
  }

  private triggerPredictiveFetch(currentKey: string): void {
    // Analyze which keys are frequently accessed together
    const predictions = this.getPredictions(3);
    if (predictions.length > 0) {
      EventBus.publish('cache:predictive_hint', {
        currentKey,
        suggestedKeys: predictions,
      }, { source: 'adaptive-cache', priority: 'low' });
    }
  }

  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      this.cache.forEach((entry, key) => {
        if (this.isExpired(entry)) {
          this.cache.delete(key);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        this.stats.currentSize = this.cache.size;
        this.stats.evictions += cleaned;
      }
    }, 60000); // Run every minute
  }

  /**
   * Stop cleanup timer (for testing or shutdown)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// Create singleton instance
export const AdaptiveCache = new AdaptiveCacheImpl();
