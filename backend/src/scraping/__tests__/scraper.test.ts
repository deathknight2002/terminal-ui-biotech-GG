/**
 * News Scrapers Test Suite
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FierceBiotechScraper } from '../fierce-biotech-scraper.js';
import { ScienceDailyScraper } from '../science-daily-scraper.js';
import { BioSpaceScraper } from '../biospace-scraper.js';
import { EndpointsNewsScraper } from '../endpoints-news-scraper.js';

describe('News Scrapers', () => {
  describe('FierceBiotechScraper', () => {
    let scraper: FierceBiotechScraper;

    beforeEach(() => {
      scraper = new FierceBiotechScraper();
    });

    afterEach(() => {
      scraper.clearCache();
    });

    it('should initialize correctly', () => {
      expect(scraper).toBeDefined();
      const health = scraper.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.circuitBreaker.state).toBe('CLOSED');
    });

    it('should have cache management', () => {
      const health1 = scraper.getHealth();
      expect(health1.cache.size).toBe(0);
      
      scraper.clearCache();
      
      const health2 = scraper.getHealth();
      expect(health2.cache.size).toBe(0);
    });
  });

  describe('ScienceDailyScraper', () => {
    let scraper: ScienceDailyScraper;

    beforeEach(() => {
      scraper = new ScienceDailyScraper();
    });

    afterEach(() => {
      scraper.clearCache();
    });

    it('should initialize correctly', () => {
      expect(scraper).toBeDefined();
      const health = scraper.getHealth();
      expect(health.status).toBe('healthy');
    });
  });

  describe('BioSpaceScraper', () => {
    let scraper: BioSpaceScraper;

    beforeEach(() => {
      scraper = new BioSpaceScraper();
    });

    afterEach(() => {
      scraper.clearCache();
    });

    it('should initialize correctly', () => {
      expect(scraper).toBeDefined();
      const health = scraper.getHealth();
      expect(health.status).toBe('healthy');
    });
  });

  describe('EndpointsNewsScraper', () => {
    let scraper: EndpointsNewsScraper;

    beforeEach(() => {
      scraper = new EndpointsNewsScraper();
    });

    afterEach(() => {
      scraper.clearCache();
    });

    it('should initialize correctly', () => {
      expect(scraper).toBeDefined();
      const health = scraper.getHealth();
      expect(health.status).toBe('healthy');
    });
  });
});
