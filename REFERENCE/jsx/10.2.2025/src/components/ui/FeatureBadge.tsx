import React from 'react';

export const FeatureBadge: React.FC<{ label: string; preview?: boolean }> = ({ label, preview }) => (
  <span className="ml-2 rounded-full bg-aurora-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-aurora-200 border border-aurora-400/30">
    {label}{preview && ' • Preview'}
  </span>
);
