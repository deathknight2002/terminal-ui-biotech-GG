import React, { useMemo, useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Calendar, FlaskConical, Landmark, Newspaper, Presentation, Sparkles } from "lucide-react";

/**
 * Biotech Catalyst Calendar — Polished Theme
 * - Restores and harmonizes theme colors
 * - Thoughtful gradients, soft-neu shadows, glass layers
 * - Parallax, micro-motions, but conservative defaults
 * - Accessible: respects prefers-reduced-motion
 *
 * To use: swap MOCK_EVENTS with your backend feed (shape: {date:'YYYY-MM-DD', symbol, title, kind, url?})
 */

/***************************
 * Theme
 ***************************/
const THEME = {
  palette: {
    indigo: "#6C63FF",
    violet: "#8B5CF6",
    cyan: "#38BDF8",
    emerald: "#10B981",
    rose: "#F43F5E",
    fuchsia: "#D946EF",
    deep: "#060719",
    glass: "rgba(255,255,255,0.04)",
  },
  sizes: {
    radius: '18px'
  }
};

const rootStyle = {
  '--primary': THEME.palette.indigo,
  '--accent': THEME.palette.violet,
  '--cyan': THEME.palette.cyan,
  '--emerald': THEME.palette.emerald,
  '--rose': THEME.palette.rose,
  '--fuchsia': THEME.palette.fuchsia,
  '--bg-deep': THEME.palette.deep,
  '--glass-bg': THEME.palette.glass,
};

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/***************************
 * Small visual helpers
 ***************************/
const glassPanelStyle = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.02), 0 10px 30px rgba(2,6,23,0.6)',
  border: '1px solid rgba(255,255,255,0.06)'
};

const neoShadow = '0 8px 24px rgba(3,7,18,0.6), inset 0 6px 12px rgba(255,255,255,0.02)';

/***************************
 * Utilities: dates
 ***************************/
const FIXED_TODAY = new Date('2205-09-30T12:00:00Z');
function startOfWeek(d, weekStartsOn = 1) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  x.setUTCDate(x.getUTCDate() - diff);
  return x;
}
function addDays(d, n) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; }
function fmt(d) { return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }); }

/***************************
 * Mock events (replace me)
 ***************************/
const MOCK_EVENTS = [
  { date: '2205-09-24', symbol: 'VERV', title: 'R&D Day – base editing', kind: 'conference' },
  { date: '2205-09-25', symbol: 'IONS', title: 'Evercore fireside chat', kind: 'conference' },
  { date: '2205-09-26', symbol: 'SRPT', title: 'FDA AdComm briefing book posts', kind: 'regulatory' },
  { date: '2205-09-27', symbol: 'CRSP', title: 'P2 topline: HSC edit', kind: 'data' },
  { date: '2205-09-28', symbol: 'ARVN', title: 'Target degrader KOL call', kind: 'conference' },
  { date: '2205-09-30', symbol: 'ABCD', title: 'PDUFA: Drug X (RA)', kind: 'regulatory' },
  { date: '2205-09-30', symbol: 'EFGH', title: 'Phase 2b topline (NASH)', kind: 'data' },
  { date: '2205-10-01', symbol: 'BEAM', title: 'Initiation – BigBank $62 TP', kind: 'other' },
  { date: '2205-10-02', symbol: 'NTLA', title: 'P1 dose expansion poster', kind: 'data' },
  { date: '2205-10-02', symbol: 'VRTX', title: 'R&D Day', kind: 'conference' },
  { date: '2205-10-03', symbol: 'REGN', title: 'FDA label expansion decision', kind: 'regulatory' },
  { date: '2205-10-03', symbol: 'ALNY', title: 'q3 prelim revenue', kind: 'earnings' },
  { date: '2205-10-04', symbol: 'XENE', title: 'Phase 3 readout: XEN1101', kind: 'data' },
  { date: '2205-10-06', symbol: 'HALO', title: 'Investor day', kind: 'conference' },
  { date: '2205-10-08', symbol: 'CRNX', title: 'Topline: CRN047 P2', kind: 'data' },
  { date: '2205-10-08', symbol: 'DNA', title: 'PDUFA: enzyme replacement', kind: 'regulatory' },
  { date: '2205-10-09', symbol: 'SRRK', title: 'Analyst day', kind: 'conference' },
  { date: '2205-10-10', symbol: 'IOVA', title: 'Quarterly – call 8am', kind: 'earnings' },
  { date: '2205-10-10', symbol: 'DYN', title: 'P1b expansion update', kind: 'data' },
  { date: '2205-10-11', symbol: 'ACAD', title: 'PDUFA: Nuplazid addl. label', kind: 'regulatory' },
];

