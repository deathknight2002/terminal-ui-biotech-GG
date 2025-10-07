import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import page components (to be created)
import { DashboardPage } from './pages/DashboardPage';
import { PipelinePage } from './pages/PipelinePage';
import { FinancialModelingPage } from './pages/FinancialModelingPage';
import { MarketIntelligencePage } from './pages/MarketIntelligencePage';
import { ClinicalTrialsPage } from './pages/ClinicalTrialsPage';
import { DataExplorerPage } from './pages/DataExplorerPage';

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

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <TerminalLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/financial" element={<FinancialModelingPage />} />
            <Route path="/intelligence" element={<MarketIntelligencePage />} />
            <Route path="/trials" element={<ClinicalTrialsPage />} />
            <Route path="/explorer" element={<DataExplorerPage />} />
          </Routes>
        </TerminalLayout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;