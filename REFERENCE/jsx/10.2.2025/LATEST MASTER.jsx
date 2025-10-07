import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MASTER SITE — GGets Aurora (Home · Science · Policy)
 * - Home: Eclipse/Saturn brand hero, gorgeous loaders, mini calendar, CTAs
 * - Science: MEGA indication explorer (cards → modal, RAG, export)
 * - Policy: PRVs / FDA-AA / CBER GT / Orphan / PDUFA — curated briefs + doc chips
 *
 * Build-safe single file. No external UI libs. All styles within <style>.
 * Optional adapters: { searchIndications, ragAsk, onOpenDoc, getExclusivity, calendarEvents }
 */

/****************************
 * Minimal icons (inline SVG)
 ****************************/
const Icon = {
  Sparkles:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12l2-2-2-2 2-2 2 2 2-2 2 2-2 2 2 2-2 2-2-2-2 2-2-2zM17 6l1-1 1 1-1 1-1-1zm0 10l1-1 1 1-1 1-1-1z" stroke="currentColor" strokeWidth="1.2"/></svg>),
  Search:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5"/></svg>),
  Filter:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.5"/></svg>),
  Flask:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M9 3h6m-1 0v5l5 8a3 3 0 0 1-3 5H8a3 3 0 0 1-3-5l5-8V3" stroke="currentColor" strokeWidth="1.3"/></svg>),
  Beaker:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M7 3h10M9 3v5l-5 8a3 3 0 0 0 3 5h10a3 3 0 0 0 3-5l-5-8V3" stroke="currentColor" strokeWidth="1.3"/></svg>),
  Timer:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.3"/><path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="1.3"/><path d="M9 2h6" stroke="currentColor" strokeWidth="1.3"/></svg>),
  FileText:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12V8l-4-6z" stroke="currentColor" strokeWidth="1.2"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.2"/><path d="M8 13h8M8 17h6M8 9h2" stroke="currentColor" strokeWidth="1.2"/></svg>),
  External:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M14 3h7v7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 14L21 3" stroke="currentColor" strokeWidth="1.3"/><path d="M20 13v7H3V4h7" stroke="currentColor" strokeWidth="1.3"/></svg>),
  Message:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 5h16v10H8l-4 4V5z" stroke="currentColor" strokeWidth="1.3"/></svg>),
  Grid:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" stroke="currentColor" strokeWidth="1.2"/></svg>),
  X:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5"/></svg>),
  Loader:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="1.3"/></svg>),
  Home:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4H9v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.3"/></svg>),
  Shield:(p)=> (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.3"/></svg>),
  Saturn:(p)=> (<svg width="64" height="64" viewBox="0 0 128 128" fill="none" {...p}><defs><radialGradient id="g1" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor="#ff3b3b"/><stop offset="100%" stopColor="rgba(255,0,0,0)"/></radialGradient></defs><g filter="url(#f)" opacity="0.95"><circle cx="64" cy="64" r="30" fill="url(#g1)"/></g><g opacity="0.9"><ellipse cx="64" cy="70" rx="48" ry="12" fill="rgba(255,255,255,0.08)"/><ellipse cx="64" cy="70" rx="48" ry="12" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/></g><g fill="rgba(255,255,255,0.25)"><circle cx="36" cy="38" r="2"/><circle cx="96" cy="46" r="1.5"/><circle cx="80" cy="30" r="1.2"/><circle cx="28" cy="60" r="1.4"/></g></svg>)
};

/****************************
 * Utilities
 ****************************/
const classNames = (...xs)=> xs.filter(Boolean).join(' ');
function useDebounced(value, ms=200){ const [v,setV]=useState(value); useEffect(()=>{ const id=setTimeout(()=>setV(value),ms); return ()=>clearTimeout(id); },[value,ms]); return v; }
const fuzzyIncludes = (h,n)=> String(h||'').toLowerCase().includes(String(n||'').trim().toLowerCase());

/****************************
 * Document registry (Laura/CG-inspired)
 ****************************/
