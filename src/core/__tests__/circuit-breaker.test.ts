/**
 * Tests for Circuit Breaker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    // Clean up any existing breakers
    const breakers = CircuitBreaker.listBreakers();
    breakers.forEach((_, name) => {
      CircuitBreaker.remove(name);
    });
  });

  describe('creation and basic operations', () => {
    it('should create a circuit breaker', () => {
      CircuitBreaker.create('test-service');
      
      const state = CircuitBreaker.getState('test-service');
      
      expect(state).toBe('closed');
    });

    it('should throw error if breaker already exists', () => {
      CircuitBreaker.create('test-service');
      
      expect(() => {
        CircuitBreaker.create('test-service');
      }).toThrow();
    });

    it('should execute function through breaker', async () => {
      CircuitBreaker.create('test-service');
      
      const result = await CircuitBreaker.execute('test-service', async () => {
        return 'success';
      });
      
      expect(result).toBe('success');
    });

    it('should throw if breaker not found', async () => {
      await expect(
        CircuitBreaker.execute('nonexistent', async () => 'test')
      ).rejects.toThrow();
    });
  });

  describe('state transitions', () => {
    it('should open after failure threshold', async () => {
      CircuitBreaker.create('test-service', {
        failureThreshold: 3,
      });
      
      // Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await CircuitBreaker.execute('test-service', async () => {
            throw new Error('Test error');
          });
        } catch (e) {
          // Expected
        }
      }
      
      const state = CircuitBreaker.getState('test-service');
      expect(state).toBe('open');
    });

    it('should reject requests when open', async () => {
      CircuitBreaker.create('test-service', {
        failureThreshold: 1,
      });
      
      // Trigger failure to open circuit
      try {
        await CircuitBreaker.execute('test-service', async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }
      
      // Next request should be rejected
      await expect(
        CircuitBreaker.execute('test-service', async () => 'test')
      ).rejects.toThrow('Circuit breaker test-service is OPEN');
    });

    it('should transition to half-open after timeout', async () => {
      vi.useFakeTimers();
      
      CircuitBreaker.create('test-service', {
        failureThreshold: 1,
        timeout: 1000,
      });
      
      // Open the circuit
      try {
        await CircuitBreaker.execute('test-service', async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }
      
      expect(CircuitBreaker.getState('test-service')).toBe('open');
      
      // Advance time past timeout
      vi.advanceTimersByTime(1100);
      
      // Try to execute - should transition to half-open
      try {
        await CircuitBreaker.execute('test-service', async () => 'test');
      } catch (e) {
        // May succeed or fail
      }
      
      const state = CircuitBreaker.getState('test-service');
      expect(['half-open', 'closed']).toContain(state!);
      
      vi.useRealTimers();
    });

    it('should close after success threshold in half-open', async () => {
      CircuitBreaker.create('test-service', {
        failureThreshold: 1,
        successThreshold: 2,
        timeout: 0, // Immediate half-open
      });
      
      // Open the circuit
      try {
        await CircuitBreaker.execute('test-service', async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }
      
      // Wait for half-open
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Execute successful requests
      await CircuitBreaker.execute('test-service', async () => 'success');
      await CircuitBreaker.execute('test-service', async () => 'success');
      
      const state = CircuitBreaker.getState('test-service');
      expect(state).toBe('closed');
    });

    it('should reopen on failure in half-open', async () => {
      CircuitBreaker.create('test-service', {
        failureThreshold: 1,
        timeout: 0,
      });
      
      // Open the circuit
      try {
        await CircuitBreaker.execute('test-service', async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }
      
      // Wait for half-open
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Fail in half-open
      try {
        await CircuitBreaker.execute('test-service', async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }
      
      const state = CircuitBreaker.getState('test-service');
      expect(state).toBe('open');
    });
  });

  describe('statistics', () => {
    it('should track failures and successes', async () => {
      CircuitBreaker.create('test-service');
      
      await CircuitBreaker.execute('test-service', async () => 'success');
      
      try {
        await CircuitBreaker.execute('test-service', async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }
      
      const stats = CircuitBreaker.getStats('test-service');
      
      expect(stats?.successes).toBeGreaterThan(0);
      expect(stats?.failures).toBeGreaterThan(0);
      expect(stats?.totalRequests).toBeGreaterThan(0);
    });

    it('should track last failure time', async () => {
      CircuitBreaker.create('test-service');
      
      try {
        await CircuitBreaker.execute('test-service', async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }
      
      const stats = CircuitBreaker.getStats('test-service');
      
      expect(stats?.lastFailure).toBeDefined();
      expect(stats?.lastFailure).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker state', async () => {
      CircuitBreaker.create('test-service', {
        failureThreshold: 1,
      });
      
      // Open the circuit
      try {
        await CircuitBreaker.execute('test-service', async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }
      
      expect(CircuitBreaker.getState('test-service')).toBe('open');
      
      // Reset
      CircuitBreaker.reset('test-service');
      
      expect(CircuitBreaker.getState('test-service')).toBe('closed');
      
      const stats = CircuitBreaker.getStats('test-service');
      expect(stats?.failures).toBe(0);
    });
  });

  describe('list and remove', () => {
    it('should list all breakers', () => {
      CircuitBreaker.create('service-1');
      CircuitBreaker.create('service-2');
      
      const breakers = CircuitBreaker.listBreakers();
      
      expect(breakers.size).toBe(2);
      expect(breakers.has('service-1')).toBe(true);
      expect(breakers.has('service-2')).toBe(true);
    });

    it('should remove breaker', () => {
      CircuitBreaker.create('test-service');
      
      CircuitBreaker.remove('test-service');
      
      const state = CircuitBreaker.getState('test-service');
      expect(state).toBeUndefined();
    });
  });
});
