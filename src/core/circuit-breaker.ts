/**
 * Circuit Breaker - Fault tolerance and resilience
 * 
 * Prevents cascade failures by monitoring service health and temporarily
 * blocking requests to failing services.
 */

import { EventBus, EventTypes } from './event-bus';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailure?: number;
  lastStateChange: number;
}

class CircuitBreakerImpl {
  private breakers: Map<string, CircuitBreakerStats> = new Map();
  private configs: Map<string, Required<CircuitBreakerConfig>> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private defaultConfig: Required<CircuitBreakerConfig> = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    resetTimeout: 30000, // 30 seconds
  };

  /**
   * Create a circuit breaker for a service
   */
  create(name: string, config: CircuitBreakerConfig = {}): void {
    if (this.breakers.has(name)) {
      throw new Error(`Circuit breaker ${name} already exists`);
    }

    this.configs.set(name, {
      ...this.defaultConfig,
      ...config,
    });

    this.breakers.set(name, {
      state: 'closed',
      failures: 0,
      successes: 0,
      totalRequests: 0,
      lastStateChange: Date.now(),
    });

    console.log(`🔌 Created circuit breaker: ${name}`);
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const stats = this.breakers.get(name);
    const config = this.configs.get(name);

    if (!stats || !config) {
      throw new Error(`Circuit breaker ${name} not found`);
    }

    // Check if circuit is open
    if (stats.state === 'open') {
      const timeSinceOpen = Date.now() - stats.lastStateChange;
      
      if (timeSinceOpen < config.timeout) {
        throw new Error(`Circuit breaker ${name} is OPEN`);
      }

      // Try to transition to half-open
      this.transitionTo(name, 'half-open');
    }

    stats.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess(name);
      return result;
    } catch (error) {
      this.onFailure(name);
      throw error;
    }
  }

  /**
   * Get circuit breaker state
   */
  getState(name: string): CircuitState | undefined {
    return this.breakers.get(name)?.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(name: string): CircuitBreakerStats | undefined {
    const stats = this.breakers.get(name);
    return stats ? { ...stats } : undefined;
  }

  /**
   * Get all circuit breakers
   */
  listBreakers(): Map<string, CircuitBreakerStats> {
    const result = new Map<string, CircuitBreakerStats>();
    this.breakers.forEach((stats, name) => {
      result.set(name, { ...stats });
    });
    return result;
  }

  /**
   * Manually reset a circuit breaker
   */
  reset(name: string): void {
    const stats = this.breakers.get(name);
    if (!stats) return;

    stats.failures = 0;
    stats.successes = 0;
    this.transitionTo(name, 'closed');
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(name);
    }

    this.breakers.delete(name);
    this.configs.delete(name);
  }

  private onSuccess(name: string): void {
    const stats = this.breakers.get(name);
    const config = this.configs.get(name);

    if (!stats || !config) return;

    stats.failures = 0;
    stats.successes++;

    // If in half-open state and enough successes, close the circuit
    if (stats.state === 'half-open' && stats.successes >= config.successThreshold) {
      this.transitionTo(name, 'closed');
      stats.successes = 0;
    }
  }

  private onFailure(name: string): void {
    const stats = this.breakers.get(name);
    const config = this.configs.get(name);

    if (!stats || !config) return;

    stats.failures++;
    stats.successes = 0;
    stats.lastFailure = Date.now();

    // Open circuit if threshold exceeded
    if (stats.state === 'closed' && stats.failures >= config.failureThreshold) {
      this.transitionTo(name, 'open');
    } else if (stats.state === 'half-open') {
      // One failure in half-open immediately reopens
      this.transitionTo(name, 'open');
    }
  }

  private transitionTo(name: string, newState: CircuitState): void {
    const stats = this.breakers.get(name);
    const config = this.configs.get(name);

    if (!stats || !config) return;

    const oldState = stats.state;
    stats.state = newState;
    stats.lastStateChange = Date.now();

    console.log(`⚡ Circuit breaker ${name}: ${oldState} → ${newState}`);

    // Emit event
    EventBus.publish(EventTypes.SYSTEM_DEGRADED, {
      circuitBreaker: name,
      oldState,
      newState,
      failures: stats.failures,
    }, { source: 'circuit-breaker', priority: newState === 'open' ? 'high' : 'normal' });

    // Set timer to attempt reset if opened
    if (newState === 'open') {
      const timer = this.timers.get(name);
      if (timer) {
        clearTimeout(timer);
      }

      const resetTimer = setTimeout(() => {
        this.transitionTo(name, 'half-open');
      }, config.resetTimeout);

      this.timers.set(name, resetTimer);
    }
  }
}

// Singleton instance
export const CircuitBreaker = new CircuitBreakerImpl();
