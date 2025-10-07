import React from 'react';
import Link from 'next/link';
import { getServerFeatureFlags } from '@/lib/featureFlags';

// Placeholder data (replace with CMS / FS ingestion) - future: generate from legacy imports
const modules = [
  { slug: 'foundations', title: 'Foundations', summary: 'Core concepts overview.' },
  { slug: 'aurora-science', title: 'Aurora Science Demo', summary: 'Migrated legacy aurora_science_tab_react_demo.jsx content placeholder.' }
];

export default function LearnIndex() {
  const flags = getServerFeatureFlags();
  return (
    <main className="space-y-8">
      <h1 className="text-3xl font-semibold gradient-text">Learn Modules</h1>
      <p className="text-sm text-white/70">Feature Flags Active: {Object.entries(flags).filter(([_,v])=>v).map(([k])=>k).join(', ') || 'None'}</p>
      <ul className="grid sm:grid-cols-2 gap-6">
        {modules.map(m => (
          <li key={m.slug} className="glass p-5 rounded-xl">
            <Link href={`/learn/${m.slug}`} className="text-lg font-medium gradient-text">{m.title}</Link>
            <p className="text-xs mt-2 text-white/60">{m.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
