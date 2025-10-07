import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MASTER SITE — GGets Aurora (Home · Science · Policy)
 *
 * Home: GlassDynamics particle hero (associating/dissociating sand → GG), News panel (brand-colored badges),
 *        full Catalyst Calendar (polished) replacing mini ribbon.
 * Science: MEGA indication explorer (cards → modal, RAG, export)
 * Policy: PRVs / FDA-AA / CBER GT / Orphan / PDUFA — curated briefs + doc chips
 *
 * Build-safe single file. No external UI libs. All styles within <style>.
 * Optional adapters: { searchIndications, ragAsk, onOpenDoc, getExclusivity, calendarEvents, fetchNews }
 */

/****************************
 * Icons (inline SVG)
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
};

/****************************
 * Utilities & Shared Data
 ****************************/
const classNames = (...xs)=> xs.filter(Boolean).join(' ');
function useDebounced(v,ms=200){ const [x,setX]=useState(v); useEffect(()=>{ const id=setTimeout(()=>setX(v),ms); return ()=>clearTimeout(id); },[v,ms]); return x; }
const fuzzyIncludes = (h,n)=> String(h||'').toLowerCase().includes(String(n||'').trim().toLowerCase());

// Documents
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
 * Normalization, classifier, mockRAG, printable
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
 * HOME tab — Particle hero + News panel + Calendar
 ****************************/
function ParticleHeroGG(){
  const canvasRef = useRef(null);
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{ setMounted(true); },[]);
  useEffect(()=>{
    if (!mounted) return; const canvas=canvasRef.current; if(!canvas) return; const ctx=canvas.getContext('2d');
    let W=canvas.clientWidth, H=canvas.clientHeight; canvas.width=W; canvas.height=H;
    // draw GG text into offscreen to get target points
    const off=document.createElement('canvas'); off.width=W; off.height=H; const ox=off.getContext('2d');
    const grad=ox.createLinearGradient(W*0.3,0,W*0.7,H); grad.addColorStop(0,'#6EE7F7'); grad.addColorStop(1,'#7C3AED');
    ox.fillStyle=grad; ox.textAlign='center'; ox.textBaseline='middle'; ox.font=`${Math.floor(Math.min(W,H)*0.34)}px Helvetica, Arial, sans-serif`;
    ox.fillText('GG', W/2, H/2);
    const img=ox.getImageData(0,0,W,H).data;
    const pts=[]; const step=5; // particle density
    for(let y=0;y<H;y+=step){ for(let x=0;x<W;x+=step){ const i=(y*W+x)*4+3; if(img[i]>80){ pts.push({x,y}); } } }
    // particles start scattered
    const N=pts.length; const prts=Array.from({length:N},(_,i)=>({ x:Math.random()*W, y:Math.random()*H, tx:pts[i].x, ty:pts[i].y, vx:0, vy:0 }));
    let t=0, running=true; const RAF=()=>{ if(!running) return; t+=1/60; ctx.clearRect(0,0,W,H);
      // background glow
      const g=ctx.createRadialGradient(W/2,H*0.45,10,W/2,H*0.45,Math.max(W,H)*0.6); g.addColorStop(0,'rgba(124,58,237,0.18)'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      for(const p of prts){ // association phase then gentle drift
        const assoc=t<4; const k=assoc?0.08:0.014; const damp=assoc?0.85:0.98; const dx=p.tx-p.x, dy=p.ty-p.y; p.vx=p.vx*k*dx + p.vx*damp; p.vy=p.vy*k*dy + p.vy*damp; p.x+=p.vx; p.y+=p.vy + Math.sin((p.x+p.y+t*30)/60)* (assoc?0.1:0.6);
        // draw
        const hue=200 + (p.tx/W)*80; ctx.fillStyle=`hsla(${hue},85%,${assoc?70:75}%,${assoc?0.10:0.22})`; ctx.fillRect(p.x,p.y,2,2);
      }
      requestAnimationFrame(RAF);
    };
    const id=requestAnimationFrame(RAF);
    const onResize=()=>{ W=canvas.clientWidth; H=canvas.clientHeight; canvas.width=W; canvas.height=H; };
    window.addEventListener('resize',onResize);
    return ()=>{ cancelAnimationFrame(id); running=false; window.removeEventListener('resize',onResize); };
  },[mounted]);
  return (<div className="particle-hero glass"><canvas ref={canvasRef} className="particle-canvas"/></div>);
}

