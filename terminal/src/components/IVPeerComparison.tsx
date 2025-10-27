/**
 * IV Peer Comparison Component
 * 
 * Shows IV7 percentile comparison for tickers with similar MOA/endpoint
 */

import React, { useState, useEffect } from 'react';
import './IVPeerComparison.css';

export interface PeerData {
  ticker: string;
  name: string;
  iv7: number;
  iv7_pctile: number;
  moa?: string;
  indication?: string;
  upcoming_catalyst?: string;
}

export interface IVPeerComparisonProps {
  ticker: string;
  moa?: string;
  endpoint?: string;
  className?: string;
}

export const IVPeerComparison: React.FC<IVPeerComparisonProps> = ({
  ticker,
  moa,
  endpoint,
  className = ''
}) => {
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPeerData();
  }, [ticker, moa, endpoint]);

  const fetchPeerData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (moa) params.append('moa_filter', moa);
      if (endpoint) params.append('therapeutic_area', endpoint);
      
      const response = await fetch(`/api/v1/iv/peer-comparison/${ticker}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch peer comparison data');
      }
      
      const data = await response.json();
      
      // Format peer data
      const formattedPeers: PeerData[] = [
        {
          ticker: data.ticker,
          name: data.name,
          iv7: data.target_iv.iv7,
          iv7_pctile: data.target_iv.iv7_pctile,
          moa: moa,
          indication: endpoint
        },
        ...data.peers.map((peer: any) => ({
          ticker: peer.ticker,
          name: peer.name,
          iv7: peer.iv7,
          iv7_pctile: peer.iv7_pctile,
          moa: peer.therapeutic_areas,
          upcoming_catalyst: null
        }))
      ];
      
      setPeers(formattedPeers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to mock data on error
      const mockPeers: PeerData[] = [
        {
          ticker: ticker,
          name: 'Current Ticker',
          iv7: 55.0,
          iv7_pctile: 72,
          moa: moa || 'Similar MOA',
          upcoming_catalyst: 'Phase 3 Data'
        },
        {
          ticker: 'PEER1',
          name: 'Peer Company 1',
          iv7: 48.0,
          iv7_pctile: 58,
          moa: moa || 'Similar MOA',
          upcoming_catalyst: 'Phase 2 Results'
        },
        {
          ticker: 'PEER2',
          name: 'Peer Company 2',
          iv7: 62.0,
          iv7_pctile: 84,
          moa: moa || 'Similar MOA',
          upcoming_catalyst: 'PDUFA'
        },
        {
          ticker: 'PEER3',
          name: 'Peer Company 3',
          iv7: 42.0,
          iv7_pctile: 45,
          moa: moa || 'Similar MOA',
          upcoming_catalyst: null
        }
      ];
      
      setPeers(mockPeers);
    } finally {
      setLoading(false);
    }
  };

  const getPercentileColor = (pctile: number): string => {
    if (pctile >= 85) return 'var(--color-high)';
    if (pctile >= 70) return 'var(--color-elevated)';
    if (pctile >= 50) return 'var(--color-medium)';
    return 'var(--color-low)';
  };

  const getPercentileClass = (pctile: number): string => {
    if (pctile >= 85) return 'pctile-high';
    if (pctile >= 70) return 'pctile-elevated';
    if (pctile >= 50) return 'pctile-medium';
    return 'pctile-low';
  };

  if (loading) {
    return (
      <div className={`iv-peer-comparison ${className}`}>
        <div className="peer-loading">Loading peer comparison...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`iv-peer-comparison ${className}`}>
        <div className="peer-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`iv-peer-comparison ${className}`}>
      <div className="peer-header">
        <h3 className="peer-title">IV PEER COMPARISON</h3>
        {moa && <span className="peer-moa">MOA: {moa}</span>}
        {endpoint && <span className="peer-endpoint">Endpoint: {endpoint}</span>}
      </div>

      <div className="peer-list">
        {peers.map((peer) => (
          <div
            key={peer.ticker}
            className={`peer-item ${peer.ticker === ticker ? 'peer-current' : ''}`}
          >
            <div className="peer-info">
              <span className="peer-ticker">{peer.ticker}</span>
              {peer.upcoming_catalyst && (
                <span className="peer-catalyst">{peer.upcoming_catalyst}</span>
              )}
            </div>

            <div className="peer-metrics">
              <div className="peer-iv">
                <span className="peer-label">IV7:</span>
                <span className="peer-value">{peer.iv7.toFixed(1)}%</span>
              </div>

              <div className="peer-percentile">
                <span className="peer-label">Pctile:</span>
                <span
                  className={`peer-value ${getPercentileClass(peer.iv7_pctile)}`}
                  style={{ color: getPercentileColor(peer.iv7_pctile) }}
                >
                  {peer.iv7_pctile}%
                </span>
              </div>
            </div>

            {/* Visual percentile bar */}
            <div className="peer-bar">
              <div
                className="peer-bar-fill"
                style={{
                  width: `${peer.iv7_pctile}%`,
                  backgroundColor: getPercentileColor(peer.iv7_pctile)
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="peer-legend">
        <div className="legend-item">
          <span className="legend-color pctile-high"></span>
          <span>Very High (≥85%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pctile-elevated"></span>
          <span>Elevated (70-84%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pctile-medium"></span>
          <span>Medium (50-69%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pctile-low"></span>
          <span>Low (<50%)</span>
        </div>
      </div>
    </div>
  );
};

export default IVPeerComparison;
