/**
 * Diagnostic System - Self-observing architecture
 * 
 * Provides deep introspection into system state, performance metrics,
 * and inter-module communication patterns.
 */

import { EventBus, EventBusStats } from './event-bus';
import { ServiceRegistry } from './service-registry';
import { AdaptiveCache } from './adaptive-cache';
import { CircuitBreaker } from './circuit-breaker';

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: number;
  components: ComponentHealth[];
  metrics: SystemMetrics;
  recommendations: string[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  metrics?: Record<string, number>;
}

export interface SystemMetrics {
  eventBus: EventBusStats;
  cache: {
    hitRate: number;
    size: number;
    evictions: number;
  };
  circuitBreakers: {
    open: number;
    halfOpen: number;
    closed: number;
  };
  services: {
    registered: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  performance: {
    averageEventTime: number;
    averageCacheAccessTime: number;
    memoryUsage?: number;
  };
}

export interface DiagnosticReport {
  timestamp: number;
  duration: number;
  health: SystemHealth;
  eventHistory: any[];
  serviceGraph: string;
  cacheAnalysis: {
    topKeys: string[];
    predictions: string[];
    stats: any;
  };
  circuitBreakerStatus: Map<string, any>;
  recommendations: string[];
}

class DiagnosticSystemImpl {
  private healthCheckInterval: number = 30000; // 30 seconds
  private healthCheckTimer?: NodeJS.Timeout;
  private lastHealth?: SystemHealth;
  private healthHistory: SystemHealth[] = [];
  private maxHealthHistory = 100;

  /**
   * Start continuous health monitoring
   */
  startMonitoring(): void {
    if (this.healthCheckTimer) {
      return;
    }

    this.performHealthCheck();

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);

    console.log('🔍 Diagnostic monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
      console.log('🔍 Diagnostic monitoring stopped');
    }
  }

  /**
   * Get current system health
   */
  async getHealth(): Promise<SystemHealth> {
    const components: ComponentHealth[] = [];
    const serviceHealth = await ServiceRegistry.getHealth();

    // Check service health
    let healthyServices = 0;
    let degradedServices = 0;
    let unhealthyServices = 0;

    serviceHealth.forEach((health, name) => {
      components.push({
        name,
        status: health.status,
        message: health.message,
        metrics: health.metrics,
      });

      if (health.status === 'healthy') healthyServices++;
      else if (health.status === 'degraded') degradedServices++;
      else unhealthyServices++;
    });

    // Check circuit breakers
    const breakers = CircuitBreaker.listBreakers();
    let openBreakers = 0;
    let halfOpenBreakers = 0;
    let closedBreakers = 0;

    breakers.forEach((stats, name) => {
      if (stats.state === 'open') {
        openBreakers++;
        components.push({
          name: `circuit:${name}`,
          status: 'unhealthy',
          message: `Circuit breaker is OPEN`,
        });
      } else if (stats.state === 'half-open') {
        halfOpenBreakers++;
      } else {
        closedBreakers++;
      }
    });

    // Get cache stats
    const cacheStats = AdaptiveCache.getStats();
    if (cacheStats.hitRate < 0.5) {
      components.push({
        name: 'cache',
        status: 'degraded',
        message: `Cache hit rate is low: ${(cacheStats.hitRate * 100).toFixed(1)}%`,
        metrics: { hitRate: cacheStats.hitRate },
      });
    }

    // Get event bus stats
    const busStats = EventBus.getStats();
    if (busStats.averageProcessingTime > 100) {
      components.push({
        name: 'event-bus',
        status: 'degraded',
        message: `Event processing is slow: ${busStats.averageProcessingTime.toFixed(1)}ms`,
        metrics: { averageProcessingTime: busStats.averageProcessingTime },
      });
    }

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (unhealthyServices > 0 || openBreakers > 0) {
      overall = 'critical';
    } else if (degradedServices > 0 || halfOpenBreakers > 0 || cacheStats.hitRate < 0.5) {
      overall = 'degraded';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      cacheStats,
      busStats,
      openBreakers,
      degradedServices,
      unhealthyServices,
    });

    const health: SystemHealth = {
      overall,
      timestamp: Date.now(),
      components,
      metrics: {
        eventBus: busStats,
        cache: {
          hitRate: cacheStats.hitRate,
          size: cacheStats.currentSize,
          evictions: cacheStats.evictions,
        },
        circuitBreakers: {
          open: openBreakers,
          halfOpen: halfOpenBreakers,
          closed: closedBreakers,
        },
        services: {
          registered: serviceHealth.size,
          healthy: healthyServices,
          degraded: degradedServices,
          unhealthy: unhealthyServices,
        },
        performance: {
          averageEventTime: busStats.averageProcessingTime,
          averageCacheAccessTime: cacheStats.averageAccessTime,
          memoryUsage: this.getMemoryUsage(),
        },
      },
      recommendations,
    };

