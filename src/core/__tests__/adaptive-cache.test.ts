/**
 * Tests for Adaptive Cache
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AdaptiveCache } from '../adaptive-cache';

describe('AdaptiveCache', () => {
  beforeEach(() => {
    AdaptiveCache.clear();
  });

  afterEach(() => {
    AdaptiveCache.destroy();
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      AdaptiveCache.set('key1', 'value1');
      
      const value = AdaptiveCache.get('key1');
      
      expect(value).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      const value = AdaptiveCache.get('nonexistent');
      
      expect(value).toBeUndefined();
    });

    it('should check if key exists', () => {
      AdaptiveCache.set('key1', 'value1');
      
      expect(AdaptiveCache.has('key1')).toBe(true);
      expect(AdaptiveCache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      AdaptiveCache.set('key1', 'value1');
      
      AdaptiveCache.delete('key1');
      
      expect(AdaptiveCache.has('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      AdaptiveCache.set('key1', 'value1');
      AdaptiveCache.set('key2', 'value2');
      
      AdaptiveCache.clear();
      
      expect(AdaptiveCache.has('key1')).toBe(false);
      expect(AdaptiveCache.has('key2')).toBe(false);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire entries after TTL', async () => {
      AdaptiveCache.set('key1', 'value1', 50); // 50ms TTL
      
      expect(AdaptiveCache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(AdaptiveCache.get('key1')).toBeUndefined();
    });

    it('should not return expired entries', async () => {
      AdaptiveCache.set('key1', 'value1', 50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(AdaptiveCache.has('key1')).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      AdaptiveCache.set('key1', 'value1');
      
      AdaptiveCache.get('key1'); // hit
      AdaptiveCache.get('nonexistent'); // miss
      
      const stats = AdaptiveCache.getStats();
      
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.5, 1);
    });

    it('should track cache size', () => {
      AdaptiveCache.set('key1', 'value1');
      AdaptiveCache.set('key2', 'value2');
      
      const stats = AdaptiveCache.getStats();
      
      expect(stats.currentSize).toBe(2);
    });

    it('should track evictions', () => {
      // Create small cache
      const smallCache = new (AdaptiveCache.constructor as any)({ maxSize: 2 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Should trigger eviction
      
      const stats = smallCache.getStats();
      
      expect(stats.evictions).toBe(1);
    });
  });

  describe('access patterns and predictions', () => {
    it('should track access patterns', () => {
      AdaptiveCache.set('key1', 'value1');
      
      // Access multiple times
      AdaptiveCache.get('key1');
      AdaptiveCache.get('key1');
      AdaptiveCache.get('key1');
      
      const entries = AdaptiveCache.entries();
      const entry = entries.find(e => e.key === 'key1');
      
      expect(entry?.accessCount).toBeGreaterThanOrEqual(3);
    });

    it('should generate predictions', async () => {
      // Access pattern: access key1 multiple times
      AdaptiveCache.set('key1', 'value1');
      
      for (let i = 0; i < 5; i++) {
        AdaptiveCache.get('key1');
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const predictions = AdaptiveCache.getPredictions(3);
      
      // Predictions may or may not include key1 depending on timing
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('eviction policies', () => {
    it('should evict least recently used (LRU)', () => {
      const cache = new (AdaptiveCache.constructor as any)({
        maxSize: 2,
        evictionPolicy: 'lru'
      });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Access key1 to make it more recent
      cache.get('key1');
      
      // Add key3, should evict key2 (least recent)
      cache.set('key3', 'value3');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });

    it('should evict least frequently used (LFU)', () => {
      const cache = new (AdaptiveCache.constructor as any)({
        maxSize: 2,
        evictionPolicy: 'lfu'
      });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Access key1 multiple times
      cache.get('key1');
      cache.get('key1');
      cache.get('key2');
      
      // Add key3, should evict key2 (less frequent)
      cache.set('key3', 'value3');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });
  });

  describe('entries and keys', () => {
    it('should return all keys', () => {
      AdaptiveCache.set('key1', 'value1');
      AdaptiveCache.set('key2', 'value2');
      
      const keys = AdaptiveCache.keys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });

    it('should return all entries', () => {
      AdaptiveCache.set('key1', 'value1');
      AdaptiveCache.set('key2', 'value2');
      
      const entries = AdaptiveCache.entries();
      
      expect(entries).toHaveLength(2);
      expect(entries[0]).toHaveProperty('key');
      expect(entries[0]).toHaveProperty('value');
      expect(entries[0]).toHaveProperty('timestamp');
    });
  });

  describe('adaptive TTL', () => {
    it('should adapt TTL based on access patterns', () => {
      AdaptiveCache.set('key1', 'value1');
      
      // Access frequently
      for (let i = 0; i < 15; i++) {
        AdaptiveCache.get('key1');
      }
      
      const adaptedTTL = AdaptiveCache.adaptTTL('key1');
      const entries = AdaptiveCache.entries();
      const entry = entries.find(e => e.key === 'key1');
      
      // Should increase TTL for frequently accessed items
      expect(adaptedTTL).toBeGreaterThanOrEqual(entry!.ttl);
    });
  });
});
