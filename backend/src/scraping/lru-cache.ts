/**
 * LRU (Least Recently Used) Cache Implementation
 * In-memory caching for frequently accessed biotech data
 */

import { logger } from '../utils/logger.js';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  ttl?: number;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  cleanupInterval?: number;
  onEvict?: (key: string, value: any) => void;
}

export class LRUCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: number;
  private cleanupTimer?: NodeJS.Timeout;
  private onEvict?: (key: string, value: T) => void;
  
  private hits: number = 0;
  private misses: number = 0;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.maxSize = config.maxSize || 1000;
    this.defaultTTL = config.defaultTTL || 300000; // 5 minutes
    this.cleanupInterval = config.cleanupInterval || 60000; // 1 minute
    this.onEvict = config.onEvict;

    // Start cleanup timer
    this.startCleanup();

    logger.info(`💾 LRU Cache initialized: max size ${this.maxSize}, TTL ${this.defaultTTL}ms`);
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    const ttl = entry.ttl || this.defaultTTL;
    
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      this.misses++;
      logger.debug(`🗑️ Cache entry expired: ${key}`);
      return undefined;
    }

    // Update access metadata
    entry.lastAccess = now;
    entry.accessCount++;
    this.hits++;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();

    // If cache is full, evict least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      lastAccess: now,
      accessCount: 0,
      ttl,
    };

    this.cache.set(key, entry);
    logger.debug(`💾 Cache set: ${key} (size: ${this.cache.size}/${this.maxSize})`);
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check expiration
    const now = Date.now();
    const ttl = entry.ttl || this.defaultTTL;
    
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    const deleted = this.cache.delete(key);
    
    if (deleted && entry && this.onEvict) {
      this.onEvict(key, entry.value);
    }
    
    return deleted;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    const size = this.cache.size;
    
    if (this.onEvict) {
      for (const [key, entry] of this.cache.entries()) {
        this.onEvict(key, entry.value);
      }
    }
    
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    
    logger.info(`🗑️ Cache cleared: ${size} entries removed`);
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    
    if (firstKey) {
      const entry = this.cache.get(firstKey);
      this.cache.delete(firstKey);
      
      if (entry && this.onEvict) {
        this.onEvict(firstKey, entry.value);
      }
      
      logger.debug(`🗑️ Evicted LRU entry: ${firstKey}`);
    }
  }

  /**
   * Get multiple values from the cache
   */
  getMany(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  /**
   * Set multiple values in the cache
   */
  setMany(entries: Map<string, T> | Record<string, T>, ttl?: number): void {
    const entriesMap = entries instanceof Map ? entries : new Map(Object.entries(entries));
    
    for (const [key, value] of entriesMap.entries()) {
      this.set(key, value, ttl);
    }
  }

  /**
   * Start the cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const ttl = entry.ttl || this.defaultTTL;
      
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
        expiredCount++;
        
        if (this.onEvict) {
          this.onEvict(key, entry.value);
        }
      }
    }

    if (expiredCount > 0) {
      logger.debug(`🧹 Cache cleanup: ${expiredCount} expired entries removed`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    
    const avgAccessCount = entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length
      : 0;

    const avgAge = entries.length > 0
      ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationRate: (this.cache.size / this.maxSize) * 100,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      totalRequests,
      avgAccessCount,
      avgAgeMs: avgAge,
    };
  }

  /**
   * Get keys by pattern
   */
  getKeysByPattern(pattern: string | RegExp): string[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  /**
   * Get the most accessed entries
   */
  getMostAccessed(limit: number = 10): Array<{ key: string; accessCount: number; value: T }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        value: entry.value,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);

    return entries;
  }

  /**
   * Destroy the cache and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.clear();
    logger.info('💾 LRU Cache destroyed');
  }
}

/**
 * Create a cache key from parts
 */
export function createCacheKey(...parts: Array<string | number | boolean>): string {
  return parts.join(':');
}

/**
 * Multi-tier cache implementation
 */
export class MultiTierCache<T = any> {
  private memoryCache: LRUCache<T>;
  private persistentCache?: Map<string, T>; // Placeholder for Redis/persistent storage

  constructor(memoryConfig?: CacheConfig) {
    this.memoryCache = new LRUCache<T>(memoryConfig);
  }

  async get(key: string): Promise<T | undefined> {
    // Try memory cache first
    let value = this.memoryCache.get(key);
    
    if (value !== undefined) {
      return value;
    }

    // Try persistent cache (would be Redis in production)
    if (this.persistentCache) {
      value = this.persistentCache.get(key);
      
      if (value !== undefined) {
        // Populate memory cache
        this.memoryCache.set(key, value);
        return value;
      }
    }

    return undefined;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, value, ttl);
    
    // Set in persistent cache (would be Redis in production)
    if (this.persistentCache) {
      this.persistentCache.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (this.persistentCache) {
      this.persistentCache.delete(key);
    }
  }

  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      persistent: {
        size: this.persistentCache?.size || 0,
      },
    };
  }
}
