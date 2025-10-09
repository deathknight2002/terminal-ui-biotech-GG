/**
 * Tests for CloudEventBus
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CloudEventBus, InMemoryDurableBackend, createCloudEventBus } from '../core/cloudevent-bus';
import { validateCloudEvent } from '../events/ce';

describe('CloudEventBus', () => {
  let cloudEventBus: CloudEventBus;
  let durableBackend: InMemoryDurableBackend;

  beforeEach(() => {
    durableBackend = new InMemoryDurableBackend();
    cloudEventBus = new CloudEventBus({
      source: 'test-source',
      validateContracts: false, // Disable for basic tests
      durableBackend,
    });
  });

  describe('publishCloudEvent', () => {
    it('should publish CloudEvent with required fields', async () => {
      const data = { test: 'data' };
      const event = await cloudEventBus.publishCloudEvent('test.event.v1', data);

      expect(event.specversion).toBe('1.0');
      expect(event.type).toBe('test.event.v1');
      expect(event.source).toBe('test-source');
      expect(event.data).toEqual(data);
      expect(validateCloudEvent(event)).toBe(true);
    });

    it('should publish CloudEvent with custom source', async () => {
      const data = { test: 'data' };
      const event = await cloudEventBus.publishCloudEvent('test.event.v1', data, {
        source: 'custom-source',
      });

      expect(event.source).toBe('custom-source');
    });

    it('should publish CloudEvent with subject', async () => {
      const data = { test: 'data' };
      const event = await cloudEventBus.publishCloudEvent('test.event.v1', data, {
        subject: 'test-subject',
      });

      expect(event.subject).toBe('test-subject');
    });

    it('should publish CloudEvent with dataschema', async () => {
      const data = { test: 'data' };
      const event = await cloudEventBus.publishCloudEvent('test.event.v1', data, {
        dataschema: 'https://example.com/schema.json',
      });

      expect(event.dataschema).toBe('https://example.com/schema.json');
    });

    it('should publish CloudEvent with extensions', async () => {
      const data = { test: 'data' };
      const event = await cloudEventBus.publishCloudEvent('test.event.v1', data, {
        extensions: { customfield: 'value' },
      });

      expect(event.customfield).toBe('value');
    });

    it('should store event in durable backend', async () => {
      const data = { test: 'data' };
      const event = await cloudEventBus.publishCloudEvent('test.event.v1', data);

      expect(durableBackend.size()).toBe(1);
      const retrieved = await durableBackend.retrieve(event.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(event.id);
    });
  });

  describe('subscribeCloudEvent', () => {
    it('should subscribe to CloudEvents', async () => {
      let receivedEvent: any = null;

      cloudEventBus.subscribeCloudEvent('test.event.v1', async (event) => {
        receivedEvent = event;
      });

      const data = { test: 'data' };
      await cloudEventBus.publishCloudEvent('test.event.v1', data);

      // Give time for async event handling
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent.type).toBe('test.event.v1');
      expect(receivedEvent.data).toEqual(data);
    });

    it('should unsubscribe from CloudEvents', async () => {
      let callCount = 0;

      const subscription = cloudEventBus.subscribeCloudEvent('test.event.v1', async () => {
        callCount++;
      });

      await cloudEventBus.publishCloudEvent('test.event.v1', { test: 'data' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(callCount).toBe(1);

      subscription.unsubscribe();

      await cloudEventBus.publishCloudEvent('test.event.v1', { test: 'data' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('queryEvents', () => {
    beforeEach(async () => {
      await cloudEventBus.publishCloudEvent('test.event.v1', { id: 1 });
      await cloudEventBus.publishCloudEvent('test.event.v2', { id: 2 });
      await cloudEventBus.publishCloudEvent('other.event.v1', { id: 3 });
    });

    it('should query events by type', async () => {
      const events = await cloudEventBus.queryEvents({ type: 'test.event.v1' });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('test.event.v1');
    });

    it('should query events by source', async () => {
      const events = await cloudEventBus.queryEvents({ source: 'test-source' });
      expect(events).toHaveLength(3);
    });

    it('should query all events without filter', async () => {
      const events = await cloudEventBus.queryEvents({});
      expect(events).toHaveLength(3);
    });
  });

  describe('retrieveEvent', () => {
    it('should retrieve event by ID', async () => {
      const published = await cloudEventBus.publishCloudEvent('test.event.v1', { test: 'data' });
      const retrieved = await cloudEventBus.retrieveEvent(published.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(published.id);
      expect(retrieved?.type).toBe('test.event.v1');
    });

    it('should return undefined for non-existent ID', async () => {
      const retrieved = await cloudEventBus.retrieveEvent('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('createCloudEventBus', () => {
    it('should create CloudEventBus with default config', () => {
      const bus = createCloudEventBus();
      expect(bus).toBeDefined();
    });

    it('should create CloudEventBus with custom config', () => {
      const bus = createCloudEventBus({
        source: 'custom-source',
        validateContracts: false,
      });
      expect(bus).toBeDefined();
    });
  });
});

describe('InMemoryDurableBackend', () => {
  let backend: InMemoryDurableBackend;

  beforeEach(() => {
    backend = new InMemoryDurableBackend();
  });

  describe('store', () => {
    it('should store event', async () => {
      const event = {
        specversion: '1.0',
        id: 'test-id',
        source: 'test',
        type: 'test.event',
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data: { test: 'data' },
      };

      await backend.store(event);
      expect(backend.size()).toBe(1);
    });
  });

  describe('retrieve', () => {
    it('should retrieve stored event', async () => {
      const event = {
        specversion: '1.0',
        id: 'test-id',
        source: 'test',
        type: 'test.event',
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data: { test: 'data' },
      };

      await backend.store(event);
      const retrieved = await backend.retrieve('test-id');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-id');
    });

    it('should return undefined for non-existent event', async () => {
      const retrieved = await backend.retrieve('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await backend.store({
        specversion: '1.0',
        id: 'event-1',
        source: 'source-a',
        type: 'type-a',
        time: '2023-01-15T00:00:00Z',
        datacontenttype: 'application/json',
        data: {},
      });

      await backend.store({
        specversion: '1.0',
        id: 'event-2',
        source: 'source-a',
        type: 'type-b',
        time: '2023-02-15T00:00:00Z',
        datacontenttype: 'application/json',
        data: {},
      });

      await backend.store({
        specversion: '1.0',
        id: 'event-3',
        source: 'source-b',
        type: 'type-a',
        time: '2023-03-15T00:00:00Z',
        datacontenttype: 'application/json',
        data: {},
      });
    });

    it('should query by type', async () => {
      const events = await backend.query({ type: 'type-a' });
      expect(events).toHaveLength(2);
    });

    it('should query by source', async () => {
      const events = await backend.query({ source: 'source-a' });
      expect(events).toHaveLength(2);
    });

    it('should query by time range', async () => {
      const events = await backend.query({
        startTime: '2023-02-01T00:00:00Z',
        endTime: '2023-03-31T00:00:00Z',
      });
      expect(events).toHaveLength(2);
    });

    it('should combine multiple criteria', async () => {
      const events = await backend.query({
        type: 'type-a',
        source: 'source-a',
      });
      expect(events).toHaveLength(1);
    });

    it('should return events sorted by time', async () => {
      const events = await backend.query({});
      expect(events).toHaveLength(3);
      expect(events[0].id).toBe('event-1');
      expect(events[2].id).toBe('event-3');
    });
  });

  describe('clear', () => {
    it('should clear all events', async () => {
      await backend.store({
        specversion: '1.0',
        id: 'event-1',
        source: 'test',
        type: 'test',
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data: {},
      });

      expect(backend.size()).toBe(1);
      backend.clear();
      expect(backend.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct size', async () => {
      expect(backend.size()).toBe(0);

      await backend.store({
        specversion: '1.0',
        id: 'event-1',
        source: 'test',
        type: 'test',
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data: {},
      });

      expect(backend.size()).toBe(1);
    });
  });
});
