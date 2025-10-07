"use client";
import React from 'react';
import type { ChatMessage } from '@/lib/chatTypes';
interface Props { availableModels: { id: string; name: string }[]; defaultModel: string; }
export const ChatComposer: React.FC<Props> = ({ availableModels, defaultModel }) => {
  const [model, setModel] = React.useState(defaultModel);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [pending, setPending] = React.useState(false);
  async function send() {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMessage]); setInput(''); setPending(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [...messages, userMessage] }) });
      const data = await res.json(); if (data.reply) setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
    } catch (e: any) { setMessages(m => [...m, { role: 'assistant', content: `Error: ${e.message}` }]); } finally { setPending(false); }
  }
  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
  return (<div className="space-y-4">
    <div className="flex items-center space-x-3 text-xs"><label className="opacity-60">Model</label><select value={model} onChange={e => setModel(e.target.value)} className="glass px-2 py-1 rounded bg-transparent text-xs">{availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
    <div className="space-y-3 max-h-72 overflow-auto pr-1">{messages.map((msg,i)=>(<div key={i} className={`text-xs leading-relaxed ${msg.role==='user'?'text-aurora-200':'text-white/70'}`}><span className="opacity-50 mr-1">{msg.role==='user'?'You':'AI'}:</span>{msg.content}</div>))}{pending && <div className="text-[10px] animate-pulse opacity-50">Thinking…</div>}</div>
    <div className="space-y-2"><textarea className="w-full glass rounded p-2 text-xs resize-none h-20 focus:outline-none" placeholder="Ask something..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} /><div className="flex justify-end"><button disabled={pending||!input.trim()} onClick={send} className="px-3 py-1 rounded glass text-[11px] disabled:opacity-30 hover:bg-white/5">Send</button></div></div>
  </div>);
};