/**
 * Catalyst Events Dashboard
 * 
 * Display and interact with catalyst events from the tracking system
 */

import React, { useState, useEffect } from 'react';
import { CatalystEventCard, ExpectationBandChart, QuadrantSlideView } from '../components/charts/CatalystEventChart';
import type { CatalystEvent, QuadrantSlide } from '../../src/types/biotech';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const CatalystEventsPage: React.FC = () => {
  const [events, setEvents] = useState<CatalystEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CatalystEvent | null>(null);
  const [quadrantData, setQuadrantData] = useState<QuadrantSlide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Fetch catalyst events
  useEffect(() => {
    fetchEvents();
    fetchTypes();
  }, [filterType]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('catalyst_type', filterType);
      }
      params.append('limit', '50');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/catalyst-events/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.events || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/catalyst-events/types`);
      if (!response.ok) throw new Error('Failed to fetch types');
      
      const data = await response.json();
      setAvailableTypes(data.catalyst_types || []);
    } catch (err) {
      console.error('Error fetching types:', err);
    }
  };

  const handleSelectEvent = async (eventId: string) => {
    try {
      // Fetch full event details
      const eventResponse = await fetch(`${API_BASE_URL}/api/v1/catalyst-events/events/${eventId}`);
      if (!eventResponse.ok) throw new Error('Failed to fetch event details');
      const eventData = await eventResponse.json();
      setSelectedEvent(eventData);

      // Fetch quadrant slide data
      const quadrantResponse = await fetch(`${API_BASE_URL}/api/v1/catalyst-events/events/${eventId}/quadrant`);
      if (quadrantResponse.ok) {
        const quadrantData = await quadrantResponse.json();
        setQuadrantData(quadrantData);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
    }
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
    setQuadrantData(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#fff',
        fontFamily: 'var(--font-mono, monospace)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>Loading catalyst events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#ff0000',
        fontFamily: 'var(--font-mono, monospace)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️</div>
          <div>Error: {error}</div>
          <button
            onClick={fetchEvents}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: 'var(--accent-primary, #FF9500)',
              border: 'none',
              borderRadius: '4px',
              color: '#000',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 'bold'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If event is selected, show detail view
  if (selectedEvent && quadrantData) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #0a0a0a, #1a1a1a)',
        padding: '20px'
      }}>
        <button
          onClick={handleCloseDetails}
          style={{
            marginBottom: '20px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px'
          }}
        >
          ← Back to Events
        </button>
        
        <QuadrantSlideView quadrant={quadrantData} />
        
        {/* Expectation Band Chart */}
        {selectedEvent.expectations?.metrics && selectedEvent.outcome?.metrics && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ 
              color: '#fff', 
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '18px',
              marginBottom: '20px'
            }}>
              EXPECTATION VS OUTCOME
            </h3>
            <ExpectationBandChart
              metrics={selectedEvent.expectations.metrics}
              outcomes={selectedEvent.outcome.metrics}
              height={400}
              transparent={false}
            />
          </div>
        )}
      </div>
    );
  }

  // Main list view
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0a0a0a, #1a1a1a)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          color: '#fff',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          CATALYST EVENTS
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '14px'
        }}>
          Hyper-granular event tracking with expectation bands and market reactions
        </p>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterType('all')}
          style={{
            padding: '8px 16px',
            background: filterType === 'all' ? 'var(--accent-primary, #FF9500)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: filterType === 'all' ? '#000' : '#fff',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          All Events
        </button>
        {availableTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '8px 16px',
              background: filterType === type ? 'var(--accent-primary, #FF9500)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: filterType === type ? '#000' : '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'var(--font-mono, monospace)',
          padding: '60px 20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div>No catalyst events found</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Try selecting a different filter or check back later
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {events.map(event => (
            <CatalystEventCard
              key={event.event_id}
              event={event}
              onViewDetails={handleSelectEvent}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.3)',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px'
      }}>
        Total Events: {events.length}
      </div>
    </div>
  );
};

export default CatalystEventsPage;
