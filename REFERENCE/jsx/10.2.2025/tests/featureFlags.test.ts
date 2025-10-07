import { describe, it, expect } from 'vitest';
import { serializeFlags, isFlagEnabled } from '../src/lib/featureFlags';

// Minimal pure helpers test (serializeFlags & isFlagEnabled). Env logic & cookies are server-only.

describe('feature flags helpers', () => {
  it('serializes flags correctly', () => {
    const flags = { GROK_CODE_FAST_PREVIEW: true, GPT5_ENABLED: false };
    expect(serializeFlags(flags)).toEqual(flags);
  });

  it('checks enabled flag', () => {
    const flags = { GROK_CODE_FAST_PREVIEW: true, GPT5_ENABLED: false };
    expect(isFlagEnabled(flags, 'GROK_CODE_FAST_PREVIEW')).toBe(true);
    expect(isFlagEnabled(flags, 'GPT5_ENABLED')).toBe(false);
  });
});
