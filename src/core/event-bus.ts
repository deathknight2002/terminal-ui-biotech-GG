/**
 * Event Bus - Central nervous system for the terminal ecosystem
 * 
 * Provides pub/sub communication between autonomous modules without direct coupling.
 * Supports event filtering, priority queuing, and diagnostic introspection.
 */

export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

export interface BusEvent<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  priority: EventPriority;
  source: string;
  metadata?: Record<string, any>;
}

export interface EventSubscription {
  id: string;
  unsubscribe: () => void;
}

export interface EventFilter {
  type?: string | string[];
  source?: string | string[];
  priority?: EventPriority | EventPriority[];
}

export interface EventBusStats {
  totalEvents: number;
  subscriberCount: number;
  eventsByType: Record<string, number>;
  eventsByPriority: Record<EventPriority, number>;
  averageProcessingTime: number;
  droppedEvents: number;
}

type EventHandler<T = any> = (event: BusEvent<T>) => void | Promise<void>;

class EventBusImpl {
  private subscribers: Map<string, Set<{ handler: EventHandler; filter?: EventFilter }>> = new Map();
  private eventHistory: BusEvent[] = [];
  private stats: EventBusStats = {
    totalEvents: 0,
    subscriberCount: 0,
    eventsByType: {},
    eventsByPriority: { critical: 0, high: 0, normal: 0, low: 0 },
    averageProcessingTime: 0,
    droppedEvents: 0,
  };
  private maxHistorySize = 1000;
  private processingTimes: number[] = [];
  private maxProcessingTimes = 100;

  /**
   * Subscribe to events with optional filtering
   */
  subscribe<T = any>(
    eventType: string | string[],
    handler: EventHandler<T>,
    filter?: EventFilter
  ): EventSubscription {
    const id = this.generateId();
    const types = Array.isArray(eventType) ? eventType : [eventType];

    types.forEach(type => {
      if (!this.subscribers.has(type)) {
        this.subscribers.set(type, new Set());
      }
      this.subscribers.get(type)!.add({ handler, filter });
    });

    this.stats.subscriberCount++;

    return {
      id,
      unsubscribe: () => {
        types.forEach(type => {
          const subs = this.subscribers.get(type);
          if (subs) {
            subs.forEach(sub => {
              if (sub.handler === handler) {
                subs.delete(sub);
              }
            });
            if (subs.size === 0) {
              this.subscribers.delete(type);
            }
          }
        });
        this.stats.subscriberCount--;
      },
    };
  }

  /**
   * Publish an event to all matching subscribers
   */
  async publish<T = any>(
    type: string,
    payload: T,
    options: {
      priority?: EventPriority;
      source?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const event: BusEvent<T> = {
      id: this.generateId(),
      type,
      payload,
      timestamp: Date.now(),
      priority: options.priority || 'normal',
      source: options.source || 'unknown',
      metadata: options.metadata,
    };

    // Update stats
    this.stats.totalEvents++;
    this.stats.eventsByType[type] = (this.stats.eventsByType[type] || 0) + 1;
    this.stats.eventsByPriority[event.priority]++;

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get subscribers
    const subscribers = this.subscribers.get(type) || new Set();
    const wildcardSubscribers = this.subscribers.get('*') || new Set();
    const allSubscribers = new Set([...subscribers, ...wildcardSubscribers]);

    // Notify subscribers
    const startTime = performance.now();
    const promises: Promise<void>[] = [];

    for (const { handler, filter } of allSubscribers) {
      if (this.matchesFilter(event, filter)) {
        try {
          const result = handler(event);
          if (result instanceof Promise) {
            promises.push(result.catch(err => {
              console.error(`Event handler error for ${type}:`, err);
            }));
          }
        } catch (err) {
          console.error(`Event handler error for ${type}:`, err);
        }
      }
    }

    await Promise.all(promises);

    // Track processing time
    const processingTime = performance.now() - startTime;
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.maxProcessingTimes) {
      this.processingTimes.shift();
    }
    this.stats.averageProcessingTime =
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  /**
   * Get event history for diagnostic purposes
   */
  getHistory(filter?: EventFilter, limit = 100): BusEvent[] {
    const filtered = filter
      ? this.eventHistory.filter(event => this.matchesFilter(event, filter))
      : this.eventHistory;
    return filtered.slice(-limit);
  }

  /**
   * Get bus statistics
   */
  getStats(): EventBusStats {
    return { ...this.stats };
  }

  /**
   * Clear event history (useful for memory management)
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalEvents: 0,
      subscriberCount: this.stats.subscriberCount,
      eventsByType: {},
      eventsByPriority: { critical: 0, high: 0, normal: 0, low: 0 },
      averageProcessingTime: 0,
      droppedEvents: 0,
    };
    this.processingTimes = [];
  }

  /**
   * Get all active subscribers (for diagnostics)
   */
  getSubscribers(): Map<string, number> {
    const result = new Map<string, number>();
    this.subscribers.forEach((subs, type) => {
      result.set(type, subs.size);
    });
    return result;
  }

  private matchesFilter(event: BusEvent, filter?: EventFilter): boolean {
    if (!filter) return true;

    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      if (!types.includes(event.type)) return false;
    }

    if (filter.source) {
      const sources = Array.isArray(filter.source) ? filter.source : [filter.source];
      if (!sources.includes(event.source)) return false;
    }

    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      if (!priorities.includes(event.priority)) return false;
    }

    return true;
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const EventBus = new EventBusImpl();

// Standard event types
export const EventTypes = {
  // Data events
  DATA_LOADED: 'data:loaded',
  DATA_UPDATED: 'data:updated',
  DATA_ERROR: 'data:error',
  DATA_CACHED: 'data:cached',

  // UI events
  UI_READY: 'ui:ready',
  UI_ERROR: 'ui:error',
  UI_NAVIGATION: 'ui:navigation',
  UI_INTERACTION: 'ui:interaction',

  // System events
  SYSTEM_READY: 'system:ready',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_DEGRADED: 'system:degraded',
  SYSTEM_RECOVERED: 'system:recovered',

  // Module events
  MODULE_REGISTERED: 'module:registered',
  MODULE_INITIALIZED: 'module:initialized',
  MODULE_ERROR: 'module:error',
  MODULE_UNREGISTERED: 'module:unregistered',

  // Performance events
  PERF_SLOW: 'performance:slow',
  PERF_MEMORY_HIGH: 'performance:memory_high',
  PERF_OPTIMIZED: 'performance:optimized',

  // Business events
  DRUG_UPDATED: 'drug:updated',
  CATALYST_TRIGGERED: 'catalyst:triggered',
  TRIAL_STATUS_CHANGED: 'trial:status_changed',
  MARKET_DATA_RECEIVED: 'market:data_received',
} as const;
