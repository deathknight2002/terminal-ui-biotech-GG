/**
 * Tests for Dependency Injection Container
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer, ServiceTokens } from '../core/di-container';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('register', () => {
    it('should register a service with singleton lifetime', () => {
      container.register('test-service', () => ({ value: 'test' }), 'singleton');
      expect(container.has('test-service')).toBe(true);
    });

    it('should register a service with transient lifetime', () => {
      container.register('test-service', () => ({ value: 'test' }), 'transient');
      expect(container.has('test-service')).toBe(true);
    });

    it('should register service with symbol key', () => {
      const key = Symbol('test');
      container.register(key, () => ({ value: 'test' }));
      expect(container.has(key)).toBe(true);
    });
  });

  describe('registerSingleton', () => {
    it('should register singleton service', () => {
      container.registerSingleton('test-service', () => ({ value: 'test' }));
      expect(container.has('test-service')).toBe(true);
    });

    it('should return same instance on multiple resolves', () => {
      let instanceCount = 0;
      container.registerSingleton('test-service', () => {
        instanceCount++;
        return { id: instanceCount };
      });

      const instance1 = container.resolve('test-service');
      const instance2 = container.resolve('test-service');

      expect(instance1).toBe(instance2);
      expect(instanceCount).toBe(1);
    });
  });

  describe('registerTransient', () => {
    it('should register transient service', () => {
      container.registerTransient('test-service', () => ({ value: 'test' }));
      expect(container.has('test-service')).toBe(true);
    });

    it('should return new instance on each resolve', () => {
      let instanceCount = 0;
      container.registerTransient('test-service', () => {
        instanceCount++;
        return { id: instanceCount };
      });

      const instance1 = container.resolve<{ id: number }>('test-service');
      const instance2 = container.resolve<{ id: number }>('test-service');

      expect(instance1).not.toBe(instance2);
      expect(instance1.id).toBe(1);
      expect(instance2.id).toBe(2);
      expect(instanceCount).toBe(2);
    });
  });

  describe('registerInstance', () => {
    it('should register existing instance', () => {
      const instance = { value: 'test' };
      container.registerInstance('test-service', instance);

      const resolved = container.resolve('test-service');
      expect(resolved).toBe(instance);
    });

    it('should return same instance on multiple resolves', () => {
      const instance = { value: 'test' };
      container.registerInstance('test-service', instance);

      const resolved1 = container.resolve('test-service');
      const resolved2 = container.resolve('test-service');

      expect(resolved1).toBe(resolved2);
      expect(resolved1).toBe(instance);
    });
  });

  describe('resolve', () => {
    it('should resolve registered service', () => {
      container.register('test-service', () => ({ value: 'test' }));
      const resolved = container.resolve<{ value: string }>('test-service');

      expect(resolved).toBeDefined();
      expect(resolved.value).toBe('test');
    });

    it('should throw error for unregistered service', () => {
      expect(() => container.resolve('non-existent')).toThrow(
        'Service not registered: non-existent'
      );
    });

    it('should pass container to factory', () => {
      container.register('dependency', () => ({ value: 'dep' }));
      container.register('test-service', (c) => {
        const dep = c.resolve<{ value: string }>('dependency');
        return { dep: dep.value };
      });

      const resolved = container.resolve<{ dep: string }>('test-service');
      expect(resolved.dep).toBe('dep');
    });
  });

  describe('has', () => {
    it('should return true for registered service', () => {
      container.register('test-service', () => ({ value: 'test' }));
      expect(container.has('test-service')).toBe(true);
    });

    it('should return false for unregistered service', () => {
      expect(container.has('non-existent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should unregister service', () => {
      container.register('test-service', () => ({ value: 'test' }));
      expect(container.has('test-service')).toBe(true);

      container.unregister('test-service');
      expect(container.has('test-service')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all services', () => {
      container.register('service-1', () => ({ value: 'test1' }));
      container.register('service-2', () => ({ value: 'test2' }));

      expect(container.has('service-1')).toBe(true);
      expect(container.has('service-2')).toBe(true);

      container.clear();

      expect(container.has('service-1')).toBe(false);
      expect(container.has('service-2')).toBe(false);
    });
  });

  describe('getRegisteredKeys', () => {
    it('should return all registered keys', () => {
      container.register('service-1', () => ({ value: 'test1' }));
      container.register('service-2', () => ({ value: 'test2' }));

      const keys = container.getRegisteredKeys();
      expect(keys).toHaveLength(2);
      expect(keys).toContain('service-1');
      expect(keys).toContain('service-2');
    });

    it('should return empty array when no services registered', () => {
      const keys = container.getRegisteredKeys();
      expect(keys).toHaveLength(0);
    });
  });

  describe('createScope', () => {
    it('should create child container', () => {
      container.register('test-service', () => ({ value: 'test' }));
      const scope = container.createScope();

      expect(scope).toBeDefined();
      expect(scope).not.toBe(container);
    });

    it('should inherit singleton instances from parent', () => {
      let instanceCount = 0;
      container.registerSingleton('test-service', () => {
        instanceCount++;
        return { id: instanceCount };
      });

      // Resolve in parent to create instance
      const parentInstance = container.resolve('test-service');
      const scope = container.createScope();
      const scopeInstance = scope.resolve('test-service');

      expect(scopeInstance).toBe(parentInstance);
      expect(instanceCount).toBe(1);
    });

    it('should not share singleton instances created in scope', () => {
      container.registerSingleton('test-service', () => ({ value: 'test' }));
      
      const scope1 = container.createScope();
      const scope2 = container.createScope();

      // Create instances in scopes (before parent)
      const scope1Instance = scope1.resolve('test-service');
      const scope2Instance = scope2.resolve('test-service');

      // They should be different since parent instance wasn't created yet
      expect(scope1Instance).not.toBe(scope2Instance);
    });

    it('should inherit service registrations', () => {
      container.register('test-service', () => ({ value: 'test' }));
      const scope = container.createScope();

      expect(scope.has('test-service')).toBe(true);
      const resolved = scope.resolve<{ value: string }>('test-service');
      expect(resolved.value).toBe('test');
    });
  });

  describe('dependency resolution', () => {
    it('should resolve dependencies in correct order', () => {
      container.register('logger', () => ({
        log: (msg: string) => msg,
      }));

      container.register('database', (c) => ({
        logger: c.resolve<{ log: (msg: string) => string }>('logger'),
        query: (sql: string) => 'result',
      }));

      container.register('service', (c) => {
        const db = c.resolve<{ logger: any; query: (sql: string) => string }>('database');
        return {
          database: db,
          execute: () => db.query('SELECT 1'),
        };
      });

      const service = container.resolve<{
        database: any;
        execute: () => string;
      }>('service');

      expect(service).toBeDefined();
      expect(service.database).toBeDefined();
      expect(service.execute()).toBe('result');
    });
  });

  describe('ServiceTokens', () => {
    it('should define service tokens as symbols', () => {
      expect(typeof ServiceTokens.EventBus).toBe('symbol');
      expect(typeof ServiceTokens.Telemetry).toBe('symbol');
      expect(typeof ServiceTokens.Metrics).toBe('symbol');
      expect(typeof ServiceTokens.Health).toBe('symbol');
    });

    it('should work with service registration', () => {
      container.register(ServiceTokens.EventBus, () => ({ publish: () => {} }));
      expect(container.has(ServiceTokens.EventBus)).toBe(true);
    });

    it('should work with service resolution', () => {
      container.register(ServiceTokens.EventBus, () => ({ publish: () => {} }));
      const resolved = container.resolve(ServiceTokens.EventBus);
      expect(resolved).toBeDefined();
    });
  });
});
