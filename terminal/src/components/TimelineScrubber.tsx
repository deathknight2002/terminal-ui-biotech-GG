/**
 * Timeline Scrubber Component
 *
 * Interactive timeline visualization for thesis updates.
 * Shows cumulative changes in PoS and sentiment over time.
 */

import React, { useState } from 'react';
import type { ThesisTimeline } from '../../types/evidence-graph';
import './TimelineScrubber.css';

interface TimelineScrubberProps {
  timeline: ThesisTimeline;
  onTimePointSelect?: (index: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  timeline,
  onTimePointSelect,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(timeline.timeline.length - 1);

  const handlePointClick = (index: number) => {
    setSelectedIndex(index);
    if (onTimePointSelect) {
      onTimePointSelect(index);
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDelta = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)}%`;
  };

  const selectedEntry = timeline.timeline[selectedIndex];

  return (
    <div className="timeline-scrubber">
      <div className="timeline-header">
        <h3 className="timeline-title">THESIS TIMELINE: {timeline.thesis.id}</h3>
        <div className="timeline-summary">
          <div className="summary-item">
            <span className="summary-label">UPDATES:</span>
            <span className="summary-value">{timeline.summary.total_updates}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">FINAL POS:</span>
            <span className="summary-value pos-value">
              {(timeline.summary.final_pos * 100).toFixed(1)}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">FINAL SENTIMENT:</span>
            <span className={`summary-value sentiment-value ${timeline.summary.final_sentiment >= 0 ? 'positive' : 'negative'}`}>
              {timeline.summary.final_sentiment.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="timeline-track">
        <svg width="100%" height="120" className="timeline-svg">
          {/* Timeline axis */}
          <line
            x1="40"
            y1="60"
            x2="calc(100% - 40)"
            y2="60"
            stroke="#4a5568"
            strokeWidth="2"
          />

          {/* Timeline points */}
          {timeline.timeline.map((entry, index) => {
            const x = 40 + ((index / (timeline.timeline.length - 1 || 1)) * (100 - 80));
            const isSelected = index === selectedIndex;

            return (
              <g key={index} onClick={() => handlePointClick(index)}>
                {/* Vertical line */}
                <line
                  x1={`${x}%`}
                  y1="30"
                  x2={`${x}%`}
                  y2="90"
                  stroke={isSelected ? '#ed8936' : '#718096'}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={isSelected ? '0' : '2,2'}
                />

                {/* Data point */}
                <circle
                  cx={`${x}%`}
                  cy="60"
                  r={isSelected ? 8 : 5}
                  fill={isSelected ? '#ed8936' : '#4299e1'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="timeline-point"
                  style={{ cursor: 'pointer' }}
                />

                {/* Label */}
                {isSelected && (
                  <text
                    x={`${x}%`}
                    y="20"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {formatDate(entry.timestamp)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selectedEntry && (
        <div className="timeline-details">
          <div className="detail-card">
            <div className="detail-header">
              <span className="detail-date">{formatDate(selectedEntry.timestamp)}</span>
              <span className={`detail-relation ${selectedEntry.edge.relation}`}>
                {selectedEntry.edge.relation.toUpperCase().replace('_', ' ')}
              </span>
            </div>

            {selectedEntry.source_node && (
              <div className="detail-source">
                <span className="source-label">SOURCE:</span>
                <span className="source-id">{selectedEntry.source_node.id}</span>
                {selectedEntry.source_node.company && (
                  <span className="source-company">({selectedEntry.source_node.company})</span>
                )}
              </div>
            )}

            {selectedEntry.edge.delta && (
              <div className="detail-deltas">
                {selectedEntry.edge.delta.pos !== undefined && (
                  <div className="delta-item">
                    <span className="delta-label">ΔPoS:</span>
                    <span className={`delta-value ${selectedEntry.edge.delta.pos >= 0 ? 'positive' : 'negative'}`}>
                      {formatDelta(selectedEntry.edge.delta.pos)}
                    </span>
                  </div>
                )}
                {selectedEntry.edge.delta.sentiment !== undefined && (
                  <div className="delta-item">
                    <span className="delta-label">ΔSentiment:</span>
                    <span className={`delta-value ${selectedEntry.edge.delta.sentiment >= 0 ? 'positive' : 'negative'}`}>
                      {formatDelta(selectedEntry.edge.delta.sentiment)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedEntry.cumulative && (
              <div className="detail-cumulative">
                <div className="cumulative-item">
                  <span className="cumulative-label">CUMULATIVE POS:</span>
                  <span className="cumulative-value">
                    {(selectedEntry.cumulative.pos * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="cumulative-item">
                  <span className="cumulative-label">CUMULATIVE SENTIMENT:</span>
                  <span className={`cumulative-value ${selectedEntry.cumulative.sentiment >= 0 ? 'positive' : 'negative'}`}>
                    {selectedEntry.cumulative.sentiment.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {selectedEntry.edge.reason && (
              <div className="detail-reason">
                <span className="reason-label">REASON:</span>
                <p className="reason-text">{selectedEntry.edge.reason}</p>
              </div>
            )}

            {selectedEntry.edge.confidence !== undefined && (
              <div className="detail-confidence">
                <span className="confidence-label">CONFIDENCE:</span>
                <span className="confidence-value">
                  {(selectedEntry.edge.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
