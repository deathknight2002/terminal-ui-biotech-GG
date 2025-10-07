import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Aurora Science Tab — MEGA Edition (merged, hardened)
 *
 * Combines the best of both:
 *  - From my original: build-safe single-file, zero external UI deps, normalized data, robust RAG, details modal, PDF/PPT exports, self-tests.
 *  - From your upgraded version: animated pipeline bars, catalyst art/chips, tags, sponsors + exclusivity badge, fuzzy search scoring,
 *    keyboard shortcuts (/ to focus search, ⌘/Ctrl+K to open RAG), tabs, help chip, ranked merging with external search.
 *
 * Fix for reported crash: ensure `mockRAG` always receives a fully-normalized item.
 *  - DetailsModal normalizes via normalizeIndication()
 *  - mockRAG() also normalizes internally (double-guard)
 *  - All array joins / maps are guarded
 *
 * Build fixes:
 *  - Use plain <style> (not styled-jsx) for non-Next bundlers
 *  - Fixed accidental `and` → `&&` in expressions
 */

/****************************
 * Types (JSDoc for clarity)
 ****************************/
/** @typedef {{ id:string, label:string, date:string, risk:'High'|'Medium'|'Low', artStyle?:'ripple'|'spark'|'bar' }} Catalyst */
/** @typedef {{ name:string, progress:number }} PipelineStage */
/** @typedef {{ name:string, type:'Big Pharma'|'SMid'|'Biotech'|'China Pharma'|'Academic'|'Unknown', exclusivityUntil?:string }} Sponsor */
/** @typedef {{ id:string, name:string, area:string, summary:string, competitors:string[], tags:string[], catalysts:Catalyst[], pipeline:PipelineStage[], refs?:string[], sponsors?:Sponsor[] }} Indication */
/** @typedef {{ id:string, title:string, url?:string, pages?:number, date?:string, highlights?:string[] }} LauraDoc */
/** @typedef {{ searchIndications?:(q:string)=>Promise<string[]>, ragAsk?:(q:string, docIds?:string[])=>Promise<{answer:string,cites?:{docId:string,snippet:string}[] }>, onOpenDoc?:(id:string)=>void, getExclusivity?:(drug:string)=>Promise<{ drug:string, exclusivityUntil?:string }|null> }} Adapters */

/****************************
 * Inline SVG Icons (minimal)
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
};

/****************************
 * Utils
 ****************************/
const classNames = (...xs)=> xs.filter(Boolean).join(' ');
function useDebounced(value, ms=200){
  const [v,setV] = useState(value);
  useEffect(()=>{ const id=setTimeout(()=>setV(value), ms); return ()=>clearTimeout(id); },[value,ms]);
  return v;
}
const fuzzyIncludes = (hay, needle)=> String(hay||'').toLowerCase().includes(String(needle||'').trim().toLowerCase());

/****************************
 * Mock data (merge of both worlds)
 ****************************/
const MOCK_DOCS = [
  { id:"doc-1", title:"EGFRm NSCLC Landscape — Laura v1", url:"https://example.com/egfrm.pdf", pages:42, date:"2025-07-14", highlights:["Resistance post-osimertinib","C797S combinations"] },
  { id:"doc-2", title:"ADC entrants — 2025Q3 deep dive", url:"https://example.com/adc_q3.pdf", pages:28, date:"2025-09-01", highlights:["Bystander effect","DAR optimization"] },
  { id:"doc-3", title:"AD Neuroinflammation — pathway map", url:"https://example.com/ad_neuro.pdf", pages:55, date:"2025-06-02", highlights:["TREM2 signaling","CSF readthrough"] },
  { id:"doc-ibd", title:"Leerink IBD Primer (Mar 2025)", url:"https://example.com/leer_ibd_mar25.pdf", pages:186, date:"2025-03-17", highlights:["TL1A/DR3 programs","Combination strategies","Oral IL-23R"] },
  { id:"doc-dmd", title:"Leerink DMD Primer (Apr 2025)", url:"https://example.com/leer_dmd_apr25.pdf", pages:62, date:"2025-04-21", highlights:["Elevidys launch","Next-gen gene therapies","AOC exon skippers"] },
  { id:"doc-cardio", title:"Leerink Cardiology Primer (Mar 2025)", url:"https://example.com/leer_cardio_mar25.pdf", pages:26, date:"2025-03-24", highlights:["Lp(a) outcomes","Oral PCSK9","HFpEF endpoints"] },
  { id:"doc-prv", title:"CG PRV Program Primer (Sep 2025)", url:"https://example.com/cg_prv_sep25.pdf", pages:24, date:"2025-09-08", highlights:["RPD deadlines","Voucher pricing","Give Kids a Chance Act"] },
  { id:"doc-npdr", title:"DR/NPDR & DME Primer (Sep 2025)", url:"https://example.com/npdr_sep25.pdf", pages:16, date:"2025-09-25", highlights:["AXPAXLI durability","Gene therapy suprachoroidal","DRSS endpoints"] }
];

