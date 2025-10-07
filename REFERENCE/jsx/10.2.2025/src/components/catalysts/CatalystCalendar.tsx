"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import shim; TS was not resolving the local module, so we wrap in a function.
const LegacyCalendar = dynamic(async () => {
  const mod: any = await import('./index');
  return mod.LegacyCalendarImpl || mod.default || mod;
}, { ssr:false, loading:()=> <div className='text-sm text-white/60 py-10 text-center'>Loading calendar…</div> });

export const CatalystCalendar: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Catalyst Calendar</h1>
        <p className="text-sm text-white/70 mt-1">Interactive 4-week biotech catalyst window. Replace mock events with backend feed.</p>
      </div>
      <LegacyCalendar />
    </div>
  );
};
