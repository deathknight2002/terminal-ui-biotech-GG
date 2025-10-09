/**
 * Core Architecture - Modular Neural Network for Biotech Terminal
 * 
 * Central export point for all core infrastructure components.
 * This forms the nervous system of the terminal ecosystem.
 */

export * from './event-bus';
export * from './cloudevent-bus';
export * from './service-registry';
export * from './adaptive-cache';
export * from './circuit-breaker';
export * from './diagnostic-system';
export * from './data-contracts';
export * from './module-interface';
export * from './intelligent-router';
export * from './configuration-manager';
export * from './documentation-generator';
export * from './telemetry';
export * from './metrics';
export * from './health';
export * from './di-container';

/**
 * Initialize the core system
 */
export async function initializeCore(config?: {
  eventBus?: { maxHistorySize?: number };
  cache?: { maxSize?: number; defaultTTL?: number };
  diagnostics?: { enableMonitoring?: boolean };
}): Promise<void> {
  console.log('🚀 Initializing Terminal Core Architecture...');

  // Import required modules
  const { EventBus, EventTypes } = await import('./event-bus');
  const { DiagnosticSystem } = await import('./diagnostic-system');

  // Start diagnostic monitoring if enabled
  if (config?.diagnostics?.enableMonitoring !== false) {
    DiagnosticSystem.startMonitoring();
  }

  // Emit system ready event
  await EventBus.publish(EventTypes.SYSTEM_READY, {
    timestamp: Date.now(),
    config,
  }, { source: 'core', priority: 'high' });

  console.log('✅ Terminal Core Architecture initialized');
}

/**
 * Shutdown the core system gracefully
 */
export async function shutdownCore(): Promise<void> {
  console.log('🛑 Shutting down Terminal Core Architecture...');

  const { DiagnosticSystem } = await import('./diagnostic-system');
  const { ServiceRegistry } = await import('./service-registry');
  const { AdaptiveCache } = await import('./adaptive-cache');

  // Stop monitoring
  DiagnosticSystem.stopMonitoring();

  // Unregister all services
  const services = ServiceRegistry.listServices();
  for (const service of services) {
    ServiceRegistry.unregister(service.name);
  }

  // Clear cache
  AdaptiveCache.clear();

  console.log('✅ Terminal Core Architecture shutdown complete');
}
