import { NextResponse } from 'next/server';
import { getServerFeatureFlags } from '@/lib/featureFlags';
import { listAvailableModels } from '@/lib/models';

export async function GET() {
  const flags = getServerFeatureFlags();
  const models = listAvailableModels(flags as unknown as { [k: string]: boolean });
  return NextResponse.json(models);
}
