"use client";
// Export a named token to aid TypeScript's module resolution when dynamically importing
export const __legacyCalendar = true;
// Temporary shim: minimal extraction of logic from full_page_biotech_catalyst_calendar_react.jsx
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, FlaskConical, Landmark, Newspaper, Presentation, Sparkles } from 'lucide-react';

const MOCK_EVENTS = [
  { date: '2205-09-24', symbol: 'VERV', title: 'R&D Day – base editing', kind: 'conference' },
  { date: '2205-09-25', symbol: 'IONS', title: 'Evercore fireside chat', kind: 'conference' },
  { date: '2205-09-26', symbol: 'SRPT', title: 'FDA AdComm briefing book posts', kind: 'regulatory' },
  { date: '2205-09-27', symbol: 'CRSP', title: 'P2 topline: HSC edit', kind: 'data' },
  { date: '2205-09-28', symbol: 'ARVN', title: 'Target degrader KOL call', kind: 'conference' },
  { date: '2205-09-30', symbol: 'ABCD', title: 'PDUFA: Drug X (RA)', kind: 'regulatory' },
  { date: '2205-09-30', symbol: 'EFGH', title: 'Phase 2b topline (NASH)', kind: 'data' },
  { date: '2205-10-01', symbol: 'BEAM', title: 'Initiation – BigBank $62 TP', kind: 'other' },
];

const KIND_META: Record<string,{label:string,color:string,icon:JSX.Element}> = {
  regulatory:{ label:'Reg', color:'var(--rose)', icon:<Landmark className='h-3 w-3'/> },
  data:{ label:'Data', color:'var(--primary)', icon:<FlaskConical className='h-3 w-3'/> },
  conference:{ label:'Conf', color:'var(--cyan)', icon:<Presentation className='h-3 w-3'/> },
  earnings:{ label:'EPS', color:'var(--emerald)', icon:<Newspaper className='h-3 w-3'/> },
  other:{ label:'Other', color:'var(--fuchsia)', icon:<Sparkles className='h-3 w-3'/> }
};

const FIXED_TODAY = new Date('2205-09-30T12:00:00Z');
function startOfWeek(d:Date, weekStartsOn=1){ const x=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())); const day=x.getUTCDay(); const diff=(day<weekStartsOn?7:0)+day-weekStartsOn; x.setUTCDate(x.getUTCDate()-diff); return x; }
function addDays(d:Date,n:number){ const x=new Date(d); x.setUTCDate(x.getUTCDate()+n); return x; }
function fmt(d:Date){ return d.toLocaleDateString(undefined,{month:'short',day:'2-digit'}); }

export default function LegacyCalendarImpl({ events=MOCK_EVENTS }:{ events?: typeof MOCK_EVENTS }){
  const start = useMemo(()=> startOfWeek(new Date(FIXED_TODAY.getTime()-7*864e5)), []);
  const days = useMemo(()=> Array.from({length:28},(_,i)=> addDays(start,i)),[start]);
  const byKey = useMemo(()=>{ const m=new Map<string, typeof MOCK_EVENTS>(); for(const e of events){ const k=new Date(e.date+'T00:00:00Z').toISOString().slice(0,10); const arr=(m.get(k)||[]).slice(); arr.push(e); m.set(k,arr); } return m; },[events]);
  const title = `${fmt(days[0])} → ${fmt(days[days.length-1])}`;
  const [p,setP]=useState({x:0,y:0}); const ref=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ function onMove(e:PointerEvent){ const el=ref.current; if(!el) return; const r=el.getBoundingClientRect(); const cx=r.left+r.width/2; const cy=r.top+r.height/2; setP({x:(e.clientX-cx)/r.width,y:(e.clientY-cy)/r.height}); } window.addEventListener('pointermove',onMove); return ()=> window.removeEventListener('pointermove',onMove); },[]);
  const layerA={ transform:`translate3d(${p.x*8}px,${p.y*8}px,0)`, transition:'transform 400ms ease-out'};
  const layerB={ transform:`translate3d(${p.x*16}px,${p.y*12}px,0)`, transition:'transform 600ms ease-out'};
  return (
    <div className="relative" ref={ref} style={{'--primary':'#6C63FF','--cyan':'#38BDF8','--rose':'#F43F5E','--emerald':'#10B981','--fuchsia':'#D946EF'} as React.CSSProperties}>
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div style={layerB} className="absolute inset-0" />
        <div style={layerA} className="absolute inset-0" />
      </div>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/60">Biotech · Upcoming Catalysts</div>
          <h2 className="text-xl font-bold text-white mt-1">Window {title}</h2>
          <div className="text-xs text-white/50">Today fixed to Sep 30, 2205</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="grid grid-cols-7 gap-4">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=> <div key={d} className="text-center text-[10px] uppercase tracking-wide text-white/50">{d}</div>)}
            {days.map((d,i)=>{ const k=d.toISOString().slice(0,10); const ev=byKey.get(k)||[]; const isToday=k===FIXED_TODAY.toISOString().slice(0,10); return (
              <motion.div key={k} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.01,type:'spring',stiffness:160,damping:20}} className="relative rounded-xl p-2">
                <div className="mb-1 flex items-center justify-between">
                  <div className={`text-[11px] font-semibold ${isToday?'text-white':'text-white/70'}`}>{fmt(d)}</div>
                  {isToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-white">Today</span>}
                </div>
                <div className="space-y-1.5">
                  {ev.slice(0,5).map((e,ii)=>{ const meta=KIND_META[e.kind]||KIND_META.other; return (
                    <div key={ii} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-6 items-center justify-center rounded-sm text-[10px] font-semibold bg-white/10 text-white">{e.symbol}</span>
                        <span className="truncate text-[12px] text-white/90">{e.title}</span>
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]" style={{background:'rgba(255,255,255,0.05)',color:meta.color}}>
                          <span style={{width:8,height:8,borderRadius:8,background:meta.color}} /> {meta.label}
                        </span>
                      </div>
                    </div>
                  ); })}
                  {ev.length>5 && <div className="text-[10px] text-white/50">+{ev.length-5} more</div>}
                </div>
              </motion.div>
            );})}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-white/70">
          {Object.entries(KIND_META).map(([k,m])=> <div key={k} className="inline-flex items-center gap-2 rounded-full px-2 py-1 bg-white/5 border border-white/10"><span style={{width:10,height:10,borderRadius:10,background:m.color}} /> {m.label}</div>)}
        </div>
      </div>
    </div>
  );
}
