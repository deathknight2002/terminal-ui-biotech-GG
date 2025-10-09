/**
 * Tests for Event Bus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus, EventTypes } from '../event-bus';

describe('EventBus', () => {
  beforeEach(() => {
    EventBus.clearHistory();
    EventBus.resetStats();
  });

  describe('publish and subscribe', () => {
    it('should publish and receive events', async () => {
      const handler = vi.fn();
      
      EventBus.subscribe(EventTypes.DATA_LOADED, handler);
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.DATA_LOADED,
          payload: { test: 'data' },
        })
      );
    });

    it('should support multiple subscribers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      EventBus.subscribe(EventTypes.DATA_LOADED, handler1);
      EventBus.subscribe(EventTypes.DATA_LOADED, handler2);
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', async () => {
      const handler = vi.fn();
      
      const sub = EventBus.subscribe(EventTypes.DATA_LOADED, handler);
      sub.unsubscribe();
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support wildcard subscriptions', async () => {
      const handler = vi.fn();
      
      EventBus.subscribe('*', handler);
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      await EventBus.publish(EventTypes.DATA_UPDATED, { test: 'data' });
      
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('filtering', () => {
    it('should filter by event type', async () => {
      const handler = vi.fn();
      
      EventBus.subscribe(
        EventTypes.DATA_LOADED,
        handler,
        { type: EventTypes.DATA_LOADED }
      );
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      await EventBus.publish(EventTypes.DATA_UPDATED, { test: 'data' });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should filter by source', async () => {
      const handler = vi.fn();
      
      EventBus.subscribe(
        EventTypes.DATA_LOADED,
        handler,
        { source: 'test-source' }
      );
      
      await EventBus.publish(
        EventTypes.DATA_LOADED,
        { test: 'data' },
        { source: 'test-source' }
      );
      
      await EventBus.publish(
        EventTypes.DATA_LOADED,
        { test: 'data' },
        { source: 'other-source' }
      );
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should filter by priority', async () => {
      const handler = vi.fn();
      
      EventBus.subscribe(
        EventTypes.DATA_LOADED,
        handler,
        { priority: 'high' }
      );
      
      await EventBus.publish(
        EventTypes.DATA_LOADED,
        { test: 'data' },
        { priority: 'high' }
      );
      
      await EventBus.publish(
        EventTypes.DATA_LOADED,
        { test: 'data' },
        { priority: 'normal' }
      );
      
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('history and stats', () => {
    it('should track event history', async () => {
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      await EventBus.publish(EventTypes.DATA_UPDATED, { test: 'data' });
      
      const history = EventBus.getHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe(EventTypes.DATA_LOADED);
      expect(history[1].type).toBe(EventTypes.DATA_UPDATED);
    });

    it('should filter history', async () => {
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      await EventBus.publish(EventTypes.DATA_UPDATED, { test: 'data' });
      
      const filtered = EventBus.getHistory({
        type: EventTypes.DATA_LOADED
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe(EventTypes.DATA_LOADED);
    });

    it('should track statistics', async () => {
      const handler = vi.fn();
      EventBus.subscribe(EventTypes.DATA_LOADED, handler);
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      const stats = EventBus.getStats();
      
      expect(stats.totalEvents).toBe(1);
      expect(stats.subscriberCount).toBeGreaterThan(0);
      expect(stats.eventsByType[EventTypes.DATA_LOADED]).toBe(1);
    });

    it('should clear history', async () => {
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      EventBus.clearHistory();
      
      const history = EventBus.getHistory();
      expect(history).toHaveLength(0);
    });

    it('should reset stats', async () => {
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      EventBus.resetStats();
      
      const stats = EventBus.getStats();
      expect(stats.totalEvents).toBe(0);
    });
  });

  describe('async handlers', () => {
    it('should handle async handlers', async () => {
      const handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      EventBus.subscribe(EventTypes.DATA_LOADED, handler);
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in handlers gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const successHandler = vi.fn();
      
      EventBus.subscribe(EventTypes.DATA_LOADED, errorHandler);
      EventBus.subscribe(EventTypes.DATA_LOADED, successHandler);
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(successHandler).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  describe('performance', () => {
    it('should track average processing time', async () => {
      const handler = vi.fn();
      EventBus.subscribe(EventTypes.DATA_LOADED, handler);
      
      await EventBus.publish(EventTypes.DATA_LOADED, { test: 'data' });
      
      const stats = EventBus.getStats();
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
    });
  });
});
