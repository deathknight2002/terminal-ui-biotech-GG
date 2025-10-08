import type { WorkspaceLayout } from '../types/biotech';

/**
 * Starter Layouts - Pre-configured workspace views
 * Bloomberg Launchpad / LSEG Workspace pattern
 */
export const STARTER_LAYOUTS: WorkspaceLayout[] = [
  {
    id: 'oncology-pm',
    name: 'Oncology PM',
    description: 'Portfolio manager view for oncology assets with catalyst tracking, news, and trials',
    category: 'starter',
    panels: [
      {
        id: 'watchlist-1',
        type: 'watchlist',
        position: { x: 0, y: 0, col: 0, row: 0 },
        size: { width: '25%', height: '50%', cols: 3, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'catalyst-calendar-1',
        type: 'catalyst-calendar',
        position: { x: 1, y: 0, col: 3, row: 0 },
        size: { width: '50%', height: '50%', cols: 6, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'news-feed-1',
        type: 'news-feed',
        position: { x: 2, y: 0, col: 9, row: 0 },
        size: { width: '25%', height: '50%', cols: 3, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'trials-timeline-1',
        type: 'trials-timeline',
        position: { x: 0, y: 1, col: 0, row: 2 },
        size: { width: '50%', height: '50%', cols: 6, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'pipeline-viz-1',
        type: 'pipeline-visualization',
        position: { x: 1, y: 1, col: 6, row: 2 },
        size: { width: '50%', height: '50%', cols: 6, rows: 2 },
        contextChannel: 'A',
      },
    ],
    contextGroups: {
      A: { channel: 'A', activeEntity: null, subscribers: ['watchlist-1', 'catalyst-calendar-1', 'news-feed-1', 'trials-timeline-1', 'pipeline-viz-1'] },
      B: { channel: 'B', activeEntity: null, subscribers: [] },
      C: { channel: 'C', activeEntity: null, subscribers: [] },
      NONE: { channel: 'NONE', activeEntity: null, subscribers: [] },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thumbnail: '🎯',
  },
  {
    id: 'catalyst-war-room',
    name: 'Catalyst War-Room',
    description: 'Real-time catalyst monitoring with multi-entity comparison and sentiment tracking',
    category: 'starter',
    panels: [
      {
        id: 'catalyst-calendar-2',
        type: 'catalyst-calendar',
        position: { x: 0, y: 0, col: 0, row: 0 },
        size: { width: '40%', height: '60%', cols: 5, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'news-sentiment-1',
        type: 'news-sentiment',
        position: { x: 1, y: 0, col: 5, row: 0 },
        size: { width: '30%', height: '60%', cols: 4, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'catalyst-alerts-1',
        type: 'catalyst-alerts',
        position: { x: 2, y: 0, col: 9, row: 0 },
        size: { width: '30%', height: '60%', cols: 3, rows: 2 },
        contextChannel: 'B',
      },
      {
        id: 'spiderweb-compare-1',
        type: 'spiderweb-compare',
        position: { x: 0, y: 1, col: 0, row: 2 },
        size: { width: '60%', height: '40%', cols: 7, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'readout-timeline-1',
        type: 'readout-timeline',
        position: { x: 1, y: 1, col: 7, row: 2 },
        size: { width: '40%', height: '40%', cols: 5, rows: 2 },
        contextChannel: 'B',
      },
    ],
    contextGroups: {
      A: { channel: 'A', activeEntity: null, subscribers: ['catalyst-calendar-2', 'news-sentiment-1', 'spiderweb-compare-1'] },
      B: { channel: 'B', activeEntity: null, subscribers: ['catalyst-alerts-1', 'readout-timeline-1'] },
      C: { channel: 'C', activeEntity: null, subscribers: [] },
      NONE: { channel: 'NONE', activeEntity: null, subscribers: [] },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thumbnail: '⚡',
  },
  {
    id: 'epi-ops',
    name: 'Epi Ops',
    description: 'Epidemiology operations dashboard with disease modeling and cohort analysis',
    category: 'starter',
    panels: [
      {
        id: 'disease-catalog-1',
        type: 'disease-catalog',
        position: { x: 0, y: 0, col: 0, row: 0 },
        size: { width: '30%', height: '50%', cols: 4, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'epi-builder-1',
        type: 'epi-builder',
        position: { x: 1, y: 0, col: 4, row: 0 },
        size: { width: '40%', height: '100%', cols: 5, rows: 4 },
        contextChannel: 'A',
      },
      {
        id: 'regional-burden-1',
        type: 'regional-burden',
        position: { x: 2, y: 0, col: 9, row: 0 },
        size: { width: '30%', height: '50%', cols: 3, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'cohort-builder-1',
        type: 'cohort-builder',
        position: { x: 0, y: 1, col: 0, row: 2 },
        size: { width: '30%', height: '50%', cols: 4, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'literature-refs-1',
        type: 'literature-explorer',
        position: { x: 2, y: 1, col: 9, row: 2 },
        size: { width: '30%', height: '50%', cols: 3, rows: 2 },
        contextChannel: 'B',
      },
    ],
    contextGroups: {
      A: { channel: 'A', activeEntity: null, subscribers: ['disease-catalog-1', 'epi-builder-1', 'regional-burden-1', 'cohort-builder-1'] },
      B: { channel: 'B', activeEntity: null, subscribers: ['literature-refs-1'] },
      C: { channel: 'C', activeEntity: null, subscribers: [] },
      NONE: { channel: 'NONE', activeEntity: null, subscribers: [] },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thumbnail: '🧬',
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    description: 'Competitive intelligence with company tracking, market data, and SOV analysis',
    category: 'starter',
    panels: [
      {
        id: 'company-profiles-1',
        type: 'company-profiles',
        position: { x: 0, y: 0, col: 0, row: 0 },
        size: { width: '25%', height: '100%', cols: 3, rows: 4 },
        contextChannel: 'A',
      },
      {
        id: 'spiderweb-landscape-1',
        type: 'spiderweb-compare',
        position: { x: 1, y: 0, col: 3, row: 0 },
        size: { width: '50%', height: '60%', cols: 6, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'sov-tracker-1',
        type: 'share-of-voice',
        position: { x: 2, y: 0, col: 9, row: 0 },
        size: { width: '25%', height: '60%', cols: 3, rows: 2 },
        contextChannel: 'A',
      },
      {
        id: 'market-valuations-1',
        type: 'market-valuations',
        position: { x: 1, y: 1, col: 3, row: 2 },
        size: { width: '50%', height: '40%', cols: 6, rows: 2 },
        contextChannel: 'B',
      },
      {
        id: 'pipeline-maps-1',
        type: 'pipeline-maps',
        position: { x: 2, y: 1, col: 9, row: 2 },
        size: { width: '25%', height: '40%', cols: 3, rows: 2 },
        contextChannel: 'B',
      },
    ],
    contextGroups: {
      A: { channel: 'A', activeEntity: null, subscribers: ['company-profiles-1', 'spiderweb-landscape-1', 'sov-tracker-1'] },
      B: { channel: 'B', activeEntity: null, subscribers: ['market-valuations-1', 'pipeline-maps-1'] },
      C: { channel: 'C', activeEntity: null, subscribers: [] },
      NONE: { channel: 'NONE', activeEntity: null, subscribers: [] },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thumbnail: '📊',
  },
];

/**
 * Get starter layout by ID
 */
export function getStarterLayout(id: string): WorkspaceLayout | undefined {
  return STARTER_LAYOUTS.find((layout) => layout.id === id);
}

/**
 * Get all starter layouts
 */
export function getAllStarterLayouts(): WorkspaceLayout[] {
  return STARTER_LAYOUTS;
}
