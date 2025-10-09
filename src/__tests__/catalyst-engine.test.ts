/**
 * Tests for Catalyst Timeline Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CatalystEngine } from '../connectors/catalyst-engine';
import { CatalystContract } from '../contracts';

describe('CatalystEngine', () => {
  let engine: CatalystEngine;

  beforeEach(() => {
    engine = new CatalystEngine();
  });

  describe('constructor', () => {
    it('should create engine without connectors', () => {
      expect(engine).toBeDefined();
    });

    it('should create engine with connectors', () => {
      const engineWithConnectors = new CatalystEngine({
        ctgovConnector: {} as any,
        drugsAtFDAConnector: {} as any,
        faersConnector: {} as any,
      });
      expect(engineWithConnectors).toBeDefined();
    });
  });

  describe('addCatalyst', () => {
    it('should add catalyst to engine', () => {
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-001',
          type: 'approval',
          title: 'FDA Approval',
          eventDate: '2023-01-15',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      engine.addCatalyst(catalyst);
      expect(engine.count()).toBe(1);
    });

    it('should overwrite catalyst with same ID', () => {
      const catalyst1: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-001',
          type: 'approval',
          title: 'FDA Approval V1',
          eventDate: '2023-01-15',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      const catalyst2: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-001',
          type: 'approval',
          title: 'FDA Approval V2',
          eventDate: '2023-01-15',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      engine.addCatalyst(catalyst1);
      engine.addCatalyst(catalyst2);
      
      expect(engine.count()).toBe(1);
      expect(engine.getCatalyst('cat-001')?.data.title).toBe('FDA Approval V2');
    });
  });

  describe('addCatalysts', () => {
    it('should add multiple catalysts', () => {
      const catalysts: CatalystContract[] = [
        {
          version: '1.0',
          schema: 'catalyst',
          data: {
            id: 'cat-001',
            type: 'approval',
            title: 'FDA Approval 1',
            eventDate: '2023-01-15',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            detectedAt: Date.now(),
          },
        },
        {
          version: '1.0',
          schema: 'catalyst',
          data: {
            id: 'cat-002',
            type: 'trial_result',
            title: 'Phase III Results',
            eventDate: '2023-02-01',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            detectedAt: Date.now(),
          },
        },
      ];

      engine.addCatalysts(catalysts);
      expect(engine.count()).toBe(2);
    });
  });

  describe('getCatalyst', () => {
    it('should get catalyst by ID', () => {
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-001',
          type: 'approval',
          title: 'FDA Approval',
          eventDate: '2023-01-15',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      engine.addCatalyst(catalyst);
      const retrieved = engine.getCatalyst('cat-001');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.data.id).toBe('cat-001');
    });

    it('should return undefined for non-existent ID', () => {
      expect(engine.getCatalyst('non-existent')).toBeUndefined();
    });
  });

  describe('removeCatalyst', () => {
    it('should remove catalyst by ID', () => {
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-001',
          type: 'approval',
          title: 'FDA Approval',
          eventDate: '2023-01-15',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      engine.addCatalyst(catalyst);
      expect(engine.count()).toBe(1);
      
      const removed = engine.removeCatalyst('cat-001');
      expect(removed).toBe(true);
      expect(engine.count()).toBe(0);
    });

    it('should return false for non-existent ID', () => {
      expect(engine.removeCatalyst('non-existent')).toBe(false);
    });
  });

  describe('getCatalysts', () => {
    beforeEach(() => {
      const catalysts: CatalystContract[] = [
        {
          version: '1.0',
          schema: 'catalyst',
          data: {
            id: 'cat-001',
            type: 'approval',
            drugId: 'drug-001',
            companyId: 'company-001',
            title: 'FDA Approval',
            eventDate: '2023-01-15',
            impact: 'positive',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            detectedAt: Date.now(),
          },
        },
        {
          version: '1.0',
          schema: 'catalyst',
          data: {
            id: 'cat-002',
            type: 'trial_result',
            drugId: 'drug-002',
            companyId: 'company-001',
            title: 'Phase III Results',
            eventDate: '2023-02-01',
            impact: 'neutral',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            detectedAt: Date.now(),
          },
        },
        {
          version: '1.0',
          schema: 'catalyst',
          data: {
            id: 'cat-003',
            type: 'fda_action',
            drugId: 'drug-001',
            companyId: 'company-002',
            title: 'Warning Letter',
            eventDate: '2023-03-10',
            impact: 'negative',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            detectedAt: Date.now(),
          },
        },
      ];

      engine.addCatalysts(catalysts);
    });

    it('should get all catalysts without filter', () => {
      const catalysts = engine.getCatalysts();
      expect(catalysts).toHaveLength(3);
    });

    it('should filter by drugId', () => {
      const catalysts = engine.getCatalysts({ drugId: 'drug-001' });
      expect(catalysts).toHaveLength(2);
      expect(catalysts.every(c => c.data.drugId === 'drug-001')).toBe(true);
    });

    it('should filter by companyId', () => {
      const catalysts = engine.getCatalysts({ companyId: 'company-001' });
      expect(catalysts).toHaveLength(2);
      expect(catalysts.every(c => c.data.companyId === 'company-001')).toBe(true);
    });

    it('should filter by type', () => {
      const catalysts = engine.getCatalysts({ type: 'approval' });
      expect(catalysts).toHaveLength(1);
      expect(catalysts[0].data.type).toBe('approval');
    });

    it('should filter by impact', () => {
      const catalysts = engine.getCatalysts({ impact: 'positive' });
      expect(catalysts).toHaveLength(1);
      expect(catalysts[0].data.impact).toBe('positive');
    });

    it('should filter by date range', () => {
      const catalysts = engine.getCatalysts({
        startDate: '2023-01-01',
        endDate: '2023-02-15',
      });
      expect(catalysts).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const catalysts = engine.getCatalysts({
        drugId: 'drug-001',
        impact: 'positive',
      });
      expect(catalysts).toHaveLength(1);
      expect(catalysts[0].data.id).toBe('cat-001');
    });

    it('should sort catalysts by date (most recent first)', () => {
      const catalysts = engine.getCatalysts();
      expect(catalysts[0].data.eventDate).toBe('2023-03-10');
      expect(catalysts[2].data.eventDate).toBe('2023-01-15');
    });
  });

  describe('getTimeline', () => {
    beforeEach(() => {
      const catalysts: CatalystContract[] = [
        {
          version: '1.0',
          schema: 'catalyst',
          data: {
            id: 'cat-001',
            type: 'approval',
            drugId: 'drug-001',
            companyId: 'company-001',
            title: 'FDA Approval',
            eventDate: '2023-01-15',
            impact: 'positive',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            detectedAt: Date.now(),
          },
        },
        {
          version: '1.0',
          schema: 'catalyst',
          data: {
            id: 'cat-002',
            type: 'approval',
            drugId: 'drug-001',
            companyId: 'company-001',
            title: 'Phase III Results',
            eventDate: '2023-02-01',
            impact: 'positive',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            detectedAt: Date.now(),
          },
        },
      ];

      engine.addCatalysts(catalysts);
    });

    it('should get timeline with summary', () => {
      const timeline = engine.getTimeline('2023-01-01', '2023-12-31');
      
      expect(timeline.startDate).toBe('2023-01-01');
      expect(timeline.endDate).toBe('2023-12-31');
      expect(timeline.catalysts).toHaveLength(2);
      expect(timeline.summary.total).toBe(2);
    });

    it('should calculate summary by type', () => {
      const timeline = engine.getTimeline('2023-01-01', '2023-12-31');
      
      expect(timeline.summary.byType['approval']).toBe(2);
    });

    it('should calculate summary by impact', () => {
      const timeline = engine.getTimeline('2023-01-01', '2023-12-31');
      
      expect(timeline.summary.byImpact['positive']).toBe(2);
    });

    it('should calculate top drugs', () => {
      const timeline = engine.getTimeline('2023-01-01', '2023-12-31');
      
      expect(timeline.summary.topDrugs).toHaveLength(1);
      expect(timeline.summary.topDrugs[0].drugId).toBe('drug-001');
      expect(timeline.summary.topDrugs[0].count).toBe(2);
    });

    it('should calculate top companies', () => {
      const timeline = engine.getTimeline('2023-01-01', '2023-12-31');
      
      expect(timeline.summary.topCompanies).toHaveLength(1);
      expect(timeline.summary.topCompanies[0].companyId).toBe('company-001');
      expect(timeline.summary.topCompanies[0].count).toBe(2);
    });
  });

  describe('getUpcoming', () => {
    it('should get upcoming catalysts', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-future',
          type: 'approval',
          title: 'Future Approval',
          eventDate: futureDate.toISOString().split('T')[0],
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      engine.addCatalyst(catalyst);
      const upcoming = engine.getUpcoming(90);
      
      expect(upcoming.length).toBeGreaterThan(0);
    });
  });

  describe('getRecent', () => {
    it('should get recent catalysts', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 15);
      
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-recent',
          type: 'approval',
          title: 'Recent Approval',
          eventDate: pastDate.toISOString().split('T')[0],
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      engine.addCatalyst(catalyst);
      const recent = engine.getRecent(30);
      
      expect(recent.length).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear all catalysts', () => {
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-001',
          type: 'approval',
          title: 'FDA Approval',
          eventDate: '2023-01-15',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      engine.addCatalyst(catalyst);
      expect(engine.count()).toBe(1);
      
      engine.clear();
      expect(engine.count()).toBe(0);
    });
  });

  describe('count', () => {
    it('should return correct count', () => {
      expect(engine.count()).toBe(0);
      
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: 'cat-001',
          type: 'approval',
          title: 'FDA Approval',
          eventDate: '2023-01-15',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      engine.addCatalyst(catalyst);
      expect(engine.count()).toBe(1);
    });
  });
});
