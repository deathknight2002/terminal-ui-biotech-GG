import React from 'react';
import { getServerFeatureFlags } from '@/lib/featureFlags';
import { listAvailableModels } from '@/lib/models';
import dynamic from 'next/dynamic';
const ChatComposer = dynamic(() => import('@/components/chat/ChatComposer').then(m => m.ChatComposer), { ssr: false });

export default function ChatPage() {
  const flags = getServerFeatureFlags();
  const models = listAvailableModels(flags as unknown as Record<string, boolean>);
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold gradient-text">Chat</h1>
      <p className="text-sm text-white/70">Unified multi-model conversation placeholder.</p>
  <div className="glass p-6 space-y-6">
        <div className="text-xs text-white/60">Enabled Models:</div>
        <ul className="grid sm:grid-cols-2 gap-3">
          {models.map(m => (
            <li key={m.id} className="glass p-3">
              <div className="text-sm font-medium">{m.name}</div>
              <div className="text-[10px] mt-1 opacity-70 uppercase tracking-wide">{m.capabilities.join(' • ')}</div>
            </li>
          ))}
        </ul>
        <div className="pt-2 border-t border-white/10">
          <ChatComposer availableModels={models} defaultModel={models[0]?.id || ''} />
        </div>
      </div>
    </main>
  );
}