const MOCK_INDICATIONS = [
  // Oncology
  {
    id: "nscalc-egfrm",
    name: "Metastatic NSCLC (EGFRm)",
    area: "Oncology",
    summary: "Targeted therapy, post‑EGFR TKI resistance (e.g., C797S); ADCs/bispecifics expanding options.",
    competitors: ["AstraZeneca (osimertinib)", "Daiichi/AZ (Datopotamab deruxtecan)", "J&J (amivantamab)"] ,
    tags: ["EGFR","TKI","ADC","TROP2"],
    catalysts: [
      { id:"eg-1", label:"Dato-DXd label expansions", date:"2025-12-20", risk:"Medium", artStyle:"bar" },
      { id:"eg-2", label:"Post-osi combo data", date:"2026-03-15", risk:"High", artStyle:"ripple" }
    ],
    pipeline: [ { name:"Preclinical", progress:1 }, { name:"Ph1", progress:1 }, { name:"Ph2", progress:.7 }, { name:"Ph3", progress:.3 }, { name:"Filed", progress:0 }, { name:"Approved", progress:.2 } ],
    refs:["doc-1","doc-2"]
  },
  // Neurology
  {
    id:"ad-nflam",
    name:"Alzheimer's (neuroinflammation)",
    area:"Neurology",
    summary:"Beyond amyloid: microglial/TREM2 pathways and complement inhibition in mid‑stage testing.",
    competitors:["Biogen","Eli Lilly","Denali","ALX"],
    tags:["TREM2","Microglia","Complement"],
    catalysts:[ { id:"ad-1", label:"Biomarker‑driven Ph2", date:"2026-01-20", risk:"High", artStyle:"bar" } ],
    pipeline:[ { name:"Preclinical", progress:1 }, { name:"Ph1", progress:1 }, { name:"Ph2", progress:.35 }, { name:"Ph3", progress:0 }, { name:"Filed", progress:0 }, { name:"Approved", progress:0 } ],
    refs:["doc-3"]
  },
  // Rare / Neuromuscular
  {
    id:"dmd",
    name:"Duchenne Muscular Dystrophy (DMD)",
    area:"Rare / Neuromuscular",
    summary:"Microdystrophin AAVs, exon skipping, and AOC strategies; durability and access drive value.",
    competitors:["Sarepta/Roche (Elevidys)","Regenxbio/AbbVie (RGX‑202)","Solid Bio (SGT‑003)","Avidity (AOC)"],
    tags:["AAV","microdystrophin","exon skipping","AOC"],
    catalysts:[ { id:"dmd-1", label:"RGX‑202 pivotal readout (est.)", date:"2026-06-30", risk:"Medium", artStyle:"ripple" } ],
    pipeline:[ { name:"Preclinical", progress:1 },{ name:"Ph1", progress:1 },{ name:"Ph2", progress:1 },{ name:"Ph3", progress:.6 },{ name:"Filed", progress:0 },{ name:"Approved", progress:.2 } ],
    refs:["doc-dmd"]
  },
  {
    id:"sma",
    name:"Spinal Muscular Atrophy (SMA)",
    area:"Rare / Neuromuscular",
    summary:"Backbone therapies (nusinersen, onasemnogene, risdiplam); myostatin inhibition (apitegromab) adds function in ambulatory patients.",
    competitors:["Biogen (Spinraza)","Novartis (Zolgensma)","Roche/PTC (Evrysdi)","Scholar Rock (apitegromab)"],
    tags:["SMN","AAV","Myostatin"],
    catalysts:[ { id:"sma-1", label:"Apitegromab label path", date:"2026-02-15", risk:"Medium", artStyle:"spark" } ],
    pipeline:[ { name:"Preclinical", progress:1 }, { name:"Ph1", progress:1 }, { name:"Ph2", progress:1 }, { name:"Ph3", progress:.8 }, { name:"Filed", progress:.2 }, { name:"Approved", progress:0 } ]
  },
  // Ophthalmology
  {
    id:"npdr",
    name:"Diabetic Retinopathy (NPDR) / DME",
    area:"Ophthalmology",
    summary:"Anti‑VEGF class dominance; shift to high‑dose, sustained delivery, and in‑office gene therapy.",
    competitors:["Regeneron (Eylea HD)","Roche (Vabysmo)","Regenxbio/AbbVie (RGX‑314)","Ocular Tx (AXPAXLI)"] ,
    tags:["VEGF","Ang2","Gene Therapy","Sustained"],
    catalysts:[ { id:"np-1", label:"RGX‑314 pivotal NPDR start/updates", date:"2025-11-01", risk:"Low", artStyle:"spark" } ],
    pipeline:[ { name:"Preclinical", progress:1 },{ name:"Ph1", progress:1 },{ name:"Ph2", progress:.8 },{ name:"Ph3", progress:.4 },{ name:"Filed", progress:0 },{ name:"Approved", progress:.3 } ],
    refs:["doc-npdr"]
  },
  {
    id:"ga-dryamd",
    name:"Geographic Atrophy (dry AMD)",
    area:"Ophthalmology",
    summary:"C3/C5 inhibitors slow lesion growth (Syfovre, Izervay) but unmet need remains on vision preservation and dosing burden.",
    competitors:["Apellis (Syfovre)","Iveric Bio/Astellas (Izervay)","NGM Bio","Annexon"],
    tags:["C3","C5","Complement"],
    catalysts:[ { id:"ga-1", label:"Long‑term GA outcomes & safety", date:"2026-05-30", risk:"Medium", artStyle:"bar" } ],
    pipeline:[ { name:"Preclinical", progress:1 },{ name:"Ph1", progress:1 },{ name:"Ph2", progress:.6 },{ name:"Ph3", progress:.4 },{ name:"Filed", progress:0 },{ name:"Approved", progress:.3 } ]
  },
  // Immunology / GI
  {
    id:"ibd",
    name:"Inflammatory Bowel Disease (UC/CD)",
    area:"Immunology / Gastroenterology",
    summary:"IL‑23 class momentum, JAKs for speed/oral convenience, TL1A poised to reset efficacy bar; combos on horizon.",
    competitors:["AbbVie (Skyrizi/Rinvoq)","Roche (RVT‑3101)","Merck (tulisokibart)","Sanofi/Teva (TEV‑48574)"],
    tags:["IL‑23","TL1A","JAK","Oral"],
    catalysts:[ { id:"ibd-1", label:"TL1A Ph3 milestones", date:"2026-06-01", risk:"Medium", artStyle:"ripple" } ],
    pipeline:[ { name:"Preclinical", progress:1 },{ name:"Ph1", progress:1 },{ name:"Ph2", progress:.8 },{ name:"Ph3", progress:.5 },{ name:"Filed", progress:0 },{ name:"Approved", progress:.4 } ],
    refs:["doc-ibd"]
  },
  // Metabolic / Endocrine
  {
    id:"obesity-glp1",
    name:"Obesity & Metabolic (GLP‑1/GIP and beyond)",
    area:"Metabolic / Endocrine",
    summary:"GLP‑1/GIP incretins define the class; expanding labels (OSA, renal), CV/MASH readouts, and orals/triple agonists next.",
    competitors:["Novo Nordisk (semaglutide)","Eli Lilly (tirzepatide, orforglipron, retatrutide)","Amgen", "Pfizer"],
    tags:["GLP‑1","GIP","Triple","Oral"],
    catalysts:[ { id:"ob-1", label:"Outcomes/label expansions", date:"2025-12-31", risk:"Medium", artStyle:"bar" } ],
    pipeline:[ { name:"Preclinical", progress:1 },{ name:"Ph1", progress:1 },{ name:"Ph2", progress:.7 },{ name:"Ph3", progress:.6 },{ name:"Filed", progress:.2 },{ name:"Approved", progress:.6 } ]
  },
  {
    id:"mash-nash",
    name:"MASH / NASH",
    area:"Hepatology",
    summary:"First approval achieved (resmetirom); combination and incretin‑adjacent strategies under evaluation for fibrosis regression.",
    competitors:["Madrigal (Rezdiffra)","Akero (efruxifermin)","89bio (pegozafermin)","Viking (VK2809)"],
    tags:["THR‑β","FGF21","ACC","GLP‑1"],
    catalysts:[ { id:"na-1", label:"Post‑approval adoption & combos", date:"2025-12-15", risk:"Low", artStyle:"spark" } ],
    pipeline:[ { name:"Preclinical", progress:1 },{ name:"Ph1", progress:1 },{ name:"Ph2", progress:.7 },{ name:"Ph3", progress:.6 },{ name:"Filed", progress:.3 },{ name:"Approved", progress:.4 } ]
  },
  // Cardiology
  {
    id:"cv-lpa-oralpcsk9",
    name:"CV Risk (Lp(a), Oral PCSK9)",
    area:"Cardiometabolic",
    summary:"Outcomes in Lp(a) and the emergence of oral PCSK9 aim to broaden lipid lowering and adherence.",
    competitors:["Novartis (pelacarsen)","Amgen (olpasiran)","Merck (MK‑0616/enlicitide)","Regeneron (PCSK9 mAbs)"],
    tags:["Lp(a)","Oral PCSK9","MACE"],
    catalysts:[ { id:"cv-1", label:"CORALreef/Outcomes data & filings", date:"2025-11-15", risk:"Medium", artStyle:"bar" } ],
    pipeline:[ { name:"Preclinical", progress:1 },{ name:"Ph1", progress:1 },{ name:"Ph2", progress:.8 },{ name:"Ph3", progress:.7 },{ name:"Filed", progress:.3 },{ name:"Approved", progress:.4 } ],
    refs:["doc-cardio"]
  }
];

