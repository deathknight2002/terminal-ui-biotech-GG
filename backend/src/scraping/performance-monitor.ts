/**
 * Performance Monitoring and Metrics Collection
 * Real-time endpoint status tracking and performance metrics
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface EndpointHealth {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  successRate: number;
  errorRate: number;
  lastCheck: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics: {
    throughput: number;
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
    cacheHitRate: number;
  };
  endpoints: EndpointHealth[];
  resources: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
  };
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private endpointMetrics: Map<string, EndpointHealth> = new Map();
  private latencies: number[] = [];
  private readonly maxMetricsPerKey: number = 1000;
  private readonly metricsWindow: number = 3600000; // 1 hour
  
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  
  private startTime: number = Date.now();
  private lastSnapshot?: PerformanceSnapshot;
  private snapshotInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startSnapshotInterval();
    logger.info('📊 Performance Monitor initialized');
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, unit: string = '', tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    const existing = this.metrics.get(name) || [];
    existing.push(metric);

    // Keep only recent metrics
    const cutoff = Date.now() - this.metricsWindow;
    const filtered = existing.filter(m => m.timestamp > cutoff).slice(-this.maxMetricsPerKey);
    
    this.metrics.set(name, filtered);

    this.emit('metric', metric);
  }

  /**
   * Record request timing
   */
  recordRequestTiming(endpoint: string, duration: number, success: boolean): void {
    this.totalRequests++;
    
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    this.latencies.push(duration);
    
    // Keep only recent latencies (last 1000)
    if (this.latencies.length > 1000) {
      this.latencies = this.latencies.slice(-1000);
    }

    // Update endpoint metrics
    const endpointMetric = this.endpointMetrics.get(endpoint) || {
      endpoint,
      status: 'healthy',
      latency: 0,
      successRate: 0,
      errorRate: 0,
      lastCheck: Date.now(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
    };

    endpointMetric.totalRequests++;
    endpointMetric.lastCheck = Date.now();
    
    if (success) {
      endpointMetric.successfulRequests++;
    } else {
      endpointMetric.failedRequests++;
    }

    endpointMetric.latency = duration;
    endpointMetric.successRate = (endpointMetric.successfulRequests / endpointMetric.totalRequests) * 100;
    endpointMetric.errorRate = (endpointMetric.failedRequests / endpointMetric.totalRequests) * 100;

    // Determine health status
    if (endpointMetric.errorRate > 50) {
      endpointMetric.status = 'down';
    } else if (endpointMetric.errorRate > 10 || duration > 5000) {
      endpointMetric.status = 'degraded';
    } else {
      endpointMetric.status = 'healthy';
    }

    this.endpointMetrics.set(endpoint, endpointMetric);

    this.recordMetric(`endpoint.${endpoint}.latency`, duration, 'ms');
    this.recordMetric(`endpoint.${endpoint}.status`, success ? 1 : 0);
  }

  /**
   * Record cache hit/miss
   */
  recordCacheAccess(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    this.recordMetric('cache.access', 1, '', { hit: hit.toString() });
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string, limit?: number): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get all endpoint health statuses
   */
  getEndpointHealth(): EndpointHealth[] {
    return Array.from(this.endpointMetrics.values());
  }

  /**
   * Get performance snapshot
   */
  getSnapshot(): PerformanceSnapshot {
    const now = Date.now();
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);

    const snapshot: PerformanceSnapshot = {
      timestamp: now,
      metrics: {
        throughput: this.calculateThroughput(),
        avgLatency: this.calculateAverage(this.latencies),
        p50Latency: this.calculatePercentile(sortedLatencies, 50),
        p95Latency: this.calculatePercentile(sortedLatencies, 95),
        p99Latency: this.calculatePercentile(sortedLatencies, 99),
        errorRate: this.totalRequests > 0 
          ? (this.failedRequests / this.totalRequests) * 100 
          : 0,
        cacheHitRate: (this.cacheHits + this.cacheMisses) > 0
          ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
          : 0,
      },
      endpoints: this.getEndpointHealth(),
      resources: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: (now - this.startTime) / 1000,
      },
    };

    this.lastSnapshot = snapshot;
    return snapshot;
  }

  /**
   * Calculate throughput (requests per second)
   */
  private calculateThroughput(): number {
    const uptime = (Date.now() - this.startTime) / 1000;
    return uptime > 0 ? this.totalRequests / uptime : 0;
  }

  /**
   * Calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)] || 0;
  }

  /**
   * Start periodic snapshot generation
   */
  private startSnapshotInterval(): void {
    this.snapshotInterval = setInterval(() => {
      const snapshot = this.getSnapshot();
      this.emit('snapshot', snapshot);
      
      // Log summary
      logger.info('📊 Performance Snapshot:', {
        throughput: snapshot.metrics.throughput.toFixed(2) + ' req/s',
        avgLatency: snapshot.metrics.avgLatency.toFixed(2) + 'ms',
        errorRate: snapshot.metrics.errorRate.toFixed(2) + '%',
        cacheHitRate: snapshot.metrics.cacheHitRate.toFixed(2) + '%',
      });
    }, 60000); // Every minute
  }

  /**
   * Get statistics summary
   */
  getStats() {
    const snapshot = this.getSnapshot();
    
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: this.totalRequests > 0 
        ? (this.successfulRequests / this.totalRequests) * 100 
        : 0,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: snapshot.metrics.cacheHitRate,
      metrics: snapshot.metrics,
      uptime: snapshot.resources.uptime,
      memoryUsageMB: snapshot.resources.memoryUsage.heapUsed / 1024 / 1024,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.endpointMetrics.clear();
    this.latencies = [];
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.startTime = Date.now();
    
    logger.info('📊 Performance metrics reset');
  }

  /**
   * Export metrics for external monitoring systems (Prometheus format)
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = [];

    // Total requests
    lines.push('# HELP scraping_requests_total Total number of scraping requests');
    lines.push('# TYPE scraping_requests_total counter');
    lines.push(`scraping_requests_total ${this.totalRequests}`);

    // Successful requests
    lines.push('# HELP scraping_requests_success_total Total number of successful requests');
    lines.push('# TYPE scraping_requests_success_total counter');
    lines.push(`scraping_requests_success_total ${this.successfulRequests}`);

    // Failed requests
    lines.push('# HELP scraping_requests_failed_total Total number of failed requests');
    lines.push('# TYPE scraping_requests_failed_total counter');
    lines.push(`scraping_requests_failed_total ${this.failedRequests}`);

    // Cache metrics
    lines.push('# HELP scraping_cache_hits_total Total number of cache hits');
    lines.push('# TYPE scraping_cache_hits_total counter');
    lines.push(`scraping_cache_hits_total ${this.cacheHits}`);

    lines.push('# HELP scraping_cache_misses_total Total number of cache misses');
    lines.push('# TYPE scraping_cache_misses_total counter');
    lines.push(`scraping_cache_misses_total ${this.cacheMisses}`);

    // Latency metrics
    const snapshot = this.lastSnapshot || this.getSnapshot();
    
    lines.push('# HELP scraping_latency_avg_ms Average request latency in milliseconds');
    lines.push('# TYPE scraping_latency_avg_ms gauge');
    lines.push(`scraping_latency_avg_ms ${snapshot.metrics.avgLatency.toFixed(2)}`);

    lines.push('# HELP scraping_latency_p95_ms 95th percentile request latency in milliseconds');
    lines.push('# TYPE scraping_latency_p95_ms gauge');
    lines.push(`scraping_latency_p95_ms ${snapshot.metrics.p95Latency.toFixed(2)}`);

    // Memory usage
    lines.push('# HELP scraping_memory_heap_used_bytes Heap memory used in bytes');
    lines.push('# TYPE scraping_memory_heap_used_bytes gauge');
    lines.push(`scraping_memory_heap_used_bytes ${snapshot.resources.memoryUsage.heapUsed}`);

    // Uptime
    lines.push('# HELP scraping_uptime_seconds Uptime in seconds');
    lines.push('# TYPE scraping_uptime_seconds counter');
    lines.push(`scraping_uptime_seconds ${snapshot.resources.uptime.toFixed(0)}`);

    return lines.join('\n');
  }

  /**
   * Shutdown the monitor
   */
  shutdown(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    
    logger.info('📊 Performance Monitor shutdown');
  }
}

/**
 * Global performance monitor instance
 */
let globalMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}

/**
 * Shutdown global monitor
 */
export function shutdownPerformanceMonitor(): void {
  if (globalMonitor) {
    globalMonitor.shutdown();
    globalMonitor = null;
  }
}
