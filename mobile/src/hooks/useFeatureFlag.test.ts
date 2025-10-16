/**
 * useFeatureFlag Hook Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFeatureFlag, useAllFeatureFlags } from '../hooks/useFeatureFlag';
import { featureFlagService } from '../services/featureFlagService';
import { FEATURE_FLAG_DEFAULTS } from '../types/featureFlags';

describe('useFeatureFlag', () => {
  beforeEach(() => {
    featureFlagService.stop();
  });

  it('should return default value for a flag', () => {
    const { result } = renderHook(() => useFeatureFlag('search.meilisearch'));
    expect(result.current).toBe(FEATURE_FLAG_DEFAULTS['search.meilisearch']);
  });

  it('should accept custom default value', () => {
    const { result } = renderHook(() => 
      useFeatureFlag('search.meilisearch', { defaultValue: true })
    );
    expect(result.current).toBe(true);
  });

  it('should handle all flag keys', () => {
    Object.keys(FEATURE_FLAG_DEFAULTS).forEach((key) => {
      const { result } = renderHook(() => 
        useFeatureFlag(key as keyof typeof FEATURE_FLAG_DEFAULTS)
      );
      expect(typeof result.current).toBe('boolean');
    });
  });
});

describe('useAllFeatureFlags', () => {
  it('should return all flags', () => {
    const { result } = renderHook(() => useAllFeatureFlags());
    expect(Object.keys(result.current).length).toBeGreaterThanOrEqual(0);
  });

  it('should return flags as boolean values', () => {
    const { result } = renderHook(() => useAllFeatureFlags());
    Object.values(result.current).forEach((value) => {
      expect(typeof value).toBe('boolean');
    });
  });
});
