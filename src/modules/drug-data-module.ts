/**
 * Example Drug Data Module - Reference implementation
 * 
 * Demonstrates how to implement a module using the new architecture.
 * This module provides drug development pipeline data with intelligent caching,
 * health monitoring, and self-documentation.
 */

import {
  BaseModule,
  DataProviderModule,
  ModuleCapability,
  ModuleConfiguration,
  HealthStatus,
} from '../core/module-interface';
import {
  QueryContract,
  QueryResultContract,
  DrugDataContract,
  DataContract,
} from '../core/data-contracts';
import { ConfigurationManager } from '../core/configuration-manager';
import { AdaptiveCache } from '../core/adaptive-cache';
import { EventTypes } from '../core/event-bus';

export class DrugDataModule extends BaseModule implements DataProviderModule {
  readonly name = 'drug-data-provider';
  readonly version = '1.0.0';
  readonly description = 'Provides pharmaceutical drug development pipeline data with real-time updates';

  private dataStore: Map<string, DrugDataContract> = new Map();
  private updateInterval?: NodeJS.Timeout;

  protected async onInitialize(): Promise<void> {
    // Register configuration schema
    ConfigurationManager.registerSchema(this.name, {
      updateInterval: {
        type: 'number',
        description: 'Interval in milliseconds to refresh drug data',
        default: 300000,
        env: 'DRUG_DATA_UPDATE_INTERVAL',
        validate: (value) => value > 0 || 'Must be positive',
      },
      apiEndpoint: {
        type: 'string',
        description: 'API endpoint for drug data',
        required: true,
        env: 'DRUG_DATA_API_ENDPOINT',
      },
      apiKey: {
        type: 'string',
        description: 'API key for authentication',
        required: false,
        env: 'DRUG_DATA_API_KEY',
        secret: true,
      },
      cacheTTL: {
        type: 'number',
        description: 'Cache TTL in milliseconds',
        default: 600000,
      },
    });

    // Load mock data for demonstration
    await this.loadMockData();

    // Start periodic updates
    const updateInterval = this.config.updateInterval || 300000;
    this.updateInterval = setInterval(() => {
      this.refreshData();
    }, updateInterval);

    // Subscribe to relevant events
    this.subscribe(EventTypes.DRUG_UPDATED, async (event) => {
      console.log(`Drug updated: ${event.payload.drugId}`);
      await this.handleDrugUpdate(event.payload);
    });

    console.log(`💊 Drug Data Module initialized with ${this.dataStore.size} entries`);
  }

  protected async onShutdown(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.dataStore.clear();
  }

  protected async onHealthCheck(): Promise<Partial<HealthStatus>> {
    const dataCount = this.dataStore.size;
    const lastUpdate = this.status.lastActivity || 0;
    const timeSinceUpdate = Date.now() - lastUpdate;

    if (dataCount === 0) {
      return {
        status: 'unhealthy',
        message: 'No data loaded',
      };
    }

    if (timeSinceUpdate > 600000) { // 10 minutes
      return {
        status: 'degraded',
        message: 'Data is stale',
        metrics: {
          timeSinceUpdate,
        },
      };
    }

    return {
      status: 'healthy',
      message: `Serving ${dataCount} drugs`,
      metrics: {
        drugCount: dataCount,
        timeSinceUpdate,
      },
    };
  }

  protected onGetCapabilities(): ModuleCapability[] {
    return [
      {
        name: 'query-drugs',
        description: 'Query drug development pipeline data',
        inputTypes: ['drug-query', 'indication-query', 'sponsor-query'],
        outputTypes: ['drug-data'],
      },
      {
        name: 'get-drug-by-id',
        description: 'Retrieve specific drug by ID',
        inputTypes: ['drug-id'],
        outputTypes: ['drug-data'],
      },
      {
        name: 'filter-by-phase',
        description: 'Filter drugs by development phase',
        inputTypes: ['phase-filter'],
        outputTypes: ['drug-data'],
      },
    ];
  }

  protected getDependencies(): string[] {
    return []; // No dependencies for this example
  }

  protected getProvides(): string[] {
    return ['drug-data', 'pipeline-data'];
  }

  protected getDefaultConfig(): ModuleConfiguration {
    return {
      updateInterval: 300000,
      apiEndpoint: 'https://api.example.com/drugs',
      cacheTTL: 600000,
    };
  }

  protected getRequiredConfig(): string[] {
    return ['apiEndpoint'];
  }

  protected getOptionalConfig(): string[] {
    return ['apiKey', 'updateInterval', 'cacheTTL'];
  }

  protected getExamples(): Array<{ description: string; code: string }> {
    return [
      {
        description: 'Query all drugs in Phase III',
        code: `
const query = {
  id: 'query-1',
  type: 'drug-query',
  filters: { phase: 'Phase III' },
};
const result = await drugModule.query(query);
`,
      },
      {
        description: 'Get drug by ID with caching',
        code: `
const query = {
  id: 'query-2',
  type: 'drug-id',
  filters: { id: 'DRUG-001' },
};
const result = await drugModule.query(query);
`,
      },
    ];
  }

