/**
 * Metrics - Prometheus-compatible metrics collection
 * 
 * Provides counters, histograms, and gauges for monitoring
 * system performance and behavior
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

class MetricsImpl {
  public readonly registry: Registry;
  
  // Core metrics
  public readonly eventLatency: Histogram;
  public readonly cacheHits: Counter;
  public readonly cacheHitRatio: Gauge;
  public readonly circuitBreakerState: Gauge;
  public readonly requestDuration: Histogram;
  public readonly requestTotal: Counter;
  public readonly errorTotal: Counter;

  constructor() {
    this.registry = new Registry();

    // Collect default Node.js metrics
    collectDefaultMetrics({ register: this.registry });

    // Event processing metrics
    this.eventLatency = new Histogram({
      name: 'event_latency_ms',
      help: 'Event processing latency in milliseconds',
      buckets: [1, 5, 10, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [this.registry],
    });

    // Cache metrics
    this.cacheHits = new Counter({
      name: 'cache_hit_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type', 'key_pattern'],
      registers: [this.registry],
    });

    this.cacheHitRatio = new Gauge({
      name: 'cache_hit_ratio',
      help: 'Cache hit ratio (0-1)',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    // Circuit breaker metrics
    this.circuitBreakerState = new Gauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
      labelNames: ['breaker_name'],
      registers: [this.registry],
    });

    // HTTP request metrics
    this.requestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.requestTotal = new Counter({
      name: 'http_request_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.errorTotal = new Counter({
      name: 'error_total',
      help: 'Total number of errors',
      labelNames: ['type', 'module'],
      registers: [this.registry],
    });
  }

  /**
   * Get metrics in Prometheus text format
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Get metrics content type
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.registry.resetMetrics();
  }

  /**
   * Record event latency
   */
  recordEventLatency(latencyMs: number): void {
    this.eventLatency.observe(latencyMs);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: string, keyPattern: string = 'default'): void {
    this.cacheHits.inc({ cache_type: cacheType, key_pattern: keyPattern });
  }

  /**
   * Update cache hit ratio
   */
  updateCacheHitRatio(cacheType: string, ratio: number): void {
    this.cacheHitRatio.set({ cache_type: cacheType }, ratio);
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreakerState(breakerName: string, state: 'closed' | 'half-open' | 'open'): void {
    const stateValue = state === 'closed' ? 0 : state === 'half-open' ? 1 : 2;
    this.circuitBreakerState.set({ breaker_name: breakerName }, stateValue);
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(method: string, route: string, status: number, durationMs: number): void {
    this.requestDuration.observe({ method, route, status: status.toString() }, durationMs);
    this.requestTotal.inc({ method, route, status: status.toString() });
  }

  /**
   * Record error
   */
  recordError(type: string, module: string): void {
    this.errorTotal.inc({ type, module });
  }
}

// Singleton instance
export const Metrics = new MetricsImpl();
