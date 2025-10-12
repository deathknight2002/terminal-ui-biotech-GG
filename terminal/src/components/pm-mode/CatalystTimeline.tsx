import React, { useState, useMemo } from 'react';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import type { CatalystTimelineEvent } from '../../../../src/types/biotech';
import './CatalystTimeline.css';

interface CatalystTimelineProps {
  events: CatalystTimelineEvent[];
  monthsToShow?: number;
  enableFiltering?: boolean;
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  'Data': '📊',
  'Filing': '📄',
  'AdCom': '🏛️',
  'PDUFA': '✅',
  'Other': '📌',
};

export const CatalystTimeline: React.FC<CatalystTimelineProps> = ({
  events,
  monthsToShow = 12,
  enableFiltering = true,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() + monthsToShow);

    let filtered = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= cutoff;
    });

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(event => selectedTypes.includes(event.eventType));
    }

    if (selectedPhases.length > 0) {
      filtered = filtered.filter(event => selectedPhases.includes(event.phase));
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, monthsToShow, selectedTypes, selectedPhases]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const togglePhase = (phase: string) => {
    setSelectedPhases(prev =>
      prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateString: string): number => {
    const now = new Date();
    const eventDate = new Date(dateString);
    return Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const uniqueTypes = Array.from(new Set(events.map(e => e.eventType)));
  const uniquePhases = Array.from(new Set(events.map(e => e.phase)));

  return (
    <Panel title="CATALYST TIMELINE (12M)" cornerBrackets>
      <div className="catalyst-timeline">
        {enableFiltering && (
          <div className="catalyst-timeline-filters">
            <div className="filter-group">
              <span className="filter-label">EVENT TYPE:</span>
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  className={`filter-chip ${selectedTypes.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleType(type)}
                >
                  {EVENT_TYPE_ICONS[type] || '📌'} {type}
                </button>
              ))}
            </div>
            <div className="filter-group">
              <span className="filter-label">PHASE:</span>
              {uniquePhases.map(phase => (
                <button
                  key={phase}
                  className={`filter-chip ${selectedPhases.includes(phase) ? 'active' : ''}`}
                  onClick={() => togglePhase(phase)}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="catalyst-timeline-header">
          <span className="timeline-count">
            {filteredEvents.length} UPCOMING CATALYSTS
          </span>
        </div>

        <div className="catalyst-timeline-events">
          {filteredEvents.length === 0 ? (
            <div className="timeline-empty">
              <p>No catalysts found in the next {monthsToShow} months</p>
            </div>
          ) : (
            filteredEvents.map(event => {
              const daysUntil = getDaysUntil(event.date);
              const urgency = daysUntil <= 30 ? 'high' : daysUntil <= 90 ? 'medium' : 'low';

              return (
                <div key={event.id} className={`catalyst-event urgency-${urgency}`}>
                  <div className="event-date">
                    <span className="event-icon">{EVENT_TYPE_ICONS[event.eventType] || '📌'}</span>
                    <div className="event-date-info">
                      <span className="event-date-text">{formatDate(event.date)}</span>
                      <span className="event-days-until">{daysUntil}d</span>
                    </div>
                  </div>
                  <div className="event-details">
                    <div className="event-header">
                      <span className="event-program">{event.program}</span>
                      <span className="event-phase-badge">{event.phase}</span>
                    </div>
                    <div className="event-description">{event.description}</div>
                    <div className="event-meta">
                      <span className="event-type">{event.eventType}</span>
                      <span className="event-ta">{event.therapeuticArea}</span>
                      {event.evDelta && (
                        <span className="event-ev-delta">
                          EV Impact: ${(event.evDelta / 1_000_000).toFixed(0)}M
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="event-importance">
                    <div className="importance-bar">
                      <div
                        className="importance-fill"
                        style={{ width: `${event.importance * 100}%` }}
                      />
                    </div>
                    <span className="importance-label">
                      {(event.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Panel>
  );
};
