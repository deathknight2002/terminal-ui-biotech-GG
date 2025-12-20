import React from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContextGroupProvider } from '../../src/contexts/ContextGroupContext'

import { TerminalLayout } from './components/TerminalLayout'
import { DashboardPage } from './pages/DashboardPage'
import { NewsPage } from './pages/NewsPage'
import { ClinicalTrialsPage } from './pages/ClinicalTrialsPage'
import { CatalystCalendarPage } from './pages/CatalystCalendarPage'
import { EvidenceJournalPage } from './pages/EvidenceJournalPage'
import { FinancialModelingPage } from './pages/FinancialModelingPage'
import { Molecule3DDemoPage } from './pages/Molecule3DDemoPage'

import '../../frontend-components/src/styles/global.css'
import './styles/glass-theme.css'
import './styles/enhanced-aurora.css'
import './styles/pwa.css'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContextGroupProvider>
        <Router>
          <TerminalLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/trials" element={<ClinicalTrialsPage />} />
              <Route path="/catalysts" element={<CatalystCalendarPage />} />
              <Route path="/evidence" element={<EvidenceJournalPage />} />
              <Route path="/financials" element={<FinancialModelingPage />} />
              <Route path="/3d" element={<Molecule3DDemoPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TerminalLayout>
        </Router>
      </ContextGroupProvider>
    </QueryClientProvider>
  )
}

export default App
