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
];

/**
 * Get function code by code string
 */
export function getFunctionCode(code: string): FunctionCode | undefined {
  return FUNCTION_CODES.find((fc) => fc.code.toLowerCase() === code.toLowerCase());
}
