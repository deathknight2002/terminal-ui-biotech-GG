/**
 * Centralized API Configuration
 * 
 * This file provides a single source of truth for API endpoints.
 * 
 * Backend Architecture:
 * - Python FastAPI backend runs on port 8000 (bt_platform)
 * - Contains all biotech intelligence APIs
 */

// Get API base URL from environment or use defaults
export const API_CONFIG = {
  // Python FastAPI backend (main biotech intelligence platform)
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  VERSION: '/api/v1',
};

// Build full API base URL
export const API_BASE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.VERSION}`;

/**
 * API Endpoints organized by module
 */
export const API_ENDPOINTS = {
  // Biotech Intelligence
  BIOTECH: {
    DASHBOARD: `${API_BASE_URL}/biotech/dashboard`,
    PIPELINE: `${API_BASE_URL}/biotech/pipeline`,
    TRIALS: `${API_BASE_URL}/biotech/trials`,
    FINANCIAL_MODELS: `${API_BASE_URL}/biotech/financial-models`,
  },
  
  // Catalysts
  CATALYSTS: {
    CALENDAR: `${API_BASE_URL}/catalysts/calendar`,
    LIST: `${API_BASE_URL}/catalysts`,
    DETAIL: (id: string | number) => `${API_BASE_URL}/catalysts/${id}`,
  },
  
  // Companies
  COMPANIES: {
    PROFILE: (ticker: string) => `${API_BASE_URL}/companies/${ticker}/profile`,
    SOURCES: (ticker: string) => `${API_BASE_URL}/companies/${ticker}/sources`,
    ARTICLES: (ticker: string) => `${API_BASE_URL}/companies/${ticker}/articles`,
    OWNERSHIP: (ticker: string) => `${API_BASE_URL}/companies/${ticker}/ownership`,
    PIPELINE: (ticker: string) => `${API_BASE_URL}/companies/${ticker}/pipeline`,
    CATALYSTS: (ticker: string) => `${API_BASE_URL}/companies/${ticker}/catalysts`,
    FINANCIALS: (ticker: string) => `${API_BASE_URL}/companies/${ticker}/financials`,
    XBI_LIST: `${API_BASE_URL}/companies/xbi`,
  },
  
  // Competition & Market Intelligence
  COMPETITION: {
    COMPARE: `${API_BASE_URL}/competition/compare`,
    SPIDERWEB: `${API_BASE_URL}/competition/spiderweb`,
    LANDSCAPE: `${API_BASE_URL}/competition/landscape`,
  },
  
  // Therapeutic Areas
  THERAPEUTIC_AREAS: {
    LIST: `${API_BASE_URL}/therapeutic-areas/areas`,
    DETAIL: (id: string) => `${API_BASE_URL}/therapeutic-areas/areas/${id}`,
    COMPARE_RADAR: `${API_BASE_URL}/therapeutic-areas/areas/compare/radar`,
  },
  
  // Evidence Journal & Science Events
  EVIDENCE: {
    JOURNAL: `${API_BASE_URL}/evidence/evidence-journal`,
    TODAY: `${API_BASE_URL}/evidence/today`,
    CATALYSTS: `${API_BASE_URL}/evidence/catalysts`,
    MOA: `${API_BASE_URL}/evidence/moa`,
    SCORECARD: (companyId: string) => `${API_BASE_URL}/evidence/scorecard/${companyId}`,
  },
  
  SCIENCE: {
    EVENTS: `${API_BASE_URL}/science/science-events`,
    EVENT_DETAIL: (id: string | number) => `${API_BASE_URL}/science/science-events/${id}`,
  },
  
  // News & Insights
  NEWS: {
    LATEST: `${API_BASE_URL}/news/latest`,
    DIFF: `${API_BASE_URL}/news/diff`,
    SEARCH: `${API_BASE_URL}/news/search`,
  },
  
  INSIGHTS: {
    SUMMARY: `${API_BASE_URL}/insights/summary`,
    OPPORTUNITIES: `${API_BASE_URL}/insights/opportunities`,
  },
  
  // Advanced Intelligence - NEW
  INTELLIGENCE: {
    DASHBOARD: `${API_BASE_URL}/intelligence/dashboard`,
    COMPREHENSIVE: (drugName: string) => `${API_BASE_URL}/intelligence/comprehensive/${encodeURIComponent(drugName)}`,
    FDA_APPROVALS: `${API_BASE_URL}/intelligence/fda/approvals`,
    SAFETY_SIGNALS: (drugName: string) => `${API_BASE_URL}/intelligence/safety/signals/${encodeURIComponent(drugName)}`,
    LITERATURE_SENTIMENT: (drugName: string) => `${API_BASE_URL}/intelligence/literature/sentiment/${encodeURIComponent(drugName)}`,
    TRIAL_SUCCESS_PREDICTION: `${API_BASE_URL}/intelligence/trials/predict-success`,
    TRIAL_TIMELINE: (nctId: string) => `${API_BASE_URL}/intelligence/trials/timeline/${nctId}`,
    COMPETITIVE_LANDSCAPE: `${API_BASE_URL}/intelligence/trials/competitive-landscape`,
    MOLECULAR_TARGETS: (drugName: string) => `${API_BASE_URL}/intelligence/molecular/targets/${encodeURIComponent(drugName)}`,
  },
  
  // Financial Modeling
  FINANCIALS: {
    OVERVIEW: `${API_BASE_URL}/financials/overview`,
    PRICE_TARGETS: `${API_BASE_URL}/financials/price-targets`,
    CONSENSUS: `${API_BASE_URL}/financials/consensus`,
    DCF: `${API_BASE_URL}/financials/dcf`,
    LOE: `${API_BASE_URL}/loe/timeline`,
    REPORTS: `${API_BASE_URL}/reports`,
  },
  
  // Analytics
  ANALYTICS: {
    METRICS: `${API_BASE_URL}/analytics/metrics`,
    TRENDS: `${API_BASE_URL}/analytics/trends`,
  },
  
  // Search
  SEARCH: {
    QUERY: `${API_BASE_URL}/search/query`,
    ENTITIES: `${API_BASE_URL}/search/entities`,
  },
  
  // Market Data
  MARKET: {
    CHART: `${API_BASE_URL}/market/openbb/chart`,
    QUOTE: `${API_BASE_URL}/market/openbb/quote`,
  },
  
  // Admin
  ADMIN: {
    HEALTH: `${API_CONFIG.BASE_URL}/health`,
  },
};

/**
 * Fetch wrapper with error handling
 */
export async function apiFetch<T>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}
