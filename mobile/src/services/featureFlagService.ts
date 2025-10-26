/**
 * Feature Flag Service
 *
 * Manages feature flags using Unleash Proxy Client.
 * Provides safe defaults when proxy is unreachable.
 */

import { UnleashClient } from 'unleash-proxy-client';
import { FeatureFlagKey, FEATURE_FLAG_DEFAULTS } from '../types/featureFlags';

export interface FeatureFlagServiceConfig {
  url: string;
  clientKey: string;
  appName: string;
  environment?: string;
  refreshInterval?: number;
}

class FeatureFlagService {
  private client: UnleashClient | null = null;
  private isInitialized = false;
  private initializationError: Error | null = null;
  private localFlags: Map<FeatureFlagKey, boolean> = new Map();

  /**
   * Initialize the Unleash client
   */
  async initialize(config: FeatureFlagServiceConfig): Promise<void> {
    if (this.isInitialized) {
      console.log('[FeatureFlags] Already initialized');
      return;
    }

    try {
      // Initialize with defaults first
      Object.entries(FEATURE_FLAG_DEFAULTS).forEach(([key, value]) => {
        this.localFlags.set(key as FeatureFlagKey, value);
      });

      this.client = new UnleashClient({
        url: config.url,
        clientKey: config.clientKey,
        appName: config.appName,
        environment: config.environment || 'development',
        refreshInterval: config.refreshInterval || 15,
      });

      // Start the client (async, non-blocking)
      await this.client.start();

      // Listen for updates
      this.client.on('update', () => {
        console.log('[FeatureFlags] Flags updated from proxy');
      });

      this.client.on('error', (error: Error) => {
        console.error('[FeatureFlags] Proxy error:', error);
        this.initializationError = error;
      });

      this.isInitialized = true;
      console.log('[FeatureFlags] Initialized successfully');
    } catch (error) {
      this.initializationError = error instanceof Error
        ? error
        : new Error('Failed to initialize feature flags');
      console.error('[FeatureFlags] Initialization error:', this.initializationError);

      // Still mark as initialized to allow fallback to defaults
      this.isInitialized = true;
    }
  }

  /**
   * Check if a feature flag is enabled
   * Falls back to default value if proxy is unavailable
   */
  isEnabled(flagKey: FeatureFlagKey): boolean {
    if (!this.isInitialized) {
      console.warn('[FeatureFlags] Not initialized, using default for:', flagKey);
      return FEATURE_FLAG_DEFAULTS[flagKey];
    }

    try {
      if (this.client) {
        const enabled = this.client.isEnabled(flagKey);
        this.localFlags.set(flagKey, enabled);
        return enabled;
      }
    } catch (error) {
      console.error('[FeatureFlags] Error checking flag:', flagKey, error);
    }

    // Fallback to cached or default value
    const cachedValue = this.localFlags.get(flagKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    return FEATURE_FLAG_DEFAULTS[flagKey];
  }

  /**
   * Get variant for a feature flag
   */
  getVariant(flagKey: FeatureFlagKey): string | null {
    if (!this.isInitialized || !this.client) {
      return null;
    }

    try {
      const variant = this.client.getVariant(flagKey);
      return variant?.name || null;
    } catch (error) {
      console.error('[FeatureFlags] Error getting variant:', flagKey, error);
      return null;
    }
  }

  /**
   * Get all flag states (for debugging)
   */
  getAllFlags(): Record<string, boolean> {
    const flags: Record<string, boolean> = {};

    Object.keys(FEATURE_FLAG_DEFAULTS).forEach((key) => {
      flags[key] = this.isEnabled(key as FeatureFlagKey);
    });

    return flags;
  }

  /**
   * Stop the client
   */
  stop(): void {
    if (this.client) {
      this.client.stop();
      this.client = null;
    }
    this.isInitialized = false;
    this.localFlags.clear();
  }

  /**
   * Check if service is initialized
   */
  getInitializationState(): {
    isInitialized: boolean;
    error: Error | null;
  } {
    return {
      isInitialized: this.isInitialized,
      error: this.initializationError,
    };
  }
}

export const featureFlagService = new FeatureFlagService();
