import React, { useMemo, useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Container,
  Tabs,
  Tab,
  Chip,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Tooltip,
  LinearProgress,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Badge,
} from "@mui/material";
import {
  // lucide-react: ensure valid icon names to avoid CDN 404s
  Menu as MenuIcon,
  UploadCloud, // was CloudUpload (invalid in lucide-react)
  Download,
  Copy, // was ContentCopy (MUI name, not lucide)
  CheckCircle2,
  XCircle,
  ChevronDown,
  Search,
  Zap,
  BookOpen,
  FileSpreadsheet,
  ShieldCheck,
  LineChart,
  ListTodo,
  Globe,
  Layers,
} from "lucide-react";
import { createTheme, ThemeProvider, alpha, styled } from "@mui/material/styles";

// =============================
// THEME — Eclipse Aurora (dark)
// =============================
const auroraTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7DF9FF" }, // electric cyan
    secondary: { main: "#C084FC" }, // aurora violet
    success: { main: "#22c55e" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    background: { default: "#0b0f15", paper: "#0f1420" },
    text: { primary: "#E6F1FF", secondary: alpha("#E6F1FF", 0.74) },
  },
  typography: {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, 'Apple Color Emoji', 'Segoe UI Emoji'",
    h1: { fontWeight: 800, letterSpacing: -0.5 },
    h2: { fontWeight: 700, letterSpacing: -0.4 },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(15,20,32,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(125,249,255,0.15)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(180deg, rgba(16,21,33,0.8), rgba(13,18,30,0.7))",
          border: "1px solid rgba(124, 252, 255, 0.16)",
          backdropFilter: "blur(14px)",
        },
      },
    },
  },
});

// Utility — save & load from localStorage
const useLocal = (key, initial) => {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
};

