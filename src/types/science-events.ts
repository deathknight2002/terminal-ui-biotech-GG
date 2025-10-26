/**
 * TypeScript Type Definitions for Science Event Store
 *
 * These types match the backend Python schema and enable type-safe
 * integration with the Science Event Store API.
 */

// ============================================================================
// Core Event Types
// ============================================================================

export type EventType =
  | "CLINICAL_READOUT"
  | "MECHANISM_INSIGHT"
  | "EVIDENCE_UPDATE"
  | "REGULATORY_CHANGE"
  | "TRIAL_UPDATE"
  | "TARGET_VALIDATION"
  | "GENETIC_EVIDENCE"
  | "BIOMARKER_DISCOVERY"
  | "PARTNERSHIP"
  | "ACQUISITION"
  | "COMPETITIVE_INTEL"
  | "SAFETY_SIGNAL"
  | "ENDPOINT_CHANGE"
  | "APPROVAL"
  | "REJECTION"
  | "LABEL_UPDATE";

export type EventCategory =
  | "CLINICAL"
  | "PRECLINICAL"
  | "REGULATORY"
  | "MECHANISM"
  | "COMMERCIAL";

export type EvidenceClass =
  | "GENETIC"
  | "PRECLINICAL"
  | "TRANSLATIONAL"
  | "CLINICAL"
  | "RWE"
  | "REGULATORY";

export type EntityType =
  | "DRUG"
  | "COMPANY"
  | "TARGET"
  | "INDICATION"
  | "TRIAL";

export type SourceType =
  | "FDA"
  | "CT.gov"
  | "EMA"
  | "SEC"
  | "PUBMED"
  | "CLINICALTRIALS"
  | "PRESS_RELEASE"
  | "CONFERENCE"
  | "UNKNOWN";

export type RelationshipType =
  | "FOLLOWS"
  | "PRECEDES"
  | "CAUSES"
  | "RESULTS_FROM"
  | "CONTRADICTS"
  | "SUPPORTS"
  | "REFINES"
  | "UPDATES"
  | "INVALIDATES";

// ============================================================================
// Science Event Schema
// ============================================================================

export interface RelatedEntity {
  type: EntityType;
  id: string;
  name: string;
}

export interface KeyFinding {
  finding: string;
  significance?: string;
  [key: string]: any;
}

export interface ScienceEvent {
  id: number;
  event_type: EventType;
  event_category?: EventCategory;
  title: string;
  description?: string;
  summary?: string;

  // Temporal
  event_date: string;  // ISO datetime
  published_date?: string;  // ISO date

  // Entity associations
  entity_type?: EntityType;
  entity_id?: string;
  entity_name?: string;
  related_entities?: RelatedEntity[];

  // Source and provenance
  source_type?: SourceType;
  source_url?: string;
  source_metadata?: Record<string, any>;

  // Content
  content?: string;
  key_findings?: KeyFinding[];
  impact_assessment?: string;

  // Classification
  evidence_class?: EvidenceClass;
  confidence_score?: number;  // 0-1
  impact_score?: number;  // 0-1

  // Versioning
  version: number;
  parent_version_id?: number;
  is_current: boolean;
  change_summary?: string;

  // Metadata
  tags?: string[];
  event_metadata?: Record<string, any>;

  // Timestamps
  created_at: string;  // ISO datetime
  updated_at?: string;  // ISO datetime
}

// ============================================================================
// Event Relationship Schema
// ============================================================================

export interface EventRelationship {
  id: number;
  source_event_id: number;
  target_event_id: number;
  relationship_type: RelationshipType;
  description?: string;
  confidence?: number;  // 0-1
  event_metadata?: Record<string, any>;
  created_at: string;  // ISO datetime
}

// ============================================================================
// API Request Types
// ============================================================================

