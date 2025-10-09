/**
 * CloudEvents - Vendor-neutral event specification
 * 
 * Implements CloudEvents v1.0 spec for portable, versionable event contracts
 * https://cloudevents.io/
 */

import { randomUUID } from 'crypto';

/**
 * CloudEvents v1.0 event envelope
 */
export interface CloudEvent<T = any> {
  specversion: '1.0';
  id: string;
  source: string;       // e.g., 'bioterminal/ctgov'
  type: string;         // e.g., 'trial.updated.v1'
  time: string;         // ISO 8601
  dataschema?: string;  // URL to JSON Schema
  datacontenttype?: 'application/json';
  data: T;
  // Optional extension attributes
  subject?: string;
  [key: string]: any;   // Allow for extension attributes
}

/**
 * Create a CloudEvent with standard envelope
 */
export function makeEvent<T>(
  type: string,
  source: string,
  data: T,
  options?: {
    dataschema?: string;
    subject?: string;
    extensions?: Record<string, any>;
  }
): CloudEvent<T> {
  return {
    specversion: '1.0',
    id: randomUUID(),
    source,
    type,
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    ...(options?.dataschema ? { dataschema: options.dataschema } : {}),
    ...(options?.subject ? { subject: options.subject } : {}),
    ...(options?.extensions || {}),
    data,
  };
}

/**
 * Validate CloudEvent structure
 */
export function validateCloudEvent(event: any): event is CloudEvent {
  return (
    event &&
    event.specversion === '1.0' &&
    typeof event.id === 'string' &&
    typeof event.source === 'string' &&
    typeof event.type === 'string' &&
    typeof event.time === 'string' &&
    event.data !== undefined
  );
}

/**
 * Parse CloudEvent from JSON string
 */
export function parseCloudEvent<T = any>(json: string): CloudEvent<T> {
  const parsed = JSON.parse(json);
  if (!validateCloudEvent(parsed)) {
    throw new Error('Invalid CloudEvent structure');
  }
  return parsed;
}

/**
 * Serialize CloudEvent to JSON string
 */
export function serializeCloudEvent(event: CloudEvent): string {
  if (!validateCloudEvent(event)) {
    throw new Error('Invalid CloudEvent structure');
  }
  return JSON.stringify(event);
}
