import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Filter, FlaskConical, ChevronRight, BookOpenText, Timer, Beaker, FileText, MessageCircle, LayoutGrid, ExternalLink, X, Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Aurora Science Tab – Upgraded
 * - Enhanced catalyst graphics (multiple views + artful SVG)
 * - Animated, left-to-right loading pipeline bars
 * - Sponsor & exclusivity display fields and badges
 * - Heuristic stage classification (Early / Mid / Late)
 * - Improved glassmorphism background layers and lighting
 * - Hooks for external exclusivity lookups (adapters.getExclusivity)
 *
 * Drop into Next.js + Tailwind + shadcn/ui. Keep adapters wired to enable live data.
 */

// ---------- Types ---------- //

export type Catalyst = {
  id: string;
  label: string; // e.g., "Phase 2 readout"
  date: string; // ISO date
  risk: "High" | "Medium" | "Low";
  artStyle?: "ripple" | "spark" | "bar"; // how it's rendered visually
};

export type PipelineStage = {
  name: string; // Preclinical, Ph1, Ph2, Ph3, Filed, Approved
  progress: number; // 0..1
};

export type Sponsor = {
  name: string;
  type: "Big Pharma" | "SMid" | "Biotech" | "China Pharma" | "Academic" | "Unknown";
  exclusivityUntil?: string; // ISO date for a controlling approved drug (if applies)
};

export type Indication = {
  id: string;
  name: string;
  area: string;
  summary: string;
  competitors: string[];
  tags: string[];
  catalysts: Catalyst[];
  pipeline: PipelineStage[];
  refs?: string[];
  sponsors?: Sponsor[];
};

export type LauraDoc = {
  id: string;
  title: string;
  url?: string;
  pages?: number;
  date?: string;
  highlights?: string[];
};

export type Adapters = {
  searchIndications?: (q: string) => Promise<string[]>;
  ragAsk?: (q: string, docIds?: string[]) => Promise<{ answer: string; cites?: { docId: string; snippet: string }[] }>;
  onOpenDoc?: (docId: string) => void;
  // Optional: lookup exclusivity data by (drugName) -> { expiry }
  getExclusivity?: (drugName: string) => Promise<{ drug: string; exclusivityUntil?: string } | null>;
};

// ---------- Mock data (safe defaults) ---------- //
const MOCK_INDICATIONS: Indication[] = [
  {
    id: "nscalc-egfrm",
    name: "Metastatic NSCLC (EGFRm)",
    area: "Oncology",
    summary: "Targeted therapy landscape with 3rd-gen TKIs, resistance mechanisms (C797S), and multiple bispecific/ADC entrants.",
    competitors: ["AstraZeneca (osimertinib)", "J&J (amivantamab)", "Spectrum"],
    tags: ["EGFR", "TKI", "ADC", "C797S"],
    catalysts: [
      { id: "1", label: "Ph3 OS update", date: "2025-11-15", risk: "Medium", artStyle: "bar" },
      { id: "2", label: "ADC Ph2 ORR", date: "2026-03-10", risk: "High", artStyle: "ripple" },
      { id: "4", label: "New combo IND", date: "2025-12-01", risk: "Low", artStyle: "spark" },
    ],
    pipeline: [
      { name: "Preclinical", progress: 1 },
      { name: "Ph1", progress: 1 },
      { name: "Ph2", progress: 0.65 },
      { name: "Ph3", progress: 0.25 },
      { name: "Filed", progress: 0 },
      { name: "Approved", progress: 0 },
    ],
    refs: ["doc-1", "doc-2"],
    sponsors: [
      { name: "AstraZeneca", type: "Big Pharma", exclusivityUntil: "2029-08-16" },
      { name: "Spectrum Pharmaceuticals", type: "SMid", exclusivityUntil: "2030-04-01" },
    ],
  },
  {
    id: "ad-nflam",
    name: "Alzheimer's (neuroinflammation)",
    area: "Neurology",
    summary: "Beyond amyloid: microglial modulation, TREM2 agonism, complement inhibition; mixed signal across Ph2.",
    competitors: ["Biogen", "Eli Lilly", "Denali", "ALX"],
    tags: ["Microglia", "TREM2", "Complement", "CSF biomarkers"],
    catalysts: [
      { id: "3", label: "Biomarker Ph2", date: "2026-01-20", risk: "High", artStyle: "bar" },
    ],
    pipeline: [
      { name: "Preclinical", progress: 1 },
      { name: "Ph1", progress: 1 },
      { name: "Ph2", progress: 0.35 },
      { name: "Ph3", progress: 0 },
      { name: "Filed", progress: 0 },
      { name: "Approved", progress: 0 },
    ],
    refs: ["doc-3"],
    sponsors: [
      { name: "Eli Lilly", type: "Big Pharma", exclusivityUntil: "2031-05-10" },
    ],
  },
];