// =============================
// DATA — Content model
// =============================
const content = {
  tldr: [
    {
      title: "What Laura wants",
      bullets: [
        "Daily skim: STAT, Endpts, Fierce — focus on data readouts & review pieces",
        "Internalize primers → PRVs, DMD (gene therapy + exon skippers), IBD next‑gen (TL1A, combos, orals), NPDR/DME",
      ],
    },
    {
      title: "Macro takeaway",
      bullets: [
        "2025–27 catalyst stack: PRV sunset/extension; next‑gen DMD; IBD pivot to TL1A/combos/orals; ophthalmology durability unlock",
      ],
    },
    {
      title: "Why it matters",
      bullets: [
        "These themes drive near‑term valuation via approvals, late‑stage data, and policy",
      ],
    },
  ],
  asks: [
    {
      title: "Daily habit",
      text:
        "Track data‑rich headlines (not financings) from STAT/Endpts; sharpen BS‑detector for what’s credible vs. splashy",
    },
    {
      title: "Up‑level in 4 spaces",
      text:
        "PRV mechanics & phase‑out; DMD competitive map; IBD efficacy ceiling & TL1A/combos/orals; NPDR/DME durability unlock",
    },
  ],
  numbers: [
    {
      area: "PRVs (RPD vouchers)",
      points: [
        "Status: RPD PRVs lapsed Dec‑2024; approvals by Sept‑30, 2026 still earn unless extended",
        "Pricing: historical $21M–$350M; FY‑25 user fee ≈ $2.5M; pricing tracks supply",
      ],
    },
    {
      area: "DMD",
      points: [
        "Street ~ $2.1B Elevidys ’25 sales; next‑gens (RGX‑202, SGT‑003) eye AA in 2026/27",
        "~7k ambulatory patients potentially untreated by 2027; SRPT ~1.8× ’25 sales vs ~6.4× peers",
      ],
    },
    {
      area: "IBD",
      points: [
        "> $30B UC+CD by 2030; tilt toward JAKs/IL‑23/α4β7",
        "Catalysts 2025–26: JNJ DUET combos; ABVX Ph3 (3Q25); LLY MORF‑057 Ph2b (1H25)",
      ],
    },
    {
      area: "NPDR/DME",
      points: [
        "~1.8M US with vision‑threatening DR; NPDR uptake <1% due to burden",
        "Durability ≥6–12 mo is the unlock — e.g., AXPAXLI single‑shot; sura‑vec gene therapy",
      ],
    },
  ],
  risks: [
    {
      area: "PRVs",
      items: [
        "Legislative uncertainty; approval‑timing wall in 2026",
        "Voucher pricing volatility with supply",
      ],
    },
    {
      area: "DMD",
      items: [
        "Safety overhangs; immunomod regimens add complexity",
        "Manufacturing & dose scaling; EMA lag vs US",
      ],
    },
    {
      area: "IBD",
      items: [
        "Ceiling persists; combo/bispecific immunosuppression risk",
        "Payer friction on JAKs; TL1A class needs Ph3 proof",
      ],
    },
    {
      area: "NPDR/DME",
      items: [
        "Durability must replicate in pivotal",
        "Procedure logistics; shifting endpoints complicate comps",
      ],
    },
  ],
  take: [
    {
      area: "PRVs",
      bullets: [
        "Build tracker of RPD assets ≤ Sept‑2026 approvals + cash needs",
        "Screen for names implicitly banking on PRV monetizations",
      ],
    },
    {
      area: "DMD",
      bullets: [
        "Harvest year for Elevidys; optionality on RGNX/SLDB",
        "Favor expression+safety+dose trifecta (discount until functional endpoints/FDA AA)",
      ],
    },
    {
      area: "IBD",
      bullets: [
        "TL1A is the zeitgeist; who wins Ph3 + differentiates",
        "Watch combo data (JNJ DUET); co‑formulations & GI share matter",
      ],
    },
    {
      area: "NPDR/DME",
      bullets: [
        "Durability is destiny; fewer injections win if safety clean",
        "Compare AXPAXLI vs sura‑vec vs implants; endpoints & rescue rules",
      ],
    },
  ],
  replies: [
    "Daily STAT/Endpts scan set; building one‑pagers on PRVs, DMD, IBD, NPDR/DME with watchlists.",
    "Flagging PRV approval wall 2H‑26; opportunities if extension slips.",
    "Tracking RGX‑202 & SGT‑003 for functional updates + AA path; mapping exon‑skipper timelines (RNA/DYN/WVE).",
    "Watching JNJ DUET + ABVX Ph3; forming TL1A grid (MoA, ADA risk, HLE strategies).",
    "Key Qs: can AXPAXLI replicate at scale; can sura‑vec maintain low ocular inflammation?",
  ],
  actions: [
    {
      title: "News workflow",
      owner: "You",
      due: "Weekly — first digest next Friday",
      detail:
        "15‑min AM scan of STAT/Endpts/Fierce; capture data readouts with quick takes",
    },
    {
      title: "PRV tracker",
      owner: "You",
      due: "2 weeks",
      detail:
        "RPD programs → approval windows, cash, implied PRV reliance; swing factors if extension passes/fails",
    },
    {
      title: "DMD battle‑cards",
      owner: "You",
      due: "2 weeks",
      detail:
        "SRPT, RGNX, SLDB, RNA, DYN, WVE — MoA, dosing, expression/functional data, safety, timeline, catalysts, valuation",
    },
    {
      title: "IBD map",
      owner: "You",
      due: "2–3 weeks",
      detail:
        "TL1A/DR3 landscape + 2025 catalysts; combos (JNJ‑4804) + oral biologic‑mimetics",
    },
    {
      title: "NPDR/DME deck",
      owner: "You",
      due: "3 weeks",
      detail:
        "Durability thesis; AXPAXLI vs sura‑vec vs implants; payer/utilization; endpoints",
    },
  ],
  deepDives: [
    {
      key: "prvs",
      title: "Policy Watch — PRVs",
      summary:
        "Mechanics, legislative status, approval cutoffs, and pricing dynamics. Build a live tracker and scenario tree.",
      checklist: [
        "List all RPD‑designated programs with potential ≤ Sept‑2026 approvals",
        "Capture cash runway & plan sensitivity to PRV monetization",
        "Model extension scenarios (pass vs fail) with valuation swings",
      ],
      links: [
        { label: "RPD history & fees", url: "#" },
        { label: "Give Kids a Chance bill tracker", url: "#" },
      ],
    },
    {
      key: "dmd",
      title: "Therapeutic Area — DMD",
      summary:
        "Elevidys near‑term dynamics vs next‑gen capsids; exon‑skippers; endpoints and safety levers.",
      checklist: [
        "Track expression & functional endpoints for RGX‑202, SGT‑003",
        "Map immunomod regimens by program; flag complexity",
        "Compare valuation multiples vs growth/durability",
      ],
      links: [
        { label: "Elevidys label & updates", url: "#" },
        { label: "Next‑gen micro‑dys data tracker", url: "#" },
      ],
    },
    {
      key: "ibd",
      title: "Therapeutic Area — IBD (TL1A, Combos, Orals)",
      summary:
        "Efficacy ceiling, TL1A class, combo therapy potential, and oral biologic‑mimetics.",
      checklist: [
        "Follow JNJ DUET combo readouts",
        "Compare TL1A MoAs & immunogenicity (ADA) mitigation",
        "Track payer posture on JAKs and IL‑23R/α4β7",
      ],
      links: [
        { label: "IBD 2025–26 catalysts", url: "#" },
        { label: "TL1A competitive grid", url: "#" },
      ],
    },
    {
      key: "retina",
      title: "Therapeutic Area — NPDR/DME (Retina)",
      summary:
        "Durability advantage and real‑world logistics. Gene therapy vs sustained release vs implants.",
      checklist: [
        "AXPAXLI pivotal design — endpoints & rescue rules",
        "Sura‑vec ocular safety at scale; clinic logistics",
        "Model payer savings from reduced injection burden",
      ],
      links: [
        { label: "DRSS & endpoint primer", url: "#" },
        { label: "Retina capacity/utilization", url: "#" },
      ],
    },
    {
      key: "exonskippers",
      title: "Platform — Exon Skippers",
      summary:
        "Chemistries (PMO/PPMO/ASO), timelines, and competitive erosion dynamics vs gene therapy.",
      checklist: [
        "Map exon coverage & patient segments",
        "Track safety signals (renal, hepatic) by chemistry",
        "Price/volume erosion vs PMO incumbents",
      ],
      links: [
        { label: "Chemistry comparisons", url: "#" },
        { label: "Skipper program timelines", url: "#" },
      ],
    },
    {
      key: "orals",
      title: "Modality — Oral Biologic‑Mimetics",
      summary:
        "Oral IL‑23R, α4β7, and other pathways aiming to unseat injections in IBD.",
      checklist: [
        "Bioavailability & target engagement proof",
        "Compare remission vs safety vs convenience",
        "Payer stacking alongside existing biologics",
      ],
      links: [
        { label: "Oral pipeline map", url: "#" },
        { label: "Key readouts calendar", url: "#" },
      ],
    },
    {
      key: "policy",
      title: "Policy — Pricing, Access & Timelines",
      summary:
        "Beyond PRVs: CMS, payer step‑edits, inflation rebates, and access headwinds across our TAs.",
      checklist: [
        "Identify therapies exposed to inflation rebates",
        "List step‑therapy barriers in GI & retina",
        "Map EMA vs FDA timing gaps for valuation",
      ],
      links: [
        { label: "CMS watchlist", url: "#" },
        { label: "EMA/FDA divergence log", url: "#" },
      ],
    },
  ],
};