  /**
   * Query drugs based on criteria
   */
  async query<T extends DataContract>(
    query: QueryContract
  ): Promise<QueryResultContract<T>> {
    this.trackRequest();
    const startTime = performance.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query);
      const cached = AdaptiveCache.get<QueryResultContract<T>>(cacheKey);
      if (cached) {
        return cached;
      }

      // Filter data based on query
      let results = Array.from(this.dataStore.values());

      // Apply filters
      if (query.filters) {
        results = results.filter(drug => this.matchesFilters(drug, query.filters));
      }

      // Apply sorting
      if (query.sort) {
        results.sort((a, b) => {
          const aVal = (a.data as any)[query.sort!.field];
          const bVal = (b.data as any)[query.sort!.field];
          return query.sort!.direction === 'asc'
            ? aVal > bVal ? 1 : -1
            : aVal < bVal ? 1 : -1;
        });
      }

      // Apply pagination
      const page = query.pagination?.page || 1;
      const pageSize = query.pagination?.pageSize || 20;
      const startIdx = (page - 1) * pageSize;
      const paginatedResults = results.slice(startIdx, startIdx + pageSize);

      const result: QueryResultContract<T> = {
        query,
        data: paginatedResults as T[],
        pagination: {
          page,
          pageSize,
          total: results.length,
          hasMore: startIdx + pageSize < results.length,
        },
        metadata: {
          executionTime: performance.now() - startTime,
          cacheHit: false,
          timestamp: Date.now(),
        },
      };

      // Cache result
      AdaptiveCache.set(cacheKey, result, this.config.cacheTTL || 600000);

      // Publish event
      await this.publish(EventTypes.DATA_LOADED, {
        queryType: query.type,
        resultCount: paginatedResults.length,
      });

      return result;
    } catch (error) {
      this.trackError(error as Error);
      throw error;
    }
  }

  private generateCacheKey(query: QueryContract): string {
    return `drug-query:${JSON.stringify(query)}`;
  }

  private matchesFilters(drug: DrugDataContract, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      const drugValue = (drug.data as any)[key];
      if (drugValue !== value) {
        return false;
      }
    }
    return true;
  }

  private async loadMockData(): Promise<void> {
    // Load mock pharmaceutical data
    const mockDrugs: DrugDataContract[] = [
      {
        version: '1.0',
        schema: 'drug',
        data: {
          id: 'DRUG-001',
          name: 'BioTech-123',
          indication: 'Multiple Sclerosis',
          phase: 'Phase III',
          sponsor: 'BioTech Corp',
          therapeuticArea: 'Neurology',
          targetDate: '2025-12-31',
          probability: 0.75,
          marketSize: 5000000000,
        },
        metadata: {
          source: 'mock-data',
          timestamp: Date.now(),
          confidence: 0.9,
        },
      },
      {
        version: '1.0',
        schema: 'drug',
        data: {
          id: 'DRUG-002',
          name: 'Onco-456',
          indication: 'Non-Small Cell Lung Cancer',
          phase: 'Phase II',
          sponsor: 'Pharma Inc',
          therapeuticArea: 'Oncology',
          targetDate: '2026-06-30',
          probability: 0.55,
          marketSize: 8000000000,
        },
        metadata: {
          source: 'mock-data',
          timestamp: Date.now(),
          confidence: 0.85,
        },
      },
      {
        version: '1.0',
        schema: 'drug',
        data: {
          id: 'DRUG-003',
          name: 'Immuno-789',
          indication: 'Rheumatoid Arthritis',
          phase: 'Filed',
          sponsor: 'Global Pharma',
          therapeuticArea: 'Immunology',
          targetDate: '2025-03-31',
          probability: 0.92,
          marketSize: 6500000000,
        },
        metadata: {
          source: 'mock-data',
          timestamp: Date.now(),
          confidence: 0.95,
        },
      },
    ];

    mockDrugs.forEach(drug => {
      this.dataStore.set(drug.data.id, drug);
    });

    this.status.lastActivity = Date.now();
  }

  private async refreshData(): Promise<void> {
    console.log('🔄 Refreshing drug data...');
    // In a real implementation, fetch from API
    this.status.lastActivity = Date.now();
  }

  private async handleDrugUpdate(payload: any): Promise<void> {
    const { drugId, ...updates } = payload;
    const existing = this.dataStore.get(drugId);

    if (existing) {
      const updated: DrugDataContract = {
        ...existing,
        data: {
          ...existing.data,
          ...updates,
        },
        metadata: {
          ...existing.metadata,
          timestamp: Date.now(),
        },
      };
      this.dataStore.set(drugId, updated);
    }
  }
}
