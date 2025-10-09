/**
 * Service Registry - Dependency injection and service discovery
 * 
 * Enables modules to register themselves and declare dependencies,
 * facilitating autonomous yet coordinated operation.
 */

import { EventBus, EventTypes } from './event-bus';

export interface ServiceDescriptor {
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  provides: string[];
  health: () => Promise<HealthStatus>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  metrics?: Record<string, number>;
  timestamp: number;
}

export interface ModuleMetadata {
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  provides: string[];
  registeredAt: number;
  lastHealthCheck?: HealthStatus;
}

class ServiceRegistryImpl {
  private services: Map<string, any> = new Map();
  private metadata: Map<string, ModuleMetadata> = new Map();
  private healthCheckInterval: number = 30000; // 30 seconds
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register a service with metadata
   */
  register<T>(
    name: string,
    service: T,
    descriptor: Omit<ServiceDescriptor, 'name'>
  ): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }

    // Validate dependencies
    const missingDeps = descriptor.dependencies.filter(dep => !this.services.has(dep));
    if (missingDeps.length > 0) {
      throw new Error(
        `Cannot register ${name}: missing dependencies: ${missingDeps.join(', ')}`
      );
    }

    this.services.set(name, service);
    this.metadata.set(name, {
      name,
      version: descriptor.version,
      description: descriptor.description,
      dependencies: descriptor.dependencies,
      provides: descriptor.provides,
      registeredAt: Date.now(),
    });

    // Start health checks
    this.startHealthChecks(name, descriptor.health);

    // Notify via event bus
    EventBus.publish(EventTypes.MODULE_REGISTERED, {
      name,
      version: descriptor.version,
    }, { source: 'service-registry', priority: 'normal' });

    console.log(`✅ Registered service: ${name} v${descriptor.version}`);
  }

  /**
   * Unregister a service
   */
  unregister(name: string): void {
    if (!this.services.has(name)) {
      return;
    }

    // Stop health checks
    const timer = this.healthCheckTimers.get(name);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(name);
    }

    this.services.delete(name);
    this.metadata.delete(name);

    // Notify via event bus
    EventBus.publish(EventTypes.MODULE_UNREGISTERED, { name }, {
      source: 'service-registry',
      priority: 'normal'
    });

    console.log(`❌ Unregistered service: ${name}`);
  }

  /**
   * Get a registered service
   */
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get service metadata
   */
  getMetadata(name: string): ModuleMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * Get all registered services
   */
  listServices(): ModuleMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    this.metadata.forEach((meta, name) => {
      graph.set(name, meta.dependencies);
    });
    return graph;
  }

  /**
   * Get services that provide a specific capability
   */
  getProviders(capability: string): string[] {
    const providers: string[] = [];
    this.metadata.forEach((meta, name) => {
      if (meta.provides.includes(capability)) {
        providers.push(name);
      }
    });
    return providers;
  }

  /**
   * Get health status of all services
   */
  async getHealth(): Promise<Map<string, HealthStatus>> {
    const health = new Map<string, HealthStatus>();
    for (const [name, meta] of this.metadata) {
      if (meta.lastHealthCheck) {
        health.set(name, meta.lastHealthCheck);
      }
    }
    return health;
  }

  /**
   * Perform health check on a specific service
   */
  private async performHealthCheck(name: string, healthFn: () => Promise<HealthStatus>): Promise<void> {
    try {
      const status = await healthFn();
      const meta = this.metadata.get(name);
      if (meta) {
        meta.lastHealthCheck = status;

        // Emit events for status changes
        if (status.status === 'degraded') {
          EventBus.publish(EventTypes.SYSTEM_DEGRADED, {
            service: name,
            ...status
          }, { source: 'service-registry', priority: 'high' });
        } else if (status.status === 'unhealthy') {
          EventBus.publish(EventTypes.MODULE_ERROR, {
            service: name,
            ...status
          }, { source: 'service-registry', priority: 'critical' });
        }
      }
    } catch (error) {
      console.error(`Health check failed for ${name}:`, error);
      EventBus.publish(EventTypes.MODULE_ERROR, {
        service: name,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { source: 'service-registry', priority: 'critical' });
    }
  }

  /**
   * Start periodic health checks for a service
   */
  private startHealthChecks(name: string, healthFn: () => Promise<HealthStatus>): void {
    // Initial health check
    this.performHealthCheck(name, healthFn);

    // Periodic health checks
    const timer = setInterval(() => {
      this.performHealthCheck(name, healthFn);
    }, this.healthCheckInterval);

    this.healthCheckTimers.set(name, timer);
  }

  /**
   * Set health check interval (in milliseconds)
   */
  setHealthCheckInterval(interval: number): void {
    this.healthCheckInterval = interval;
  }

  /**
   * Generate a visual representation of the service graph
   */
  visualizeDependencies(): string {
    let output = '\n=== Service Dependency Graph ===\n\n';
    const graph = this.getDependencyGraph();

    graph.forEach((deps, service) => {
      const meta = this.metadata.get(service);
      const healthIcon = meta?.lastHealthCheck?.status === 'healthy' ? '✅' : '⚠️';
      output += `${healthIcon} ${service}\n`;
      if (deps.length > 0) {
        deps.forEach(dep => {
          output += `  ├── depends on: ${dep}\n`;
        });
      }
      if (meta && meta.provides.length > 0) {
        output += `  └── provides: ${meta.provides.join(', ')}\n`;
      }
      output += '\n';
    });

    return output;
  }
}

// Singleton instance
export const ServiceRegistry = new ServiceRegistryImpl();
