import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BioAuroraDashboard,
} from '../../../frontend-components/src/biotech';
import type { 
  Catalyst,
  PortfolioPosition 
} from '../../../frontend-components/src/types/biotech';

// Fetch data from our backend or use the sophisticated defaults
const fetchDashboardData = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/biotech/dashboard');
    if (!response.ok) {
      // Fall back to sophisticated default data if backend is unavailable
      return null;
    }
    return response.json();
  } catch {
    console.log('Backend unavailable, using sophisticated defaults');
    return null;
  }
};

export function DashboardPage() {
  const { 
    data: dashboardData, 
  } = useQuery({
    queryKey: ['aurora-dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Use the sophisticated BioAuroraDashboard with its built-in defaults
  // or enhanced data from backend
  return (
    <div className="terminal-frame aurora-shimmer">
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
        onSelectCatalyst={(catalyst: Catalyst) => {
          console.log('Selected catalyst:', catalyst);
          // Could open a modal or navigate to detailed view
        }}
        onSelectPosition={(position: PortfolioPosition) => {
          console.log('Selected position:', position);
          // Could open a detailed analysis view
        }}
      />
    </div>
  );
}