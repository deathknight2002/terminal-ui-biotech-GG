import React, { useState, useEffect } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import './CatalystCalendarPage.css';

interface CatalystEvent {
  id: number;
  name: string;
  title: string;
  company: string;
  drug: string;
  kind: string;
  date: string;
  probability?: number;
  impact?: string;
  description?: string;
  status: string;
  source_url?: string;
}

type ViewMode = 'month' | 'week' | 'agenda';

export function CatalystCalendarPage() {
  const [events, setEvents] = useState<CatalystEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchCatalysts();
  }, [selectedMonth]);

  const fetchCatalysts = async () => {
    try {
      setLoading(true);
      const fromDate = `${selectedMonth}-01`;
      const toDate = `${selectedMonth}-31`;
      const response = await fetch(
        `http://localhost:8000/api/v1/catalysts/calendar?from_date=${fromDate}&to_date=${toDate}`
      );
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalysts');
    } finally {
      setLoading(false);
    }
  };

  const exportToICS = () => {
    // ICS export format
    let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Biotech Terminal//Catalyst Calendar//EN\r\n';
    
    events.forEach((event) => {
      const dateStr = event.date ? event.date.replace(/[-:]/g, '').split('.')[0] + 'Z' : '';
      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${event.id}@biotech-terminal.local\r\n`;
      icsContent += `DTSTAMP:${dateStr}\r\n`;
      icsContent += `DTSTART:${dateStr}\r\n`;
      icsContent += `SUMMARY:${event.company} - ${event.title}\r\n`;
      icsContent += `DESCRIPTION:${event.description || event.kind}\r\n`;
      icsContent += `LOCATION:${event.company}\r\n`;
      icsContent += 'END:VEVENT\r\n';
    });
    
    icsContent += 'END:VCALENDAR';
    
    // Download
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalyst-calendar-${selectedMonth}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getImpactColor = (impact?: string) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return 'impact-high';
      case 'medium':
        return 'impact-medium';
      case 'low':
        return 'impact-low';
      default:
        return 'impact-unknown';
    }
  };

  const renderAgendaView = () => {
    return (
      <div className="agenda-view">
        {events.length === 0 ? (
          <div className="empty-state">No catalysts scheduled for {selectedMonth}</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="agenda-item">
              <div className="agenda-date">
                {event.date ? new Date(event.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short'
                }) : 'TBD'}
              </div>
              <div className="agenda-details">
                <div className="agenda-header">
                  <h3 className="agenda-title">
                    {event.source_url ? (
                      <a href={event.source_url} target="_blank" rel="noopener noreferrer">
                        {event.name}
                      </a>
                    ) : (
                      event.name
                    )}
                  </h3>
                  <div className="agenda-badges">
                    <span className={`impact-badge ${getImpactColor(event.impact)}`}>
                      {event.impact || 'N/A'}
                    </span>
                    {event.probability && (
                      <span className="probability-badge">
                        {Math.round(event.probability * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="agenda-meta">
                  <span className="meta-item">{event.company}</span>
                  {event.drug && <span className="meta-item">Drug: {event.drug}</span>}
                  <span className="meta-item">{event.kind}</span>
                  <span className={`status-badge status-${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>
                {event.description && (
                  <div className="agenda-description">{event.description}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    // Group events by day
    const eventsByDay: Record<string, CatalystEvent[]> = {};
    events.forEach((event) => {
      if (event.date) {
        const day = new Date(event.date).getDate();
        const key = day.toString();
        if (!eventsByDay[key]) {
          eventsByDay[key] = [];
        }
        eventsByDay[key].push(event);
      }
    });

    // Generate calendar grid
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = new Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="month-view">
        <div className="month-header">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
            <div key={day} className="month-day-label">{day}</div>
          ))}
        </div>
        <div className="month-grid">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="month-week">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`month-day ${day ? 'active' : 'inactive'} ${
                    eventsByDay[day?.toString() || ''] ? 'has-events' : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className="day-number">{day}</div>
                      {eventsByDay[day.toString()]?.map((event, idx) => (
                        <div
                          key={idx}
                          className={`day-event ${getImpactColor(event.impact)}`}
                          title={event.name}
                        >
                          {event.company}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    // Group events by day of week
    const eventsByWeek: Record<string, CatalystEvent[]> = {};
    events.forEach((event) => {
      if (event.date) {
        const weekDay = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long' });
        if (!eventsByWeek[weekDay]) {
          eventsByWeek[weekDay] = [];
        }
        eventsByWeek[weekDay].push(event);
      }
    });

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
      <div className="week-view">
        {weekDays.map((day) => (
          <div key={day} className="week-day">
            <div className="week-day-header">{day}</div>
            <div className="week-day-events">
              {eventsByWeek[day]?.map((event) => (
                <div key={event.id} className="week-event">
                  <div className="week-event-time">
                    {event.date ? new Date(event.date).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    }) : 'TBD'}
                  </div>
                  <div className="week-event-details">
                    <div className="week-event-title">{event.name}</div>
                    <div className="week-event-company">{event.company}</div>
                  </div>
                </div>
              )) || <div className="week-empty">No events</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="catalyst-calendar-page">
      <Panel
        title="CATALYST CALENDAR"
        cornerBrackets
        variant="glass"
        headerAction={
          <div className="calendar-controls">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-picker"
            />
            <div className="view-mode-buttons">
              <button
                className={`view-mode-btn ${viewMode === 'month' ? 'active' : ''}`}
                onClick={() => setViewMode('month')}
              >
                MONTH
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                WEEK
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'agenda' ? 'active' : ''}`}
                onClick={() => setViewMode('agenda')}
              >
                AGENDA
              </button>
            </div>
            <button onClick={exportToICS} className="export-btn" title="Export to ICS">
              📅 EXPORT ICS
            </button>
          </div>
        }
      >
        {loading && <div className="loading-state">Loading catalysts...</div>}
        {error && <div className="error-state">{error}</div>}

        {!loading && !error && (
          <>
            {viewMode === 'agenda' && renderAgendaView()}
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
          </>
        )}
      </Panel>
    </div>
  );
}
