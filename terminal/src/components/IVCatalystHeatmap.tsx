/**
 * IV Catalyst Heatmap Component
 * 
 * Calendar view showing catalyst events with implied volatility overlay.
 * Color-coded cells by IV z-score, badges for event proximity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './IVCatalystHeatmap.css';

interface IVData {
  iv7: number | null;
  iv30: number | null;
  iv7_pctile: number | null;
  skew_25d: number | null;
  is_backwardation: boolean;
  iv_date: string | null;
}

interface PriceData {
  price: number | null;
  returns_5d: number | null;
  realized_vol_20d: number | null;
}

interface CalendarEvent {
  id: number;
  ticker: string;
  name: string;
  event_date: string;
  event_type: string;
  days_to_event: number;
  marker: string | null;
  iv_data: IVData;
  price_data: PriceData | null;
}

interface IVCatalystHeatmapProps {
  className?: string;
}

export const IVCatalystHeatmap: React.FC<IVCatalystHeatmapProps> = ({ className = '' }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      const response = await fetch(`/api/v1/iv/calendar?${params}`);
      if (!response.ok) throw new Error('Failed to fetch IV calendar data');
      
      const data = await response.json();
      setEvents(data.events || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const getIVColorClass = (iv_pctile: number | null): string => {
    if (!iv_pctile) return 'iv-unknown';
    if (iv_pctile >= 85) return 'iv-very-high';
    if (iv_pctile >= 70) return 'iv-high';
    if (iv_pctile >= 50) return 'iv-medium';
    if (iv_pctile >= 30) return 'iv-low';
    return 'iv-very-low';
  };

  const getMarkerClass = (marker: string | null): string => {
    if (!marker) return '';
    return `marker-${marker.toLowerCase().replace('-', '')}`;
  };

  const renderCalendarView = () => {
    // Group events by ticker
    const eventsByTicker = events.reduce((acc, event) => {
      if (!acc[event.ticker]) {
        acc[event.ticker] = [];
      }
      acc[event.ticker].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);

    return (
      <div className="iv-calendar-grid">
        <div className="calendar-header">
          <div className="header-cell">TICKER</div>
          <div className="header-cell">D-30</div>
          <div className="header-cell">D-7</div>
          <div className="header-cell">D-3</div>
          <div className="header-cell">D-1</div>
          <div className="header-cell">EVENT</div>
          <div className="header-cell">D+1</div>
          <div className="header-cell">IV7</div>
          <div className="header-cell">IV/RV</div>
          <div className="header-cell">SKEW</div>
        </div>
        
        {Object.entries(eventsByTicker).map(([ticker, tickerEvents]) => {
          const latestEvent = tickerEvents[0]; // Assuming sorted by date
          const iv7 = latestEvent.iv_data.iv7;
          const rv20 = latestEvent.price_data?.realized_vol_20d;
          const ivRvRatio = (iv7 && rv20) ? iv7 / rv20 : null;
          
          return (
            <div key={ticker} className="calendar-row">
              <div className="ticker-cell">
                <span className="ticker-symbol">{ticker}</span>
              </div>
              
              {/* Timeline cells D-30 through D+1 */}
              {['D-30', 'D-7', 'D-3', 'D-1', 'EVENT', 'D+1'].map((period) => {
                const event = tickerEvents.find(e => 
                  period === 'EVENT' ? true : e.marker === period
                );
                
                return (
                  <div 
                    key={`${ticker}-${period}`}
                    className={`timeline-cell ${event ? getIVColorClass(event.iv_data.iv7_pctile) : ''} ${event ? getMarkerClass(event.marker) : ''}`}
                    title={event ? `${event.name}\n${event.event_type}\nIV7: ${event.iv_data.iv7?.toFixed(1)}%\nPctile: ${event.iv_data.iv7_pctile?.toFixed(0)}%` : ''}
                  >
                    {event && period !== 'EVENT' && (
                      <div className="event-badge">
                        {event.marker}
                      </div>
                    )}
                    {event && period === 'EVENT' && (
                      <div className="event-marker">
                        <div className="event-name">{event.event_type}</div>
                        <div className="event-date">
                          {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Metrics cells */}
              <div className="metric-cell">
                {iv7 ? `${iv7.toFixed(1)}%` : 'N/A'}
                {latestEvent.iv_data.is_backwardation && (
                  <span className="backwardation-indicator" title="Term structure in backwardation">⚠</span>
                )}
              </div>
              
              <div className={`metric-cell ${ivRvRatio && ivRvRatio > 1.4 ? 'elevated' : ''}`}>
                {ivRvRatio ? ivRvRatio.toFixed(2) : 'N/A'}
              </div>
              
              <div className="metric-cell">
                {latestEvent.iv_data.skew_25d ? latestEvent.iv_data.skew_25d.toFixed(1) : 'N/A'}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="iv-list-view">
        {events.map((event) => {
          const iv7 = event.iv_data.iv7;
          const rv20 = event.price_data?.realized_vol_20d;
          const ivRvRatio = (iv7 && rv20) ? iv7 / rv20 : null;
          
          return (
            <div key={event.id} className={`event-card ${getIVColorClass(event.iv_data.iv7_pctile)}`}>
              <div className="event-header">
                <div className="event-ticker">{event.ticker}</div>
                <div className={`event-marker-badge ${getMarkerClass(event.marker)}`}>
                  {event.marker || `${event.days_to_event}d`}
                </div>
              </div>
              
              <div className="event-title">{event.name}</div>
              <div className="event-type">{event.event_type}</div>
              <div className="event-date">
                {new Date(event.event_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              
              <div className="event-metrics">
                <div className="metric">
                  <div className="metric-label">IV7</div>
                  <div className="metric-value">{iv7 ? `${iv7.toFixed(1)}%` : 'N/A'}</div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">IV30</div>
                  <div className="metric-value">{event.iv_data.iv30 ? `${event.iv_data.iv30.toFixed(1)}%` : 'N/A'}</div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">Percentile</div>
                  <div className="metric-value">{event.iv_data.iv7_pctile ? `${event.iv_data.iv7_pctile.toFixed(0)}%` : 'N/A'}</div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">IV/RV</div>
                  <div className={`metric-value ${ivRvRatio && ivRvRatio > 1.4 ? 'elevated' : ''}`}>
                    {ivRvRatio ? ivRvRatio.toFixed(2) : 'N/A'}
                  </div>
                </div>
                
                <div className="metric">
                  <div className="metric-label">Skew</div>
                  <div className="metric-value">{event.iv_data.skew_25d ? event.iv_data.skew_25d.toFixed(1) : 'N/A'}</div>
                </div>
                
                {event.iv_data.is_backwardation && (
                  <div className="metric backwardation">
                    <div className="metric-label">Term Structure</div>
                    <div className="metric-value">⚠ Backwardation</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`iv-catalyst-heatmap ${className}`}>
        <div className="loading-state">Loading IV calendar data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`iv-catalyst-heatmap ${className}`}>
        <div className="error-state">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`iv-catalyst-heatmap ${className}`}>
      <div className="heatmap-header">
        <h2 className="heatmap-title">IV CATALYST HEATMAP</h2>
        
        <div className="heatmap-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              CALENDAR
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              LIST
            </button>
          </div>
          
          <button className="refresh-btn" onClick={fetchCalendarData}>
            ↻ REFRESH
          </button>
        </div>
      </div>
      
      <div className="heatmap-legend">
        <div className="legend-item">
          <span className="legend-color iv-very-low"></span>
          <span className="legend-label">IV &lt;30%ile</span>
        </div>
        <div className="legend-item">
          <span className="legend-color iv-low"></span>
          <span className="legend-label">30-50%ile</span>
        </div>
        <div className="legend-item">
          <span className="legend-color iv-medium"></span>
          <span className="legend-label">50-70%ile</span>
        </div>
        <div className="legend-item">
          <span className="legend-color iv-high"></span>
          <span className="legend-label">70-85%ile</span>
        </div>
        <div className="legend-item">
          <span className="legend-color iv-very-high"></span>
          <span className="legend-label">&gt;85%ile</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge">⚠</span>
          <span className="legend-label">Backwardation</span>
        </div>
      </div>
      
      {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
      
      {events.length === 0 && (
        <div className="empty-state">
          No catalyst events with IV data found in the selected timeframe.
        </div>
      )}
    </div>
  );
};

export default IVCatalystHeatmap;