const DOCS = [
  { id:"doc-ibd", title:"Leerink IBD Primer (Mar 2025)", url:"#", highlights:["TL1A/DR3","Combos","Oral IL-23R"] },
  { id:"doc-dmd", title:"Leerink DMD Primer (Apr 2025)", url:"#", highlights:["Elevidys","Next-gen GT","AOC skippers"] },
  { id:"doc-cardio", title:"Leerink Cardiology (Mar 2025)", url:"#", highlights:["Lp(a)","Oral PCSK9","HFpEF"] },
  { id:"doc-prv", title:"CG PRV Primer (Sep 2025)", url:"#", highlights:["RPD","Voucher pricing","GKAC"] },
  { id:"doc-npdr", title:"DR/NPDR & DME (Sep 2025)", url:"#", highlights:["AXPAXLI","SC GT","DRSS"] },
];

/****************************
 * SCIENCE — Indications (expanded)
 ****************************/
const INDICATIONS = [
  { id:"obesity-glp1", name:"Obesity & Metabolic (GLP‑1/GIP/+)", area:"Metabolic / Endocrine", summary:"GLP‑1/GIP incretins lead; outcomes/label expansions; orals/triple agonists next.", tags:["GLP‑1","GIP","Triple","Oral"], competitors:["Novo (semaglutide)","Lilly (tirzepatide)"], catalysts:[{id:"ob-1",label:"New CV/OSA readouts",date:"2025-12-31",risk:"Medium"}], pipeline:[{name:"Preclinical",progress:1},{name:"Ph1",progress:1},{name:"Ph2",progress:.7},{name:"Ph3",progress:.6},{name:"Filed",progress:.2},{name:"Approved",progress:.6}] },
  { id:"ibd", name:"IBD (UC/CD)", area:"Immunology / GI", summary:"IL‑23 momentum, JAK speed/oral, TL1A to reset efficacy; combos emerging.", tags:["IL‑23","TL1A","JAK","Oral"], competitors:["AbbVie (Skyrizi/Rinvoq)","Roche (RVT‑3101)","Merck (tulisokibart)"], catalysts:[{id:"ibd-1",label:"TL1A Ph3 updates",date:"2026-06-01",risk:"Medium"}], pipeline:[{name:"Preclinical",progress:1},{name:"Ph1",progress:1},{name:"Ph2",progress:.8},{name:"Ph3",progress:.5},{name:"Filed",progress:0},{name:"Approved",progress:.4}], refs:["doc-ibd"] },
  { id:"dmd", name:"Duchenne Muscular Dystrophy (DMD)", area:"Rare / Neuromuscular", summary:"Microdystrophin AAVs, exon skipping, AOC strategies; durability/access drive value.", tags:["AAV","microdystrophin","exon skipping","AOC"], competitors:["Sarepta/Roche (Elevidys)","RGNX/AbbVie (RGX‑202)","Solid Bio (SGT‑003)","Avidity (AOC)"], catalysts:[{id:"dmd-1",label:"RGX‑202 pivotal readout (est.)",date:"2026-06-30",risk:"Medium"}], pipeline:[{name:"Preclinical",progress:1},{name:"Ph1",progress:1},{name:"Ph2",progress:1},{name:"Ph3",progress:.6},{name:"Filed",progress:0},{name:"Approved",progress:.2}], refs:["doc-dmd"] },
  { id:"sma", name:"Spinal Muscular Atrophy (SMA)", area:"Rare / Neuromuscular", summary:"SMN backbone; myostatin inhibition (apitegromab) for function in ambulatory patients.", tags:["SMN","AAV","Myostatin"], competitors:["Spinraza","Zolgensma","Evrysdi","Apitegromab"], catalysts:[{id:"sma-1",label:"Apitegromab label path",date:"2026-02-15",risk:"Medium"}], pipeline:[{name:"Preclinical",progress:1},{name:"Ph1",progress:1},{name:"Ph2",progress:1},{name:"Ph3",progress:.8},{name:"Filed",progress:.2},{name:"Approved",progress:0}] },
  { id:"npdr", name:"DR/NPDR & DME", area:"Ophthalmology", summary:"Anti‑VEGF class — shift to high‑dose, sustained, and in‑office gene therapy.", tags:["VEGF","Ang2","Gene Tx","Sustained"], competitors:["Eylea HD","Vabysmo","RGX‑314","AXPAXLI"], catalysts:[{id:"np-1",label:"RGX‑314 pivotal NPDR start/updates",date:"2025-11-01",risk:"Low"}], pipeline:[{name:"Preclinical",progress:1},{name:"Ph1",progress:1},{name:"Ph2",progress:.8},{name:"Ph3",progress:.4},{name:"Filed",progress:0},{name:"Approved",progress:.3}], refs:["doc-npdr"] },
  { id:"ga-dryamd", name:"Geographic Atrophy (dry AMD)", area:"Ophthalmology", summary:"C3/C5 inhibitors slow lesion growth; unmet need on vision/dosing burden.", tags:["C3","C5","Complement"], competitors:["Syfovre","Izervay","NGM","Annexon"], catalysts:[{id:"ga-1",label:"Long‑term outcomes & safety",date:"2026-05-30",risk:"Medium"}], pipeline:[{name:"Preclinical",progress:1},{name:"Ph1",progress:1},{name:"Ph2",progress:.6},{name:"Ph3",progress:.4},{name:"Filed",progress:0},{name:"Approved",progress:.3}] },
  { id:"mash-nash", name:"MASH / NASH", area:"Hepatology", summary:"First approval (resmetirom); combos + incretin-adjacent strategies under eval.", tags:["THR‑β","FGF21","ACC","GLP‑1"], competitors:["Rezdiffra","Efruxifermin","Pegozafermin","VK2809"], catalysts:[{id:"na-1",label:"Adoption & combo reads",date:"2025-12-15",risk:"Low"}], pipeline:[{name:"Preclinical",progress:1},{name:"Ph1",progress:1},{name:"Ph2",progress:.7},{name:"Ph3",progress:.6},{name:"Filed",progress:.3},{name:"Approved",progress:.4}] },
  { id:"cv-lpa-oralpcsk9", name:"CV Risk (Lp(a), Oral PCSK9)", area:"Cardiometabolic", summary:"Lp(a) outcomes + oral PCSK9 broaden lipid lowering and adherence.", tags:["Lp(a)","Oral PCSK9","MACE"], competitors:["Pelacarsen","Olpasiran","MK‑0616 (enlicitide)","PCSK9 mAbs"], catalysts:[{id:"cv-1",label:"CORALreef/Outcomes data & filings",date:"2025-11-15",risk:"Medium"}], pipeline:[{name:"Preclinical",progress:1},{name:"Ph1",progress:1},{name:"Ph2",progress:.8},{name:"Ph3",progress:.7},{name:"Filed",progress:.3},{name:"Approved",progress:.4}], refs:["doc-cardio"] }
];