const MOCK_DOCS: LauraDoc[] = [
  { id: "doc-1", title: "EGFRm NSCLC Landscape – Laura v1", url: "https://example.com/egfrm.pdf", pages: 42, date: "2025-07-14", highlights: ["Resistance post-osimertinib", "C797S combinations"] },
  { id: "doc-2", title: "ADC entrants – 2025Q3 deep dive", url: "https://example.com/adc_q3.pdf", pages: 28, date: "2025-09-01", highlights: ["Bystander effect", "DAR optimization"] },
  { id: "doc-3", title: "AD Neuroinflammation – pathway map", url: "https://example.com/ad_neuro.pdf", pages: 55, date: "2025-06-02", highlights: ["TREM2 signaling", "CSF readthrough"] },
];

// ---------- Utilities ---------- //
const auroraBg = "bg-[radial-gradient(1200px_600px_at_20%_0%,rgba(99,102,241,0.28),transparent),radial-gradient(1000px_500px_at_100%_20%,rgba(34,197,94,0.18),transparent),radial-gradient(800px_400px_at_0%_100%,rgba(236,72,153,0.18),transparent)]";

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function fuzzyIncludes(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

function classifyStage(stages: PipelineStage[]) {
  // crude heuristic: average progress across later stages
  const weights = { Preclinical: 0.1, Ph1: 0.2, Ph2: 0.3, Ph3: 0.4, Filed: 0.5, Approved: 0.6 } as Record<string, number>;
  const avg = stages.reduce((acc, s) => acc + (s.progress * (weights[s.name] ?? 0.25)), 0);
  if (avg < 0.2) return "Early";
  if (avg < 0.45) return "Mid";
  return "Late";
}

// ---------- Visual components ---------- //

function AnimatedPipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      {stages.map((s, i) => (
        <div key={s.name} className="flex w-full items-center gap-2">
          <div className="min-w-[56px] text-xs text-white/70">{s.name}</div>
          <div className="relative flex-1 overflow-hidden rounded-full bg-white/6" style={{ height: 10 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(1, s.progress)) * 100}%` }}
              transition={{ duration: 1.1 + i * 0.12, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400/80 via-teal-300/70 to-pink-400/70 shadow-[0_6px_18px_rgba(99,102,241,0.18)]"
            />
            {/* shimmer overlay to make it feel alive */}
            <div className="pointer-events-none absolute inset-0 animate-[shimmer_2.5s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)]" />
          </div>
          <div className="w-10 text-right text-xs text-white/80">{Math.round(s.progress * 100)}%</div>
        </div>
      ))}

      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}} .animate-[shimmer_2.5s_linear_infinite]{animation:shimmer 2.5s linear infinite}`}</style>
    </div>
  );
}

function CatalystArt({ catalysts }: { catalysts: Catalyst[] }) {
  // Render a small cluster of SVG art chips to make catalysts pop
  return (
    <div className="flex gap-2">
      {catalysts.map((c, idx) => (
        <div key={c.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 backdrop-blur">
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
            <defs>
              <radialGradient id={`g-${c.id}`} cx="30%" cy="20%">
                <stop offset="0%" stopColor={c.risk === "High" ? "#ff7a7a" : c.risk === "Medium" ? "#ffd36b" : "#7ef7b5"} stopOpacity="0.95" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
              </radialGradient>
            </defs>
            {/* art variations */}
            {c.artStyle === "ripple" && (
              <g>
                <circle cx="20" cy="20" r={10 + (idx % 3) * 2} fill={`url(#g-${c.id})`} opacity="0.9" />
                <circle cx="20" cy="20" r={5} fill="white" opacity="0.06" />
              </g>
            )}
            {c.artStyle === "spark" && (
              <g>
                <polygon points="20,6 24,20 20,34 16,20" fill={`url(#g-${c.id})`} opacity="0.95" />
                <circle cx="20" cy="20" r={4} fill="white" opacity="0.06" />
              </g>
            )}
            {c.artStyle === "bar" && (
              <g>
                <rect x="6" y="12" width="28" height="16" rx="4" fill={`url(#g-${c.id})`} opacity="0.95" />
                <rect x="10" y="16" width={6 + (idx % 4) * 4} height={8} rx="2" fill="white" opacity="0.06" />
              </g>
            )}
          </svg>
          <div className="flex flex-col">
            <span className="font-semibold">{c.label}</span>
            <span className="text-[11px] text-white/60">{new Date(c.date).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExclusivityBadge({ sponsor, adapters }: { sponsor: Sponsor; adapters?: Adapters }) {
  const [live, setLive] = useState<string | undefined>(sponsor.exclusivityUntil);

  useEffect(() => {
    let mounted = true;
    async function fetchIt() {
      if (!sponsor.exclusivityUntil && adapters?.getExclusivity) {
        try {
          const res = await adapters.getExclusivity(sponsor.name);
          if (!mounted) return;
          setLive(res?.exclusivityUntil ?? undefined);
        } catch (e) {
          // ignore
        }
      }
    }
    fetchIt();
    return () => (mounted = false);
  }, [sponsor, adapters]);

  return (
    <div className="flex items-center gap-2">
      <Badge className={classNames("rounded-full text-sm text-white/90 bg-white/10")}>{sponsor.type}</Badge>
      <div className="text-xs text-white/70">{sponsor.name}</div>
      <div className="ml-2 rounded-full bg-white/6 px-2 py-0.5 text-xs text-white/80">Excl: {live ? new Date(live).toLocaleDateString() : "—"}</div>
    </div>
  );
}

function PipelineMini({ stages }: { stages: PipelineStage[] }) {
  // keep old compact visual but use animated pipeline bars under the hood
  return (
    <div className="flex flex-col gap-2">
      <AnimatedPipeline stages={stages} />
    </div>
  );
}

function CatalystChips({ catalysts }: { catalysts: Catalyst[] }) {
  const riskColor = (r: Catalyst["risk"]) => (r === "High" ? "bg-rose-500/80" : r === "Medium" ? "bg-amber-500/80" : "bg-emerald-500/80");
  return (
    <div className="flex flex-wrap gap-2" aria-label="Upcoming catalysts">
      {catalysts.map((c) => (
        <Badge key={c.id} className={classNames("rounded-full backdrop-blur text-white", riskColor(c.risk))}>
          <Timer className="mr-1 h-3 w-3" /> {c.label} · {new Date(c.date).toLocaleDateString()}
        </Badge>
      ))}
    </div>
  );
}

function DocRefs({ docIds, docs, onOpen }: { docIds?: string[]; docs: LauraDoc[]; onOpen?: (id: string) => void }) {
  if (!docIds?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Document references">
      {docIds.map((id) => {
        const d = docs.find((x) => x.id === id);
        if (!d) return null;
        return (
          <a
            key={id}
            href={d.url || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={() => onOpen?.(id)}
            className="group inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-0"
          >
            <FileText className="h-3.5 w-3.5" /> {d.title}
            <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
          </a>
        );
      })}
    </div>
  );
}

// ---------- Indication Card (upgraded) ---------- //

function GlassIndicationCard({ ind, docs, onSelectDoc, adapters }: { ind: Indication; docs: LauraDoc[]; onSelectDoc?: (id: string) => void; adapters?: Adapters }) {
  const stage = classifyStage(ind.pipeline);
  const sponsor = ind.sponsors?.[0];

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <Card
        role="article"
        tabIndex={0}
        className={classNames(
          "group relative overflow-hidden rounded-2xl border border-white/20 bg-white/6 p-0 text-white shadow-2xl backdrop-blur-xl transition",
          "hover:scale-[1.01] hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        )}
        aria-labelledby={`ind-${ind.id}`}
      >
        <div className="absolute -inset-12 z-0 transform-gpu blur-3xl opacity-60" aria-hidden>
          <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/40 to-pink-400/30" />
          <div className="absolute right-10 bottom-0 h-44 w-44 rounded-full bg-gradient-to-bl from-emerald-300/30 to-teal-400/20" />
        </div>
        <CardHeader className="relative z-10 flex items-start justify-between gap-3 p-5">
          <div>
            <h3 id={`ind-${ind.id}`} className="text-lg font-semibold leading-tight">
              {ind.name}
            </h3>
            <p className="mt-1 text-xs text-white/70">{ind.area} · <span className="ml-2 rounded-md bg-white/6 px-2 py-0.5 text-xs">{stage}</span></p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="rounded-full bg-white/20 text-white backdrop-blur">
              <FlaskConical className="mr-1 h-3.5 w-3.5" /> {ind.tags.slice(0, 3).join(" · ")}
            </Badge>
            {sponsor && <ExclusivityBadge sponsor={sponsor} adapters={adapters} />}
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4 p-5 pt-0">
          <p className="text-sm text-white/90">{ind.summary}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
            <Beaker className="h-3.5 w-3.5" /> Competitors:
            {ind.competitors.map((c) => (
              <span key={c} className="rounded-full bg-white/10 px-2 py-0.5">{c}</span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <CatalystArt catalysts={ind.catalysts} />
              <div className="mt-3">
                <CatalystChips catalysts={ind.catalysts} />
              </div>
            </div>
            <div className="w-1/3">
              <PipelineMini stages={ind.pipeline} />
            </div>
          </div>

          <DocRefs docIds={ind.refs} docs={docs} onOpen={onSelectDoc} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------- RAG Panel (unchanged) ---------- //

function RagPanel({ docs, ask, busy }: { docs: LauraDoc[]; ask: (q: string, docIds?: string[]) => void; busy?: boolean }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask RAG about mechanisms, comps, or trial nuances (⌘/Ctrl+K)"
          className="h-11 rounded-xl border-white/30 bg-white/10 pr-10 text-white placeholder:text-white/60 focus-visible:ring-indigo-300"
          aria-label="RAG question input"
        />
        <Button
          disabled={!q || busy}
          onClick={() => ask(q, sel)}
          className="absolute right-1 top-1 h-9 rounded-xl bg-white/20 text-white hover:bg-white/30"
          aria-label="Send question to RAG"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="h-24 rounded-xl border border-white/20 bg-white/5 p-2">
        <div className="flex flex-wrap gap-2">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              className={classNames(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
                sel.includes(d.id)
                  ? "border-emerald-300/60 bg-emerald-300/20 text-white"
                  : "border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
              )}
              aria-pressed={sel.includes(d.id)}
              aria-label={`Toggle document ${d.title}`}
            >
              <BookOpenText className="h-3.5 w-3.5" /> {d.title}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------- Main Export ---------- //

type Props = {
  indications?: Indication[];
  documents?: LauraDoc[];
  adapters?: Adapters;
};

export default function AuroraScienceTab({ indications = MOCK_INDICATIONS, documents = MOCK_DOCS, adapters }: Props) {
  const [query, setQuery] = useState("");
  const [ragBusy, setRagBusy] = useState(false);
  const dQuery = useDebounced(query, 150);

  const filtered = useMemo(() => {
    if (!dQuery) return indications;
    return indications
      .map((ind) => ({
        ind,
        score: [ind.name, ind.area, ind.summary, ind.tags.join(" "), ind.competitors.join(" ")].reduce((acc, field) => (fuzzyIncludes(field, dQuery) ? acc + 1 : acc), 0),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.ind);
  }, [dQuery, indications]);

  const [searchIds, setSearchIds] = useState<string[] | null>(null);
  useEffect(() => {
    let mounted = true;
    async function go() {
      if (!adapters?.searchIndications || !dQuery) {
        setSearchIds(null);
        return;
      }
      try {
        const ids = await adapters.searchIndications(dQuery);
        if (!mounted) return;
        setSearchIds(ids);
      } catch (e) {
        setSearchIds(null);
      }
    }
    go();
    return () => {
      mounted = false;
    };
  }, [adapters?.searchIndications, dQuery]);

  const ranked = useMemo(() => {
    if (!searchIds) return filtered;
    const map = new Map(indications.map((i) => [i.id, i] as const));
    const hits = searchIds.map((id) => map.get(id)).filter(Boolean) as Indication[];
    const localIds = new Set(hits.map((h) => h.id));
    const merged = [...hits, ...filtered.filter((f) => !localIds.has(f.id))];
    return merged;
  }, [filtered, indications, searchIds]);

  const askRag = async (q: string, docIds?: string[]) => {
    setRagBusy(true);
    try {
      const res = await adapters?.ragAsk?.(q, docIds) ?? { answer: "This is a demo response. Wire up your RAG endpoint via `adapters.ragAsk`.", cites: (docIds ?? []).map((d) => ({ docId: d, snippet: "Relevant passage here." })) };
      setRagAnswer({ q, ...res });
    } finally {
      setRagBusy(false);
    }
  };

  const [ragAnswer, setRagAnswer] = useState<null | { q: string; answer: string; cites?: { docId: string; snippet: string }[] }>(null);

  const onOpenDoc = (id: string) => adapters?.onOpenDoc?.(id);

  // Keyboard: focus search on "/"
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={classNames("min-h-[80vh] w-full text-white", auroraBg)}>
      {/* Glass header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 shadow-lg backdrop-blur">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold tracking-tight">GGets Aurora · Science</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" className="rounded-xl text-white hover:bg-white/10" aria-label="Grid view">
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-white/20 text-white hover:bg-white/30" aria-label="Open RAG panel">
                  <MessageCircle className="mr-2 h-4 w-4" /> Ask RAG
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Interactive RAG Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <RagPanel docs={documents} ask={askRag} busy={ragBusy} />
                  {ragAnswer && (
                    <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                      <div className="mb-2 text-xs text-white/60">Q: {ragAnswer.q}</div>
                      <div className="text-sm leading-relaxed">{ragAnswer.answer}</div>
                      {!!ragAnswer.cites?.length && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-white/60">References</div>
                          <ul className="space-y-1 text-sm">
                            {ragAnswer.cites!.map((c, i) => {
                              const d = documents.find((x) => x.id === c.docId);
                              return (
                                <li key={i} className="flex items-start gap-2">
                                  <BookOpenText className="mt-0.5 h-4 w-4" />
                                  <div>
                                    <a className="underline underline-offset-2" href={d?.url} target="_blank" rel="noreferrer">{d?.title ?? c.docId}</a>
                                    <div className="text-xs text-white/70">{c.snippet}</div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative w-full">
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search indications, tags, competitors… (press / to focus)"
              aria-label="Search indications"
              className="h-12 rounded-2xl border-white/30 bg-white/10 pl-10 text-white placeholder:text-white/60 focus-visible:ring-indigo-300"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
          </div>
          <Button variant="ghost" className="h-12 rounded-2xl text-white hover:bg-white/10" aria-label="Filters">
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="rounded-2xl bg-white/10 p-1">
            <TabsTrigger value="all" className="rounded-xl text-white data-[state=active]:bg-white/20">All</TabsTrigger>
            <TabsTrigger value="onco" className="rounded-xl text-white data-[state=active]:bg-white/20">Oncology</TabsTrigger>
            <TabsTrigger value="neuro" className="rounded-xl text-white data-[state=active]:bg-white/20">Neuro</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <GridList items={ranked} docs={documents} onOpenDoc={onOpenDoc} adapters={adapters} />
          </TabsContent>
          <TabsContent value="onco" className="mt-6">
            <GridList items={ranked.filter((i) => i.area === "Oncology")} docs={documents} onOpenDoc={onOpenDoc} adapters={adapters} />
          </TabsContent>
          <TabsContent value="neuro" className="mt-6">
            <GridList items={ranked.filter((i) => i.area === "Neurology")} docs={documents} onOpenDoc={onOpenDoc} adapters={adapters} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Help */}
      <HelpChip />
    </div>
  );
}

function GridList({ items, docs, onOpenDoc, adapters }: { items: Indication[]; docs: LauraDoc[]; onOpenDoc?: (id: string) => void; adapters?: Adapters }) {
  return (
    <AnimatePresence mode="popLayout">
      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center rounded-3xl border border-white/20 bg-white/5 p-16 text-white/70">
          No matches. Try different keywords or remove filters.
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ind) => (
            <GlassIndicationCard key={ind.id} ind={ind} docs={docs} onSelectDoc={onOpenDoc} adapters={adapters} />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

function HelpChip() {
  const [open, setOpen] = useState(true);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-6 right-6 z-30"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white shadow-xl backdrop-blur">
            <Sparkles className="h-4 w-4" /> Tip: Press "/" to search, ⌘/Ctrl+K to open RAG.
            <button className="ml-2 rounded-full bg-white/20 p-1 hover:bg-white/30" aria-label="Dismiss hint" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Theming notes (Tailwind) ---------- //
// Add this to tailwind.config.ts for smoother glass & aurora feel:
// theme: { extend: { borderRadius: { '2xl': '1rem', '3xl': '1.5rem' }, boxShadow: { aurora: '0 10px 30px rgba(0,0,0,0.25)' } } }
// And ensure background is dark with subtle gradient.

// ---------- Wiring (example) ---------- //
// <AuroraScienceTab
//   indications={yourIndications}
//   documents={lauraDocs}
//   adapters={{
//     searchIndications: async (q) => {
//       const { hits } = await fetch("/api/search?q=" + encodeURIComponent(q)).then(r => r.json());
//       return hits.map((h: any) => h.id);
//     },
//     ragAsk: async (q, docIds) => {
//       const res = await fetch("/api/rag", { method: "POST", body: JSON.stringify({ q, docIds }) }).then(r => r.json());
//       return res;
//     },
//     onOpenDoc: (id) => fetch("/api/analytics", { method: "POST", body: JSON.stringify({ event: "open_doc", id }) }),
//     getExclusivity: async (drugName) => {
//       // optionally call your own service that looks up patent / exclusivity info
//       return fetch(`/api/exclusivity?drug=${encodeURIComponent(drugName)}`).then(r => r.json());
//     }
//   }}
// />
