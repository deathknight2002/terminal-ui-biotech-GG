import type { FunctionCode } from '../types/biotech';

/**
 * Function Codes - Bloomberg-style command shortcuts
 * Pattern: 2-4 letter codes for quick navigation
 */
export const FUNCTION_CODES: FunctionCode[] = [
  // Navigation - Core Pages
  {
    code: 'HO',
    label: 'HOME',
    description: 'Main dashboard and overview',
    path: '/',
    keywords: ['dashboard', 'overview', 'main', 'home'],
    shortcut: '⌘+H',
    category: 'navigation',
  },
  
  // News & Intelligence
  {
    code: 'NE',
    label: 'NEWS',
    description: 'Latest biotech news and articles',
    path: '/news',
    keywords: ['news', 'articles', 'intelligence', 'feed'],
    shortcut: '⌘+N',
    category: 'navigation',
  },

  // Companies
  {
    code: 'CO',
    label: 'COMPANIES',
    description: 'Company profiles and information',
    path: '/companies',
    keywords: ['company', 'companies', 'profiles', 'biotech', 'pharma'],
    shortcut: '⌘+C',
    category: 'navigation',
  },

  // Clinical Trials
  {
    code: 'TR',
    label: 'TRIALS',
    description: 'Clinical trial database and tracker',
    path: '/trials',
    keywords: ['trials', 'clinical', 'studies', 'research'],
    shortcut: '⌘+T',
    category: 'navigation',
  },

  // Catalysts
  {
    code: 'CA',
    label: 'CATALYST CALENDAR',
    description: 'Upcoming market-moving events',
    path: '/catalysts/calendar',
    keywords: ['catalyst', 'calendar', 'events', 'readouts'],
    shortcut: '⌘+K',
    category: 'navigation',
  },

  // Pipeline
  {
    code: 'PI',
    label: 'PIPELINE',
    description: 'Drug pipeline and development tracker',
    path: '/pipeline',
    keywords: ['pipeline', 'drugs', 'development', 'assets'],
    category: 'navigation',
  },

  // Epidemiology
  {
    code: 'EP',
    label: 'EPIDEMIOLOGY',
    description: 'Disease epidemiology and patient populations',
    path: '/epidemiology',
    keywords: ['epidemiology', 'disease', 'patients', 'prevalence'],
    shortcut: '⌘+E',
    category: 'navigation',
  },

  // Competitors
  {
    code: 'CM',
    label: 'COMPETITORS',
    description: 'Competitive landscape analysis',
    path: '/competitors',
    keywords: ['competitors', 'competition', 'landscape'],
    category: 'navigation',
  },

  // Market Intelligence
  {
    code: 'MI',
    label: 'MARKET INTEL',
    description: 'Market intelligence and trends',
    path: '/market-intelligence',
    keywords: ['market', 'intelligence', 'trends', 'analysis'],
    category: 'navigation',
  },

  // Data Catalog
  {
    code: 'DC',
    label: 'DATA CATALOG',
    description: 'Browse available datasets',
    path: '/data-catalog',
    keywords: ['data', 'catalog', 'datasets', 'sources'],
    category: 'navigation',
  },

  // Audit Log
  {
    code: 'AL',
    label: 'AUDIT LOG',
    description: 'System audit log and history',
    path: '/audit',
    keywords: ['audit', 'log', 'history', 'changes'],
    category: 'navigation',
  },

  // Financial Pages
  {
    code: 'FI',
    label: 'FINANCIALS',
    description: 'Financial overview and models',
    path: '/financials',
    keywords: ['financials', 'finance', 'valuation', 'models'],
    category: 'navigation',
  },

  {
    code: 'PT',
    label: 'PRICE TARGETS',
    description: 'Analyst price targets and consensus',
    path: '/financials/price-targets',
    keywords: ['price', 'targets', 'analyst', 'consensus'],
    category: 'navigation',
  },

  {
    code: 'VA',
    label: 'VALUATION',
    description: 'DCF and multiples valuation',
    path: '/financials/valuation',
    keywords: ['valuation', 'dcf', 'multiples', 'analysis'],
    category: 'navigation',
  },

  {
    code: 'LO',
    label: 'LOE TIMELINE',
    description: 'Loss of exclusivity timeline',
    path: '/financials/loe',
    keywords: ['loe', 'loss', 'exclusivity', 'patent', 'cliff'],
    category: 'navigation',
  },

  // Data Operations
  {
    code: 'EX',
    label: 'EXPORT',
    description: 'Export data to Excel/PowerPoint',
    path: '#export',
    keywords: ['export', 'download', 'excel', 'pptx'],
    category: 'data',
  },

  {
    code: 'IM',
    label: 'IMPORT',
    description: 'Import data from Excel/CSV',
    path: '#import',
    keywords: ['import', 'upload', 'excel', 'csv'],
    category: 'data',
  },

  {
    code: 'SE',
    label: 'SEARCH',
    description: 'Global search across all data',
    path: '#search',
    keywords: ['search', 'find', 'query', 'lookup'],
    category: 'data',
  },

  {
    code: 'RE',
    label: 'REFRESH',
    description: 'Refresh data from sources',
    path: '#refresh',
    keywords: ['refresh', 'reload', 'update', 'sync'],
    category: 'data',
  },

  // Analytics & Reports
  {
    code: 'RP',
    label: 'REPORTS',
    description: 'Generate and download reports',
    path: '#reports',
    keywords: ['reports', 'generate', 'download', 'artifacts'],
    category: 'action',
  },

  {
    code: 'SN',
    label: 'SENSITIVITY',
    description: 'Sensitivity analysis tables',
    path: '#sensitivity',
    keywords: ['sensitivity', 'analysis', 'scenarios', 'assumptions'],
    category: 'tool',
  },

  {
    code: 'CP',
    label: 'COMPARABLES',
    description: 'Comparable companies analysis',
    path: '#comparables',
    keywords: ['comparables', 'comps', 'peers', 'multiples'],
    category: 'tool',
  },
];

/**
 * Get function code by code string
 */
export function getFunctionCode(code: string): FunctionCode | undefined {
  return FUNCTION_CODES.find((fc) => fc.code.toLowerCase() === code.toLowerCase());
}
