import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import mobile pages
import { MobileDashboard } from './pages/MobileDashboard';
import { MobilePipeline } from './pages/MobilePipeline';
import { MobileTrials } from './pages/MobileTrials';
import { MobileFinancial } from './pages/MobileFinancial';
import { MobileIntelligence } from './pages/MobileIntelligence';
import { MobileNews } from './pages/MobileNews';

// Import mobile layout
import { MobileLayout } from './components/MobileLayout';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MobileLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<MobileDashboard />} />
            <Route path="/pipeline" element={<MobilePipeline />} />
            <Route path="/trials" element={<MobileTrials />} />
            <Route path="/financial" element={<MobileFinancial />} />
            <Route path="/intelligence" element={<MobileIntelligence />} />
            <Route path="/news" element={<MobileNews />} />
          </Routes>
        </MobileLayout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
