import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@biotech-terminal/frontend-components/terminal';

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
import '@biotech-terminal/frontend-components/styles';
import './App.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
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
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;