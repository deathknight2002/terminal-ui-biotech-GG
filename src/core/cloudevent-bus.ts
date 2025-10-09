/**
 * CloudEvents EventBus Adapter
 * 
 * Wraps the EventBus with CloudEvents envelope for standardized event handling
 * Provides durable backend support and event contract validation
 */

import { CloudEvent, makeEvent, validateCloudEvent } from '../events/ce';
import { EventBus, BusEvent, EventPriority, EventSubscription, EventFilter } from './event-bus';
import { ContractValidators } from '../contracts';

export interface CloudEventBusConfig {
  source: string; // Default source for events
  validateContracts?: boolean; // Validate events against contracts
  durableBackend?: DurableEventBackend; // Optional durable storage
}

export interface DurableEventBackend {
  /**
   * Store event for durability
   */
  store(event: CloudEvent): Promise<void>;

  /**
   * Retrieve event by ID
   */
  retrieve(id: string): Promise<CloudEvent | undefined>;

  /**
   * Query events by criteria
   */
  query(criteria: {
    type?: string;
    source?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<CloudEvent[]>;
}

/**
 * In-memory durable backend (for development/testing)
 */
export class InMemoryDurableBackend implements DurableEventBackend {
  private events: Map<string, CloudEvent> = new Map();

  async store(event: CloudEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async retrieve(id: string): Promise<CloudEvent | undefined> {
    return this.events.get(id);
  }

  async query(criteria: {
    type?: string;
    source?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<CloudEvent[]> {
    let events = Array.from(this.events.values());

    if (criteria.type) {
      events = events.filter(e => e.type === criteria.type);
    }

    if (criteria.source) {
      events = events.filter(e => e.source === criteria.source);
    }

    if (criteria.startTime) {
      events = events.filter(e => e.time >= criteria.startTime!);
    }

    if (criteria.endTime) {
      events = events.filter(e => e.time <= criteria.endTime!);
    }

    return events.sort((a, b) => a.time.localeCompare(b.time));
  }

  clear(): void {
    this.events.clear();
  }

  size(): number {
    return this.events.size;
  }
}

/**
 * CloudEvents-wrapped EventBus
 */
export class CloudEventBus {
  private config: CloudEventBusConfig;
  private eventBus: typeof EventBus;

  constructor(config: CloudEventBusConfig) {
    this.config = config;
    this.eventBus = EventBus;
  }

  /**
   * Publish a CloudEvent
   */
  async publishCloudEvent<T>(
    type: string,
    data: T,
    options?: {
      source?: string;
      subject?: string;
      dataschema?: string;
      priority?: EventPriority;
      extensions?: Record<string, any>;
    }
  ): Promise<CloudEvent<T>> {
    // Create CloudEvent
    const cloudEvent = makeEvent(
      type,
      options?.source || this.config.source,
      data,
      {
        subject: options?.subject,
        dataschema: options?.dataschema,
        extensions: options?.extensions,
      }
    );

    // Validate against contract if enabled
    if (this.config.validateContracts) {
      await this.validateEventContract(cloudEvent);
    }

    // Store in durable backend if configured
    if (this.config.durableBackend) {
      await this.config.durableBackend.store(cloudEvent);
    }

    // Publish to EventBus
    await this.eventBus.publish(type, cloudEvent, {
      priority: options?.priority || 'normal',
      source: cloudEvent.source,
      metadata: {
        cloudEventId: cloudEvent.id,
        cloudEventTime: cloudEvent.time,
        ...options?.extensions,
      },
    });

    return cloudEvent;
  }

  /**
   * Subscribe to CloudEvents
   */
  subscribeCloudEvent<T>(
    eventType: string | string[],
    handler: (cloudEvent: CloudEvent<T>) => void | Promise<void>,
    filter?: EventFilter
  ): EventSubscription {
    return this.eventBus.subscribe(
      eventType,
      async (busEvent: BusEvent) => {
        // Extract CloudEvent from BusEvent payload
        const cloudEvent = busEvent.payload as CloudEvent<T>;
        
        // Validate CloudEvent structure
        if (!validateCloudEvent(cloudEvent)) {
          console.error(`Invalid CloudEvent structure for type: ${eventType}`);
          return;
        }

        await handler(cloudEvent);
      },
      filter
    );
  }

  /**
   * Publish a contract-validated event
   */
  async publishContract<T>(
    schema: keyof typeof ContractValidators,
    data: T,
    options?: {
      subject?: string;
      priority?: EventPriority;
    }
  ): Promise<CloudEvent<T>> {
    // Validate contract
    const validator = ContractValidators[schema];
    if (!validator) {
      throw new Error(`No validator found for schema: ${schema}`);
    }

    try {
      validator(data);
    } catch (error) {
      throw new Error(`Contract validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Publish with schema reference
    return this.publishCloudEvent(
      `biotech.${schema}.v1`,
      data,
      {
        ...options,
        dataschema: `https://biotech-terminal.io/schemas/${schema}/v1.0`,
      }
    );
  }

  /**
   * Query durable events
   */
  async queryEvents(criteria: {
    type?: string;
    source?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<CloudEvent[]> {
    if (!this.config.durableBackend) {
      throw new Error('Durable backend not configured');
    }

    return this.config.durableBackend.query(criteria);
  }

  /**
   * Retrieve event by ID from durable backend
   */
  async retrieveEvent(id: string): Promise<CloudEvent | undefined> {
    if (!this.config.durableBackend) {
      throw new Error('Durable backend not configured');
    }

    return this.config.durableBackend.retrieve(id);
  }

  /**
   * Validate event against contract
   */
  private async validateEventContract(event: CloudEvent): Promise<void> {
    // Extract schema name from dataschema or type
    const schemaMatch = event.dataschema?.match(/\/schemas\/([^\/]+)\//) 
      || event.type.match(/biotech\.([^.]+)\./);

    if (!schemaMatch) {
      // No schema specified, skip validation
      return;
    }

    const schemaName = schemaMatch[1] as keyof typeof ContractValidators;
    const validator = ContractValidators[schemaName];

    if (validator) {
      try {
        validator(event.data);
      } catch (error) {
        throw new Error(
          `Event contract validation failed for ${schemaName}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  }
}

/**
 * Create CloudEventBus with default configuration
 */
export function createCloudEventBus(config?: Partial<CloudEventBusConfig>): CloudEventBus {
  return new CloudEventBus({
    source: config?.source || 'biotech-terminal',
    validateContracts: config?.validateContracts ?? true,
    durableBackend: config?.durableBackend || new InMemoryDurableBackend(),
  });
}
