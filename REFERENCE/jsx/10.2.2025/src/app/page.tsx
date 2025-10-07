import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientText } from '@/components/ui/GradientText';
import { getServerFeatureFlags } from '@/lib/featureFlags';
import dynamic from 'next/dynamic';

const FeatureFlagsPanel = dynamic(() => import('@/components/ui/FeatureFlagsPanel').then(m => m.FeatureFlagsPanel), { ssr: false });

export default function LandingPage() {
  const flags = getServerFeatureFlags();
  return (
    <main className="space-y-10">
      <section className="text-center mt-8">
        <h1 className="text-5xl font-bold tracking-tight mb-4"><GradientText>Aurora Mega Learning</GradientText></h1>
        <p className="text-sm max-w-2xl mx-auto text-white/70">Your consolidated, extensible, feature-flag driven knowledge universe. Merge modules, experiments, and AI interactions in a single glassy aurora interface.</p>
      </section>
      <div className="grid sm:grid-cols-3 gap-6">
        <GlassCard heading="Learn" footer="Add structured content & port legacy JSX">
          Curate modular lessons and progressive deep-dives. Each module lives under <code>/learn/[slug]</code>.
        </GlassCard>
        <GlassCard heading="Lab" footer="Future: live code, model runs">
          A sandbox for code + model reasoning experiments. Wire in execution + evaluation services.
        </GlassCard>
        <GlassCard heading="Chat" footer="Multi-model orchestration">
          Conversational interface across enabled models (flags reveal previews & future tiers).
        </GlassCard>
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="sm:col-span-1">
          <FeatureFlagsPanel initial={flags} />
        </div>
      </div>
    </main>
  );
}