/***************************
 * Kind meta with thoughtful colors referencing the theme
 ***************************/
const KIND_META = {
  regulatory: { label: 'Reg', colorVar: '--rose', icon: <Landmark className='h-3 w-3' /> },
  data: { label: 'Data', colorVar: '--primary', icon: <FlaskConical className='h-3 w-3' /> },
  conference: { label: 'Conf', colorVar: '--cyan', icon: <Presentation className='h-3 w-3' /> },
  earnings: { label: 'EPS', colorVar: '--emerald', icon: <Newspaper className='h-3 w-3' /> },
  other: { label: 'Other', colorVar: '--fuchsia', icon: <Sparkles className='h-3 w-3' /> },
};

/***************************
 * Day tile — improved visuals
 ***************************/
function DayCell({ date, isToday, events, motionEnabled }) {
  const cap = 5;
  const shown = events.slice(0, cap);
  const more = Math.max(0, events.length - cap);

  const lift = useMotionValue(0);

  return (
    <motion.div
      style={{ translateY: lift }}
      whileHover={motionEnabled ? { translateY: -8 } : {}}
      transition={motionEnabled ? { type: 'spring', stiffness: 170, damping: 18 } : { duration: 0 }}
      className='relative rounded-[14px] p-2' 
      aria-label={`Day ${fmt(date)}`}
    >
      <div style={{ boxShadow: neoShadow, borderRadius: 12, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className='p-2'>
          <div className='mb-2 flex items-center justify-between'>
            <div className={`text-[11px] font-semibold ${isToday ? 'text-white' : 'text-white/80'}`}>{fmt(date)}</div>
            {isToday && (
              <motion.span
                initial={{ opacity: 0.6, scale: 0.99 }}
                animate={{ opacity: [0.6, 0.95, 0.6], scale: [0.99, 1.03, 0.99] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className='inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]' 
                style={{ background: 'linear-gradient(90deg, rgba(108,99,255,0.12), rgba(139,92,246,0.08))', color: 'white' }}
              >
                <Calendar className='h-3 w-3' /> Today
              </motion.span>
            )}
          </div>

          <div className='space-y-1.5'>
            {shown.map((e, i) => {
              const meta = KIND_META[e.kind] || KIND_META.other;
              const color = `var(${meta.colorVar})`;
              return (
                <a key={i} href={e.url || '#'} className='group block rounded-lg px-2 py-1.5 transition-all duration-250' style={{ display: 'block', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className='flex items-center gap-2'>
                    <span className='inline-flex h-5 w-6 items-center justify-center rounded-sm text-[10px] font-semibold' style={{ background: 'rgba(255,255,255,0.04)', color: 'white' }}>{e.symbol.slice(0,5)}</span>
                    <span className='truncate text-[12px]' style={{ color: 'rgba(255,255,255,0.92)' }}>{e.title}</span>
                    <span className='ml-auto inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[11px]' style={{ background: 'rgba(255,255,255,0.02)', color }}>
                      <span style={{ width: 8, height: 8, borderRadius: 8, background: color }} />
                      <span style={{ opacity: 0.95 }}>{meta.label}</span>
                    </span>
                  </div>
                </a>
              );
            })}
            {more > 0 && (
              <div className='mt-1 text-[10px] text-white/60'>+{more} more</div>
            )}
          </div>
        </div>
      </div>

      {isToday && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 14, zIndex: -1, background: `radial-gradient(60% 60% at 50% 40%, rgba(108,99,255,0.14), transparent 40%)`, filter: 'blur(20px)' }} />
      )}
    </motion.div>
  );
}

/***************************
 * Main calendar
 ***************************/
export default function BiotechCatalystCalendar({ events = MOCK_EVENTS }) {
  const reduced = prefersReducedMotion();
  const start = useMemo(() => startOfWeek(addDays(FIXED_TODAY, -7)), []);
  const days = useMemo(() => Array.from({ length: 28 }, (_, i) => addDays(start, i)), [start]);

  const byKey = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const k = new Date(e.date + 'T00:00:00Z').toISOString().slice(0,10);
      const arr = map.get(k) || [];
      arr.push(e);
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const title = `${fmt(days[0])} → ${fmt(days[days.length - 1])}`;

  // parallax
  const ref = useRef(null);
  const [p, setP] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    function onMove(e) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      setP({ x: dx, y: dy });
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  const layerA = { transform: `translate3d(${p.x * 8}px, ${p.y * 8}px, 0)`, transition: 'transform 400ms ease-out' };
  const layerB = { transform: `translate3d(${p.x * 16}px, ${p.y * 12}px, 0)`, transition: 'transform 600ms ease-out' };

  return (
    <div style={rootStyle} className='min-h-screen' ref={ref}>
      {/* background */}
      <div className='fixed inset-0 -z-20 overflow-hidden' aria-hidden>
        <div style={layerB} className='absolute inset-0' >
          <div style={{ width: '100%', height: '100%', background: `radial-gradient(700px 500px at 8% 12%, rgba(139,92,246,0.12), transparent), radial-gradient(600px 400px at 92% 88%, rgba(56,189,248,0.09), transparent)` }} />
        </div>
        <div style={layerA} className='absolute inset-0'>
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(180deg, rgba(6,7,25,0.6), rgba(6,7,25,0.92))`, mixBlendMode: 'overlay' }} />
        </div>
      </div>

      <div className='mx-auto max-w-7xl px-6 pt-8'>
        <div className='mb-6 flex items-end justify-between gap-3'>
          <div>
            <div className='text-xs uppercase tracking-widest text-white/60'>Biotech · Upcoming Catalysts</div>
            <h1 className='mt-1 text-3xl font-extrabold text-white'>Catalyst Calendar</h1>
            <div className='mt-1 text-sm text-white/70'>Window: {title} · Today fixed to Sep 30, 2205</div>
          </div>

          <div style={{ ...glassPanelStyle, borderRadius: 14, padding: 8 }}>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg px-3 py-1 text-sm text-white/90' style={{ background: 'rgba(255,255,255,0.02)' }}>1 wk back · 3 wk ahead</div>
              <div className='hidden sm:block rounded-lg px-3 py-1 text-sm text-white/90' style={{ background: 'rgba(255,255,255,0.02)' }}>Max 5 events/day</div>
            </div>
          </div>
        </div>

        <div style={{ ...glassPanelStyle, borderRadius: 18, padding: 14 }}>
          <div className='grid grid-cols-7 gap-4'>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className='px-1 pb-1 text-center text-xs uppercase tracking-wide text-white/50'>{d}</div>
            ))}

            {days.map((d,i) => {
              const k = d.toISOString().slice(0,10);
              const ev = (byKey.get(k) || []);
              const evts = ev.slice(0,5);
              const isToday = k === FIXED_TODAY.toISOString().slice(0,10);
              return (
                <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : i * 0.01, type: 'spring', stiffness: 160, damping: 20 }}>
                  <DayCell date={d} isToday={isToday} events={evts} motionEnabled={!reduced} />
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-2 text-xs text-white/70'>
          {Object.entries(KIND_META).map(([k,m]) => (
            <div key={k} className='inline-flex items-center gap-2 rounded-full px-2 py-1' style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ width:10, height:10, borderRadius:10, background: `var(${m.colorVar})` }} />
              <div style={{ opacity: 0.9 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div className='py-10 text-center text-xs text-white/40'>Polished theme: consistent colors, soft neu-glass, and gentle motion. Swap MOCK_EVENTS to feed real data.</div>
      </div>
    </div>
  );
}

// run minimal self-tests in-browser
function runSelfTests() {
  try {
    const wk = startOfWeek(new Date('2205-09-30T00:00:00Z'));
    console.assert(wk.toISOString().slice(0,10) === '2205-09-26', 'startOfWeek: expected 2205-09-26');
    const days = Array.from({length:28},(_,i)=>addDays(wk,i));
    console.assert(days.length === 28, '28 days');
    const grouped = MOCK_EVENTS.reduce((map,e)=>{ const k = new Date(e.date+'T00:00:00Z').toISOString().slice(0,10); map.set(k,(map.get(k)||[]).concat(e)); return map; }, new Map());
    console.assert((grouped.get('2205-09-30')||[]).length >= 2, 'sep30 has >=2 events');
  } catch(err) { console.warn('selftests',err); }
}
if (typeof window !== 'undefined') runSelfTests();