    this.lastHealth = health;
    this.healthHistory.push(health);
    if (this.healthHistory.length > this.maxHealthHistory) {
      this.healthHistory.shift();
    }

    return health;
  }

  /**
   * Generate comprehensive diagnostic report
   */
  async generateReport(): Promise<DiagnosticReport> {
    const startTime = Date.now();

    const health = await this.getHealth();
    const eventHistory = EventBus.getHistory(undefined, 50);
    const serviceGraph = ServiceRegistry.visualizeDependencies();
    const cacheEntries = AdaptiveCache.entries();
    const predictions = AdaptiveCache.getPredictions(10);

    const topKeys = cacheEntries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(e => e.key);

    const circuitBreakerStatus = CircuitBreaker.listBreakers();

    const duration = Date.now() - startTime;

    const report: DiagnosticReport = {
      timestamp: Date.now(),
      duration,
      health,
      eventHistory,
      serviceGraph,
      cacheAnalysis: {
        topKeys,
        predictions,
        stats: AdaptiveCache.getStats(),
      },
      circuitBreakerStatus,
      recommendations: health.recommendations,
    };

    return report;
  }

  /**
   * Get health history
   */
  getHealthHistory(limit = 20): SystemHealth[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get health trends
   */
  getHealthTrends(): {
    overallTrend: 'improving' | 'stable' | 'declining';
    cacheHitRateTrend: number;
    eventProcessingTrend: number;
  } {
    if (this.healthHistory.length < 5) {
      return {
        overallTrend: 'stable',
        cacheHitRateTrend: 0,
        eventProcessingTrend: 0,
      };
    }

    const recent = this.healthHistory.slice(-5);
    const cacheHitRates = recent.map(h => h.metrics.cache.hitRate);
    const eventProcessingTimes = recent.map(h => h.metrics.performance.averageEventTime);

    const cacheHitRateTrend = this.calculateTrend(cacheHitRates);
    const eventProcessingTrend = this.calculateTrend(eventProcessingTimes);

    // Determine overall trend
    let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
    const healthScores = recent.map(h => {
      if (h.overall === 'healthy') return 2;
      if (h.overall === 'degraded') return 1;
      return 0;
    });
    const overallScore = this.calculateTrend(healthScores);

    if (overallScore > 0.1) overallTrend = 'improving';
    else if (overallScore < -0.1) overallTrend = 'declining';

    return {
      overallTrend,
      cacheHitRateTrend,
      eventProcessingTrend,
    };
  }

  /**
   * Export diagnostic data for external analysis
   */
  exportDiagnostics(): string {
    const report = {
      timestamp: new Date().toISOString(),
      health: this.lastHealth,
      trends: this.getHealthTrends(),
      services: ServiceRegistry.listServices(),
      eventBusStats: EventBus.getStats(),
      cacheStats: AdaptiveCache.getStats(),
      circuitBreakers: Array.from(CircuitBreaker.listBreakers().entries()),
    };

    return JSON.stringify(report, null, 2);
  }

  private async performHealthCheck(): Promise<void> {
    const health = await this.getHealth();

    if (health.overall === 'critical') {
      console.error('🚨 System health is CRITICAL');
      health.recommendations.forEach(rec => console.error(`  - ${rec}`));
    } else if (health.overall === 'degraded') {
      console.warn('⚠️ System health is DEGRADED');
      health.recommendations.forEach(rec => console.warn(`  - ${rec}`));
    }
  }

  private generateRecommendations(context: {
    cacheStats: any;
    busStats: any;
    openBreakers: number;
    degradedServices: number;
    unhealthyServices: number;
  }): string[] {
    const recommendations: string[] = [];

    if (context.cacheStats.hitRate < 0.5) {
      recommendations.push(
        `Increase cache TTL or pre-fetch frequently accessed data (current hit rate: ${(context.cacheStats.hitRate * 100).toFixed(1)}%)`
      );
    }

    if (context.busStats.averageProcessingTime > 100) {
      recommendations.push(
        `Optimize event handlers or use async processing (current avg: ${context.busStats.averageProcessingTime.toFixed(1)}ms)`
      );
    }

    if (context.openBreakers > 0) {
      recommendations.push(
        `${context.openBreakers} circuit breaker(s) are open. Check service health and connectivity.`
      );
    }

    if (context.unhealthyServices > 0) {
      recommendations.push(
        `${context.unhealthyServices} service(s) are unhealthy. Review service logs and dependencies.`
      );
    }

    if (context.cacheStats.evictions > context.cacheStats.hits * 0.2) {
      recommendations.push(
        'High cache eviction rate detected. Consider increasing cache size.'
      );
    }

    return recommendations;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }
}

// Singleton instance
export const DiagnosticSystem = new DiagnosticSystemImpl();
