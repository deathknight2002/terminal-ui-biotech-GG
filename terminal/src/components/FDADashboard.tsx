/**
 * FDA Intelligence Dashboard Component
 * 
 * Displays FDA approvals, adverse events, and recalls in a unified dashboard.
 * Integrates with OpenFDA API endpoints.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import { API_ENDPOINTS, apiFetch } from '../config/api';

interface FDADashboardData {
  recent_approvals: Array<{
    brand_name: string;
    generic_name: string;
    sponsor_name: string;
    approval_date: string;
    indications: string;
  }>;
  approvals_count: number;
  top_adverse_events: Array<{
    drug_name: string;
    event_count: number;
  }>;
  active_recalls: Array<{
    recall_number: string;
    classification: string;
    product_description: string;
    reason_for_recall: string;
    status: string;
  }>;
  recalls_count: number;
  timestamp: string;
}

export const FDADashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<FDADashboardData>({
    queryKey: ['fda-dashboard'],
    queryFn: () => apiFetch(API_ENDPOINTS.FDA.DASHBOARD),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  if (isLoading) {
    return (
      <Panel title="FDA INTELLIGENCE" cornerBrackets>
        <div className="p-4">Loading FDA data...</div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="FDA INTELLIGENCE" cornerBrackets>
        <div className="p-4 text-red-500">
          Error loading FDA data: {error.message}
        </div>
      </Panel>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Panel title="FDA INTELLIGENCE DASHBOARD" cornerBrackets>
        <div className="p-4">
          <p className="text-sm text-terminal-text-secondary">
            Real-time FDA data from OpenFDA API
          </p>
          <p className="text-xs text-terminal-text-tertiary mt-1">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
      </Panel>

      {/* Recent Approvals */}
      <Panel title={`RECENT APPROVALS (${data.approvals_count})`} cornerBrackets>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-terminal-border">
              <tr className="text-left">
                <th className="p-3 font-mono uppercase text-xs">Brand Name</th>
                <th className="p-3 font-mono uppercase text-xs">Generic Name</th>
                <th className="p-3 font-mono uppercase text-xs">Sponsor</th>
                <th className="p-3 font-mono uppercase text-xs">Date</th>
                <th className="p-3 font-mono uppercase text-xs">Indication</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_approvals.slice(0, 10).map((approval, idx) => (
                <tr 
                  key={idx}
                  className="border-b border-terminal-border/50 hover:bg-terminal-bg-hover"
                >
                  <td className="p-3 font-mono text-terminal-accent">
                    {approval.brand_name || 'N/A'}
                  </td>
                  <td className="p-3 font-mono text-terminal-text-secondary">
                    {approval.generic_name || 'N/A'}
                  </td>
                  <td className="p-3 font-mono text-terminal-text-secondary">
                    {approval.sponsor_name}
                  </td>
                  <td className="p-3 font-mono text-terminal-text-secondary">
                    {approval.approval_date || 'N/A'}
                  </td>
                  <td className="p-3 text-sm max-w-xs truncate">
                    {approval.indications || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Adverse Events and Recalls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Adverse Events */}
        <Panel title="TOP ADVERSE EVENT REPORTS" cornerBrackets>
          <div className="p-4 space-y-2">
            {data.top_adverse_events.slice(0, 10).map((event, idx) => (
              <div 
                key={idx}
                className="flex justify-between items-center p-2 bg-terminal-bg-hover rounded"
              >
                <span className="font-mono text-terminal-text">
                  {event.drug_name}
                </span>
                <span className="font-mono text-terminal-accent">
                  {event.event_count.toLocaleString()} events
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Active Recalls */}
        <Panel title={`ACTIVE RECALLS (${data.recalls_count})`} cornerBrackets>
          <div className="p-4 space-y-3">
            {data.active_recalls.slice(0, 5).map((recall, idx) => (
              <div 
                key={idx}
                className="p-3 bg-terminal-bg-hover rounded border-l-2 border-red-500"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-terminal-accent">
                    {recall.recall_number}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-mono ${
                    recall.classification === 'Class I' 
                      ? 'bg-red-500/20 text-red-500'
                      : recall.classification === 'Class II'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {recall.classification}
                  </span>
                </div>
                <p className="text-sm text-terminal-text mb-1">
                  {recall.product_description}
                </p>
                <p className="text-xs text-terminal-text-tertiary">
                  {recall.reason_for_recall}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default FDADashboard;
