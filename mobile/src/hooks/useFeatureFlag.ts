/**
 * useFeatureFlag Hook
 *
 * React hook for accessing feature flags in components.
 * Provides safe defaults when the proxy is unreachable.
 */

import { useState, useEffect } from 'react';
import { featureFlagService } from '../services/featureFlagService';
import { FeatureFlagKey, FEATURE_FLAG_DEFAULTS } from '../types/featureFlags';

export interface UseFeatureFlagOptions {
  /**
   * Default value to use before flags are loaded
   */
  defaultValue?: boolean;

  /**
   * Refresh interval in milliseconds (default: 60000 = 1 minute)
   */
  refreshInterval?: number;
}

/**
 * Hook to check if a feature flag is enabled
 *
 * @param key - The feature flag key to check
 * @param options - Optional configuration
 * @returns boolean indicating if the feature is enabled
 *
 * @example
 * ```tsx
 * const isSearchEnabled = useFeatureFlag('search.meilisearch');
 *
 * if (isSearchEnabled) {
 *   return <MeilisearchComponent />;
 * }
 * return <LegacySearchComponent />;
 * ```
 */
export function useFeatureFlag(
  key: FeatureFlagKey,
  options: UseFeatureFlagOptions = {}
): boolean {
  const {
    defaultValue = FEATURE_FLAG_DEFAULTS[key],
    refreshInterval = 60000,
  } = options;

  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Use the custom default value from options
    return defaultValue;
  });

  useEffect(() => {
    // Update value from service
    const updateFlag = () => {
      const { isInitialized } = featureFlagService.getInitializationState();

      // Only update from service if it's initialized
      // Otherwise keep the default value
      if (isInitialized) {
        const enabled = featureFlagService.isEnabled(key);
        setIsEnabled(enabled);
      }
    };

    // Initial update
    updateFlag();

    // Set up polling for updates
    const interval = setInterval(updateFlag, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [key, refreshInterval]);

  return isEnabled;
}

/**
 * Hook to get a feature flag variant
 *
 * @param key - The feature flag key
 * @returns string | null - The variant name or null
 *
 * @example
 * ```tsx
 * const searchVariant = useFeatureFlagVariant('search.meilisearch');
 *
 * if (searchVariant === 'v2') {
 *   return <MeilisearchV2 />;
 * }
 * return <MeilisearchV1 />;
 * ```
 */
export function useFeatureFlagVariant(key: FeatureFlagKey): string | null {
  const [variant, setVariant] = useState<string | null>(() => {
    const { isInitialized } = featureFlagService.getInitializationState();
    if (isInitialized) {
      return featureFlagService.getVariant(key);
    }
    return null;
  });

  useEffect(() => {
    const updateVariant = () => {
      const v = featureFlagService.getVariant(key);
      setVariant(v);
    };

    updateVariant();

    const interval = setInterval(updateVariant, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [key]);

  return variant;
}

/**
 * Hook to get all feature flags (for debugging)
 *
 * @returns Record<string, boolean> - All feature flags and their states
 */
export function useAllFeatureFlags(): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const updateFlags = () => {
      const allFlags = featureFlagService.getAllFlags();
      setFlags(allFlags);
    };

    updateFlags();

    const interval = setInterval(updateFlags, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return flags;
}
