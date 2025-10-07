"use client";
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Minimal types adapted from legacy file
export type Catalyst = { id:string; label:string; date:string; risk:'High'|'Medium'|'Low'; artStyle?:'ripple'|'spark'|'bar' };
export type PipelineStage = { name:string; progress:number };
export type Indication = { id:string; name:string; area:string; summary:string; competitors:string[]; tags:string[]; catalysts:Catalyst[]; pipeline:PipelineStage[] };

type RagDoc = { id:string; title:string; date?:string; highlights?:string[] };

// Mock seed (can be replaced by API later)
const MOCK: Indication[] = [
  { id:'egfr', name:'Metastatic NSCLC (EGFRm)', area:'Oncology', summary:'3rd gen TKIs; resistance (C797S); ADC & bispecific entrants.', competitors:['AZN','J&J','Spectrum'], tags:['EGFR','TKI','ADC'], catalysts:[{id:'c1',label:'Ph3 OS update',date:'2025-11-15',risk:'Medium',artStyle:'bar'}], pipeline:[{name:'Preclinical',progress:1},{name:'Ph1',progress:1},{name:'Ph2',progress:.65},{name:'Ph3',progress:.25},{name:'Filed',progress:0},{name:'Approved',progress:0}] },
  { id:'ad', name:"Alzheimer's (neuroinflam)", area:'Neurology', summary:'Microglial modulation, TREM2 agonism, complement inhibition.', competitors:['Biogen','Lilly','Denali'], tags:['Microglia','TREM2'], catalysts:[{id:'c2',label:'Biomarker Ph2',date:'2026-01-20',risk:'High',artStyle:'ripple'}], pipeline:[{name:'Preclinical',progress:1},{name:'Ph1',progress:1},{name:'Ph2',progress:.35},{name:'Ph3',progress:0},{name:'Filed',progress:0},{name:'Approved',progress:0}] }
];

const MOCK_DOCS: RagDoc[] = [
  { id:'doc-1', title:'EGFRm NSCLC Landscape – Laura v1', date:'2025-07-14', highlights:['Resistance post-osimertinib','C797S combos'] },
  { id:'doc-2', title:'ADC entrants – 2025Q3 deep dive', date:'2025-09-01', highlights:['Bystander effect','DAR optimization'] },
  { id:'doc-3', title:'AD Neuroinflammation pathway map', date:'2025-06-02', highlights:['TREM2 signaling','CSF readthrough'] }
];

function classify(stage:PipelineStage[]): 'Early'|'Mid'|'Late' {
  const weights: Record<string,number> = { Preclinical:.1, Ph1:.2, Ph2:.3, Ph3:.4, Filed:.5, Approved:.6 };
  const score = (stage||[]).reduce((a,s)=> a + (s.progress||0)*(weights[s.name]??0.25),0);
  if (score < .2) return 'Early'; if (score < .45) return 'Mid'; return 'Late';
}