/****************************
 * Normalization, classifiers, RAG, printable
 ****************************/
function normalizeIndication(r){ r=r||{}; return { id:String(r.id||'unknown'), name:String(r.name||'Unknown Indication'), area:String(r.area||'Unspecified'), summary:String(r.summary||'No summary available.'), competitors:Array.isArray(r.competitors)?r.competitors.map(String):[], tags:Array.isArray(r.tags)?r.tags.map(String):[], catalysts:Array.isArray(r.catalysts)? r.catalysts.map(c=>({id:String(c?.id||Math.random()),label:String(c?.label||'—'),date:c?.date||new Date().toISOString().slice(0,10),risk:(c?.risk==='High'||c?.risk==='Medium')?c.risk:'Low'})) : [], pipeline:Array.isArray(r.pipeline)? r.pipeline.map(s=>({name:String(s?.name||'Stage'), progress:Math.max(0,Math.min(1,Number(s?.progress||0)))})) : [], refs:Array.isArray(r.refs)? r.refs.map(String):[], sponsors:Array.isArray(r.sponsors)? r.sponsors.map(s=>({name:String(s?.name||'—'),type:s?.type||'Unknown',exclusivityUntil:s?.exclusivityUntil})) : [] }; }
function classifyStage(stages){ const w={Preclinical:.1,Ph1:.2,Ph2:.3,Ph3:.4,Filed:.5,Approved:.6}; const avg=(stages||[]).reduce((a,s)=>a+((s.progress||0)*(w[s.name]??.25)),0); return avg<.2?'Early':avg<.45?'Mid':'Late'; }
function mockRAG(item,q){ const it=normalizeIndication(item); const t=String(q||'').toLowerCase(); if(!t) return `Quick take: ${it.summary}`; if(t.includes('endpoint')||t.includes('measure')) return 'Endpoints vary; track function/biomarkers.'; if(t.includes('competitor')||t.includes('company')||t.includes('drug')) return it.competitors.length?`Top comps: ${it.competitors.slice(0,3).join(', ')}.`:'No comp data.'; if(t.includes('catalyst')||t.includes('readout')||t.includes('pdufa')) return it.catalysts.length?`Next catalysts: ${it.catalysts.map(ev=>`${new Date(ev.date).toLocaleDateString()} – ${ev.label}`).join(' | ')}`:'No catalysts listed.'; return `Quick take: ${it.summary}`; }
function printableHTML(i){ return `<!doctype html><html><head><meta charset="utf-8"/><title>${i.name}</title><style>body{font-family:system-ui,Segoe UI,Roboto,Inter,Arial;margin:24px;line-height:1.4}h1{margin:0 0 6px}h2{margin:18px 0 8px}.muted{color:#333}</style></head><body><h1>${i.name}</h1><div class="muted">Area: ${i.area}</div><h2>Summary</h2><p>${i.summary}</p><h2>Competitors</h2><ul>${i.competitors.map(c=>`<li>${c}</li>`).join('')}</ul><h2>Catalysts</h2><ul>${i.catalysts.map(ev=>`<li>${new Date(ev.date).toLocaleDateString()} — ${ev.label}</li>`).join('')}</ul></body></html>`; }

