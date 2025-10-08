import type { AppModule } from '../types/biotech';

/**
 * App Modules - Launchable applications in the terminal
 * Workspace/Launchpad pattern for modular app discovery
 */
export const APP_MODULES: AppModule[] = [
  // News & Intelligence
  {
    id: 'news-stream',
    name: 'News Stream',
    description: 'Latest biotech news articles and intelligence feed',
    category: 'news',
    icon: '📰',
    path: '/news',
    functionCode: 'NE',
  },
  {
    id: 'sentiment-tracker',
    name: 'Sentiment Tracker',
    description: 'Track sentiment across domains and sources',
    category: 'news',
    icon: '📊',
    path: '/news/sentiment',
    functionCode: 'SENT',
  },

  // Science & Research
  {
    id: 'epidemiology',
    name: 'Epidemiology Builder',
    description: 'Disease burden analysis and modeling toolkit',
    category: 'science',
    icon: '🧬',
    path: '/epidemiology',
    functionCode: 'EPI',
  },
  {
    id: 'literature',
    name: 'Literature Explorer',
    description: 'Scientific literature search and discovery',
    category: 'science',
    icon: '📚',
    path: '/science/literature',
    functionCode: 'LIT',
  },
  {
    id: 'biomarkers',
    name: 'Biomarker Atlas',
    description: 'Comprehensive biomarker database and atlas',
    category: 'science',
    icon: '🔬',
    path: '/science/biomarkers',
    functionCode: 'BIO',
  },

  // Catalysts
  {
    id: 'catalyst-calendar',
    name: 'Catalyst Calendar',
    description: 'Upcoming market-moving events and readouts',
    category: 'catalysts',
    icon: '📅',
    path: '/catalysts/calendar',
    functionCode: 'CA',
  },
  {
    id: 'past-catalysts',
    name: 'Past Catalysts Log',
    description: 'Historical catalyst data and outcomes',
    category: 'catalysts',
    icon: '📜',
    path: '/catalysts/past',
  },
  {
    id: 'catalyst-alerts',
    name: 'Catalyst Alerts',
    description: 'Custom alert notes and notifications',
    category: 'catalysts',
    icon: '🔔',
    path: '/catalysts/alerts',
  },

  // Clinical Trials
  {
    id: 'trials-finder',
    name: 'Trial Finder',
    description: 'Search and track clinical trials',
    category: 'trials',
    icon: '🔍',
    path: '/trials',
    functionCode: 'TR',
  },
  {
    id: 'readout-timeline',
    name: 'Readout Timeline',
    description: 'Upcoming trial readouts and milestones',
    category: 'trials',
    icon: '⏰',
    path: '/trials/readouts',
    functionCode: 'RO',
  },
  {
    id: 'enrollment-heatmap',
    name: 'Enrollment Heatmap',
    description: 'Trial enrollment tracking and visualization',
    category: 'trials',
    icon: '🗺️',
    path: '/trials/enrollment',
    functionCode: 'ENR',
  },

  // Companies
  {
    id: 'company-profiles',
    name: 'Company Profiles',
    description: 'Biotech and pharma company information',
    category: 'companies',
    icon: '🏢',
    path: '/companies',
    functionCode: 'CO',
  },
  {
    id: 'therapeutics-directory',
    name: 'Therapeutics Directory',
    description: 'Drug pipeline directory and database',
    category: 'companies',
    icon: '💊',
    path: '/companies/therapeutics',
    functionCode: 'THER',
  },
  {
    id: 'pipeline-maps',
    name: 'Pipeline Maps',
    description: 'Visual pipeline maps and development stages',
    category: 'companies',
    icon: '🗺️',
    path: '/companies/pipelines',
    functionCode: 'PIPE',
  },

  // Analytics
  {
    id: 'compare-engine',
    name: 'Compare Engine',
    description: 'Multi-entity comparison and analysis',
    category: 'analytics',
    icon: '⚖️',
    path: '/analytics/compare',
    functionCode: 'CMP',
  },
  {
    id: 'trend-detection',
    name: 'Trend Detection',
    description: 'AI-powered trend analysis and forecasting',
    category: 'analytics',
    icon: '📈',
    path: '/analytics/trends',
    functionCode: 'TREND',
  },
  {
    id: 'scenario-models',
    name: 'Scenario Models',
    description: 'Scenario planning and modeling tools',
    category: 'analytics',
    icon: '🎯',
    path: '/analytics/scenarios',
    functionCode: 'SCEN',
  },

  // Data
  {
    id: 'data-catalog',
    name: 'Data Catalog',
    description: 'Browse available datasets and sources',
    category: 'data',
    icon: '📂',
    path: '/data/catalog',
    functionCode: 'DATA',
  },
  {
    id: 'data-provenance',
    name: 'Provenance & Audit',
    description: 'Data lineage tracking and audit trail',
    category: 'data',
    icon: '🔍',
    path: '/data/provenance',
    functionCode: 'PROV',
  },
  {
    id: 'data-exports',
    name: 'Exports',
    description: 'Export data files and reports',
    category: 'data',
    icon: '📥',
    path: '/data/exports',
    functionCode: 'EXP',
  },
  {
    id: 'data-freshness',
    name: 'Data Freshness',
    description: 'Data update tracking and monitoring',
    category: 'data',
    icon: '🔄',
    path: '/data/freshness',
    functionCode: 'FRESH',
  },

  // Tools
  {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Quick command access and navigation',
    category: 'tools',
    icon: '⌨️',
    path: '/tools/command',
    functionCode: 'CMD',
  },
  {
    id: 'manual-refresh',
    name: 'Manual Refresh',
    description: 'Data refresh controls and management',
    category: 'tools',
    icon: '🔄',
    path: '/tools/refresh',
    functionCode: 'REF',
  },
  {
    id: 'keyboard-shortcuts',
    name: 'Keyboard Shortcuts',
    description: 'View all keyboard shortcuts and hotkeys',
    category: 'tools',
    icon: '⌨️',
    path: '/tools/shortcuts',
    functionCode: 'KEY',
  },
  {
    id: 'theme-toggle',
    name: 'Theme Toggle',
    description: 'Switch between UI themes and styles',
    category: 'tools',
    icon: '🎨',
    path: '/tools/theme',
    functionCode: 'THEME',
  },
];

/**
 * Get app module by ID
 */
export function getAppModule(id: string): AppModule | undefined {
  return APP_MODULES.find((app) => app.id === id);
}

/**
 * Get apps by category
 */
export function getAppsByCategory(category: string): AppModule[] {
  return APP_MODULES.filter((app) => app.category === category);
}

/**
 * Search app modules
 */
export function searchAppModules(query: string): AppModule[] {
  const lowerQuery = query.toLowerCase();
  return APP_MODULES.filter(
    (app) =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery) ||
      app.functionCode?.toLowerCase().includes(lowerQuery)
  );
}