export const ScienceExplorer: React.FC<{ indications?:Indication[] }>=({ indications=MOCK })=>{
  const [q,setQ]=useState('');
  const [active,setActive]=useState<Indication|null>(null);
  const [ragOpen,setRagOpen]=useState(false);
  const [ragBusy,setRagBusy]=useState(false);
  const [ragAnswer,setRagAnswer]=useState<{ q:string; answer:string; cites?:{docId:string; snippet:string}[] }|null>(null);
  const [ragSel,setRagSel]=useState<string[]>([]);
  const debounced = useDebounce(q,160);
  const searchRef = useRef<HTMLInputElement|null>(null);
  const filtered = useMemo(()=>{
    if(!debounced) return indications; const L=debounced.toLowerCase();
    return indications.filter(i=> [i.name,i.area,i.summary,...i.tags,...i.competitors].some(f=>f.toLowerCase().includes(L)));
  },[debounced,indications]);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ const tag=(e.target as HTMLElement).tagName; if(e.key==='/' && tag!=='INPUT' && tag!=='TEXTAREA'){ e.preventDefault(); searchRef.current?.focus(); } if((e.metaKey||e.ctrlKey)&& e.key.toLowerCase()==='k'){ e.preventDefault(); setRagOpen(o=>!o);} }; window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey); },[]);

  async function askRag(qText:string){
    if(!qText.trim()) return; setRagBusy(true); setRagAnswer(null);
    const lower=qText.toLowerCase();
    // very lightweight mock logic referencing selected docs
    const hits = MOCK_DOCS.filter(d=> !ragSel.length || ragSel.includes(d.id));
    const cites = hits.slice(0,3).map(d=>({ docId:d.id, snippet:(d.highlights?.[0]||'Relevant passage') }));
    let answer:string;
    if(lower.includes('compet')||lower.includes('rival')){
      answer = 'Key competitors vary by indication: ' + indications.map(i=> `${i.name.split(' ')[0]}: ${i.competitors.slice(0,3).join(', ')}`).join(' | ');
    } else if(lower.includes('catalyst')||lower.includes('readout')){
      answer = 'Upcoming catalysts focus on pivotal / Ph2 readouts; track dates & risk coloring for prioritization.';
    } else if(lower.includes('pipeline')){
      answer = 'Pipelines skew Mid-stage on average; EGFRm progressing into Ph3 while neuroinflam earlier.';
    } else {
      answer = 'Quick take: diversified landscape; refine query (competitors, catalysts, pipeline, mechanism).';
    }
    setTimeout(()=>{ setRagAnswer({ q:qText, answer, cites }); setRagBusy(false); }, 420); // simulate latency
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input ref={searchRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search indications (/ to focus)" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <span className="text-xs text-white/60">{filtered.length} results</span>
        <button onClick={()=>setRagOpen(true)} className="text-[11px] rounded-lg px-3 py-1 bg-violet-500/20 border border-violet-400/30 hover:bg-violet-500/30 transition">RAG (⌘/Ctrl+K)</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(ind=> <IndicationCard key={ind.id} ind={ind} onOpen={()=>setActive(ind)} />)}
          {filtered.length===0 && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full text-center text-sm text-white/60 border border-white/10 rounded-xl py-10">No matches</motion.div>}
        </AnimatePresence>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {active && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setActive(null)} />
            <motion.div initial={{scale:.95,opacity:0,y:10}} animate={{scale:1,opacity:1,y:0}} exit={{scale:.95,opacity:0,y:10}} className="relative w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 backdrop-blur-xl shadow-2xl">
              <button onClick={()=>setActive(null)} className="absolute top-3 right-3 text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20">Close</button>
              <h2 className="text-lg font-semibold mb-1">{active.name}</h2>
              <p className="text-[11px] uppercase tracking-wide text-white/50 mb-3">{active.area} · {classify(active.pipeline)}</p>
              <p className="text-sm text-white/80 mb-4 leading-relaxed">{active.summary}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <section>
                    <h3 className="text-xs font-semibold tracking-wide text-white/60 mb-2">Pipeline</h3>
                    <PipelineMini stages={active.pipeline} />
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold tracking-wide text-white/60 mb-2">Catalysts</h3>
                    <div className="flex flex-col gap-1.5">
                      {active.catalysts.map(c=> (
                        <div key={c.id} className="flex items-center gap-2 text-[11px] rounded-md border border-white/10 bg-white/5 px-2 py-1">
                          <span className={`h-2 w-2 rounded-full ${c.risk==='High'?'bg-rose-400':c.risk==='Medium'?'bg-amber-400':'bg-emerald-400'}`} />
                          <span className="flex-1 truncate">{c.label}</span>
                          <span className="text-white/50">{new Date(c.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                      {active.catalysts.length===0 && <div className="text-[11px] text-white/50">No catalysts</div>}
                    </div>
                  </section>
                </div>
                <div className="space-y-4">
                  <section>
                    <h3 className="text-xs font-semibold tracking-wide text-white/60 mb-2">Competitors</h3>
                    <div className="flex flex-wrap gap-1">
                      {active.competitors.map(c=> <span key={c} className="text-[11px] rounded-full bg-white/10 px-2 py-0.5">{c}</span>)}
                      {active.competitors.length===0 && <span className="text-[11px] text-white/50">None</span>}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold tracking-wide text-white/60 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {active.tags.map(t=> <span key={t} className="text-[11px] rounded-full bg-violet-400/20 border border-violet-300/30 px-2 py-0.5">{t}</span>)}
                      {active.tags.length===0 && <span className="text-[11px] text-white/50">None</span>}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RAG Global Panel */}
      <AnimatePresence>
        {ragOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur" onClick={()=>setRagOpen(false)} />
            <motion.div initial={{scale:.95,opacity:0,y:10}} animate={{scale:1,opacity:1,y:0}} exit={{scale:.95,opacity:0,y:10}} className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5 backdrop-blur-xl shadow-xl">
              <button onClick={()=>setRagOpen(false)} className="absolute top-3 right-3 text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20">Close</button>
              <h3 className="font-semibold mb-4">Interactive RAG Chat</h3>
              <RagPanel docs={MOCK_DOCS} selected={ragSel} toggle={(id)=> setRagSel(s=> s.includes(id)? s.filter(x=>x!==id): [...s,id])} onAsk={askRag} busy={ragBusy} answer={ragAnswer} />
              <p className="mt-4 text-[10px] text-white/40">Demo RAG: local heuristics only. Wire backend adapter for real retrieval.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const IndicationCard: React.FC<{ ind:Indication; onOpen?:()=>void }> = ({ ind, onOpen }) =>{
  const stage = classify(ind.pipeline);
  return (
    <motion.article layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 backdrop-blur-md shadow-[0_8px_28px_-4px_rgba(0,0,0,0.45)] hover:shadow-[0_12px_34px_-2px_rgba(0,0,0,0.55)] transition cursor-pointer" onClick={onOpen} onKeyDown={(e)=>{ if(e.key==='Enter') onOpen?.(); }} tabIndex={0} aria-label={`Open details for ${ind.name}`}>
      <h3 className="font-semibold text-sm mb-1 pr-10 leading-snug">{ind.name}</h3>
      <p className="text-[11px] uppercase tracking-wide text-white/50 mb-2">{ind.area} · {stage}</p>
      <p className="text-xs text-white/80 line-clamp-3 mb-3 min-h-[2.6rem]">{ind.summary}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {ind.tags.slice(0,4).map(t=> <span key={t} className="text-[10px] rounded-full bg-white/10 px-2 py-0.5">{t}</span>)}
      </div>
      <PipelineMini stages={ind.pipeline} />
    </motion.article>
  );
};

const PipelineMini: React.FC<{ stages:PipelineStage[] }> = ({ stages }) => (
  <div className="space-y-1 mt-2">
    {stages.map(s=> (
      <div key={s.name} className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-[10px] text-white/60">{s.name}</span>
        <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div initial={{width:0}} animate={{width:`${Math.round(s.progress*100)}%`}} transition={{duration:0.8}} className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-fuchsia-400" />
        </div>
        <span className="text-[10px] text-white/50 w-8 text-right">{Math.round(s.progress*100)}%</span>
      </div>
    ))}
  </div>
);

function useDebounce<T>(value:T, ms=200){
  const [v,setV]=useState(value); useEffect(()=>{ const id=setTimeout(()=>setV(value), ms); return ()=>clearTimeout(id); },[value,ms]); return v;
}

// RAG Panel component
const RagPanel: React.FC<{ docs:RagDoc[]; selected:string[]; toggle:(id:string)=>void; onAsk:(q:string)=>void; busy:boolean; answer: { q:string; answer:string; cites?:{docId:string; snippet:string}[] } | null }> = ({ docs, selected, toggle, onAsk, busy, answer }) => {
  const [q,setQ]=useState('');
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') onAsk(q); }} placeholder="Ask about competitors, catalysts, pipeline…" className="flex-1 rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
        <button disabled={!q || busy} onClick={()=>onAsk(q)} className="rounded-lg px-4 py-2 text-sm font-medium bg-violet-500 disabled:opacity-40 hover:bg-violet-400 transition">{busy? '…' : 'Ask'}</button>
      </div>
      <div className="flex flex-wrap gap-2 max-h-28 overflow-auto p-2 rounded-lg border border-white/10 bg-white/5">
        {docs.map(d=> {
          const on = selected.includes(d.id);
          return (
            <button key={d.id} onClick={()=>toggle(d.id)} className={`text-[11px] px-2 py-1 rounded-md border ${on? 'bg-emerald-400/25 border-emerald-300/40':'bg-white/10 border-white/15 hover:bg-white/15'} transition`}>{d.title}</button>
          );
        })}
      </div>
      {answer && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-3">
          <div className="text-[11px] uppercase tracking-wide text-white/50">Q: {answer.q}</div>
          <div>{answer.answer}</div>
          {!!answer.cites?.length && (
            <div className="text-[11px] space-y-1">
              <div className="uppercase tracking-wide text-white/40">References</div>
              {answer.cites.map(c=> <div key={c.docId} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-300"/> <span className="text-white/70">{docs.find(d=>d.id===c.docId)?.title}</span> <span className="text-white/40">{c.snippet}</span></div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
