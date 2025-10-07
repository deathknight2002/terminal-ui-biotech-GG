import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  Command,
  Mic,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import styles from './TerminalHome.module.css';
import { TerminalFrame } from './components/TerminalFrame';
import { WatchlistPanel } from './components/WatchlistPanel';
import { StageMixCard } from './components/StageMixCard';

export type TrendState = 'up' | 'down' | 'flat';

export type IconComponent = React.ComponentType<{ size?: number }>;

export type QuickAction = {
  label: string;
  description: string;
  icon: IconComponent;
  module?: string;
  href?: string;
  shortcut?: string;
};

export type StageMetric = {
  stage: string;
  value: number;
  change: number;
  trend: TrendState;
  palette: [string, string];
};

export type StatMetric = {
  label: string;
  value: string;
  sublabel?: string;
  trend?: TrendState;
  delta?: string;
};

export type WatchlistRow = {
  symbol: string;
  label: string;
  price: string;
  change: string;
  changeState: TrendState;
};

export type ScreenerRow = {
  name: string;
  focus: string;
  stage: string;
  score: string;
  signal: TrendState;
};

export type RegulatoryItem = {
  agency: string;
  action: string;
  timeline: string;
  status: 'approved' | 'pending' | 'review';
};

export type ResourceLink = {
  name: string;
  summary: string;
  href: string;
  category: string;
};

export interface TerminalHomeData {
  headline?: {
    title: string;
    subtitle: string;
  };
  quickActions: QuickAction[];
  stageMix: StageMetric[];
  stats: StatMetric[];
  watchlist: WatchlistRow[];
  screener: ScreenerRow[];
  regulatory: RegulatoryItem[];
  resources: ResourceLink[];
}

export interface TerminalHomeProps {
  data?: Partial<TerminalHomeData>;
  onNavigate?: (module: string) => void;
  onOpenLink?: (href: string) => void;
  className?: string;
}

const DEFAULT_HOME_DATA: TerminalHomeData = {
  headline: {
    title: 'Black Aurora Terminal',
    subtitle:
      '90-day intelligence sprint across pipeline momentum, runway appetite, and regulatory sentiment. Cutting across discovery to commercial execution with human + machine alignment.',
  },
  quickActions: [
    {
      label: 'Launch Aurora Ops',
      description: 'Real-time command for pipeline logistics and field ops.',
      module: 'aurora',
      icon: Command,
      shortcut: '⌘ + ⇧ + A',
    },
    {
      label: 'Portfolio Pulse',
      description: 'Risk overlays, exposure deltas, and alpha decomposition.',
      module: 'portfolio',
      icon: BarChart3,
      shortcut: '⌘ + ⇧ + P',
    },
    {
      label: 'Catalyst Screener',
      description: 'Surface mission-critical readouts across 60-day horizon.',
      module: 'catalyst',
      icon: Sparkles,
      shortcut: '⌘ + ⇧ + C',
    },
    {
      label: 'Knowledge Base',
      description: 'Playbooks, briefing decks, and therapeutic dossiers.',
      href: 'https://openbb.co/academy',
      icon: BookOpen,
      shortcut: '⌘ + ⇧ + K',
    },
  ],
  stageMix: [
    {
      stage: 'Discovery',
      value: 18,
      change: 5,
      trend: 'up',
      palette: ['rgba(244,63,94,0.82)', 'rgba(244,63,94,0.55)'],
    },
    {
      stage: 'Preclinical',
      value: 22,
      change: 3,
      trend: 'up',
      palette: ['rgba(236,72,153,0.87)', 'rgba(236,72,153,0.48)'],
    },
    {
      stage: 'Phase I',
      value: 16,
      change: -2,
      trend: 'down',
      palette: ['rgba(168,85,247,0.85)', 'rgba(168,85,247,0.45)'],
    },
    {
      stage: 'Phase II',
      value: 14,
      change: 1,
      trend: 'up',
      palette: ['rgba(99,102,241,0.8)', 'rgba(99,102,241,0.42)'],
    },
    {
      stage: 'Phase III',
      value: 11,
      change: -1,
      trend: 'down',
      palette: ['rgba(59,130,246,0.85)', 'rgba(59,130,246,0.48)'],
    },
    {
      stage: 'Commercial',
      value: 8,
      change: 2,
      trend: 'up',
      palette: ['rgba(14,165,233,0.82)', 'rgba(14,165,233,0.42)'],
    },
  ],
  stats: [
    { label: 'Pipeline Velocity', value: '↑ 8.2%', delta: '+1.4% QoQ', trend: 'up' },
    { label: 'Runway Coverage', value: '14.8 mo', delta: '+0.6 mo', trend: 'up' },
    { label: 'Regulatory Risk', value: 'Moderate', delta: 'Stable', trend: 'flat' },
  ],
  watchlist: [
    { symbol: 'SRPT', label: 'Sarepta', price: '$162.40', change: '+3.2%', changeState: 'up' },
    { symbol: 'BEAM', label: 'Beam Therapeutics', price: '$41.22', change: '+1.5%', changeState: 'up' },
    { symbol: 'NTLA', label: 'Intellia', price: '$52.78', change: '-0.9%', changeState: 'down' },
    { symbol: 'REGN', label: 'Regeneron', price: '$898.12', change: '+0.3%', changeState: 'flat' },
  ],
  screener: [
    { name: 'NovaCell', focus: 'CAR-T Solid Tumor', stage: 'Phase II', score: '↑ High', signal: 'up' },
    { name: 'OncoPulse', focus: 'ADC Ovarian', stage: 'Phase I', score: '↑ Medium', signal: 'up' },
    { name: 'HelixBridge', focus: 'RNAi Pulmonary', stage: 'Preclinical', score: '→ Watch', signal: 'flat' },
    { name: 'VectorField', focus: 'Capsid Engineering', stage: 'Discovery', score: '↓ Low', signal: 'down' },
  ],
  regulatory: [
    {
      agency: 'FDA CBER',
      action: 'Type B Meeting Confirmed',
      timeline: 'Nov 05 • SRP-5051',
      status: 'approved',
    },
    {
      agency: 'EMA',
      action: 'Accelerated Assessment Requested',
      timeline: 'Nov 21 • NTLA-2002',
      status: 'pending',
    },
    {
      agency: 'FDA CDER',
      action: 'CMC Follow Up Requested',
      timeline: 'Dec 02 • BEAM-302',
      status: 'review',
    },
  ],
  resources: [
    {
      name: 'Aurora Ops Playbook',
      summary: 'Runbook for deployment sequencing and escalation paths.',
      href: '#',
      category: 'Operations',
    },
    {
      name: 'Portfolio Risk Deck',
      summary: 'Exposure, VaR, and catalyst clustering across funds.',
      href: '#',
      category: 'Strategy',
    },
    {
      name: 'Regulatory Matrix',
      summary: 'Agency-specific SLAs, precedent notes, and contacts.',
      href: '#',
      category: 'Regulatory',
    },
  ],
};