const NEWS_BRANDS = {
  'Fierce Biotech': { color:'#D0021B', fg:'#fff' },
  'Fierce Pharma': { color:'#D0021B', fg:'#fff' },
  'ScienceDaily': { color:'#0C5DB3', fg:'#fff' },
  'Endpoints': { color:'#6C63FF', fg:'#fff' },
  'Default': { color:'#444', fg:'#fff' },
};
const MOCK_NEWS=[
  { id:'n1', source:'Fierce Biotech', title:'TL1A program kicks off phase 3 in UC', author:'J. Reporter', publishedAt:'2025-10-01T09:12:00Z', url:'#' },
  { id:'n2', source:'Fierce Pharma', title:'Obesity: new outcomes readout scheduled for Q4', author:'C. Writer', publishedAt:'2025-10-01T06:45:00Z', url:'#' },
  { id:'n3', source:'ScienceDaily', title:'Microglial TREM2 modulation advances in Alzheimer’s models', author:'Science Desk', publishedAt:'2025-09-30T14:05:00Z', url:'#' },
];
function NewsPanel({ adapters }){
  const [news,setNews]=useState(MOCK_NEWS);
  useEffect(()=>{ let mounted=true; (async()=>{ try{ if(adapters?.fetchNews){ const n = await adapters.fetchNews(['ibd','obesity','rare','oph','cardio']); if(mounted && Array.isArray(n) && n.length) setNews(n); } }catch(_){/* keep mock */} })(); return ()=>{ mounted=false }; },[adapters]);
  return (
    <div className="news glass">
      <div className="news-head">Latest Science & Biopharma</div>
      <div className="news-grid">
        {news.map(it=>{ const meta=NEWS_BRANDS[it.source]||NEWS_BRANDS.Default; return (
          <a key={it.id} className="news-card" href={it.url} target="_blank" rel="noreferrer">
            <div className="news-badge" style={{background:meta.color, color:meta.fg}}>{it.source}</div>
            <div className="news-title">{it.title}</div>
            <div className="news-meta">{it.author ? `${it.author} · `:''}{new Date(it.publishedAt).toLocaleString()}</div>
          </a>
        ); })}
      </div>
    </div>
  );
}

/****************************
 * Catalyst Calendar (full) — adapted from your calendar file
 ****************************/
// Helpers: dates
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfWeek(d, weekStartsOn=1){ const x=new Date(d); const day=x.getDay(); const diff=(day<weekStartsOn?7:0)+day-weekStartsOn; x.setDate(x.getDate()-diff); x.setHours(0,0,0,0); return x; }
function fmt(d){ return d.toLocaleDateString(undefined,{month:'short', day:'2-digit'}); }

const KIND_META={ regulatory:{label:'Reg', color:'#F43F5E'}, data:{label:'Data', color:'#6C63FF'}, conference:{label:'Conf', color:'#38BDF8'}, earnings:{label:'EPS', color:'#10B981'}, other:{label:'Other', color:'#D946EF'} };

function DayCell({ date, isToday, events }){
  const cap=5; const shown=events.slice(0,cap); const more=Math.max(0, events.length-cap);
  return (
    <div className="cal-cell">
      <div className="cal-card glass">
        <div className="cal-head"><div className={classNames('cal-date', isToday&&'cal-today')}>{fmt(date)}</div>{isToday&&<div className="cal-chip">Today</div>}</div>
        <div className="cal-events">
          {shown.map((e,i)=>{ const m=KIND_META[e.kind]||KIND_META.other; return (
            <a key={i} href={e.url||'#'} className="cal-evt">
              <span className="cal-sym">{String(e.symbol||'').slice(0,5)}</span>
              <span className="cal-title">{e.title}</span>
              <span className="cal-kind" style={{borderColor:m.color, color:m.color}}>{m.label}</span>
            </a>
          ); })}
          {more>0 && <div className="cal-more">+{more} more</div>}
        </div>
      </div>
      {isToday && <div className="cal-glow" aria-hidden/>}
    </div>
  );
}

