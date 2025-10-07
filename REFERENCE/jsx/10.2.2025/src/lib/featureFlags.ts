import { cookies } from 'next/headers';
import type { FeatureFlagsState, FeatureFlag } from './types';

const FLAG_COOKIE_PREFIX = 'ff_';

function envFlag(name: FeatureFlag): boolean {
  const raw = process.env[name];
  return raw === '1' || raw === 'true' || raw === 'TRUE';
}

export function getServerFeatureFlags(): FeatureFlagsState {
  const jar = cookies();
  const base: FeatureFlagsState = {
    GROK_CODE_FAST_PREVIEW: envFlag('GROK_CODE_FAST_PREVIEW'),
    GPT5_ENABLED: envFlag('GPT5_ENABLED')
  };
  // cookie overrides
  for (const key of Object.keys(base) as FeatureFlag[]) {
    const c = jar.get(FLAG_COOKIE_PREFIX + key);
    if (c) base[key] = c.value === '1';
  }
  return base;
}

export function serializeFlags(flags: FeatureFlagsState) {
  return Object.entries(flags).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

export function isFlagEnabled(flags: FeatureFlagsState, flag: FeatureFlag) {
  return !!flags[flag];
}

export function toggleFlagClient(flag: FeatureFlag, value: boolean) {
  document.cookie = `${FLAG_COOKIE_PREFIX}${flag}=${value ? '1' : '0'}; path=/; max-age=604800`;
}
