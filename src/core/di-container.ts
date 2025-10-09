/**
 * Dependency Injection Container
 * 
 * Simple IoC container for managing service dependencies and lifecycle
 * Supports singleton and transient service lifetimes
 */

export type ServiceLifetime = 'singleton' | 'transient';

export interface ServiceDescriptor<T = any> {
  factory: (container: DIContainer) => T;
  lifetime: ServiceLifetime;
  instance?: T;
}

export class DIContainer {
  private services: Map<string | symbol, ServiceDescriptor> = new Map();

  /**
   * Register a service with the container
   */
  register<T>(
    key: string | symbol,
    factory: (container: DIContainer) => T,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    this.services.set(key, { factory, lifetime });
  }

  /**
   * Register a singleton service (cached after first resolution)
   */
  registerSingleton<T>(
    key: string | symbol,
    factory: (container: DIContainer) => T
  ): void {
    this.register(key, factory, 'singleton');
  }

  /**
   * Register a transient service (new instance each resolution)
   */
  registerTransient<T>(
    key: string | symbol,
    factory: (container: DIContainer) => T
  ): void {
    this.register(key, factory, 'transient');
  }

  /**
   * Register an existing instance as a singleton
   */
  registerInstance<T>(key: string | symbol, instance: T): void {
    this.services.set(key, {
      factory: () => instance,
      lifetime: 'singleton',
      instance,
    });
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(key: string | symbol): T {
    const descriptor = this.services.get(key);
    
    if (!descriptor) {
      throw new Error(`Service not registered: ${String(key)}`);
    }

    // Return cached singleton instance
    if (descriptor.lifetime === 'singleton' && descriptor.instance) {
      return descriptor.instance;
    }

    // Create new instance
    const instance = descriptor.factory(this);

    // Cache singleton
    if (descriptor.lifetime === 'singleton') {
      descriptor.instance = instance;
    }

    return instance;
  }

  /**
   * Check if a service is registered
   */
  has(key: string | symbol): boolean {
    return this.services.has(key);
  }

  /**
   * Unregister a service
   */
  unregister(key: string | symbol): void {
    this.services.delete(key);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get all registered service keys
   */
  getRegisteredKeys(): Array<string | symbol> {
    return Array.from(this.services.keys());
  }

  /**
   * Create a child container with inherited services
   */
  createScope(): DIContainer {
    const scope = new DIContainer();
    
    // Copy singleton instances to child
    this.services.forEach((descriptor, key) => {
      if (descriptor.lifetime === 'singleton' && descriptor.instance) {
        scope.registerInstance(key, descriptor.instance);
      } else {
        scope.services.set(key, { ...descriptor });
      }
    });

    return scope;
  }
}

// Global container instance
export const container = new DIContainer();

// Service tokens (symbols for type-safe service registration)
export const ServiceTokens = {
  EventBus: Symbol('EventBus'),
  Telemetry: Symbol('Telemetry'),
  Metrics: Symbol('Metrics'),
  Health: Symbol('Health'),
  ConfigurationManager: Symbol('ConfigurationManager'),
  AdaptiveCache: Symbol('AdaptiveCache'),
  CircuitBreaker: Symbol('CircuitBreaker'),
  CTGovV2Connector: Symbol('CTGovV2Connector'),
  FAERSConnector: Symbol('FAERSConnector'),
  DrugsAtFDAConnector: Symbol('DrugsAtFDAConnector'),
  CatalystEngine: Symbol('CatalystEngine'),
} as const;