// =============================
// Components
// =============================
const GradientBG = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background:
    "radial-gradient(1200px 600px at 10% -10%, rgba(125,249,255,0.18), transparent 60%)," +
    "radial-gradient(900px 500px at 90% 0%, rgba(192,132,252,0.16), transparent 60%)," +
    "linear-gradient(180deg, #070a10 0%, #0b0f15 60%, #0a1018 100%)",
}));

const AuroraBar = () => (
  <Box sx={{ position: "sticky", top: 0, zIndex: 10 }}>
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: "1px solid rgba(125,249,255,0.12)",
        background: "rgba(8,12,20,0.6)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 1 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.3 }}>
          Aurora • Biotech Learning Module
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip icon={<Globe size={16} />} label="Eclipse Aurora" color="secondary" variant="outlined" />
      </Toolbar>
    </AppBar>
  </Box>
);

// Fancy pipeline loader
const PipelineLoader = ({ running }) => {
  return (
    <Box sx={{ my: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Zap size={18} />
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Processing knowledge pipeline
          </Typography>
        </Box>
        <Box sx={{ position: "relative", mt: 2 }}>
          <svg width="100%" height="60" viewBox="0 0 800 60">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7DF9FF" />
                <stop offset="50%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#7DF9FF" />
              </linearGradient>
            </defs>
            <rect x="10" y="25" width="780" height="10" rx="5" fill="url(#grad)" opacity="0.18" />
            {Array.from({ length: 12 }).map((_, i) => (
              <circle key={i} cx={20 + i * 65} cy={30} r={running ? 5 : 3} fill="url(#grad)">
                <animate
                  attributeName="cx"
                  values="20;790"
                  dur="5s"
                  repeatCount="indefinite"
                  begin={`${i * 0.25}s`}
                />
              </circle>
            ))}
          </svg>
          {running && <LinearProgress sx={{ position: "absolute", bottom: -2, left: 0, right: 0 }} />}
        </Box>
      </Paper>
    </Box>
  );
};

const SectionCard = ({ title, icon, children, actions }) => (
  <Card sx={{ mb: 2 }}>
    <CardHeader
      avatar={icon}
      title={<Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>}
      action={actions || null}
    />
    <Divider />
    <CardContent>{children}</CardContent>
  </Card>
);

const CopyButton = ({ text }) => {
  const [open, setOpen] = useState(false);
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setOpen(true);
    } catch (e) {
      // Fallback prompt for restricted environments
      const ok = window.prompt("Copy manually:", text);
      setOpen(!!ok);
    }
  };
  return (
    <>
      <Tooltip title="Copy to clipboard">
        <IconButton onClick={copyText}>
          <Copy size={18} />
        </IconButton>
      </Tooltip>
      <Snackbar open={open} autoHideDuration={1600} onClose={() => setOpen(false)}>
        <Alert severity="success" variant="filled">Copied</Alert>
      </Snackbar>
    </>
  );
};

