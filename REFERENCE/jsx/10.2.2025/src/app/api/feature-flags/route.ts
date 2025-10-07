import { NextResponse } from 'next/server';
import { getServerFeatureFlags } from '@/lib/featureFlags';

export async function GET() {
  const flags = getServerFeatureFlags();
  return NextResponse.json(flags);
}