/****************************
 * Core helpers: normalization, stage classification, export, RAG mock
 ****************************/
function normalizeIndication(raw){
  const r = raw || {};
  return {
    id: String(r.id || 'unknown'),
    name: String(r.name || 'Unknown Indication'),
    area: String(r.area || 'Unspecified'),
    summary: String(r.summary || 'No summary available.'),
    competitors: Array.isArray(r.competitors)? r.competitors.map(String) : [],
    tags: Array.isArray(r.tags)? r.tags.map(String) : [],
    catalysts: Array.isArray(r.catalysts)? r.catalysts.map(c=>({ id:String(c?.id||Math.random()), label:String(c?.label||'—'), date:c?.date||new Date().toISOString().slice(0,10), risk:(c?.risk==='High'||c?.risk==='Medium')?c.risk:'Low', artStyle:(c?.artStyle==='ripple'||c?.artStyle==='spark')?c.artStyle:'bar' })) : [],
    pipeline: Array.isArray(r.pipeline)? r.pipeline.map(s=>({ name:String(s?.name||'Stage'), progress:Math.max(0, Math.min(1, Number(s?.progress||0))) })) : [],
    refs: Array.isArray(r.refs)? r.refs.map(String) : [],
    sponsors: Array.isArray(r.sponsors)? r.sponsors.map(s=>({ name:String(s?.name||'—'), type: s?.type||'Unknown', exclusivityUntil:s?.exclusivityUntil })) : []
  };
}

function classifyStage(stages){
  const weights = { Preclinical: 0.1, Ph1: 0.2, Ph2: 0.3, Ph3: 0.4, Filed: 0.5, Approved: 0.6 };
  const avg = (stages||[]).reduce((acc,s)=> acc + ((s.progress||0) * (weights[s.name]??0.25)), 0);
  if (avg < 0.2) return 'Early'; if (avg < 0.45) return 'Mid'; return 'Late';
}

function mockRAG(item, q){
  const it = normalizeIndication(item);
  const lower = String(q||'').toLowerCase();
  if (!lower) return `Quick take: ${it.summary}`;
  if (lower.includes('endpoint')||lower.includes('measure')) return `Endpoints vary; track function/biomarkers per program.`;
  if (lower.includes('competitor')||lower.includes('company')||lower.includes('drug')) return it.competitors.length? `Top comps: ${it.competitors.slice(0,3).join(', ')}.` : `No comp data.`;
  if (lower.includes('catalyst')||lower.includes('readout')||lower.includes('pdufa')) return it.catalysts.length? `Next catalysts: ${it.catalysts.map(ev=>`${new Date(ev.date).toLocaleDateString()} – ${ev.label}`).join(' | ')}` : `No catalysts listed.`;
  return `Quick take: ${it.summary}`;
}

