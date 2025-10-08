import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContextGroupProvider } from '../../src/contexts/ContextGroupContext';

// Import page components
import { DashboardPage } from './pages/DashboardPage';
import { PipelinePage } from './pages/PipelinePage';
import { FinancialModelingPage } from './pages/FinancialModelingPage';
import { MarketIntelligencePage } from './pages/MarketIntelligencePage';
import { ClinicalTrialsPage } from './pages/ClinicalTrialsPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { EpidemiologyPage } from './pages/EpidemiologyPage';
import { NewsPage } from './pages/NewsPage';

// Import layout components
import { TerminalLayout } from './components/TerminalLayout';

// Styles
import '../../frontend-components/src/styles/global.css';
import './styles/glass-theme.css';
import './styles/enhanced-aurora.css';
import './App.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

// Placeholder component for routes not yet implemented
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2 style={{ color: 'var(--accent-primary, #00ff00)' }}>{title}</h2>
    <p style={{ color: 'var(--text-secondary, #aaaaaa)', marginTop: '1rem' }}>
      This page is under construction.
    </p>
  </div>
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContextGroupProvider>
        <Router>
          <TerminalLayout>
          <Routes>
            {/* Home */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/recents" element={<PlaceholderPage title="RECENTS" />} />
            <Route path="/favorites" element={<PlaceholderPage title="FAVORITES" />} />

            {/* News */}
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/sources" element={<PlaceholderPage title="NEWS SOURCES" />} />
            <Route path="/news/sentiment" element={<PlaceholderPage title="SENTIMENT TRACKER" />} />
            <Route path="/news/trends" element={<PlaceholderPage title="TREND TERMS" />} />

            {/* Science */}
            <Route path="/science/epidemiology" element={<EpidemiologyPage />} />
            <Route path="/science/literature" element={<PlaceholderPage title="LITERATURE EXPLORER" />} />
            <Route path="/science/biomarkers" element={<PlaceholderPage title="BIOMARKER ATLAS" />} />

            {/* Catalysts */}
            <Route path="/catalysts/calendar" element={<PlaceholderPage title="CATALYST CALENDAR" />} />
            <Route path="/catalysts/past" element={<PlaceholderPage title="PAST CATALYSTS" />} />
            <Route path="/catalysts/alerts" element={<PlaceholderPage title="CATALYST ALERTS" />} />

            {/* Trials */}
            <Route path="/trials" element={<ClinicalTrialsPage />} />
            <Route path="/trials/readouts" element={<PlaceholderPage title="READOUT TIMELINE" />} />
            <Route path="/trials/enrollment" element={<PlaceholderPage title="ENROLLMENT HEATMAP" />} />

            {/* Companies */}
            <Route path="/companies" element={<PlaceholderPage title="COMPANY PROFILES" />} />
            <Route path="/companies/therapeutics" element={<PlaceholderPage title="THERAPEUTICS DIRECTORY" />} />
            <Route path="/companies/pipelines" element={<PlaceholderPage title="PIPELINE MAPS" />} />

            {/* Competitors */}
            <Route path="/competitors/spiderweb" element={<PlaceholderPage title="SPIDERWEB COMPARE" />} />
            <Route path="/competitors/matrix" element={<PlaceholderPage title="LANDSCAPE MATRIX" />} />
            <Route path="/competitors/voice" element={<PlaceholderPage title="SHARE-OF-VOICE" />} />

            {/* Epidemiology */}
            <Route path="/epidemiology" element={<EpidemiologyPage />} />
            <Route path="/epidemiology/regional" element={<PlaceholderPage title="REGIONAL BURDEN MAPS" />} />
            <Route path="/epidemiology/cohorts" element={<PlaceholderPage title="COHORT BUILDER" />} />

            {/* Markets */}
            <Route path="/markets/sectors" element={<PlaceholderPage title="SECTOR INDICES" />} />
            <Route path="/markets/valuations" element={<PlaceholderPage title="VALUATION COMPS" />} />
            <Route path="/markets/risks" element={<PlaceholderPage title="RISK FACTORS" />} />

            {/* Portfolios */}
            <Route path="/portfolios/watchlists" element={<PlaceholderPage title="WATCHLIST MANAGER" />} />
            <Route path="/portfolios/baskets" element={<PlaceholderPage title="CUSTOM BASKETS" />} />
            <Route path="/portfolios/risk" element={<PlaceholderPage title="RISK METRICS" />} />

            {/* Analytics */}
            <Route path="/analytics/compare" element={<PlaceholderPage title="COMPARE ENGINE" />} />
            <Route path="/analytics/trends" element={<PlaceholderPage title="TREND DETECTION" />} />
            <Route path="/analytics/scenarios" element={<PlaceholderPage title="SCENARIO MODELS" />} />

            {/* Data */}
            <Route path="/data/catalog" element={<PlaceholderPage title="DATA CATALOG" />} />
            <Route path="/data/provenance" element={<PlaceholderPage title="PROVENANCE & AUDIT" />} />
            <Route path="/data/exports" element={<PlaceholderPage title="EXPORTS" />} />
            <Route path="/data/freshness" element={<PlaceholderPage title="DATA FRESHNESS" />} />

            {/* Tools */}
            <Route path="/tools/command" element={<PlaceholderPage title="COMMAND PALETTE" />} />
            <Route path="/tools/refresh" element={<PlaceholderPage title="MANUAL REFRESH" />} />
            <Route path="/tools/shortcuts" element={<PlaceholderPage title="KEYBOARD SHORTCUTS" />} />
            <Route path="/tools/theme" element={<PlaceholderPage title="THEME TOGGLE" />} />

            {/* Settings */}
            <Route path="/settings" element={<PlaceholderPage title="PREFERENCES" />} />
            <Route path="/settings/api" element={<PlaceholderPage title="API KEYS" />} />
            <Route path="/settings/permissions" element={<PlaceholderPage title="PERMISSIONS" />} />

            {/* Help */}
            <Route path="/help/docs" element={<PlaceholderPage title="DOCUMENTATION" />} />
            <Route path="/help/about" element={<PlaceholderPage title="ABOUT" />} />
            <Route path="/help/keyboard" element={<PlaceholderPage title="KEYBOARD MAP" />} />

            {/* Legacy routes */}
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/financial" element={<FinancialModelingPage />} />
            <Route path="/intelligence" element={<MarketIntelligencePage />} />
            <Route path="/explorer" element={<DataExplorerPage />} />
          </Routes>
        </TerminalLayout>
      </Router>
      </ContextGroupProvider>
    </QueryClientProvider>
  );
}

export default App;