function CatalystCalendar({ events }){
  const today=new Date(); const start=startOfWeek(addDays(today,-7)); const days=Array.from({length:28},(_,i)=>addDays(start,i));
  const byKey = useMemo(()=>{ const map=new Map(); for(const e of (events||[])){ const k=new Date(e.date+'T00:00:00').toISOString().slice(0,10); const arr=map.get(k)||[]; arr.push(e); map.set(k,arr); } return map; },[events]);
  const title=`${fmt(days[0])} → ${fmt(days[days.length-1])}`;
  return (
    <div className="cal-wrap">
      <div className="cal-top">
        <div>
          <div className="cal-eyebrow">Biotech · Upcoming Catalysts</div>
          <div className="cal-title">Catalyst Calendar</div>
          <div className="cal-sub">Window: {title} · 1 wk back · 3 wk ahead · max 5/day</div>
        </div>
      </div>
      <div className="cal-grid glass">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=> <div key={d} className="cal-dow">{d}</div>)}
        {days.map(d=>{ const k=d.toISOString().slice(0,10); const ev=(byKey.get(k)||[]); const isToday = (new Date().toDateString()===d.toDateString()); return <DayCell key={k} date={d} isToday={isToday} events={ev}/>; })}
      </div>
      <div className="cal-legend">
        {Object.entries(KIND_META).map(([k,m])=> (<div key={k} className="cal-legend-item"><span className="cal-dot" style={{background:m.color}}/> {m.label}</div>))}
      </div>
    </div>
  );
}

/****************************
 * HOME Tab
 ****************************/
function HomeTab({ onOpenScience, onOpenCalendar, adapters }){
  // News
  return (
    <div className="tab-wrap home">
      <div className="hero">
        <ParticleHeroGG/>
        <div className="cta sticky-cta"><button className="btn-cta" onClick={onOpenScience}>Open Science</button><button className="btn-solid" onClick={onOpenCalendar}>View Today’s Catalysts</button></div>
      </div>
      <NewsPanel adapters={adapters}/>
      <div className="section"><h3>Upcoming Catalysts</h3><CatalystCalendar events={adapters?.calendarEvents || []}/></div>
    </div>
  );
}

/****************************
 * MASTER APP
 ****************************/
