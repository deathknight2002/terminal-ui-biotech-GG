"use client";
import React from 'react';
import type { FeatureFlagsState, FeatureFlag } from '@/lib/types';

interface Props {
  initial: FeatureFlagsState;
}

export const FeatureFlagsPanel: React.FC<Props> = ({ initial }) => {
  const [flags, setFlags] = React.useState<FeatureFlagsState>(initial);
  function toggle(flag: FeatureFlag) {
    const next = { ...flags, [flag]: !flags[flag] } as FeatureFlagsState;
    setFlags(next);
    document.cookie = `ff_${flag}=${next[flag] ? '1' : '0'}; path=/; max-age=604800`;
  }
  return (
    <div className="glass p-4 rounded-xl space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold gradient-text">Feature Flags</span>
      </div>
      <ul className="space-y-2">
        {Object.entries(flags).map(([k, v]) => (
          <li key={k} className="flex items-center justify-between">
            <span>{k}</span>
            <button
              onClick={() => toggle(k as FeatureFlag)}
              className={`px-2 py-0.5 rounded border ${v ? 'bg-aurora-500/30 border-aurora-400' : 'opacity-50 hover:opacity-70 border-white/20'}`}
            >{v ? 'ON' : 'OFF'}</button>
          </li>
        ))}
      </ul>
      <p className="text-[10px] opacity-50">Toggles set cookies; refresh to see server components update.</p>
    </div>
  );
};