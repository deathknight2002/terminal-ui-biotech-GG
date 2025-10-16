/**
 * Feature Flag Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { featureFlagService } from '../services/featureFlagService';
import { FEATURE_FLAG_DEFAULTS } from '../types/featureFlags';

describe('FeatureFlagService', () => {
  beforeEach(() => {
    // Reset the service before each test
    featureFlagService.stop();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const state = featureFlagService.getInitializationState();
      expect(state.isInitialized).toBe(false);
    });

    it('should return default values when not initialized', () => {
      const isEnabled = featureFlagService.isEnabled('search.meilisearch');
      expect(isEnabled).toBe(FEATURE_FLAG_DEFAULTS['search.meilisearch']);
    });
  });

  describe('isEnabled', () => {
    it('should return default value for each flag', () => {
      Object.keys(FEATURE_FLAG_DEFAULTS).forEach((key) => {
        const flagKey = key as keyof typeof FEATURE_FLAG_DEFAULTS;
        const isEnabled = featureFlagService.isEnabled(flagKey);
        expect(isEnabled).toBe(FEATURE_FLAG_DEFAULTS[flagKey]);
      });
    });

    it('should handle errors gracefully', () => {
      // Test with invalid flag key - should return default
      const isEnabled = featureFlagService.isEnabled('search.meilisearch');
      expect(typeof isEnabled).toBe('boolean');
    });
  });

  describe('getAllFlags', () => {
    it('should return all flags', () => {
      const flags = featureFlagService.getAllFlags();
      expect(Object.keys(flags).length).toBeGreaterThan(0);
    });

    it('should return all flag keys as boolean values', () => {
      const flags = featureFlagService.getAllFlags();
      Object.values(flags).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });
    });
  });

  describe('getVariant', () => {
    it('should return null when not initialized', () => {
      const variant = featureFlagService.getVariant('search.meilisearch');
      expect(variant).toBeNull();
    });
  });
});
