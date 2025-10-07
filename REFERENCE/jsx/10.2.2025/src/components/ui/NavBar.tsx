import React from 'react';
import Link from 'next/link';
import { getServerFeatureFlags } from '@/lib/featureFlags';
import { MODELS } from '@/lib/models';
import { FeatureBadge } from './FeatureBadge';
import dynamic from 'next/dynamic';

// Client-only theme toggle dynamically imported
const ThemeToggle = dynamic(() => import('./ThemeToggle').then(m => m.ThemeToggle), { ssr: false });

export async function NavBar() {
  const flags = getServerFeatureFlags();
  const anyPreview = MODELS.some(m => m.preview && (!m.flagsRequired || m.flagsRequired.every(f => (flags as any)[f])));
  return (
    <nav className="glass flex items-center justify-between px-6 py-3 mb-8">
      <div className="flex items-center space-x-6 text-sm">
        <Link href="/" className="font-semibold gradient-text text-base">AuroraMega</Link>
        <Link href="/learn">Learn</Link>
        <Link href="/lab">Lab</Link>
        <Link href="/chat">Chat</Link>
        <Link href="/science">Science</Link>
        <Link href="/catalysts">Catalysts</Link>
      </div>
      <div className="flex items-center text-xs opacity-80 space-x-3">
        {anyPreview && <FeatureBadge label="Preview" />}
        <ThemeToggle />
      </div>
    </nav>
  );
}
