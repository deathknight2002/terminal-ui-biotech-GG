/**
 * Tests for CloudEvents implementation
 */

import { describe, it, expect } from 'vitest';
import { makeEvent, validateCloudEvent, parseCloudEvent, serializeCloudEvent } from '../events/ce';

describe('CloudEvents', () => {
  describe('makeEvent', () => {
    it('should create valid CloudEvent with required fields', () => {
      const event = makeEvent('test.event.v1', 'test/source', { foo: 'bar' });

      expect(event.specversion).toBe('1.0');
      expect(event.type).toBe('test.event.v1');
      expect(event.source).toBe('test/source');
      expect(event.data).toEqual({ foo: 'bar' });
      expect(event.id).toBeDefined();
      expect(event.time).toBeDefined();
      expect(event.datacontenttype).toBe('application/json');
    });

    it('should include optional dataschema', () => {
      const event = makeEvent('test.event.v1', 'test/source', { foo: 'bar' }, {
        dataschema: 'https://example.com/schema.json'
      });

      expect(event.dataschema).toBe('https://example.com/schema.json');
    });

    it('should include optional subject', () => {
      const event = makeEvent('test.event.v1', 'test/source', { foo: 'bar' }, {
        subject: 'test-subject'
      });

      expect(event.subject).toBe('test-subject');
    });

    it('should include extension attributes', () => {
      const event = makeEvent('test.event.v1', 'test/source', { foo: 'bar' }, {
        extensions: { customfield: 'value' }
      });

      expect(event.customfield).toBe('value');
    });
  });

  describe('validateCloudEvent', () => {
    it('should validate valid CloudEvent', () => {
      const event = makeEvent('test.event.v1', 'test/source', { foo: 'bar' });
      expect(validateCloudEvent(event)).toBe(true);
    });

    it('should reject invalid CloudEvent missing required fields', () => {
      expect(validateCloudEvent({})).toBe(false);
      expect(validateCloudEvent({ specversion: '1.0' })).toBe(false);
      expect(validateCloudEvent({ specversion: '1.0', id: '123' })).toBe(false);
    });

    it('should reject CloudEvent with wrong spec version', () => {
      const event = {
        specversion: '0.3',
        id: '123',
        source: 'test',
        type: 'test',
        time: new Date().toISOString(),
        data: {}
      };
      expect(validateCloudEvent(event)).toBe(false);
    });
  });

  describe('parseCloudEvent', () => {
    it('should parse valid CloudEvent JSON', () => {
      const original = makeEvent('test.event.v1', 'test/source', { foo: 'bar' });
      const json = JSON.stringify(original);
      const parsed = parseCloudEvent(json);

      expect(parsed.specversion).toBe('1.0');
      expect(parsed.type).toBe('test.event.v1');
      expect(parsed.data).toEqual({ foo: 'bar' });
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseCloudEvent('invalid json')).toThrow();
    });

    it('should throw on invalid CloudEvent structure', () => {
      expect(() => parseCloudEvent('{}')).toThrow('Invalid CloudEvent structure');
    });
  });

  describe('serializeCloudEvent', () => {
    it('should serialize CloudEvent to JSON', () => {
      const event = makeEvent('test.event.v1', 'test/source', { foo: 'bar' });
      const json = serializeCloudEvent(event);
      const parsed = JSON.parse(json);

      expect(parsed.specversion).toBe('1.0');
      expect(parsed.type).toBe('test.event.v1');
    });

    it('should throw on invalid CloudEvent', () => {
      expect(() => serializeCloudEvent({} as any)).toThrow('Invalid CloudEvent structure');
    });
  });
});
