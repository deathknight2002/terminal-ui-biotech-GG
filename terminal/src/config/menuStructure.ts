import { MenuItem } from '../../../frontend-components/src/terminal/organisms/AuroraTopBar/AuroraTopBar';

export const menuStructure: MenuItem[] = [
  {
    label: 'HOME',
    items: [
      { label: 'Overview Dashboard', path: '/', description: 'Main dashboard with key metrics' },
      { label: 'Recents', path: '/recents', description: 'Recently viewed items' },
      { label: 'Favorites', path: '/favorites', description: 'Your saved favorites' }
    ]
  },
  {
    label: 'NEWS',
    items: [
      { label: 'News Stream', path: '/news', description: 'Latest biotech news articles' },
      { label: 'Source Filters', path: '/news/sources', description: 'Filter by news source' },
      { label: 'Sentiment Tracker', path: '/news/sentiment', description: 'Track sentiment across domains' },
      { label: 'Trend Terms', path: '/news/trends', description: 'Trending topics and terms' }
    ]
  },
  {
    label: 'SCIENCE',
    items: [
      { label: 'Epidemiology Builder', path: '/science/epidemiology', description: 'Disease burden analysis' },
      { label: 'Literature Explorer', path: '/science/literature', description: 'Scientific literature search' },
      { label: 'Biomarker Atlas', path: '/science/biomarkers', description: 'Biomarker database' }
    ]
  },
  {
    label: 'CATALYSTS',
    items: [
      { label: 'Catalyst Calendar', path: '/catalysts/calendar', description: 'Upcoming catalyst events' },
      { label: 'Past Catalysts Log', path: '/catalysts/past', description: 'Historical catalyst data' },
      { label: 'Manual Alert Notes', path: '/catalysts/alerts', description: 'Custom catalyst alerts' }
    ]
  },
  {
    label: 'TRIALS',
    items: [
      { label: 'Trial Finder', path: '/trials', description: 'Search clinical trials' },
      { label: 'Readout Timeline', path: '/trials/readouts', description: 'Upcoming trial readouts' },
      { label: 'Enrollment Heatmap', path: '/trials/enrollment', description: 'Trial enrollment tracking' }
    ]
  },
  {
    label: 'COMPANIES',
    items: [
      { label: 'Company Profiles', path: '/companies', description: 'Company information' },
      { label: 'Therapeutics Directory', path: '/companies/therapeutics', description: 'Drug pipeline directory' },
      { label: 'Pipeline Maps', path: '/companies/pipelines', description: 'Visual pipeline maps' }
    ]
  },
  {
    label: 'COMPETITORS',
    items: [
      { label: 'Spiderweb Compare', path: '/competitors/spiderweb', description: 'Competitive landscape radar' },
      { label: 'Landscape Matrix', path: '/competitors/matrix', description: 'Market positioning matrix' },
      { label: 'Share-of-Voice', path: '/competitors/voice', description: 'Media presence tracking' }
    ]
  },
  {
    label: 'EPIDEMIOLOGY',
    items: [
      { label: 'Disease Catalog', path: '/epidemiology', description: 'Comprehensive disease database' },
      { label: 'Regional Burden Maps', path: '/epidemiology/regional', description: 'Geographic disease burden' },
      { label: 'Cohort Builder', path: '/epidemiology/cohorts', description: 'Patient cohort builder' }
    ]
  },
  {
    label: 'MARKETS',
    items: [
      { label: 'Sector Indices', path: '/markets/sectors', description: 'Market sector performance' },
      { label: 'Valuation Comps', path: '/markets/valuations', description: 'Comparable company analysis' },
      { label: 'Risk Factors', path: '/markets/risks', description: 'Risk assessment dashboard' }
    ]
  },
  {
    label: 'FINANCIALS',
    items: [
      { label: 'Overview', path: '/financials/overview', description: 'House vs Street financial overview' },
      { label: 'Price Targets', path: '/financials/price-targets', description: 'Analyst price targets' },
      { label: 'Consensus vs House', path: '/financials/consensus', description: 'Street consensus vs House estimates' },
      { label: 'DCF & Multiples', path: '/financials/dcf', description: 'Discounted cash flow and multiples analysis' },
      { label: 'LoE Cliff', path: '/financials/loe-cliff', description: 'Loss of exclusivity timeline' },
      { label: 'Model Audit', path: '/financials/audit', description: 'Valuation run audit trail' },
      { label: 'Reports', path: '/financials/reports', description: 'Export decks and models' }
    ]
  },
  {
    label: 'PORTFOLIOS',
    items: [
      { label: 'Watchlist Manager', path: '/portfolios/watchlists', description: 'Manage your watchlists' },
      { label: 'Custom Baskets', path: '/portfolios/baskets', description: 'Create custom portfolios' },
      { label: 'Risk Metrics', path: '/portfolios/risk', description: 'Portfolio risk analysis' }
    ]
  },
  {
    label: 'ANALYTICS',
    items: [
      { label: 'Compare Engine', path: '/analytics/compare', description: 'Multi-entity comparison' },
      { label: 'Trend Detection', path: '/analytics/trends', description: 'AI-powered trend analysis' },
      { label: 'Scenario Models', path: '/analytics/scenarios', description: 'Scenario planning tools' }
    ]
  },
  {
    label: 'DATA',
    items: [
      { label: 'Data Catalog', path: '/data/catalog', description: 'Available datasets' },
      { label: 'Provenance & Audit', path: '/data/provenance', description: 'Data lineage tracking' },
      { label: 'Exports', path: '/data/exports', description: 'Export data files' },
      { label: 'Freshness', path: '/data/freshness', description: 'Data update tracking' }
    ]
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'Command Palette', path: '/tools/command', description: 'Quick command access' },
      { label: 'Manual Refresh', path: '/tools/refresh', description: 'Data refresh controls' },
      { label: 'Keyboard Shortcuts', path: '/tools/shortcuts', description: 'View all shortcuts' },
      { label: 'Theme Toggle', path: '/tools/theme', description: 'Switch UI themes' }
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Preferences', path: '/settings', description: 'User preferences' },
      { label: 'API Keys', path: '/settings/api', description: 'Manage API keys' },
      { label: 'Permissions', path: '/settings/permissions', description: 'Access controls' }
    ]
  },
  {
    label: 'HELP',
    items: [
      { label: 'Documentation', path: '/help/docs', description: 'User documentation' },
      { label: 'About', path: '/help/about', description: 'About Aurora Terminal' },
      { label: 'Keyboard Map', path: '/help/keyboard', description: 'Keyboard shortcuts guide' }
    ]
  }
];
