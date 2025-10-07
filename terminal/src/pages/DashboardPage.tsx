import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BioAuroraDashboard,
} from '../../../frontend-components/src/biotech';
import type { 
  Catalyst,
  PortfolioPosition 
} from '../../../frontend-components/src/types/biotech';
import styles from './DashboardPage.module.css';

// Fetch data from our backend - LIVE data only
const fetchDashboardData = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/biotech/dashboard');
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    const data = await response.json();
    console.log('Dashboard data received:', data);
    return data;
  } catch (error) {
    console.error('Backend unavailable:', error);
    throw error; // No mock fallback - we want real data only
  }
};

export function DashboardPage() {
  const { 
    data: dashboardData, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['aurora-dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleSelectCatalyst = (catalyst: Catalyst) => {
    console.log('Selected catalyst:', catalyst);
    
    if (catalyst.url) {
      // Open the catalyst link in a new tab
      window.open(catalyst.url, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: search for the catalyst on Fierce Biotech
      const searchQuery = catalyst.label.replace(/\s+/g, '+');
      window.open(`https://www.fiercebiotech.com/search?query=${searchQuery}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSelectPosition = (position: PortfolioPosition) => {
    console.log('Selected position:', position);
    // Could open a detailed analysis view or search for company news
    const searchQuery = `${position.company} stock analysis`.replace(/\s+/g, '+');
    window.open(`https://www.fiercebiotech.com/search?query=${searchQuery}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className={`${styles.frame} terminal-frame aurora-shimmer`}>
        <div className={styles.loading}>
          <div>Loading Aurora Biotech Intelligence...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.frame} terminal-frame aurora-shimmer`}>
        <div className={styles.error}>
          <div>Failed to load dashboard data</div>
          <div className={styles.errorMessage}>
            Backend connection failed - check if Node.js server is running on port 3001
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.frame} terminal-frame aurora-shimmer`}>
      <BioAuroraDashboard
        theme="aurora-red"
        headline={dashboardData?.headline}
        metrics={dashboardData?.metrics}
        catalysts={dashboardData?.catalysts}
        positions={dashboardData?.positions}
        exposures={dashboardData?.exposures}
        pipeline={dashboardData?.pipeline}
        documents={dashboardData?.documents}
        analytics={dashboardData?.analytics}
        onSelectCatalyst={handleSelectCatalyst}
        onSelectPosition={handleSelectPosition}
      />
    </div>
  );
}
