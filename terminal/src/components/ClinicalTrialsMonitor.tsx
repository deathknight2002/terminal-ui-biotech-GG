/**
 * Clinical Trials Monitor Component
 *
 * Real-time clinical trials intelligence from ClinicalTrials.gov
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import { API_ENDPOINTS, apiFetch } from '../config/api';

interface TrialsDashboardData {
  recruiting_trials: Array<{
    nct_id: string;
    title: string;
    overall_status: string;
    phases: string[];
    enrollment: number;
    lead_sponsor: string;
    conditions: string[];
    start_date: string;
  }>;
  recruiting_count: number;
  phase_distribution: Array<{
    category: string;
    count: number;
  }>;
  status_distribution: Array<{
    category: string;
    count: number;
  }>;
  total_trials: number;
}

export const ClinicalTrialsMonitor: React.FC = () => {
  const [condition, setCondition] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery<TrialsDashboardData>({
    queryKey: ['trials-dashboard', condition],
    queryFn: () => {
      const url = condition
        ? `${API_ENDPOINTS.TRIALS.DASHBOARD}?condition=${encodeURIComponent(condition)}`
        : API_ENDPOINTS.TRIALS.DASHBOARD;
      return apiFetch(url);
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  if (isLoading) {
    return (
      <Panel title="CLINICAL TRIALS MONITOR" cornerBrackets>
        <div className="p-4">Loading clinical trials data...</div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="CLINICAL TRIALS MONITOR" cornerBrackets>
        <div className="p-4 text-red-500">
          Error loading trials data: {error.message}
        </div>
      </Panel>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <Panel title="CLINICAL TRIALS INTELLIGENCE" cornerBrackets>
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Filter by condition (e.g., 'Lung Cancer')"
              className="flex-1 px-3 py-2 bg-terminal-bg-hover border border-terminal-border rounded font-mono text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-terminal-accent text-terminal-bg rounded font-mono text-sm hover:bg-terminal-accent/80"
            >
              SEARCH
            </button>
          </form>
          <p className="text-xs text-terminal-text-tertiary mt-2">
            Total trials: {data.total_trials.toLocaleString()}
            {condition && ` | Filtering by: ${condition}`}
          </p>
        </div>
      </Panel>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phase Distribution */}
        <Panel title="PHASE DISTRIBUTION" cornerBrackets>
          <div className="p-4 space-y-2">
            {data.phase_distribution.map((phase, idx) => {
              const percentage = data.total_trials > 0
                ? (phase.count / data.total_trials * 100).toFixed(1)
                : '0.0';

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm">{phase.category}</span>
                    <span className="font-mono text-terminal-accent text-sm">
                      {phase.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-terminal-bg-hover rounded-full h-2">
                    <div
                      className="bg-terminal-accent h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Status Distribution */}
        <Panel title="STATUS DISTRIBUTION" cornerBrackets>
          <div className="p-4 space-y-2">
            {data.status_distribution.map((status, idx) => {
              const percentage = data.total_trials > 0
                ? (status.count / data.total_trials * 100).toFixed(1)
                : '0.0';

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm">{status.category}</span>
                    <span className="font-mono text-terminal-accent text-sm">
                      {status.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-terminal-bg-hover rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status.category.includes('RECRUITING')
                          ? 'bg-green-500'
                          : status.category.includes('COMPLETED')
                          ? 'bg-blue-500'
                          : 'bg-terminal-accent'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Recruiting Trials */}
      <Panel title={`RECRUITING TRIALS (${data.recruiting_count})`} cornerBrackets>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-terminal-border">
              <tr className="text-left">
                <th className="p-3 font-mono uppercase text-xs">NCT ID</th>
                <th className="p-3 font-mono uppercase text-xs">Title</th>
                <th className="p-3 font-mono uppercase text-xs">Phase</th>
                <th className="p-3 font-mono uppercase text-xs">Enrollment</th>
                <th className="p-3 font-mono uppercase text-xs">Sponsor</th>
                <th className="p-3 font-mono uppercase text-xs">Conditions</th>
              </tr>
            </thead>
            <tbody>
              {data.recruiting_trials.slice(0, 20).map((trial, idx) => (
                <tr
                  key={idx}
                  className="border-b border-terminal-border/50 hover:bg-terminal-bg-hover"
                >
                  <td className="p-3 font-mono text-terminal-accent">
                    <a
                      href={`https://clinicaltrials.gov/study/${trial.nct_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {trial.nct_id}
                    </a>
                  </td>
                  <td className="p-3 max-w-md">
                    <div className="truncate" title={trial.title}>
                      {trial.title}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-terminal-text-secondary">
                    {trial.phases?.join(', ') || 'N/A'}
                  </td>
                  <td className="p-3 font-mono text-terminal-text-secondary text-right">
                    {trial.enrollment?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="p-3 text-sm max-w-xs">
                    <div className="truncate" title={trial.lead_sponsor}>
                      {trial.lead_sponsor}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {trial.conditions?.slice(0, 2).map((cond, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-terminal-bg-hover rounded"
                        >
                          {cond}
                        </span>
                      ))}
                      {trial.conditions?.length > 2 && (
                        <span className="px-2 py-1 text-terminal-text-tertiary">
                          +{trial.conditions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default ClinicalTrialsMonitor;
