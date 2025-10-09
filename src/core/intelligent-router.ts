/**
 * Intelligent Router - Routes requests to appropriate modules
 * 
 * Analyzes requests and routes them to the best available module based on
 * capabilities, load, health status, and historical performance.
 */

import { ServiceRegistry } from './service-registry';
import { CircuitBreaker } from './circuit-breaker';
import { AdaptiveCache } from './adaptive-cache';
import { EventBus, EventTypes } from './event-bus';
import type { QueryContract, QueryResultContract, DataContract } from './data-contracts';
import type { DataProviderModule } from './module-interface';

export interface RouteConfig {
  cacheable?: boolean;
  timeout?: number;
  retries?: number;
  fallback?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface RouteResult<T> {
  data: T;
  source: string;
  cached: boolean;
  executionTime: number;
  metadata?: Record<string, any>;
}

export interface RouterStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  routesByModule: Record<string, number>;
}

class IntelligentRouterImpl {
  private stats: RouterStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    routesByModule: {},
  };

  private responseTimes: number[] = [];
  private maxResponseTimes = 100;

  /**
   * Route a query to the appropriate module
   */
  async route<T extends DataContract>(
    query: QueryContract,
    config: RouteConfig = {}
  ): Promise<RouteResult<QueryResultContract<T>>> {
    const startTime = performance.now();
    this.stats.totalRequests++;

    try {
      // Check cache first if cacheable
      if (config.cacheable !== false) {
        const cacheKey = this.generateCacheKey(query);
        const cached = AdaptiveCache.get<QueryResultContract<T>>(cacheKey);

        if (cached) {
          this.stats.successfulRequests++;
          this.updateCacheHitRate(true);
          
          return {
            data: cached,
            source: 'cache',
            cached: true,
            executionTime: performance.now() - startTime,
          };
        }
        this.updateCacheHitRate(false);
      }

      // Find appropriate module
      const moduleName = await this.selectModule(query, config);
      if (!moduleName) {
        throw new Error(`No module found to handle query type: ${query.type}`);
      }

      // Execute through circuit breaker
      const result = await CircuitBreaker.execute(
        moduleName,
        async () => {
          const module = ServiceRegistry.get<DataProviderModule>(moduleName);
          return await this.executeWithTimeout(
            () => module.query<T>(query),
            config.timeout || 30000
          );
        }
      );

      // Cache result if applicable
      if (config.cacheable !== false) {
        const cacheKey = this.generateCacheKey(query);
        const ttl = this.determineCacheTTL(query, result);
        AdaptiveCache.set(cacheKey, result, ttl);
      }

      const executionTime = performance.now() - startTime;
      this.updateStats(moduleName, executionTime, true);

      // Emit success event
      await EventBus.publish(EventTypes.DATA_LOADED, {
        queryType: query.type,
        module: moduleName,
        executionTime,
      }, { source: 'router', priority: 'low' });

      return {
        data: result,
        source: moduleName,
        cached: false,
        executionTime,
      };
    } catch (error) {
      this.stats.failedRequests++;
      
      // Try fallback if configured
      if (config.fallback) {
        try {
          return await this.routeToFallback(query, config.fallback, startTime);
        } catch (fallbackError) {
          // Fallback also failed
        }
      }

      // Emit error event
      await EventBus.publish(EventTypes.DATA_ERROR, {
        queryType: query.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { source: 'router', priority: 'high' });

      throw error;
    }
  }

  /**
   * Get router statistics
   */
  getStats(): RouterStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      routesByModule: {},
    };
    this.responseTimes = [];
  }

  /**
   * Get module recommendations for a query type
   */
  async getModuleRecommendations(queryType: string): Promise<Array<{
    module: string;
    score: number;
    reason: string;
  }>> {
    const services = ServiceRegistry.listServices();
    const recommendations: Array<{ module: string; score: number; reason: string }> = [];

    for (const service of services) {
      const module = ServiceRegistry.get<DataProviderModule>(service.name);
      
      if (!module.supportsQuery(queryType)) {
        continue;
      }

      let score = 1.0;
      const reasons: string[] = [];

      // Check health
      const health = await module.getHealth();
      if (health.status === 'healthy') {
        score *= 1.2;
        reasons.push('healthy');
      } else if (health.status === 'degraded') {
        score *= 0.7;
        reasons.push('degraded');
      } else {
        score *= 0.3;
        reasons.push('unhealthy');
      }

      // Check circuit breaker
      const cbState = CircuitBreaker.getState(service.name);
      if (cbState === 'open') {
        score *= 0.1;
        reasons.push('circuit breaker open');
      } else if (cbState === 'half-open') {
        score *= 0.5;
        reasons.push('circuit breaker half-open');
      }

      // Consider past performance
      const moduleRequests = this.stats.routesByModule[service.name] || 0;
      if (moduleRequests > 10) {
        score *= 1.1;
        reasons.push('proven performance');
      }

      recommendations.push({
        module: service.name,
        score,
        reason: reasons.join(', '),
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Select best module for a query
   */
  private async selectModule(query: QueryContract, config: RouteConfig): Promise<string | null> {
    const recommendations = await this.getModuleRecommendations(query.type);
    
    if (recommendations.length === 0) {
      return null;
    }

    // If high priority, always use best available
    if (config.priority === 'high') {
      return recommendations[0].module;
    }

    // For normal/low priority, use weighted random selection to distribute load
    const totalScore = recommendations.reduce((sum, rec) => sum + rec.score, 0);
    let random = Math.random() * totalScore;

    for (const rec of recommendations) {
      random -= rec.score;
      if (random <= 0) {
        return rec.module;
      }
    }

    return recommendations[0].module;
  }

  /**
   * Route to fallback module
   */
  private async routeToFallback<T extends DataContract>(
    query: QueryContract,
    fallbackModule: string,
    startTime: number
  ): Promise<RouteResult<QueryResultContract<T>>> {
    const module = ServiceRegistry.get<DataProviderModule>(fallbackModule);
    const result = await module.query<T>(query);
    const executionTime = performance.now() - startTime;

    this.updateStats(fallbackModule, executionTime, true);

    return {
      data: result,
      source: fallbackModule,
      cached: false,
      executionTime,
      metadata: { fallback: true },
    };
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      ),
    ]);
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(query: QueryContract): string {
    const parts = [
      query.type,
      JSON.stringify(query.filters),
      query.sort ? JSON.stringify(query.sort) : '',
      query.pagination ? JSON.stringify(query.pagination) : '',
    ];
    return `query:${parts.join(':')}`;
  }

  /**
   * Determine cache TTL based on query and result
   */
  private determineCacheTTL(query: QueryContract, result: QueryResultContract<any>): number {
    // Default TTL based on query priority
    const baseTTL = query.metadata?.priority === 'high' ? 60000 : 300000;

    // Adjust based on result size
    if (result.data.length > 100) {
      return baseTTL * 2; // Cache larger results longer
    }

    return baseTTL;
  }

  /**
   * Update statistics
   */
  private updateStats(module: string, executionTime: number, success: boolean): void {
    if (success) {
      this.stats.successfulRequests++;
    }

    this.stats.routesByModule[module] = (this.stats.routesByModule[module] || 0) + 1;

    this.responseTimes.push(executionTime);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }

    this.stats.averageResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(hit: boolean): void {
    const total = this.stats.totalRequests;
    const hits = hit ? 1 : 0;
    this.stats.cacheHitRate = (this.stats.cacheHitRate * (total - 1) + hits) / total;
  }
}

// Singleton instance
export const IntelligentRouter = new IntelligentRouterImpl();