export interface CreateScienceEventRequest {
  event_type: EventType;
  event_category?: EventCategory;
  title: string;
  description?: string;
  summary?: string;
  event_date: string;
  published_date?: string;
  entity_type?: EntityType;
  entity_id?: string;
  entity_name?: string;
  related_entities?: RelatedEntity[];
  source_type?: SourceType;
  source_url?: string;
  source_metadata?: Record<string, any>;
  content?: string;
  key_findings?: KeyFinding[];
  impact_assessment?: string;
  evidence_class?: EvidenceClass;
  confidence_score?: number;
  impact_score?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateScienceEventRequest extends CreateScienceEventRequest {
  change_summary?: string;
}

export interface CreateEventRelationshipRequest {
  source_event_id: number;
  target_event_id: number;
  relationship_type: RelationshipType;
  description?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface ListEventsQuery {
  event_type?: EventType;
  event_category?: EventCategory;
  entity_type?: EntityType;
  entity_id?: string;
  source_type?: SourceType;
  evidence_class?: EvidenceClass;
  from_date?: string;  // ISO datetime
  to_date?: string;  // ISO datetime
  tags?: string;  // Comma-separated
  min_confidence?: number;
  min_impact?: number;
  current_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface TimelineQuery {
  from_date?: string;
  to_date?: string;
  event_types?: string;  // Comma-separated
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CreateEventResponse {
  id: number;
  event_type: EventType;
  title: string;
  event_date: string;
  created_at: string;
}

export interface ListEventsResponse {
  events: ScienceEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface TimelineResponse {
  entity_type: EntityType;
  entity_id: string;
  timeline: ScienceEvent[];
  total_events: number;
}

export interface EventHistoryVersion {
  id: number;
  version: number;
  title: string;
  event_date: string;
  is_current: boolean;
  change_summary?: string;
  created_at: string;
}

export interface EventHistoryResponse {
  versions: EventHistoryVersion[];
}

export interface EventRelationshipsResponse {
  event_id: number;
  relationships: EventRelationship[];
}

export interface AggregationByType {
  event_type: EventType;
  count: number;
}

export interface AggregateResponse {
  aggregations: AggregationByType[];
}

export interface SearchResult {
  id: number;
  event_type: EventType;
  title: string;
  summary?: string;
  event_date: string;
  entity_type?: EntityType;
  entity_id?: string;
  source_type?: SourceType;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
}

// ============================================================================
// Client API
// ============================================================================

export class ScienceEventStoreAPI {
  constructor(private baseUrl: string = '/api/v1/science') {}

  /**
   * Create a new science event
   */
  async createEvent(event: CreateScienceEventRequest): Promise<CreateEventResponse> {
    const response = await fetch(`${this.baseUrl}/science-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List science events with filtering
   */
  async listEvents(query?: ListEventsQuery): Promise<ListEventsResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/science-events?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to list events: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific science event
   */
  async getEvent(eventId: number): Promise<ScienceEvent> {
    const response = await fetch(`${this.baseUrl}/science-events/${eventId}`);

    if (!response.ok) {
      throw new Error(`Failed to get event: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update a science event (creates new version)
   */
  async updateEvent(
    eventId: number,
    event: UpdateScienceEventRequest
  ): Promise<CreateEventResponse> {
    const response = await fetch(`${this.baseUrl}/science-events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get version history of an event
   */
  async getEventHistory(eventId: number): Promise<EventHistoryResponse> {
    const response = await fetch(`${this.baseUrl}/science-events/${eventId}/history`);

    if (!response.ok) {
      throw new Error(`Failed to get event history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get timeline of events for an entity
   */
  async getTimeline(
    entityType: EntityType,
    entityId: string,
    query?: TimelineQuery
  ): Promise<TimelineResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/science-events/timeline/${entityType}/${entityId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get timeline: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a relationship between events
   */
  async createRelationship(
    relationship: CreateEventRelationshipRequest
  ): Promise<{ id: number }> {
    const response = await fetch(`${this.baseUrl}/event-relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(relationship)
    });

    if (!response.ok) {
      throw new Error(`Failed to create relationship: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get relationships for an event
   */
  async getRelationships(
    eventId: number,
    relationshipType?: RelationshipType,
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
  ): Promise<EventRelationshipsResponse> {
    const params = new URLSearchParams({ direction });
    if (relationshipType) {
      params.append('relationship_type', relationshipType);
    }

    const response = await fetch(
      `${this.baseUrl}/event-relationships/${eventId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get relationships: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Aggregate events by type
   */
  async aggregateByType(
    fromDate?: string,
    toDate?: string,
    entityType?: EntityType
  ): Promise<AggregateResponse> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    if (entityType) params.append('entity_type', entityType);

    const response = await fetch(
      `${this.baseUrl}/science-events/aggregate/by-type?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to aggregate events: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search events by text
   */
  async searchEvents(query: string, limit: number = 50): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });

    const response = await fetch(`${this.baseUrl}/science-events/search?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to search events: ${response.statusText}`);
    }

    return response.json();
  }
}

// ============================================================================
// React Hooks (if using React)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useScienceEvents(query?: ListEventsQuery) {
  const api = new ScienceEventStoreAPI();

  return useQuery({
    queryKey: ['science-events', query],
    queryFn: () => api.listEvents(query)
  });
}

export function useScienceEvent(eventId: number) {
  const api = new ScienceEventStoreAPI();

  return useQuery({
    queryKey: ['science-event', eventId],
    queryFn: () => api.getEvent(eventId),
    enabled: !!eventId
  });
}

export function useEventTimeline(entityType: EntityType, entityId: string, query?: TimelineQuery) {
  const api = new ScienceEventStoreAPI();

  return useQuery({
    queryKey: ['timeline', entityType, entityId, query],
    queryFn: () => api.getTimeline(entityType, entityId, query)
  });
}

export function useCreateEvent() {
  const api = new ScienceEventStoreAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (event: CreateScienceEventRequest) => api.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['science-events'] });
    }
  });
}

export function useUpdateEvent(eventId: number) {
  const api = new ScienceEventStoreAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (event: UpdateScienceEventRequest) => api.updateEvent(eventId, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['science-event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['science-events'] });
    }
  });
}

export function useEventSearch(query: string, limit?: number) {
  const api = new ScienceEventStoreAPI();

  return useQuery({
    queryKey: ['event-search', query, limit],
    queryFn: () => api.searchEvents(query, limit),
    enabled: query.length >= 3
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format event date for display
 */
export function formatEventDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get event type display name
 */
export function getEventTypeLabel(eventType: EventType): string {
  const labels: Record<EventType, string> = {
    CLINICAL_READOUT: 'Clinical Readout',
    MECHANISM_INSIGHT: 'Mechanism Insight',
    EVIDENCE_UPDATE: 'Evidence Update',
    REGULATORY_CHANGE: 'Regulatory Change',
    TRIAL_UPDATE: 'Trial Update',
    TARGET_VALIDATION: 'Target Validation',
    GENETIC_EVIDENCE: 'Genetic Evidence',
    BIOMARKER_DISCOVERY: 'Biomarker Discovery',
    PARTNERSHIP: 'Partnership',
    ACQUISITION: 'Acquisition',
    COMPETITIVE_INTEL: 'Competitive Intel',
    SAFETY_SIGNAL: 'Safety Signal',
    ENDPOINT_CHANGE: 'Endpoint Change',
    APPROVAL: 'Approval',
    REJECTION: 'Rejection',
    LABEL_UPDATE: 'Label Update'
  };

  return labels[eventType] || eventType;
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(score?: number): string {
  if (!score) return 'Unknown';
  if (score >= 0.8) return 'High';
  if (score >= 0.5) return 'Medium';
  return 'Low';
}

/**
 * Get impact level label
 */
export function getImpactLabel(score?: number): string {
  if (!score) return 'Unknown';
  if (score >= 0.7) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}
