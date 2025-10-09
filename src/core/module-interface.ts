/**
 * Module Interface - Base abstraction for all system modules
 * 
 * Provides a unified interface for module lifecycle, capabilities,
 * and self-description. Every module implements this interface.
 */

import { EventBus, EventSubscription } from './event-bus';
import { ServiceRegistry, ServiceDescriptor, HealthStatus } from './service-registry';
import type { DataContract, QueryContract, QueryResultContract } from './data-contracts';

export interface ModuleCapability {
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
}

export interface ModuleConfiguration {
  [key: string]: any;
}

export interface ModuleInterface {
  /**
   * Module metadata
   */
  readonly name: string;
  readonly version: string;
  readonly description: string;

  /**
   * Module lifecycle
   */
  initialize(config?: ModuleConfiguration): Promise<void>;
  shutdown(): Promise<void>;
  reset?(): Promise<void>;

  /**
   * Health and status
   */
  getHealth(): Promise<HealthStatus>;
  getStatus(): ModuleStatus;

  /**
   * Capabilities
   */
  getCapabilities(): ModuleCapability[];
  supportsQuery(queryType: string): boolean;

  /**
   * Self-description for documentation
   */
  describe(): ModuleDescription;
}

export interface ModuleStatus {
  initialized: boolean;
  active: boolean;
  lastActivity?: number;
  errorCount: number;
  requestCount: number;
}

export interface ModuleDescription {
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  provides: string[];
  capabilities: ModuleCapability[];
  configuration: {
    required: string[];
    optional: string[];
    defaults: Record<string, any>;
  };
  examples?: Array<{
    description: string;
    code: string;
  }>;
}

/**
 * Abstract base class for implementing modules
 */
export abstract class BaseModule implements ModuleInterface {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description: string;

  protected status: ModuleStatus = {
    initialized: false,
    active: false,
    errorCount: 0,
    requestCount: 0,
  };

  protected subscriptions: EventSubscription[] = [];
  protected config: ModuleConfiguration = {};

  /**
   * Initialize the module
   */
  async initialize(config: ModuleConfiguration = {}): Promise<void> {
    if (this.status.initialized) {
      throw new Error(`Module ${this.name} is already initialized`);
    }

    this.config = { ...this.getDefaultConfig(), ...config };

    try {
      await this.onInitialize();
      this.status.initialized = true;
      this.status.active = true;
      this.status.lastActivity = Date.now();

      // Register with service registry
      ServiceRegistry.register(this.name, this, {
        version: this.version,
        description: this.description,
        dependencies: this.getDependencies(),
        provides: this.getProvides(),
        health: () => this.getHealth(),
      });

      console.log(`✅ Module initialized: ${this.name} v${this.version}`);
    } catch (error) {
      this.status.errorCount++;
      throw new Error(`Failed to initialize ${this.name}: ${error}`);
    }
  }

  /**
   * Shutdown the module
   */
  async shutdown(): Promise<void> {
    if (!this.status.initialized) {
      return;
    }

    try {
      await this.onShutdown();

      // Unsubscribe from all events
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions = [];

      // Unregister from service registry
      ServiceRegistry.unregister(this.name);

      this.status.initialized = false;
      this.status.active = false;

      console.log(`❌ Module shutdown: ${this.name}`);
    } catch (error) {
      console.error(`Error shutting down ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Reset module state
   */
  async reset(): Promise<void> {
    await this.shutdown();
    await this.initialize(this.config);
  }

  /**
   * Get module health status
   */
  async getHealth(): Promise<HealthStatus> {
    const health = await this.onHealthCheck();
    return {
      status: health.status,
      message: health.message,
      metrics: {
        errorCount: this.status.errorCount,
        requestCount: this.status.requestCount,
        uptime: this.status.lastActivity
          ? Date.now() - this.status.lastActivity
          : 0,
        ...health.metrics,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Get module status
   */
  getStatus(): ModuleStatus {
    return { ...this.status };
  }

  /**
   * Get module capabilities
   */
  getCapabilities(): ModuleCapability[] {
    return this.onGetCapabilities();
  }

  /**
   * Check if module supports a query type
   */
  supportsQuery(queryType: string): boolean {
    return this.getCapabilities().some(cap =>
      cap.inputTypes.includes(queryType) || cap.name === queryType
    );
  }

  /**
   * Get module description for documentation
   */
  describe(): ModuleDescription {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      dependencies: this.getDependencies(),
      provides: this.getProvides(),
      capabilities: this.getCapabilities(),
      configuration: {
        required: this.getRequiredConfig(),
        optional: this.getOptionalConfig(),
        defaults: this.getDefaultConfig(),
      },
      examples: this.getExamples(),
    };
  }

  /**
   * Subscribe to event bus with automatic cleanup
   */
  protected subscribe(
    eventType: string | string[],
    handler: (event: any) => void | Promise<void>
  ): void {
    const subscription = EventBus.subscribe(eventType, handler);
    this.subscriptions.push(subscription);
  }

  /**
   * Publish to event bus
   */
  protected async publish(type: string, payload: any, priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    await EventBus.publish(type, payload, {
      source: this.name,
      priority,
    });
  }

  /**
   * Track request
   */
  protected trackRequest(): void {
    this.status.requestCount++;
    this.status.lastActivity = Date.now();
  }

  /**
   * Track error
   */
  protected trackError(error: Error): void {
    this.status.errorCount++;
    console.error(`Error in ${this.name}:`, error);
  }

  // Abstract methods to be implemented by subclasses
  protected abstract onInitialize(): Promise<void>;
  protected abstract onShutdown(): Promise<void>;
  protected abstract onHealthCheck(): Promise<Partial<HealthStatus>>;
  protected abstract onGetCapabilities(): ModuleCapability[];
  protected abstract getDependencies(): string[];
  protected abstract getProvides(): string[];
  protected abstract getDefaultConfig(): ModuleConfiguration;
  protected abstract getRequiredConfig(): string[];
  protected abstract getOptionalConfig(): string[];
  protected abstract getExamples(): Array<{ description: string; code: string }>;
}

/**
 * Data provider interface for modules that provide data
 */
export interface DataProviderModule extends ModuleInterface {
  query<T extends DataContract>(
    query: QueryContract
  ): Promise<QueryResultContract<T>>;
}

/**
 * Processor module interface for modules that transform data
 */
export interface ProcessorModule extends ModuleInterface {
  process<TIn extends DataContract, TOut extends DataContract>(
    input: TIn
  ): Promise<TOut>;
}

/**
 * Visualization module interface for modules that render data
 */
export interface VisualizationModule extends ModuleInterface {
  render(data: DataContract, target: HTMLElement): Promise<void>;
  update(data: DataContract): Promise<void>;
  destroy(): Promise<void>;
}
