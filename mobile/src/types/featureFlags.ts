/**
 * Feature Flag Types
 * 
 * All feature flags used in the mobile app.
 * Flags should be added here as they're introduced to ensure type safety.
 */

export type FeatureFlagKey =
  | 'search.meilisearch'
  | 'storage.rxdb'
  | 'ux.liveActivities'
  | 'security.passkeys'
  | 'observability.sentry'
  | 'observability.posthog'
  | 'observability.opentelemetry'
  | 'sw.workbox'
  | 'background.fetch';

export interface FeatureFlagConfig {
  key: FeatureFlagKey;
  defaultValue: boolean;
  description: string;
}

/**
 * Default feature flag values
 * Used when the proxy is unreachable or during initial load
 */
export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  'search.meilisearch': false,
  'storage.rxdb': false,
  'ux.liveActivities': false,
  'security.passkeys': false,
  'observability.sentry': false,
  'observability.posthog': false,
  'observability.opentelemetry': false,
  'sw.workbox': false,
  'background.fetch': false,
};

/**
 * Feature flag descriptions for documentation
 */
export const FEATURE_FLAG_DESCRIPTIONS: Record<FeatureFlagKey, string> = {
  'search.meilisearch': 'Enable Meilisearch-powered global search',
  'storage.rxdb': 'Enable RxDB local-first storage with replication',
  'ux.liveActivities': 'Enable iOS Live Activities for real-time updates',
  'security.passkeys': 'Enable WebAuthn/Passkey authentication',
  'observability.sentry': 'Enable Sentry error tracking and session replay',
  'observability.posthog': 'Enable PostHog analytics and event tracking',
  'observability.opentelemetry': 'Enable OpenTelemetry tracing',
  'sw.workbox': 'Enable Workbox-powered service worker strategies',
  'background.fetch': 'Enable background data refresh for widgets',
};
