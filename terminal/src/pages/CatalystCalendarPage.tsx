import React from 'react'
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel'
import { previewCatalystEvents } from '../data/previewData'
import './CatalystCalendarPage.css'

export function CatalystCalendarPage() {
  return (
    <div className="catalyst-calendar-page">
      <Panel title="CATALYST CALENDAR" subtitle="Next 120 days" cornerBrackets>
        <div className="catalyst-grid">
          {previewCatalystEvents.map((event) => (
            <div key={event.event_id} className="catalyst-card">
              <div className="catalyst-header">
                <div className="catalyst-date">{new Date(event.catalyst.date).toLocaleDateString()}</div>
                <div className="catalyst-type">{event.catalyst.subtype}</div>
              </div>
              <h3 className="catalyst-title">{event.catalyst.title}</h3>
              <p className="catalyst-company">
                {event.company.ticker} • {event.company.name}
              </p>
              <p className="catalyst-description">{event.catalyst.description}</p>
              <div className="catalyst-meta">
                <span className="badge">{event.expectations.class.toUpperCase()}</span>
                <span className="badge ghost">P({Math.round(event.expectations.probability * 100)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