// News log with addable rows
const NewsLog = () => {
  const [rows, setRows] = useLocal("newslog", []);
  const [form, setForm] = useState({ date: "", source: "", headline: "", take: "" });
  const add = () => {
    if (!form.headline) return;
    setRows([{ id: Date.now(), ...form }, ...rows]);
    setForm({ date: "", source: "", headline: "", take: "" });
  };
  return (
    <SectionCard title="News Log" icon={<BookOpen size={18} />}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Date"
          placeholder="YYYY‑MM‑DD"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <TextField
          size="small"
          label="Source"
          placeholder="STAT / Endpts / Fierce"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
        />
        <TextField
          size="small"
          label="Headline"
          sx={{ flex: 1 }}
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
        <TextField
          size="small"
          label="Quick take"
          sx={{ flex: 1 }}
          value={form.take}
          onChange={(e) => setForm({ ...form, take: e.target.value })}
        />
        <Button variant="contained" onClick={add} startIcon={<UploadCloud size={16} />}>
          Add
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Headline</TableCell>
            <TableCell>Quick take</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.date}</TableCell>
              <TableCell>{r.source}</TableCell>
              <TableCell>{r.headline}</TableCell>
              <TableCell>{r.take}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
};

// Checklist with persistence
const Checklist = ({ items, storageKey }) => {
  const [checks, setChecks] = useLocal(storageKey, {});
  const toggle = (i) => setChecks({ ...checks, [i]: !checks[i] });
  const progress = useMemo(() => {
    const vals = Object.values(checks);
    if (!items?.length) return 0;
    return Math.round((vals.filter(Boolean).length / items.length) * 100);
  }, [checks, items]);
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
          Progress
        </Typography>
        <Box sx={{ flex: 1 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
        <Chip size="small" label={`${progress}%`} color={progress === 100 ? "success" : "default"} />
      </Box>
      <List>
        {items.map((t, i) => (
          <ListItem key={i} disableGutters onClick={() => toggle(i)} sx={{ cursor: "pointer" }}>
            <ListItemIcon>
              <Checkbox edge="start" checked={!!checks[i]} tabIndex={-1} disableRipple />
            </ListItemIcon>
            <ListItemText primary={t} />
          </ListItem>
        ))}
      </List>
    </>
  );
};

const TLDR = () => (
  <SectionCard title="TL;DR" icon={<Zap size={18} />}>
    <Stack spacing={2}>
      {content.tldr.map((b, idx) => (
        <Paper key={idx} sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="secondary">{b.title}</Typography>
          <List dense>
            {b.bullets.map((t, i) => (
              <ListItem key={i}>
                <ListItemIcon>
                  <CheckCircle2 size={16} />
                </ListItemIcon>
                <ListItemText primary={t} />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}
    </Stack>
  </SectionCard>
);

const KeyAsks = () => (
  <SectionCard title="Key asks / decisions" icon={<ListTodo size={18} />}>
    <Stack spacing={2}>
      {content.asks.map((a, i) => (
        <Paper key={i} sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="secondary">{a.title}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>{a.text}</Typography>
        </Paper>
      ))}
    </Stack>
  </SectionCard>
);

const Numbers = () => (
  <SectionCard title="Numbers that matter" icon={<LineChart size={18} />}>
    <Stack spacing={2}>
      {content.numbers.map((n, i) => (
        <Paper key={i} sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="secondary" sx={{ mb: 1 }}>
            {n.area}
          </Typography>
          <List dense>
            {n.points.map((p, j) => (
              <ListItem key={j}>
                <ListItemIcon>
                  <Layers size={16} />
                </ListItemIcon>
                <ListItemText primary={p} />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}
    </Stack>
  </SectionCard>
);

const Risks = () => (
  <SectionCard title="Risks & unknowns" icon={<ShieldCheck size={18} />}>
    <Stack spacing={2}>
      {content.risks.map((r, i) => (
        <Accordion key={i}>
          <AccordionSummary expandIcon={<ChevronDown />}> 
            <Typography variant="subtitle2" color="secondary">{r.area}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {r.items.map((it, j) => (
                <ListItem key={j}>
                  <ListItemIcon>
                    <XCircle size={16} />
                  </ListItemIcon>
                  <ListItemText primary={it} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  </SectionCard>
);

const MyTake = () => (
  <SectionCard title="My take" icon={<FileSpreadsheet size={18} />}> 
    <Stack spacing={2}>
      {content.take.map((t, i) => (
        <Paper key={i} sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="secondary" sx={{ mb: 1 }}>
            {t.area}
          </Typography>
          <List dense>
            {t.bullets.map((b, j) => (
              <ListItem key={j}>
                <ListItemIcon>
                  <CheckCircle2 size={16} />
                </ListItemIcon>
                <ListItemText primary={b} />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}
    </Stack>
  </SectionCard>
);

const SuggestedReplies = () => (
  <SectionCard
    title="Suggested reply lines to Laura"
    icon={<BookOpen size={18} />}
    actions={<CopyButton text={content.replies.join("\n")} />}
  >
    <List dense>
      {content.replies.map((r, i) => (
        <ListItem key={i}>
          <ListItemIcon>
            <CheckCircle2 size={16} />
          </ListItemIcon>
          <ListItemText primary={r} />
        </ListItem>
      ))}
    </List>
  </SectionCard>
);

const NextActions = () => (
  <SectionCard title="Next actions" icon={<ListTodo size={18} />}>
    <Stack spacing={2}>
      {content.actions.map((a, i) => (
        <Paper key={i} sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="secondary">{a.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{a.detail}</Typography>
            </Box>
            <Chip label={`Owner: ${a.owner}`} variant="outlined" />
            <Badge color="secondary" badgeContent={a.due} />
          </Stack>
        </Paper>
      ))}
    </Stack>
  </SectionCard>
);

const DeepDiveCard = ({ dive }) => (
  <Card sx={{ height: "100%" }}>
    <CardHeader title={dive.title} subheader={dive.summary} />
    <Divider />
    <CardContent>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>Checklist</Typography>
      <Checklist items={dive.checklist} storageKey={`check_${dive.key}`} />
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {dive.links.map((l, i) => (
          <Chip key={i} label={l.label} component="a" href={l.url} clickable variant="outlined" />
        ))}
      </Stack>
    </CardContent>
  </Card>
);

const DeepDives = () => (
  <SectionCard title="Deeper dives (policy + ≥5 TAs)" icon={<Layers size={18} />}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 2,
      }}
    >
      {content.deepDives.map((d) => (
        <DeepDiveCard key={d.key} dive={d} />
      ))}
    </Box>
  </SectionCard>
);

const SearchBar = ({ onSearch }) => {
  const [q, setQ] = useState("");
  return (
    <Paper sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
      <Search size={18} />
      <TextField
        size="small"
        placeholder="Search within this module"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ flex: 1 }}
      />
      <Button variant="outlined" onClick={() => onSearch(q)}>
        Find
      </Button>
    </Paper>
  );
};

const findMatches = (q) => {
  if (!q) return [];
  const L = q.toLowerCase();
  const results = [];
  const scanText = (label, text) => {
    if (text.toLowerCase().includes(L)) results.push({ label, snippet: text.slice(0, 240) + "…" });
  };
  content.tldr.forEach((s) => s.bullets.forEach((b) => scanText(`TL;DR • ${s.title}`, b)));
  content.asks.forEach((a) => scanText("Ask", a.text));
  content.numbers.forEach((n) => n.points.forEach((p) => scanText(`Numbers • ${n.area}`, p)));
  content.risks.forEach((r) => r.items.forEach((it) => scanText(`Risk • ${r.area}`, it)));
  content.take.forEach((t) => t.bullets.forEach((b) => scanText(`My take • ${t.area}`, b)));
  content.replies.forEach((r) => scanText("Reply", r));
  content.actions.forEach((a) => [a.title, a.detail, a.due].forEach((t) => scanText(`Action • ${a.title}`, t)));
  content.deepDives.forEach((d) => {
    scanText(`Deep dive • ${d.title}`, d.summary);
    d.checklist.forEach((c) => scanText(`Deep dive • ${d.title}`, c));
  });
  return results.slice(0, 20);
};

// =============================
// Dev Diagnostics — lightweight "tests"
// =============================
const runDiagnostics = () => {
  const results = [];
  // Test 1: lucide icons exist (prevents CDN path 404s)
  results.push({
    name: "Icon availability (lucide-react)",
    pass: typeof UploadCloud === "function" && typeof Copy === "function",
    detail: "Expect UploadCloud and Copy to be valid components.",
  });
  // Test 2: search finds expected seeded terms
  const s1 = findMatches("PRV").length > 0;
  const s2 = findMatches("TL1A").length > 0;
  results.push({ name: "Search index contains PRV", pass: s1 });
  results.push({ name: "Search index contains TL1A", pass: s2 });
  // Test 3: localStorage read/write
  try {
    const k = "__aurora_selftest__";
    const v = String(Date.now());
    localStorage.setItem(k, v);
    const ok = localStorage.getItem(k) === v;
    localStorage.removeItem(k);
    results.push({ name: "localStorage R/W", pass: ok });
  } catch (e) {
    results.push({ name: "localStorage R/W", pass: false, detail: String(e) });
  }
  return results;
};

const Diagnostics = () => {
  const [runs, setRuns] = useState([]);
  const execute = () => setRuns(runDiagnostics());
  useEffect(() => {
    // auto-run once on mount
    execute();
  }, []);
  return (
    <SectionCard title="Diagnostics" icon={<Globe size={18} />}>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Lightweight checks to catch common integration issues. All should pass.
        </Typography>
        <Button variant="outlined" onClick={execute}>Run tests</Button>
      </Stack>
      <Stack spacing={1}>
        {runs.map((r, i) => (
          <Alert key={i} severity={r.pass ? "success" : "error"}>
            <strong>{r.name}:</strong> {r.pass ? "PASS" : "FAIL"}
            {r.detail ? <span style={{ marginLeft: 8 }}>— {r.detail}</span> : null}
          </Alert>
        ))}
      </Stack>
    </SectionCard>
  );
};

// =============================
// Root App
// =============================
export default function AuroraBiotechLearningModule() {
  const [tab, setTab] = useState(0);
  const [running, setRunning] = useState(true);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setRunning(false), 2400);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = (q) => setResults(findMatches(q));

  return (
    <ThemeProvider theme={auroraTheme}>
      <GradientBG>
        <Box sx={{ position: "sticky", top: 0, zIndex: 10 }}>
          <AppBar
            position="static"
            color="transparent"
            elevation={0}
            sx={{
              borderBottom: "1px solid rgba(125,249,255,0.12)",
              background: "rgba(8,12,20,0.6)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Toolbar>
              <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.3 }}>
                Aurora • Biotech Learning Module
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip icon={<Globe size={16} />} label="Eclipse Aurora" color="secondary" variant="outlined" />
            </Toolbar>
          </AppBar>
        </Box>

        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h3">Interactive Briefing</Typography>
            <Chip label="Glass dynamics" variant="outlined" />
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<Download size={16} />}
              onClick={() => {
                const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "aurora_module_export.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export JSON
            </Button>
          </Box>

          <PipelineLoader running={running} />
          <Box sx={{ mb: 2 }}>
            <Paper sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Search size={18} />
              <TextField
                size="small"
                placeholder="Search within this module"
                onChange={(e) => handleSearch(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Chip label={`${results.length} hits`} size="small" />
            </Paper>
            {results.length > 0 && (
              <Paper sx={{ mt: 1, p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Results
                </Typography>
                <List dense>
                  {results.map((r, i) => (
                    <ListItem key={i}>
                      <ListItemIcon>
                        <Search size={16} />
                      </ListItemIcon>
                      <ListItemText primary={r.label} secondary={r.snippet} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          <Paper sx={{ mb: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons allowScrollButtonsMobile>
              <Tab label="TL;DR" />
              <Tab label="Key asks" />
              <Tab label="Numbers" />
              <Tab label="Risks" />
              <Tab label="My take" />
              <Tab label="Replies" />
              <Tab label="Next actions" />
              <Tab label="News log" />
              <Tab label="Deep dives" />
              <Tab label="Diagnostics" />
            </Tabs>
          </Paper>

          {tab === 0 && <TLDR />}
          {tab === 1 && <KeyAsks />}
          {tab === 2 && <Numbers />}
          {tab === 3 && <Risks />}
          {tab === 4 && <MyTake />}
          {tab === 5 && <SuggestedReplies />}
          {tab === 6 && <NextActions />}
          {tab === 7 && <NewsLog />}
          {tab === 8 && <DeepDives />}
          {tab === 9 && <Diagnostics />}

          <Box sx={{ textAlign: "center", py: 4, opacity: 0.7 }}>
            <Typography variant="caption">Eagle & Condor mode: informed vision + grounded execution.</Typography>
          </Box>
        </Container>
      </GradientBG>
    </ThemeProvider>
  );
}
