/**
 * Feature Flag Service (Backend)
 *
 * Provides a simple feature flag proxy service using in-memory storage.
 * In production, this should be replaced with Unleash Server or similar.
 */

import { logger } from '../utils/logger.js';

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

interface FeatureFlag {
  name: FeatureFlagKey;
  enabled: boolean;
  variant?: string;
  description: string;
}

class FeatureFlagService {
  private flags: Map<FeatureFlagKey, FeatureFlag> = new Map();
  private lastUpdate: Date = new Date();

  constructor() {
    this.initializeDefaultFlags();
  }

  /**
   * Initialize default flags
   */
  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        name: 'search.meilisearch',
        enabled: false,
        description: 'Enable Meilisearch-powered global search',
      },
      {
        name: 'storage.rxdb',
        enabled: false,
        description: 'Enable RxDB local-first storage with replication',
      },
      {
        name: 'ux.liveActivities',
        enabled: false,
        description: 'Enable iOS Live Activities for real-time updates',
      },
      {
        name: 'security.passkeys',
        enabled: false,
        description: 'Enable WebAuthn/Passkey authentication',
      },
      {
        name: 'observability.sentry',
        enabled: false,
        description: 'Enable Sentry error tracking and session replay',
      },
      {
        name: 'observability.posthog',
        enabled: false,
        description: 'Enable PostHog analytics and event tracking',
      },
      {
        name: 'observability.opentelemetry',
        enabled: false,
        description: 'Enable OpenTelemetry tracing',
      },
      {
        name: 'sw.workbox',
        enabled: false,
        description: 'Enable Workbox-powered service worker strategies',
      },
      {
        name: 'background.fetch',
        enabled: false,
        description: 'Enable background data refresh for widgets',
      },
    ];

    defaultFlags.forEach((flag) => {
      this.flags.set(flag.name, flag);
    });

    logger.info(`[FeatureFlags] Initialized ${this.flags.size} feature flags`);
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get a specific flag
   */
  getFlag(name: FeatureFlagKey): FeatureFlag | undefined {
    return this.flags.get(name);
  }

  /**
   * Check if a flag is enabled
   */
  isEnabled(name: FeatureFlagKey): boolean {
    const flag = this.flags.get(name);
    return flag?.enabled || false;
  }

  /**
   * Update a flag
   */
  updateFlag(name: FeatureFlagKey, enabled: boolean, variant?: string): void {
    const flag = this.flags.get(name);
    if (flag) {
      flag.enabled = enabled;
      if (variant !== undefined) {
        flag.variant = variant;
      }
      this.lastUpdate = new Date();
      logger.info(`[FeatureFlags] Updated flag: ${name} = ${enabled}`);
    }
  }

  /**
   * Get last update time
   */
  getLastUpdate(): Date {
    return this.lastUpdate;
  }

  /**
   * Load flags from environment variables
   * Format: FEATURE_FLAG_<NAME>=true/false
   */
  loadFromEnvironment(): void {
    const prefix = 'FEATURE_FLAG_';

    Object.keys(process.env).forEach((key) => {
      if (key.startsWith(prefix)) {
        const flagName = key
          .substring(prefix.length)
          .toLowerCase()
          .replace(/_/g, '.') as FeatureFlagKey;

        const value = process.env[key]?.toLowerCase() === 'true';

        if (this.flags.has(flagName)) {
          this.updateFlag(flagName, value);
        }
      }
    });
  }
}

export const featureFlagService = new FeatureFlagService();

// Load flags from environment on startup
featureFlagService.loadFromEnvironment();
