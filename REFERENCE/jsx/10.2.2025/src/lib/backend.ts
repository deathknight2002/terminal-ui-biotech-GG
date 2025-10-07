/** Lightweight backend fetch wrapper with feature flag passthrough.
 * Extend with auth tokens, tracing, retries, circuit breakers as needed.
 */
import { getServerFeatureFlags } from './featureFlags';

const base = process.env.BACKEND_API_BASE;

if (!base) {
  // Intentionally silent in production; could log via observability layer instead.
}

export interface BackendOptions extends RequestInit {
  path: string;
  asJson?: boolean;
}

export async function backendRequest<T = unknown>({ path, asJson = true, headers, ...init }: BackendOptions): Promise<T> {
  if (!base) throw new Error('BACKEND_API_BASE not configured');
  const flags = getServerFeatureFlags();
  const url = base.replace(/\/$/, '') + path;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-feature-flags': Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join(','),
      'x-api-key': process.env.BACKEND_API_KEY || '',
      ...(headers || {})
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Backend ${res.status} ${res.statusText}`);
  return (asJson ? res.json() : (res.text() as any)) as T;
}

export async function listBackendModels() {
  try {
    return await backendRequest<{ id: string; name: string }[]>({ path: '/models' });
  } catch (e) {
    return [];
  }
}