import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BioAuroraDashboard } from '../../../frontend-components/src/biotech';

// Fetch dashboard data from our backend
const fetchDashboardData = async () => {
  const response = await fetch('http://localhost:3001/api/biotech/dashboard');
  if (!response.ok) {
    // Return mock data if backend is not available
    return {
      status: 'success',
      data: 'mock'
    };
  }
  return response.json();
};

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['aurora-dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#00d4ff',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '14px'
      }}>
        <div>
          <div style={{ marginBottom: '16px' }}>🧬 INITIALIZING AURORA TERMINAL...</div>
          <div style={{ animation: 'pulse 2s infinite' }}>Loading biotech intelligence...</div>
        </div>
      </div>
    );
  }

  // Handle connection errors gracefully
  if (error) {
    console.warn('Backend connection failed, using demo data');
  }

  return (
    <BioAuroraDashboard
      theme="aurora-red"
      onSelectCatalyst={(catalyst) => {
        console.log('Selected catalyst:', catalyst);
        // TODO: Navigate to catalyst detail view
      }}
      onSelectPosition={(position) => {
        console.log('Selected position:', position);
        // TODO: Navigate to position detail view
      }}
    />
  );
}