export default function MasterApp({ adapters }){
  const [tab,setTab]=useState('home');
  useEffect(()=>{ const onKey=(e)=>{ if(e.key==='/' && (e.target||{}).tagName!=='INPUT') setTab('science'); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[]);
  return (
    <div className="site-root">
      <header className="stickybar glass"><div className="brandpack"><Icon.Sparkles/> GGets Aurora</div><nav className="tabsbar"><button className={classNames('navtab',tab==='home'&&'on')} onClick={()=>setTab('home')}>Home</button><button className={classNames('navtab',tab==='science'&&'on')} onClick={()=>setTab('science')}>Science</button><button className={classNames('navtab',tab==='policy'&&'on')} onClick={()=>setTab('policy')}>Policy</button></nav><div className="top-cta"><button className="btn-cta" onClick={()=>setTab('science')}>Open Science</button></div></header>
      <main className="mainwrap">
        {tab==='home' && <HomeTab adapters={adapters} onOpenScience={()=>setTab('science')} onOpenCalendar={()=>setTab('science')}/>}
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
        .card{ overflow:hidden; padding:0 }
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
        .risk-high{ background: rgba(244,63,94,0.72) } .risk-mid{ background: rgba(245,158,11,0.72) } .risk-low{ background: rgba(16,185,129,0.72) }
        .doc-refs{ display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.4rem }
        .doc-pill{ display:inline-flex; align-items:center; gap:.25rem; padding:.25rem .5rem; border:1px solid var(--b2); background: rgba(255,255,255,0.1); border-radius:999px; color:var(--fg); text-decoration:none }
        .modal-root{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center } .backdrop{ position:absolute; inset:0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px) }
        .modal{ position:relative; width:min(960px,94vw); max-height:88vh; overflow:auto; padding:16px 18px 20px; border-radius:18px }
        .modal-title{ margin:4px 0 6px; font-size:1.35rem; font-weight:700 } .meta{ display:flex; gap:.5rem; flex-wrap:wrap; margin:.25rem 0 } .section{ margin-top:1rem }
        .bullets{ margin:.25rem 0; padding-left:18px } .chat{ background: rgba(255,255,255,0.05); border:1px solid var(--b2); border-radius:12px; padding:.6rem }
        .log{ max-height:160px; overflow:auto; padding-right:6px } .bubble{ padding:.5rem .6rem; border-radius:10px; margin:.25rem 0 } .user{ background: rgba(139,92,246,0.35); text-align:right } .bot{ background: rgba(255,255,255,0.08) }
        .chat-row{ display:flex; gap:.5rem; margin-top:.5rem } .input{ flex:1; background: rgba(255,255,255,0.08); border:1px solid var(--b2); color:var(--fg); border-radius:10px; padding:.5rem .6rem }
        /* HOME */
        .home .hero{ position:relative; min-height:44vh; display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1rem .75rem }
        .particle-hero{ position:relative; border:1px solid var(--b2); border-radius:18px; overflow:hidden; min-height:240px; width:100%; background: radial-gradient(900px 600px at 10% 15%, rgba(139,92,246,0.18), transparent), radial-gradient(700px 500px at 90% 85%, rgba(56,189,248,0.14), transparent) }
        .particle-canvas{ width:100%; height:100%; display:block }
        .sticky-cta{ position:sticky; top:.75rem; align-self:flex-start; display:flex; gap:.5rem }
        .news{ margin-top:1rem; padding:12px; border-radius:16px }
        .news-head{ font-weight:700; margin:.25rem 0 .6rem }
        .news-grid{ display:grid; grid-template-columns: repeat(1,minmax(0,1fr)); gap:.6rem } @media(min-width:800px){ .news-grid{ grid-template-columns: repeat(3,1fr) } }
        .news-card{ border:1px solid var(--b2); background: rgba(255,255,255,0.06); border-radius:14px; padding:10px; color:var(--fg); text-decoration:none; display:block }
        .news-badge{ display:inline-block; padding:.22rem .45rem; border-radius:6px; font-weight:800; letter-spacing:.2px; margin-bottom:.35rem }
        .news-title{ font-size:.98rem; font-weight:700; line-height:1.25 }
        .news-meta{ margin-top:.2rem; font-size:.8rem; opacity:.8 }
        /* Calendar */
        .cal-wrap{ margin-top:1rem }
        .cal-top{ display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; margin-bottom:.6rem }
        .cal-eyebrow{ font-size:.72rem; opacity:.75; text-transform:uppercase; letter-spacing:.15em }
        .cal-title{ font-size:1.6rem; font-weight:800 }
        .cal-sub{ font-size:.85rem; opacity:.8 }
        .cal-grid{ padding:12px; border-radius:18px }
        .cal-dow{ text-align:center; font-size:.72rem; opacity:.7; padding:.2rem 0 }
        .cal-cell{ position:relative }
        .cal-card{ padding:8px; border-radius:14px; margin:4px 0 }
        .cal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:.25rem }
        .cal-date{ font-size:.74rem; font-weight:700; opacity:.9 } .cal-today{ color:#fff }
        .cal-chip{ font-size:.68rem; padding:.1rem .35rem; border-radius:999px; background: linear-gradient(90deg, rgba(108,99,255,0.12), rgba(139,92,246,0.08)); border:1px solid rgba(255,255,255,0.12) }
        .cal-events{ display:flex; flex-direction:column; gap:.25rem }
        .cal-evt{ display:flex; align-items:center; gap:.35rem; border:1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.04); border-radius:10px; padding:.25rem .35rem; color:var(--fg); text-decoration:none }
        .cal-sym{ min-width:28px; text-align:center; font-weight:700; font-size:.72rem; background: rgba(255,255,255,0.06); border-radius:6px }
        .cal-title{ flex:1; font-size:.82rem }
        .cal-kind{ font-size:.72rem; padding:.05rem .35rem; border-radius:999px; border:1px solid currentColor }
        .cal-more{ font-size:.72rem; opacity:.75; margin-top:.15rem }
        .cal-legend{ display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.6rem; font-size:.8rem; opacity:.9 }
        .cal-legend-item{ display:flex; align-items:center; gap:.25rem }
        .cal-dot{ width:10px; height:10px; border-radius:10px }
        .cal-glow{ position:absolute; inset:0; border-radius:14px; background: radial-gradient(60% 60% at 50% 40%, rgba(108,99,255,0.14), transparent 40%); filter: blur(18px); z-index:-1 }
      `}</style>
    </div>
  );
}
