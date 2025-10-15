/**
 * Research Trends Component
 * 
 * Visualizes publication trends and research velocity from PubMed
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import { API_ENDPOINTS, apiFetch } from '../config/api';

interface TrendData {
  data: Array<{
    year: number;
    count: number;
  }>;
  query: string;
  years_analyzed: number;
  source: string;
}

interface HotTopicsData {
  hot_topics: Array<{
    topic: string;
    growth_rate: number;
    recent_publications: number;
    total_publications: number;
    is_accelerating: boolean;
  }>;
  therapeutic_area: string;
  analysis_period_years: number;
}

export const ResearchTrends: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('CAR-T therapy');
  const [therapeuticArea, setTherapeuticArea] = useState<string>('Oncology');
  const [activeTab, setActiveTab] = useState<'trends' | 'hot-topics'>('trends');

  // Fetch publication trends
  const { data: trendsData, isLoading: trendsLoading, refetch: refetchTrends } = useQuery<TrendData>({
    queryKey: ['research-trends', searchQuery],
    queryFn: () => 
      apiFetch(`${API_ENDPOINTS.RESEARCH.TRENDS}?query=${encodeURIComponent(searchQuery)}&years=10`),
    enabled: activeTab === 'trends',
    staleTime: 10 * 60 * 1000,
  });

  // Fetch hot topics
  const { data: hotTopicsData, isLoading: hotTopicsLoading, refetch: refetchHotTopics } = useQuery<HotTopicsData>({
    queryKey: ['hot-topics', therapeuticArea],
    queryFn: () => 
      apiFetch(`${API_ENDPOINTS.RESEARCH.HOT_TOPICS}?therapeutic_area=${encodeURIComponent(therapeuticArea)}&years=5`),
    enabled: activeTab === 'hot-topics',
    staleTime: 10 * 60 * 1000,
  });

  const handleTrendsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetchTrends();
  };

  const handleHotTopicsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetchHotTopics();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Panel title="RESEARCH INTELLIGENCE" cornerBrackets>
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-4 py-2 font-mono text-sm rounded ${
                activeTab === 'trends'
                  ? 'bg-terminal-accent text-terminal-bg'
                  : 'bg-terminal-bg-hover text-terminal-text hover:bg-terminal-bg-hover/80'
              }`}
            >
              PUBLICATION TRENDS
            </button>
            <button
              onClick={() => setActiveTab('hot-topics')}
              className={`px-4 py-2 font-mono text-sm rounded ${
                activeTab === 'hot-topics'
                  ? 'bg-terminal-accent text-terminal-bg'
                  : 'bg-terminal-bg-hover text-terminal-text hover:bg-terminal-bg-hover/80'
              }`}
            >
              HOT TOPICS
            </button>
          </div>

          {activeTab === 'trends' ? (
            <form onSubmit={handleTrendsSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search query (e.g., 'CAR-T therapy')"
                className="flex-1 px-3 py-2 bg-terminal-bg-hover border border-terminal-border rounded font-mono text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-terminal-accent text-terminal-bg rounded font-mono text-sm hover:bg-terminal-accent/80"
              >
                ANALYZE
              </button>
            </form>
          ) : (
            <form onSubmit={handleHotTopicsSearch} className="flex gap-2">
              <input
                type="text"
                value={therapeuticArea}
                onChange={(e) => setTherapeuticArea(e.target.value)}
                placeholder="Therapeutic area (e.g., 'Oncology')"
                className="flex-1 px-3 py-2 bg-terminal-bg-hover border border-terminal-border rounded font-mono text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-terminal-accent text-terminal-bg rounded font-mono text-sm hover:bg-terminal-accent/80"
              >
                ANALYZE
              </button>
            </form>
          )}
        </div>
      </Panel>

      {/* Trends View */}
      {activeTab === 'trends' && (
        <>
          {trendsLoading ? (
            <Panel title="LOADING..." cornerBrackets>
              <div className="p-4">Analyzing publication trends...</div>
            </Panel>
          ) : trendsData ? (
            <>
              {/* Summary Stats */}
              <Panel title={`PUBLICATION TRENDS: ${trendsData.query.toUpperCase()}`} cornerBrackets>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-terminal-text-tertiary mb-1">TOTAL PUBLICATIONS</div>
                      <div className="text-2xl font-mono text-terminal-accent">
                        {trendsData.data.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-terminal-text-tertiary mb-1">RECENT YEAR</div>
                      <div className="text-2xl font-mono text-terminal-accent">
                        {trendsData.data[trendsData.data.length - 1]?.count.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-terminal-text-tertiary mb-1">GROWTH</div>
                      <div className="text-2xl font-mono text-green-500">
                        {(() => {
                          const first = trendsData.data[0]?.count || 1;
                          const last = trendsData.data[trendsData.data.length - 1]?.count || 0;
                          const growth = ((last - first) / first * 100).toFixed(0);
                          return `${growth}%`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Year-by-Year Data */}
              <Panel title="YEAR-BY-YEAR BREAKDOWN" cornerBrackets>
                <div className="p-4 space-y-2">
                  {trendsData.data.map((yearData, idx) => {
                    const maxCount = Math.max(...trendsData.data.map(d => d.count));
                    const percentage = (yearData.count / maxCount * 100).toFixed(1);
                    
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-sm">{yearData.year}</span>
                          <span className="font-mono text-terminal-accent text-sm">
                            {yearData.count.toLocaleString()} publications
                          </span>
                        </div>
                        <div className="w-full bg-terminal-bg-hover rounded-full h-3">
                          <div
                            className="bg-terminal-accent h-3 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </>
          ) : null}
        </>
      )}

      {/* Hot Topics View */}
      {activeTab === 'hot-topics' && (
        <>
          {hotTopicsLoading ? (
            <Panel title="LOADING..." cornerBrackets>
              <div className="p-4">Identifying hot topics...</div>
            </Panel>
          ) : hotTopicsData ? (
            <Panel title={`HOT TOPICS: ${hotTopicsData.therapeutic_area.toUpperCase()}`} cornerBrackets>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-terminal-border">
                    <tr className="text-left">
                      <th className="p-3 font-mono uppercase text-xs">Topic</th>
                      <th className="p-3 font-mono uppercase text-xs text-right">Growth Rate</th>
                      <th className="p-3 font-mono uppercase text-xs text-right">Recent Pubs</th>
                      <th className="p-3 font-mono uppercase text-xs text-right">Total Pubs</th>
                      <th className="p-3 font-mono uppercase text-xs text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotTopicsData.hot_topics.map((topic, idx) => (
                      <tr 
                        key={idx}
                        className="border-b border-terminal-border/50 hover:bg-terminal-bg-hover"
                      >
                        <td className="p-3 max-w-md">
                          <div className="truncate font-mono text-terminal-text">
                            {topic.topic}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-right">
                          <span className={topic.growth_rate > 0 ? 'text-green-500' : 'text-red-500'}>
                            {topic.growth_rate > 0 ? '+' : ''}{topic.growth_rate}%
                          </span>
                        </td>
                        <td className="p-3 font-mono text-terminal-text-secondary text-right">
                          {topic.recent_publications.toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-terminal-text-secondary text-right">
                          {topic.total_publications.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          {topic.is_accelerating ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs font-mono">
                              <span role="img" aria-label="Accelerating trend">🔥</span> ACCELERATING
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs font-mono">
                              STEADY
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}
        </>
      )}
    </div>
  );
};

export default ResearchTrends;
