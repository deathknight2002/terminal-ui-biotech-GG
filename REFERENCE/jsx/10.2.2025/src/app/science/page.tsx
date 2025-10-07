import React from 'react';
import dynamic from 'next/dynamic';

const ScienceExplorer = dynamic(()=> import('@/components/science/ScienceExplorer').then(m=> m.ScienceExplorer), { ssr:false, loading: ()=> <div className='text-sm text-white/60'>Loading science explorer…</div> });

export default function SciencePage(){
  return (
    <div className="px-4 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Science Explorer</h1>
        <p className="text-sm text-white/70 mt-1 max-w-2xl">Interactive indication landscape with pipeline micro-bars and catalyst tags. This is an extracted, trimmed version of the legacy mega science tab; further deep-dive modal + RAG chat will be reintroduced iteratively.</p>
      </div>
      <ScienceExplorer />
    </div>
  );
}