function printableHTML(i){
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(i.name)}</title>
  <style>body{font-family:system-ui,Segoe UI,Roboto,Inter,Arial;margin:24px;line-height:1.4}h1{margin:0 0 6px}h2{margin:18px 0 8px}.muted{color:#333}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}ul{margin:0;padding-left:18px}</style></head><body>
  <h1>${escapeHtml(i.name)}</h1>
  <div class="muted">Area: ${escapeHtml(i.area)}</div>
  <h2>Summary</h2><p>${escapeHtml(i.summary)}</p>
  <h2>Competitors</h2><ul>${i.competitors.map(c=>`<li>${escapeHtml(c)}</li>`).join('')}</ul>
  <h2>Catalysts</h2><ul>${i.catalysts.map(ev=>`<li>${new Date(ev.date).toLocaleDateString()} — ${escapeHtml(ev.label)}</li>`).join('')}</ul>
  </body></html>`;
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }

/****************************
 * Catalyst visuals & pipeline
 ****************************/
function AnimatedPipeline({ stages }){
  const items = Array.isArray(stages)? stages: [];
  return (
    <div className="pipe-wrap" aria-hidden>
      {items.map((s, i)=> (
        <div key={s.name+String(i)} className="pipe-row">
          <div className="pipe-label">{s.name}</div>
          <div className="pipe-bar">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(Math.max(0,Math.min(1,s.progress||0))*100)}%` }} transition={{ duration: 1.1 + i*0.12, ease:'easeOut' }} className="pipe-fill" />
            <div className="pipe-shimmer" />
          </div>
          <div className="pipe-pct">{Math.round((s.progress||0)*100)}%</div>
        </div>
      ))}
    </div>
  );
}

