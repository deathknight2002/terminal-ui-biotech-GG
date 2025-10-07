import React from 'react';
import { getServerFeatureFlags } from '@/lib/featureFlags';

export default function LabPage() {
  const flags = getServerFeatureFlags();
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold gradient-text">Lab</h1>
      <p className="text-sm text-white/70">Experimental code + reasoning environment placeholder.</p>
      <div className="glass p-6">
        <p className="text-xs text-white/60">Active Flags: {Object.entries(flags).map(([k,v])=>`${k}=${v?'1':'0'}`).join(' | ')}</p>
        <p className="mt-4 text-sm">Embed code editors, execution kernels, model diffing, scoring pipelines here.</p>
      </div>
    </main>
  );
}