const trendClassName = (trend: TrendState | undefined): string => {
  if (trend === 'up') return styles.trendPositive;
  if (trend === 'down') return styles.trendNegative;
  return styles.trendNeutral;
};

const TrendValue: React.FC<{ trend?: TrendState; value?: string }> = ({ trend, value }) => {
  if (!value) return null;
  return <span className={trendClassName(trend)}>{value}</span>;
};

const QuickActions: React.FC<{
  actions: QuickAction[];
  onNavigate?: (module: string) => void;
  onOpenLink?: (href: string) => void;
}> = ({ actions, onNavigate, onOpenLink }) => {
  const handleAction = (action: QuickAction) => {
    if (action.module) {
      if (onNavigate) {
        onNavigate(action.module);
      } else if (typeof window !== 'undefined') {
        const payload = { type: 'terminal:navigate', target: action.module };
        const hostWindow = window as typeof window & {
          chrome?: { webview?: { postMessage?: (message: unknown) => void } };
        };
        hostWindow.chrome?.webview?.postMessage?.(payload);
        window.parent?.postMessage?.(payload, '*');
      }
    } else if (action.href) {
      if (onOpenLink) {
        onOpenLink(action.href);
      } else if (typeof window !== 'undefined') {
        window.open(action.href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div className={styles.quickActions}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            className={styles.quickAction}
            onClick={() => handleAction(action)}
          >
            <div className={styles.quickActionHeader}>
              <Icon size={18} />
              <span>{action.label}</span>
            </div>
            <p className={styles.quickActionDescription}>{action.description}</p>
            {action.shortcut && (
              <span className={styles.pill}>
                <Command size={12} style={{ opacity: 0.65 }} /> {action.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const Screener: React.FC<{ rows: ScreenerRow[] }> = ({ rows }) => (
  <div className={styles.screenerTable}>
    {rows.map((row) => (
      <div key={row.name} className={styles.screenerRow}>
        <span>{row.name}</span>
        <span>{row.focus}</span>
        <span>{row.stage}</span>
        <span className={trendClassName(row.signal)}>{row.score}</span>
      </div>
    ))}
  </div>
);

const Regulatory: React.FC<{ rows: RegulatoryItem[] }> = ({ rows }) => (
  <div className={styles.regulatoryList}>
    {rows.map((item) => (
      <div key={`${item.agency}-${item.timeline}`} className={styles.regulatoryItem}>
        <div className={styles.regulatoryMeta}>
          <span>{item.agency}</span>
          <strong>{item.action}</strong>
          <span>{item.timeline}</span>
        </div>
        <span className={styles.pill}>{item.status}</span>
      </div>
    ))}
  </div>
);

const Resources: React.FC<{ links: ResourceLink[]; onOpenLink?: (href: string) => void }> = ({
  links,
  onOpenLink,
}) => (
  <div className={styles.resourceList}>
    {links.map((link) => (
      <button
        key={link.name}
        type="button"
        className={styles.resourceItem}
        onClick={() => {
          if (onOpenLink) {
            onOpenLink(link.href);
          } else if (typeof window !== 'undefined') {
            window.open(link.href, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <div className={styles.resourceMeta}>
          <span>{link.category}</span>
          <strong>{link.name}</strong>
          <span>{link.summary}</span>
        </div>
        <span className={styles.resourceAction}>
          Open <ArrowUpRight size={16} />
        </span>
      </button>
    ))}
  </div>
);

export const TerminalHome: React.FC<TerminalHomeProps> = ({
  data,
  onNavigate,
  onOpenLink,
  className,
}) => {
  const mergedData = useMemo<TerminalHomeData>(() => {
    if (!data) return DEFAULT_HOME_DATA;
    return {
      headline: data.headline ?? DEFAULT_HOME_DATA.headline,
      quickActions: data.quickActions ?? DEFAULT_HOME_DATA.quickActions,
      stageMix: data.stageMix ?? DEFAULT_HOME_DATA.stageMix,
      stats: data.stats ?? DEFAULT_HOME_DATA.stats,
      watchlist: data.watchlist ?? DEFAULT_HOME_DATA.watchlist,
      screener: data.screener ?? DEFAULT_HOME_DATA.screener,
      regulatory: data.regulatory ?? DEFAULT_HOME_DATA.regulatory,
      resources: data.resources ?? DEFAULT_HOME_DATA.resources,
    };
  }, [data]);

  const headline = mergedData.headline;

  return (
    <TerminalFrame
      className={className}
      headline={{
        title: headline?.title ?? 'Biotech Command',
        subtitle: headline?.subtitle,
        eyebrow: 'Human + Machine Ops',
      }}
      watchlistSlot={<WatchlistPanel rows={mergedData.watchlist} />}
    >
      <div className={styles.grid}>
        <div className={styles.primaryColumn}>
          <article className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Command Shortcuts</span>
              <span className={styles.badge}>Always On</span>
            </div>
            <QuickActions
              actions={mergedData.quickActions}
              onNavigate={onNavigate}
              onOpenLink={onOpenLink}
            />
          </article>

          <StageMixCard
            stages={mergedData.stageMix}
            stats={mergedData.stats}
            actionLabel="Full Analytics"
            onAction={onNavigate ? () => onNavigate('analytics') : undefined}
          />

          <article className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Catalyst Screener</span>
              <span className={styles.badge}>60 Day Horizon</span>
            </div>
            <Screener rows={mergedData.screener} />
          </article>
        </div>

        <div className={styles.secondaryColumn}>
          <article className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Regulatory Signals</span>
              <ShieldCheck size={18} />
            </div>
            <Regulatory rows={mergedData.regulatory} />
          </article>

          <article className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Ops Resources</span>
              <Mic size={18} />
            </div>
            <Resources links={mergedData.resources} onOpenLink={onOpenLink} />
          </article>

          <article className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Runway Focus</span>
              <CalendarClock size={18} />
            </div>
            <p className={styles.quickActionDescription}>
              72% of tracked programs maintain &gt; 14 month runway. 5 critical assets require financing
              actions within the next quarter.
            </p>
            <div className={styles.statTiles}>
              <div className={styles.statTile}>
                <span className={styles.statLabel}>Median Burn</span>
                <span className={styles.statValue}>$4.8M</span>
                <TrendValue trend="down" value="-0.6M MoM" />
              </div>
              <div className={styles.statTile}>
                <span className={styles.statLabel}>Financing Window</span>
                <span className={styles.statValue}>89 Days</span>
                <TrendValue trend="flat" value="Monitoring" />
              </div>
            </div>
          </article>
        </div>
      </div>
    </TerminalFrame>
  );
};

export default TerminalHome;
