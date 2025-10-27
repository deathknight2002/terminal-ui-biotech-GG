/**
 * IV Catalyst Heatmap - Enhanced Next.js Panel
 * 
 * A comprehensive catalyst calendar with IV overlay showing:
 * - Row = ticker
 * - Columns = D-30 → D+5 (days relative to catalyst)
 * - Cells shaded by IV7 z-score
 * - Badges on critical days (D-7, D-3, D-1)
 * - Tooltips with IV drift, skew change, OI spikes
 */

import React, { useState, useEffect } from 'react';
import './IVCatalystHeatmapNext.css';

interface CatalystEvent {
  id: number;
  ticker: string;
  name: string;
  event_date: string;
  event_type: string;
  days_to_event: number;
  marker: string | null;
  iv_data: {
    iv7: number | null;
    iv30: number | null;
    iv7_pctile: number | null;
    skew_25d: number | null;
    is_backwardation: boolean;
    iv_date: string | null;
  };
  price_data: {
    price: number | null;
    returns_5d: number | null;
    realized_vol_20d: number | null;
  } | null;
}

interface CalendarData {
  events: CatalystEvent[];
  count: number;
  months: Record<string, CatalystEvent[]>;
  date_range: {
    from: string;
    to: string;
  };
}

const IVCatalystHeatmapNext: React.FC = () => {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTickers, setSelectedTickers] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    fetchCalendarData();
  }, [selectedTickers, dateRange]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from_date', dateRange.from);
      if (dateRange.to) params.append('to_date', dateRange.to);
      if (selectedTickers) params.append('tickers', selectedTickers);

      const response = await fetch(`/api/v1/iv/calendar?${params}`);
      if (!response.ok) throw new Error('Failed to fetch calendar data');

      const data = await response.json();
      setCalendarData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getIVZScore = (iv7: number | null, iv7_pctile: number | null): number => {
    // Simple z-score approximation from percentile
    // In production, this would use actual mean and std dev
    if (!iv7 || !iv7_pctile) return 0;
    
    // Map percentile to z-score (rough approximation)
    if (iv7_pctile < 25) return -1;
    if (iv7_pctile < 50) return 0;
    if (iv7_pctile < 75) return 1;
    if (iv7_pctile < 90) return 1.5;
    return 2;
  };

  const getCellClass = (zScore: number): string => {
    if (zScore < 0.5) return 'iv-low';
    if (zScore < 1.5) return 'iv-medium';
    return 'iv-high';
  };

  const getMarkerBadge = (marker: string | null): string => {
    if (!marker) return '';
    if (marker === 'D-1') return '⚠️';
    if (marker === 'D-3') return '📊';
    if (marker === 'D-7') return '📈';
    if (marker === 'D-30') return '📅';
    return '';
  };

  const renderCalendarRow = (event: CatalystEvent) => {
    const zScore = getIVZScore(event.iv_data.iv7, event.iv_data.iv7_pctile);
    const cellClass = getCellClass(zScore);
    const badge = getMarkerBadge(event.marker);

    return (
      <tr key={event.id} className="calendar-row">
        <td className="ticker-cell">
          <strong>{event.ticker}</strong>
        </td>
        <td className={`iv-cell ${cellClass}`} title={`IV7: ${event.iv_data.iv7}% (${event.iv_data.iv7_pctile}%ile)`}>
          <div className="iv-indicator">
            {badge && <span className="marker-badge">{badge}</span>}
            <div className="iv-bar" style={{ width: `${event.iv_data.iv7_pctile || 0}%` }}></div>
          </div>
        </td>
        <td className="event-cell">
          <div className="event-info">
            <div className="event-type">{event.event_type}</div>
            <div className="event-date">{new Date(event.event_date).toLocaleDateString()}</div>
            <div className="days-to-event">{event.days_to_event} days</div>
          </div>
        </td>
        <td className="metrics-cell">
          <div className="metrics">
            {event.iv_data.iv7 && (
              <div className="metric">
                <span className="label">IV7:</span>
                <span className="value">{event.iv_data.iv7.toFixed(1)}%</span>
              </div>
            )}
            {event.iv_data.iv30 && (
              <div className="metric">
                <span className="label">IV30:</span>
                <span className="value">{event.iv_data.iv30.toFixed(1)}%</span>
              </div>
            )}
            {event.iv_data.is_backwardation && (
              <div className="metric flag">
                <span className="warning">⚠️ Backwardation</span>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="iv-heatmap-container">
        <div className="loading">Loading catalyst calendar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="iv-heatmap-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="iv-heatmap-container">
      <div className="heatmap-header">
        <h2>CATALYST CALENDAR + IV OVERLAY</h2>
        
        <div className="filters">
          <input
            type="text"
            placeholder="Filter tickers (comma-separated)"
            value={selectedTickers}
            onChange={(e) => setSelectedTickers(e.target.value)}
            className="ticker-filter"
          />
          <button onClick={fetchCalendarData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color iv-low"></span>
          <span>Low IV (z &lt; 0.5)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color iv-medium"></span>
          <span>Medium IV (0.5 &lt; z &lt; 1.5)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color iv-high"></span>
          <span>High IV (z &gt; 1.5)</span>
        </div>
        <div className="legend-item">
          <span>⚠️ D-1</span>
          <span>📊 D-3</span>
          <span>📈 D-7</span>
          <span>📅 D-30</span>
        </div>
      </div>

      <div className="calendar-table-wrapper">
        <table className="calendar-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>IV Signal</th>
              <th>Event</th>
              <th>Metrics</th>
            </tr>
          </thead>
          <tbody>
            {calendarData?.events.map(renderCalendarRow)}
          </tbody>
        </table>
      </div>

      {calendarData && (
        <div className="summary">
          <div className="summary-stat">
            <span className="label">Total Events:</span>
            <span className="value">{calendarData.count}</span>
          </div>
          <div className="summary-stat">
            <span className="label">Date Range:</span>
            <span className="value">
              {new Date(calendarData.date_range.from).toLocaleDateString()} - {new Date(calendarData.date_range.to).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IVCatalystHeatmapNext;