function CatalystArt({ catalysts }){
  const cats = Array.isArray(catalysts)? catalysts: [];
  return (
    <div className="cat-art">
      {cats.map((c, idx)=> (
        <div key={c.id||idx} className="cat-chip">
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
            <defs>
              <radialGradient id={`g-${c.id||idx}`} cx="30%" cy="20%">
                <stop offset="0%" stopColor={c.risk==='High'? '#ff7a7a' : c.risk==='Medium'? '#ffd36b' : '#7ef7b5'} stopOpacity="0.95" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
              </radialGradient>
            </defs>
            {c.artStyle==='ripple' && (<g><circle cx="20" cy="20" r={10+(idx%3)*2} fill={`url(#g-${c.id||idx})`} opacity="0.9" /><circle cx="20" cy="20" r={5} fill="white" opacity="0.06" /></g>)}
            {c.artStyle==='spark' && (<g><polygon points="20,6 24,20 20,34 16,20" fill={`url(#g-${c.id||idx})`} opacity="0.95" /><circle cx="20" cy="20" r={4} fill="white" opacity="0.06" /></g>)}
            {(!c.artStyle||c.artStyle==='bar') && (<g><rect x="6" y="12" width="28" height="16" rx="4" fill={`url(#g-${c.id||idx})`} opacity="0.95" /><rect x="10" y="16" width={6+(idx%4)*4} height={8} rx="2" fill="white" opacity="0.06" /></g>)}
          </svg>
          <div className="cat-info">
            <span className="cat-title">{c.label}</span>
            <span className="cat-date">{new Date(c.date).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/****************************
 * Reusable bits
 ****************************/
function Badge({ children, tone='glass' }){
  return <span className={classNames('badge', tone==='glass' && 'badge-glass', tone==='solid' && 'badge-solid')}>{children}</span>;
}

function DocRefs({ docIds, docs, onOpen }){
  if (!docIds||!docIds.length) return null;
  return (
    <div className="doc-refs" aria-label="Document references">
      {docIds.map(id => {
        const d = docs.find(x=>x.id===id);
        if (!d) return null;
        return (
          <a key={id} href={d.url||'#'} target="_blank" rel="noreferrer" onClick={()=>onOpen&&onOpen(id)} className="doc-pill">
            <Icon.FileText style={{marginRight:6}}/> {d.title} <Icon.External style={{marginLeft:6, opacity:.7}}/>
          </a>
        );
      })}
    </div>
  );
}

function ExclusivityBadge({ sponsor, adapters }){
  const [live, setLive] = useState(sponsor?.exclusivityUntil);
  useEffect(()=>{
    let mounted=true;
    async function run(){
      if (!sponsor?.exclusivityUntil && adapters?.getExclusivity){
        try{ const res = await adapters.getExclusivity(sponsor.name); if (!mounted) return; setLive(res?.exclusivityUntil); }catch(_){/* ignore */}
      }
    }
    run();
    return ()=>{ mounted=false };
  },[sponsor, adapters]);
  if (!sponsor) return null;
  return (
    <div className="excl">
      <Badge>{sponsor.type}</Badge>
      <div className="excl-name">{sponsor.name}</div>
      <div className="excl-date">Excl: {live? new Date(live).toLocaleDateString() : '—'}</div>
    </div>
  );
}

/****************************
 * Indication Card (merged)
 ****************************/
function GlassIndicationCard({ ind, docs, onOpen, adapters }){
  const it = normalizeIndication(ind);
  const stage = classifyStage(it.pipeline);
  const sponsor = it.sponsors?.[0];
  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
      <article className="card glass kbd-focus" role="article" tabIndex={0} aria-labelledby={`ind-${it.id}`} onClick={onOpen} onKeyDown={(e)=>{ if(e.key==='Enter') onOpen(); }}>
        <div className="card-bg" aria-hidden>
          <div className="blob a"/><div className="blob b"/>
        </div>
        <header className="card-head">
          <div>
            <h3 id={`ind-${it.id}`} className="card-title">{it.name}</h3>
            <p className="card-sub">{it.area} · <span className="chip-soft">{stage}</span></p>
          </div>
          <div className="card-right">
            <Badge><Icon.Flask style={{marginRight:6}}/>{(it.tags||[]).slice(0,3).join(' · ')}</Badge>
            {sponsor && <ExclusivityBadge sponsor={sponsor} adapters={adapters} />}
          </div>
        </header>
        <section className="card-body">
          <p className="card-summary">{it.summary}</p>
          <div className="card-comps"><Icon.Beaker style={{marginRight:6}}/> Competitors: {(it.competitors||[]).map(c=> <span className="chip" key={c}>{c}</span>)}</div>
          <div className="card-flex">
            <div className="card-flex-left">
              <CatalystArt catalysts={it.catalysts} />
              <div className="cat-chips">{it.catalysts.map(ev=> <span key={ev.id} className={classNames('chip', ev.risk==='High'?'risk-high':ev.risk==='Medium'?'risk-mid':'risk-low')}><Icon.Timer style={{marginRight:6}}/>{ev.label} · {new Date(ev.date).toLocaleDateString()}</span>)}</div>
            </div>
            <div className="card-flex-right">
              <AnimatedPipeline stages={it.pipeline} />
            </div>
          </div>
          <DocRefs docIds={it.refs} docs={docs} onOpen={()=>{}} />
        </section>
      </article>
    </motion.div>
  );
}

/****************************
 * RAG Panel (global)
 ****************************/
function RagPanel({ docs, ask, busy }){
  const [q,setQ]=useState('');
  const [sel,setSel]=useState([]);
  const inputRef=useRef(null);
  useEffect(()=>{
    const onKey=(e)=>{ if((e.ctrlKey||e.metaKey)&& e.key.toLowerCase()==='k'){ e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey);
  },[]);
  const toggle=(id)=> setSel(s=> s.includes(id)? s.filter(x=>x!==id): [...s,id]);
  return (
    <div className="rag">
      <div className="rag-row">
        <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask RAG about mechanisms, comps, trial nuances (⌘/Ctrl+K)" className="input" aria-label="RAG question" />
        <button disabled={!q||busy} onClick={()=>ask(q, sel)} className="btn-ghost" aria-label="Send question">{busy? <span className="spin"><Icon.Loader/></span> : <Icon.Message/>}</button>
      </div>
      <div className="doc-scroll">
        {(docs||[]).map(d=> (
          <button key={d.id} className={classNames('doc-chip', sel.includes(d.id)&&'doc-chip-on')} onClick={()=>toggle(d.id)} aria-pressed={sel.includes(d.id)}>
            <Icon.FileText style={{marginRight:6}}/> {d.title}
          </button>
        ))}
      </div>
    </div>
  );
}

/****************************
 * Details Modal (keeps original deep dive + export)
 ****************************/
function DetailsModal({ item, onClose }){
  const it = useMemo(()=> normalizeIndication(item), [item]);
  const [msgs,setMsgs] = useState([{ role:'assistant', text:`Hi! Ask me about ${it.name} — endpoints, competitors, catalysts…` }]);
  const [input,setInput]=useState('');
  const send = async ()=> {
    if (!input.trim()) return; const q=input.trim(); setMsgs(m=>[...m,{role:'user',text:q}]); setInput('');
    const ans = mockRAG(it,q); await new Promise(r=>setTimeout(r, 280)); setMsgs(m=>[...m,{role:'assistant',text:ans}]);
  };
  const exportPDF = ()=>{ const w = window.open('', '_blank', 'noopener'); if(!w) return alert('Popup blocked.'); w.document.write(printableHTML(it)); w.document.close(); w.focus(); try{ w.print(); }catch(_){} };
  const exportPPT = ()=>{ const content = `# ${it.name}\n\n${it.summary}\n\nCompetitors\n- ${it.competitors.join('\n- ')}\n\nCatalysts\n- ${it.catalysts.map(ev=>`${new Date(ev.date).toLocaleDateString()} — ${ev.label}`).join('\n- ')}`; const blob=new Blob([content],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${it.id}_overview.ppt.txt`; document.body.appendChild(a); a.click(); a.remove(); };
  return (
    <div className="modal-root">
      <div className="backdrop" onClick={onClose}/>
      <motion.div className="modal glass" initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}}>
        <button className="btn" onClick={onClose} aria-label="Close" style={{position:'absolute',right:12,top:12}}><Icon.X/></button>
        <h2 className="modal-title">{it.name}</h2>
        <div className="meta"><span className="chip">{it.area}</span><span className="chip">Stage: {classifyStage(it.pipeline)}</span></div>
        <p className="muted" style={{marginTop:6}}>{it.summary}</p>
        <div className="section"><h3>Pipeline</h3><AnimatedPipeline stages={it.pipeline}/></div>
        <div className="section"><h3>Catalysts</h3><div className="cat-chips">{it.catalysts.map(ev=> <span key={ev.id} className={classNames('chip', ev.risk==='High'?'risk-high':ev.risk==='Medium'?'risk-mid':'risk-low')}><Icon.Timer style={{marginRight:6}}/>{ev.label} · {new Date(ev.date).toLocaleDateString()}</span>)}</div></div>
        <div className="section"><h3>Competitors</h3><ul className="bullets">{it.competitors.map(c=> <li key={c}>{c}</li>)}</ul></div>
        <div className="section"><h3>Ask a question</h3><div className="chat"><div className="log">{msgs.map((m,i)=> <div key={i} className={classNames('bubble', m.role==='user'?'user':'bot')}>{m.text}</div>)}</div><div className="chat-row"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }} placeholder={`Ask about ${it.name}…`} className="input"/><button onClick={send} className="btn-cta">Ask</button></div></div></div>
        <div className="section" style={{display:'flex',gap:8}}><button className="btn" onClick={exportPDF}>Export PDF (Print)</button><button className="btn" onClick={exportPPT}>Export PPT (Text)</button></div>
      </motion.div>
    </div>
  );
}

/****************************
 * Main Component (tabs, search, global RAG)
 ****************************/
export default function App({ indications=MOCK_INDICATIONS, documents=MOCK_DOCS, adapters }){
  const [query,setQuery]=useState('');
  const [ragOpen,setRagOpen]=useState(false);
  const [ragBusy,setRagBusy]=useState(false);
  const [ragAnswer,setRagAnswer]=useState(null);
  const dQuery=useDebounced(query,150);
  const searchRef=useRef(null);

  // external search merge (best-of-both ranking)
  const filteredLocal = useMemo(()=>{
    if (!dQuery) return indications;
    return indications
      .map(ind=>({ ind, score:[ind.name, ind.area, ind.summary, (ind.tags||[]).join(' '), (ind.competitors||[]).join(' ')].reduce((acc,f)=> acc + (fuzzyIncludes(f,dQuery)?1:0), 0) }))
      .filter(x=>x.score>0).sort((a,b)=> b.score-a.score).map(x=>x.ind);
  },[dQuery, indications]);

  const [searchIds,setSearchIds]=useState(null);
  useEffect(()=>{ let mounted=true; (async()=>{
    if (!adapters?.searchIndications || !dQuery){ setSearchIds(null); return; }
    try{ const ids = await adapters.searchIndications(dQuery); if(!mounted) return; setSearchIds(ids); }catch(_){ setSearchIds(null); }
  })(); return ()=>{ mounted=false } },[adapters?.searchIndications, dQuery]);

  const ranked = useMemo(()=>{
    if (!searchIds) return filteredLocal;
    const map = new Map(indications.map(i=>[i.id,i]));
    const hits = searchIds.map(id=>map.get(id)).filter(Boolean);
    const rest = filteredLocal.filter(f=> !new Set(hits.map(h=>h.id)).has(f.id));
    return [...hits, ...rest];
  },[filteredLocal, indications, searchIds]);

  const [tab,setTab]=useState('all');
  const tabbed = useMemo(()=>{
    if (tab==='onco') return ranked.filter(i=> normalizeIndication(i).area.toLowerCase().includes('onco'));
    if (tab==='neuro') return ranked.filter(i=> normalizeIndication(i).area.toLowerCase().includes('neuro'));
    if (tab==='oph') return ranked.filter(i=> normalizeIndication(i).area.toLowerCase().includes('oph')); 
    return ranked;
  },[tab, ranked]);

  // RAG
  const askRag = async (q, docIds)=>{
    setRagBusy(true);
    try{
      const res = await adapters?.ragAsk?.(q, docIds) ?? { answer:"Demo response. Wire adapters.ragAsk for real answers.", cites:(docIds||[]).map(d=>({docId:d, snippet:'Relevant passage…'})) };
      setRagAnswer({ q, ...res });
    } finally { setRagBusy(false); }
  };

  // shortcuts
  useEffect(()=>{ const onKey=(e)=>{ if(e.key==='/' && (e.target||{}).tagName!=='INPUT'){ e.preventDefault(); searchRef.current?.focus(); } if((e.ctrlKey||e.metaKey)&& e.key.toLowerCase()==='k'){ e.preventDefault(); setRagOpen(true);} }; window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey); },[]);

  const [active,setActive]=useState(null);

  return (
    <div className="root">
      {/* BG layers */}
      <div className="bg-layer" aria-hidden><div className="grad grad-a"/><div className="grad grad-b"/></div>

      {/* Header */}
      <header className="topbar">
        <div className="brand"><Icon.Sparkles/> <span>GGets Aurora · Science</span></div>
        <div className="actions">
          <button className="btn-ghost" aria-label="Grid view"><Icon.Grid/></button>
          <button className="btn-solid" onClick={()=>setRagOpen(true)} aria-label="Open RAG"><Icon.Message/> Ask RAG</button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="wrap search-row">
        <div className="search">
          <Icon.Search className="srch-ico"/>
          <input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search indications, tags, competitors… (press / to focus)" aria-label="Search"/>
        </div>
        <button className="btn-ghost" aria-label="Filters"><Icon.Filter/></button>
      </div>

      {/* Tabs */}
      <div className="wrap tabs">
        <div className="tablist" role="tablist">
          {['all','onco','neuro','oph'].map(key=> (
            <button key={key} role="tab" aria-selected={tab===key} className={classNames('tab', tab===key&&'tab-on')} onClick={()=>setTab(key)}>
              {key==='all'?'All': key==='onco'?'Oncology': key==='neuro'?'Neuro':'Ophthalmology'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="wrap">
        <AnimatePresence mode="popLayout">
          {tabbed.length===0 ? (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="empty">No matches. Try different keywords or remove filters.</motion.div>
          ) : (
            <div className="grid">
              {tabbed.map(ind=> (
                <GlassIndicationCard key={ind.id} ind={ind} docs={documents} adapters={adapters} onOpen={()=>setActive(ind)} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Details modal */}
      {active && <DetailsModal item={active} onClose={()=>setActive(null)}/>} 

      {/* Global RAG dialog */}
      <AnimatePresence>
        {ragOpen && (
          <div className="modal-root">
            <div className="backdrop" onClick={()=>setRagOpen(false)} />
            <motion.div className="modal glass" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0,y:10}}>
              <div className="modal-head"><h3>Interactive RAG Chat</h3><button className="btn" onClick={()=>setRagOpen(false)} aria-label="Close"><Icon.X/></button></div>
              <RagPanel docs={documents} ask={askRag} busy={ragBusy}/>
              {ragAnswer && (
                <div className="rag-ans">
                  <div className="ans-q">Q: {ragAnswer.q}</div>
                  <div className="ans-a">{ragAnswer.answer}</div>
                  {!!ragAnswer.cites?.length && (
                    <div className="ans-cites">
                      <div className="cites-title">References</div>
                      <ul>{ragAnswer.cites.map((c,i)=> { const d=documents.find(x=>x.id===c.docId); return (
                        <li key={i}><Icon.FileText/> <a href={d?.url} target="_blank" rel="noreferrer">{d?.title || c.docId}</a><div className="cite-snippet">{c.snippet}</div></li>
                      ); })}</ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Help chip */}
      <HelpChip/>

      {/* Styles (plain <style> for bundler compatibility) */}
      <style>{`
        :root{ --deep:#060719; --fg:rgba(255,255,255,0.92); --glass:linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)); --b1:rgba(255,255,255,0.1); --b2:rgba(255,255,255,0.2); }
        *{ box-sizing:border-box }
        body{ margin:0; background:var(--deep); color:var(--fg); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial }
        .root{ min-height:100vh; position:relative }
        .wrap{ width:min(1120px,92vw); margin:0 auto }
        .bg-layer{ position:fixed; inset:0; z-index:-1; overflow:hidden }
        .grad{ position:absolute; inset:-10% -10% -10% -10% }
        .grad-a{ background: radial-gradient(700px 500px at 8% 12%, rgba(139,92,246,0.16), transparent 60%), radial-gradient(650px 450px at 92% 88%, rgba(56,189,248,0.12), transparent 60%) }
        .grad-b{ background: radial-gradient(680px 520px at 85% 15%, rgba(108,99,255,0.14), transparent 58%); mix-blend-mode:screen }

        .topbar{ position:sticky; top:0; z-index:20; backdrop-filter: blur(8px); background: rgba(255,255,255,0.05) }
        .brand{ display:flex; align-items:center; gap:.5rem; padding:.75rem 1rem; border-radius:18px; border:1px solid var(--b2); background: rgba(255,255,255,0.08); margin:.6rem auto; width:min(1120px,92vw) }
        .brand span{ font-weight:600; letter-spacing:.2px }
        .actions{ position:absolute; right:calc((100vw - min(1120px,92vw))/2 + .75rem); top:.85rem; display:flex; gap:.5rem }
        .btn-ghost, .btn-solid, .btn, .btn-cta{ border:1px solid var(--b2); background: rgba(255,255,255,0.1); color:var(--fg); border-radius:12px; padding:.5rem .75rem; cursor:pointer }
        .btn-solid{ background: rgba(255,255,255,0.2); font-weight:600 }
        .btn-cta{ background: linear-gradient(135deg, #6C63FF, #8B5CF6); color:#0b0d1a; font-weight:700; border:none }
        .btn-ghost{ background: rgba(255,255,255,0.08) }

        .search-row{ display:flex; align-items:center; gap:.6rem; padding:.75rem 0 }
        .search{ position:relative; flex:1; display:flex; align-items:center; gap:.5rem; background: rgba(255,255,255,0.1); border:1px solid var(--b2); border-radius:16px; padding:.6rem .8rem }
        .search input{ flex:1; background:transparent; border:0; outline:0; color:var(--fg) }
        .srch-ico{ color:rgba(255,255,255,.75) }

        .tabs{ margin-top:.25rem }
        .tablist{ display:flex; gap:.4rem; background: rgba(255,255,255,0.08); padding:.3rem; border-radius:16px; border:1px solid var(--b2) }
        .tab{ padding:.4rem .8rem; border-radius:12px; background:transparent; color:var(--fg); border:0; cursor:pointer }
        .tab-on{ background: rgba(255,255,255,0.2) }

        .grid{ display:grid; grid-template-columns: repeat(1,minmax(0,1fr)); gap:16px; padding: 1rem 0 2.5rem }
        @media(min-width:700px){ .grid{ grid-template-columns: repeat(2,1fr) } }
        @media(min-width:1024px){ .grid{ grid-template-columns: repeat(3,1fr) } }

        .glass{ background: var(--glass); border:1px solid var(--b2); border-radius:16px; box-shadow: inset 1px 1px 0 rgba(255,255,255,0.025), 0 10px 30px rgba(2,6,23,0.6) }
        .chip{ display:inline-flex; align-items:center; gap:.35rem; padding:.25rem .5rem; background: rgba(255,255,255,0.12); border:1px solid var(--b2); border-radius:999px; font-size:.75rem }
        .chip-soft{ background: rgba(255,255,255,0.08); padding:.15rem .4rem; border-radius:8px }
        .badge{ font-size:.75rem; padding:.25rem .5rem; border-radius:999px; border:1px solid var(--b2) }
        .badge-glass{ background: rgba(255,255,255,0.12) }
        .badge-solid{ background: rgba(255,255,255,0.2); font-weight:600 }

        .card{ position:relative; overflow:hidden; padding:0; transition: transform .18s ease, box-shadow .18s ease }
        .card:hover{ transform: translateY(-3px); box-shadow: 0 12px 32px rgba(2,6,23,0.7) }
        .card-bg .blob{ position:absolute; border-radius:50% }
        .card-bg .blob.a{ left:-10%; top:-10%; width:220px; height:220px; background: radial-gradient(circle at 30% 20%, rgba(108,99,255,0.35), rgba(255,255,255,0.01)) }
        .card-bg .blob.b{ right:10%; bottom:-10%; width:180px; height:180px; background: radial-gradient(circle at 50% 50%, rgba(56,189,248,0.25), rgba(255,255,255,0.01)) }
        .card-head{ position:relative; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:16px }
        .card-title{ margin:0; font-size:1.05rem; font-weight:700 }
        .card-sub{ margin:.25rem 0 0; font-size:.8rem; color:rgba(255,255,255,0.8) }
        .card-right{ display:flex; flex-direction:column; align-items:flex-end; gap:.4rem }
        .card-body{ position:relative; z-index:1; padding:0 16px 16px }
        .card-summary{ margin:.25rem 0 .35rem; font-size:.92rem; color:rgba(255,255,255,0.95) }
        .card-comps{ display:flex; align-items:center; flex-wrap:wrap; gap:.4rem; font-size:.82rem; color:rgba(255,255,255,0.9) }
        .card-flex{ display:flex; gap:1rem; align-items:flex-start; margin-top:.6rem }
        .card-flex-left{ flex:1 }
        .card-flex-right{ width:38% }

        .cat-art{ display:flex; gap:.5rem; flex-wrap:wrap }
        .cat-chip{ display:flex; align-items:center; gap:.4rem; padding:.35rem .45rem; border:1px solid var(--b1); background: rgba(255,255,255,0.06); border-radius:14px; backdrop-filter: blur(6px) }
        .cat-info{ display:flex; flex-direction:column }
        .cat-title{ font-weight:600; font-size:.8rem }
        .cat-date{ font-size:.7rem; color:rgba(255,255,255,0.7) }
        .cat-chips{ display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.35rem }
        .risk-high{ background: rgba(244,63,94,0.72) }
        .risk-mid{ background: rgba(245,158,11,0.72) }
        .risk-low{ background: rgba(16,185,129,0.72) }

        .pipe-wrap{ display:flex; flex-direction:column; gap:.35rem }
        .pipe-row{ display:flex; align-items:center; gap:.5rem }
        .pipe-label{ min-width:72px; font-size:.72rem; color:rgba(255,255,255,0.8) }
        .pipe-bar{ position:relative; flex:1; height:10px; border-radius:999px; background: rgba(255,255,255,0.06); overflow:hidden }
        .pipe-fill{ position:absolute; inset:0 auto 0 0; background: linear-gradient(90deg, rgba(108,99,255,0.8), rgba(45,212,191,0.7), rgba(236,72,153,0.7)); border-radius:999px; box-shadow: 0 6px 18px rgba(99,102,241,0.18) }
        .pipe-shimmer{ position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); animation:shimmer 2.5s linear infinite }
        @keyframes shimmer{ 0%{ transform:translateX(-100%) } 100%{ transform:translateX(100%) } }

        .doc-refs{ display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.5rem }
        .doc-pill{ display:inline-flex; align-items:center; gap:.25rem; padding:.25rem .5rem; border:1px solid var(--b2); background: rgba(255,255,255,0.1); border-radius:999px; color:var(--fg); text-decoration:none }

        .excl{ display:flex; align-items:center; gap:.5rem }
        .excl-name{ font-size:.8rem }
        .excl-date{ margin-left:.25rem; padding:.15rem .35rem; border-radius:999px; background: rgba(255,255,255,0.08); font-size:.72rem }

        .kbd-focus:focus{ outline:2px solid #8B5CF6; outline-offset:2px }

        .empty{ display:flex; align-items:center; justify-content:center; border:1px solid var(--b2); background: rgba(255,255,255,0.06); padding:2.5rem; border-radius:20px; color:rgba(255,255,255,0.8) }

        .modal-root{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center }
        .backdrop{ position:absolute; inset:0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px) }
        .modal{ position:relative; width:min(960px,94vw); max-height:88vh; overflow:auto; padding:16px 18px 20px; border-radius:18px }
        .modal-title{ margin:4px 0 6px; font-size:1.35rem; font-weight:700 }
        .meta{ display:flex; gap:.5rem; flex-wrap:wrap; margin:.25rem 0 }
        .section{ margin-top:1rem }
        .bullets{ margin:.25rem 0; padding-left:18px }
        .chat{ background: rgba(255,255,255,0.05); border:1px solid var(--b2); border-radius:12px; padding:.6rem }
        .log{ max-height:150px; overflow-y:auto; padding-right:6px }
        .bubble{ padding:.5rem .6rem; border-radius:10px; margin:.25rem 0 }
        .user{ background: rgba(139,92,246,0.35); text-align:right }
        .bot{ background: rgba(255,255,255,0.08) }
        .chat-row{ display:flex; gap:.5rem; margin-top:.5rem }
        .input{ flex:1; background: rgba(255,255,255,0.08); border:1px solid var(--b2); color:var(--fg); border-radius:10px; padding:.5rem .6rem }

        .rag{ display:flex; flex-direction:column; gap:.6rem }
        .rag-row{ position:relative; display:flex; gap:.5rem }
        .doc-scroll{ max-height:96px; overflow:auto; border:1px solid var(--b2); background: rgba(255,255,255,0.05); border-radius:12px; padding:.35rem }
        .doc-chip{ display:inline-flex; align-items:center; gap:.35rem; margin:.25rem; padding:.25rem .55rem; border:1px solid var(--b2); background: rgba(255,255,255,0.1); border-radius:999px; color:var(--fg); cursor:pointer }
        .doc-chip-on{ background: rgba(16,185,129,0.22); border-color: rgba(16,185,129,0.55) }
        .rag-ans{ margin-top:.6rem; border:1px solid var(--b2); background: rgba(255,255,255,0.05); border-radius:12px; padding:.6rem }
        .ans-q{ font-size:.72rem; color:rgba(255,255,255,0.75); margin-bottom:.2rem }
        .ans-a{ font-size:.92rem }
        .ans-cites{ margin-top:.5rem }
        .cites-title{ font-size:.72rem; color:rgba(255,255,255,0.7); margin-bottom:.25rem }
        .spin{ display:inline-block; animation:spin 1s linear infinite }
        @keyframes spin{ to{ transform:rotate(360deg) } }

        .help{ position:fixed; bottom:18px; right:18px; z-index:30 }
        .help-inner{ display:flex; align-items:center; gap:.5rem; border:1px solid var(--b2); background: rgba(255,255,255,0.1); padding:.45rem .65rem; border-radius:16px; box-shadow:0 10px 24px rgba(0,0,0,0.25) }
      `}</style>
    </div>
  );
}

function HelpChip(){
  const [open,setOpen]=useState(true);
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}} className="help">
          <div className="help-inner">
            <Icon.Sparkles/> Tip: Press "/" to search, ⌘/Ctrl+K to open RAG.
            <button className="btn-ghost" onClick={()=>setOpen(false)} aria-label="Dismiss"><Icon.X/></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/****************************
 * Self-tests (console)
 ****************************/
(function runSelfTests(){
  try{
    const n1 = normalizeIndication({}); console.assert(n1.name==='Unknown Indication','normalize default name');
    console.assert(Array.isArray(n1.pipeline),'normalize pipeline array');
    console.assert(typeof classifyStage([{name:'Ph3',progress:.5}])==='string','classify returns string');
    const a1 = mockRAG({ name:'Foo' }, 'competitors'); console.assert(typeof a1==='string','mockRAG returns string');
    const a2 = mockRAG({ name:'Foo', catalysts:[] }, 'catalysts'); console.assert(typeof a2==='string','mockRAG catalysts path');
    const html = printableHTML(normalizeIndication(MOCK_INDICATIONS[0])); console.assert(/^<!doctype html>/i.test(html),'printable has doctype');
  }catch(e){ console.warn('Self-tests warning:', e); }
})();