/****************************
 * SCIENCE tab — cards grid + modal + RAG
 ****************************/
function AnimatedPipeline({ stages }){ const items=Array.isArray(stages)?stages:[]; return <div className="pipe-wrap">{items.map((s,i)=>(<div key={s.name+i} className="pipe-row"><div className="pipe-label">{s.name}</div><div className="pipe-bar"><motion.div initial={{width:0}} animate={{width:`${Math.round(Math.max(0,Math.min(1,s.progress||0))*100)}%`}} transition={{duration:1.1+i*0.12,ease:'easeOut'}} className="pipe-fill"/><div className="pipe-shimmer"/></div><div className="pipe-pct">{Math.round((s.progress||0)*100)}%</div></div>))}</div>; }
function CatalystChips({ list }){ const cats=Array.isArray(list)?list:[]; return <div className="cat-chips">{cats.map(ev=>(<span key={ev.id} className={classNames('chip', ev.risk==='High'?'risk-high':ev.risk==='Medium'?'risk-mid':'risk-low')}><Icon.Timer style={{marginRight:6}}/>{ev.label} · {new Date(ev.date).toLocaleDateString()}</span>))}</div>; }
function DocRefs({ docIds }){ if(!docIds||!docIds.length) return null; return <div className="doc-refs">{docIds.map(id=>{ const d=DOCS.find(x=>x.id===id); if(!d) return null; return <a key={id} className="doc-pill" href={d.url} target="_blank" rel="noreferrer"><Icon.FileText style={{marginRight:6}}/>{d.title}<Icon.External style={{marginLeft:6,opacity:.7}}/></a>; })}</div>; }
function ExclusivityBadge({ sponsor }){ if(!sponsor) return null; return <div className="excl"><span className="badge badge-glass">{sponsor.type||'—'}</span><div className="excl-name">{sponsor.name||'—'}</div><div className="excl-date">Excl: {sponsor.exclusivityUntil? new Date(sponsor.exclusivityUntil).toLocaleDateString() : '—'}</div></div>; }
function ScienceCard({ ind, onOpen }){ const it=normalizeIndication(ind); const stage=classifyStage(it.pipeline); const sponsor=it.sponsors?.[0]; return (<motion.article layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="card glass" onClick={onOpen} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')onOpen();}}><div className="card-head"><div><h3 className="card-title">{it.name}</h3><div className="card-sub">{it.area} · <span className="chip-soft">{stage}</span></div></div><div className="card-right"><span className="badge badge-glass"><Icon.Flask style={{marginRight:6}}/>{(it.tags||[]).slice(0,3).join(' · ')}</span>{sponsor&&<ExclusivityBadge sponsor={sponsor}/>}</div></div><div className="card-body"><p className="card-summary">{it.summary}</p><div className="card-comps"><Icon.Beaker style={{marginRight:6}}/> Competitors: {(it.competitors||[]).map(c=><span className="chip" key={c}>{c}</span>)}</div><AnimatedPipeline stages={it.pipeline}/><CatalystChips list={it.catalysts}/><DocRefs docIds={it.refs}/></div></motion.article>); }
function DetailsModal({ item, onClose }){ const it=useMemo(()=>normalizeIndication(item),[item]); const [msgs,setMsgs]=useState([{role:'assistant',text:`Hi! Ask me about ${it.name} — endpoints, competitors, catalysts…`}]); const [input,setInput]=useState(''); const send=async()=>{ if(!input.trim())return; const q=input.trim(); setMsgs(m=>[...m,{role:'user',text:q}]); setInput(''); const ans=mockRAG(it,q); await new Promise(r=>setTimeout(r,250)); setMsgs(m=>[...m,{role:'assistant',text:ans}]); }; const exportPDF=()=>{ const w=window.open('','_blank','noopener'); if(!w) return alert('Popup blocked'); w.document.write(printableHTML(it)); w.document.close(); try{w.print();}catch(_){} }; return (<div className="modal-root"><div className="backdrop" onClick={onClose}/><motion.div className="modal glass" initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}}><button className="btn" onClick={onClose} aria-label="Close"><Icon.X/></button><h2 className="modal-title">{it.name}</h2><div className="meta"><span className="chip">{it.area}</span><span className="chip">Stage: {classifyStage(it.pipeline)}</span></div><p className="muted" style={{marginTop:6}}>{it.summary}</p><div className="section"><h3>Pipeline</h3><AnimatedPipeline stages={it.pipeline}/></div><div className="section"><h3>Catalysts</h3><CatalystChips list={it.catalysts}/></div><div className="section"><h3>Competitors</h3><ul className="bullets">{it.competitors.map(c=><li key={c}>{c}</li>)}</ul></div><div className="section"><h3>Ask a question</h3><div className="chat"><div className="log">{msgs.map((m,i)=><div key={i} className={classNames('bubble',m.role==='user'?'user':'bot')}>{m.text}</div>)}</div><div className="chat-row"><input className="input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send();}} placeholder={`Ask about ${it.name}…`}/><button className="btn-cta" onClick={send}>Ask</button></div></div></div><div className="section" style={{display:'flex',gap:8}}><button className="btn" onClick={exportPDF}>Print PDF</button></div></motion.div></div>); }
function ScienceTab(){ const [q,setQ]=useState(''); const query=useDebounced(q,160); const filtered=useMemo(()=>{ if(!query) return INDICATIONS; return INDICATIONS.map(ind=>({ ind, score:[ind.name,ind.area,ind.summary,(ind.tags||[]).join(' '),(ind.competitors||[]).join(' ')].reduce((a,f)=>a+(fuzzyIncludes(f,query)?1:0),0) })).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.ind); },[query]); const [active,setActive]=useState(null); return (<div className="tab-wrap"><div className="search-row"><div className="search"><Icon.Search className="srch-ico"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search indications, tags, competitors… (press / to focus)"/></div></div><div className="grid">{filtered.map(ind=><ScienceCard key={ind.id} ind={ind} onOpen={()=>setActive(ind)}/>)}</div>{active&&<DetailsModal item={active} onClose={()=>setActive(null)}/>}</div>); }

/****************************
 * POLICY tab — curated briefs
 ****************************/
function PolicyCard({ title, bullets=[], docId }){ const doc=DOCS.find(d=>d.id===docId); return (<div className="card glass"><div className="card-head"><h3 className="card-title"><Icon.Shield style={{marginRight:8}}/>{title}</h3></div><div className="card-body"><ul className="bullets">{bullets.map((b,i)=><li key={i}>{b}</li>)}</ul>{doc&&<a className="doc-pill" href={doc.url} target="_blank" rel="noreferrer"><Icon.FileText style={{marginRight:6}}/>{doc.title}<Icon.External style={{marginLeft:6,opacity:.7}}/></a>}</div></div>); }
function PolicyTab(){ return (<div className="tab-wrap"><div className="grid"><PolicyCard title="PRVs (Pediatric/RPD) & GKAC" bullets={["RPD eligibility timelines & labeling","Voucher pricing trends","GKAC implications for pediatrics"]} docId="doc-prv"/><PolicyCard title="FDA AA endpoints & CBER GT trends" bullets={["Surrogate → clinical outcomes bridge","GT hepatic safety & immunomod","Manufacturing comparability"]} docId="doc-dmd"/><PolicyCard title="IRA, Orphan exclusivity, PDUFA cadence" bullets={["Small molecule vs biologic timelines","Exemptions & OSC interplay","User fee timing & windows"]} docId="doc-cardio"/></div></div>); }

/****************************
 * HOME tab — Eclipse/Saturn brand + CTAs + mini calendar
 ****************************/
function GGBrandMark(){ return (<div className="brandmark glass"><div className="logo"><Icon.Saturn/></div><div className="brand-text">GG</div><div className="particles" aria-hidden>{Array.from({length:24}).map((_,i)=>(<span key={i} style={{animationDelay:`${i*120}ms`, left:`${(i*37)%100}%`, top:`${(i*53)%100}%`}}/>))}</div></div>); }
function MiniCalendar({ fromIndications=INDICATIONS }){ // consolidate catalysts into a 14d ribbon
  const today=new Date(); const days=Array.from({length:14},(_,i)=>{const d=new Date(today); d.setDate(d.getDate()+i); d.setHours(0,0,0,0); return d;});
  const byDate=new Map();
  for(const ind of fromIndications){ for(const ev of (ind.catalysts||[])){ const d=new Date(ev.date); const k=d.toISOString().slice(0,10); const arr=byDate.get(k)||[]; arr.push({label:ev.label, risk:ev.risk, ind:ind.name}); byDate.set(k,arr); } }
  return (<div className="mini-cal glass"><div className="mini-row">{days.map((d,i)=>{ const k=d.toISOString().slice(0,10); const ev=byDate.get(k)||[]; return (<div key={k} className="mini-cell"><div className="mini-date">{d.toLocaleDateString(undefined,{month:'short',day:'2-digit'})}</div><div className="mini-events">{ev.slice(0,3).map((e,idx)=>(<div key={idx} className={classNames('mini-pill', e.risk==='High'?'risk-high':e.risk==='Medium'?'risk-mid':'risk-low')} title={e.ind}>{e.label}</div>))}{ev.length>3&&<div className="mini-more">+{ev.length-3}</div>}</div></div>); })}</div></div>);
}
function HomeTab({ onOpenScience, onOpenCalendar }){ return (<div className="home"><div className="hero"><GGBrandMark/><div className="cta"><button className="btn-cta" onClick={onOpenScience}>Open Science</button><button className="btn-solid" onClick={onOpenCalendar}>View Today’s Catalysts</button></div></div><div className="section"><h3>What’s moving now</h3><div className="grid four"><div className="pulse-card">GLP‑1 / GIP</div><div className="pulse-card">SMA (apitegromab)</div><div className="pulse-card">TL1A in IBD</div><div className="pulse-card">Oral PCSK9</div></div></div><div className="section"><h3>Two‑week Catalyst Ribbon</h3><MiniCalendar/></div></div>); }

/****************************
 * MASTER APP
 ****************************/
export default function MasterApp({ adapters }){
  const [tab,setTab]=useState('home');
  useEffect(()=>{ const onKey=(e)=>{ if(e.key==='/' && (e.target||{}).tagName!=='INPUT') setTab('science'); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[]);
  return (
    <div className="site-root">
      <header className="stickybar glass"><div className="brandpack"><Icon.Sparkles/> GGets Aurora</div><nav className="tabsbar"><button className={classNames('navtab',tab==='home'&&'on')} onClick={()=>setTab('home')}><Icon.Home/> Home</button><button className={classNames('navtab',tab==='science'&&'on')} onClick={()=>setTab('science')}><Icon.Flask/> Science</button><button className={classNames('navtab',tab==='policy'&&'on')} onClick={()=>setTab('policy')}><Icon.Shield/> Policy</button></nav><div className="top-cta"><button className="btn-cta" onClick={()=>setTab('science')}>Open Science</button></div></header>
      <main className="mainwrap">
        {tab==='home' && <HomeTab onOpenScience={()=>setTab('science')} onOpenCalendar={()=>setTab('science')}/>}
        {tab==='science' && <ScienceTab/>}
        {tab==='policy' && <PolicyTab/>}
      </main>
      <style>{`
        :root{ --deep:#060719; --fg:rgba(255,255,255,0.92); --glass:linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); --b2:rgba(255,255,255,0.2) }
        *{ box-sizing:border-box }
        body{ margin:0; background:var(--deep); color:var(--fg); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial }
        .glass{ background: var(--glass); border:1px solid var(--b2); border-radius:16px; box-shadow: inset 1px 1px 0 rgba(255,255,255,0.025), 0 10px 30px rgba(2,6,23,0.6) }
        .site-root{ min-height:100vh; position:relative }
        .stickybar{ position:sticky; top:0; z-index:30; display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.5rem .75rem; backdrop-filter: blur(10px) }
        .brandpack{ display:flex; align-items:center; gap:.5rem; font-weight:700 }
        .tabsbar{ display:flex; gap:.35rem }
        .navtab{ display:inline-flex; align-items:center; gap:.35rem; padding:.35rem .6rem; border:1px solid var(--b2); background: rgba(255,255,255,0.08); border-radius:12px; cursor:pointer }
        .navtab.on{ background: rgba(255,255,255,0.2) }
        .top-cta{ display:flex; gap:.4rem }
        .btn-cta{ border:none; background: linear-gradient(135deg,#6C63FF,#8B5CF6); color:#0b0d1a; font-weight:700; border-radius:12px; padding:.45rem .7rem; cursor:pointer }
        .btn-solid{ border:1px solid var(--b2); background: rgba(255,255,255,0.2); border-radius:12px; padding:.45rem .7rem; color:var(--fg); font-weight:600; cursor:pointer }
        .btn{ border:1px solid var(--b2); background: rgba(255,255,255,0.1); border-radius:10px; padding:.35rem .6rem; color:var(--fg); cursor:pointer }
        .tab-wrap{ padding:1rem .75rem 2rem; max-width:1120px; margin:0 auto }
        .search-row{ display:flex; gap:.6rem; margin:.5rem 0 }
        .search{ flex:1; display:flex; align-items:center; gap:.5rem; border:1px solid var(--b2); background: rgba(255,255,255,0.1); border-radius:16px; padding:.6rem .8rem }
        .search input{ flex:1; background:transparent; border:0; outline:0; color:var(--fg) }
        .grid{ display:grid; grid-template-columns:repeat(1,minmax(0,1fr)); gap:16px; padding: .5rem 0 2rem }
        @media(min-width:700px){ .grid{ grid-template-columns: repeat(2,1fr) } }
        @media(min-width:1024px){ .grid{ grid-template-columns: repeat(3,1fr) } }
        .grid.four{ grid-template-columns: repeat(2,1fr) }
        @media(min-width:900px){ .grid.four{ grid-template-columns: repeat(4,1fr) } }
        .card{ overflow:hidden; padding:0; }
        .card-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:16px }
        .card-title{ margin:0; font-weight:700 }
        .card-sub{ font-size:.84rem; opacity:.9 }
        .card-right{ display:flex; flex-direction:column; align-items:flex-end; gap:.35rem }
        .card-body{ padding:0 16px 16px }
        .card-summary{ margin:.25rem 0 .4rem; font-size:.95rem }
        .chip{ display:inline-flex; align-items:center; gap:.35rem; padding:.25rem .5rem; background: rgba(255,255,255,0.12); border:1px solid var(--b2); border-radius:999px; font-size:.75rem }
        .chip-soft{ background: rgba(255,255,255,0.08); padding:.15rem .4rem; border-radius:8px }
        .badge{ font-size:.75rem; padding:.25rem .5rem; border-radius:999px; border:1px solid var(--b2) }
        .badge-glass{ background: rgba(255,255,255,0.12) }
        .badge-solid{ background: rgba(255,255,255,0.2); font-weight:600 }
        .card-comps{ display:flex; align-items:center; gap:.35rem; flex-wrap:wrap }
        .pipe-wrap{ display:flex; flex-direction:column; gap:.35rem; margin-top:.4rem }
        .pipe-row{ display:flex; align-items:center; gap:.5rem }
        .pipe-label{ min-width:72px; font-size:.72rem; opacity:.9 }
        .pipe-bar{ position:relative; flex:1; height:10px; border-radius:999px; background: rgba(255,255,255,0.06); overflow:hidden }
        .pipe-fill{ position:absolute; inset:0 auto 0 0; background: linear-gradient(90deg, rgba(108,99,255,0.85), rgba(45,212,191,0.75), rgba(236,72,153,0.75)); border-radius:999px; box-shadow: 0 6px 18px rgba(99,102,241,0.18) }
        .pipe-shimmer{ position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); animation:shimmer 2.5s linear infinite }
        @keyframes shimmer{ 0%{ transform:translateX(-100%) } 100%{ transform:translateX(100%) } }
        .cat-chips{ display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.35rem }
        .risk-high{ background: rgba(244,63,94,0.72) }
        .risk-mid{ background: rgba(245,158,11,0.72) }
        .risk-low{ background: rgba(16,185,129,0.72) }
        .doc-refs{ display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.4rem }
        .doc-pill{ display:inline-flex; align-items:center; gap:.25rem; padding:.25rem .5rem; border:1px solid var(--b2); background: rgba(255,255,255,0.1); border-radius:999px; color:var(--fg); text-decoration:none }
        .modal-root{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center }
        .backdrop{ position:absolute; inset:0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px) }
        .modal{ position:relative; width:min(960px,94vw); max-height:88vh; overflow:auto; padding:16px 18px 20px; border-radius:18px }
        .modal-title{ margin:4px 0 6px; font-size:1.35rem; font-weight:700 }
        .meta{ display:flex; gap:.5rem; flex-wrap:wrap; margin:.25rem 0 }
        .section{ margin-top:1rem }
        .bullets{ margin:.25rem 0; padding-left:18px }
        .chat{ background: rgba(255,255,255,0.05); border:1px solid var(--b2); border-radius:12px; padding:.6rem }
        .log{ max-height:160px; overflow:auto; padding-right:6px }
        .bubble{ padding:.5rem .6rem; border-radius:10px; margin:.25rem 0 }
        .user{ background: rgba(139,92,246,0.35); text-align:right }
        .bot{ background: rgba(255,255,255,0.08) }
        .chat-row{ display:flex; gap:.5rem; margin-top:.5rem }
        .input{ flex:1; background: rgba(255,255,255,0.08); border:1px solid var(--b2); color:var(--fg); border-radius:10px; padding:.5rem .6rem }
        /* HOME */
        .home .hero{ position:relative; min-height:44vh; display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1rem .75rem }
        .brandmark{ position:relative; display:flex; align-items:center; gap:12px; padding:.75rem 1rem; border-radius:18px }
        .brandmark .logo{ width:80px; height:80px; display:flex; align-items:center; justify-content:center; filter: drop-shadow(0 6px 30px rgba(255,0,0,0.35)) }
        .brandmark .brand-text{ font-size:2rem; font-weight:900; letter-spacing:.04em; background: radial-gradient(circle at 50% 30%, rgba(255,80,80,0.9), rgba(255,80,80,0.15)); -webkit-background-clip:text; background-clip:text; color:transparent }
        .brandmark .particles span{ position:absolute; width:3px; height:3px; border-radius:50%; background: rgba(255,255,255,0.25); animation: float 6s ease-in-out infinite }
        @keyframes float{ 0%{ transform: translateY(0)} 50%{ transform: translateY(-8px)} 100%{ transform: translateY(0)} }
        .home .cta{ display:flex; gap:.5rem }
        .pulse-card{ padding:1rem; text-align:center; border:1px solid var(--b2); background: rgba(255,255,255,0.06); border-radius:14px }
        .mini-cal{ padding:.6rem; border-radius:16px }
        .mini-row{ display:grid; grid-template-columns: repeat(7,1fr); gap:.5rem }
        .mini-cell{ border:1px solid var(--b2); background: rgba(255,255,255,0.05); border-radius:12px; padding:.35rem }
        .mini-date{ font-size:.74rem; opacity:.9 }
        .mini-events{ display:flex; flex-direction:column; gap:.25rem; margin-top:.25rem }
        .mini-pill{ font-size:.7rem; padding:.15rem .35rem; border-radius:999px; color:#0b0d1a }
        .mini-more{ font-size:.7rem; opacity:.8 }
      `}</style>
    </div>
  );
}
