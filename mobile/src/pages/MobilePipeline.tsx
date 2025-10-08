import { FC, useState } from 'react';
import './MobilePipeline.css';

interface DrugCandidate {
  id: string;
  name: string;
  indication: string;
  phase: string;
  completion: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
}

const PIPELINE_DATA: DrugCandidate[] = [
  { id: '1', name: 'BTX-101', indication: 'Non-Small Cell Lung Cancer', phase: 'Phase III', completion: 85, targetDate: 'Q2 2025', priority: 'high' },
  { id: '2', name: 'IMM-205', indication: 'Rheumatoid Arthritis', phase: 'Phase II', completion: 65, targetDate: 'Q3 2025', priority: 'high' },
  { id: '3', name: 'NEU-340', indication: 'Alzheimer\'s Disease', phase: 'Phase II', completion: 45, targetDate: 'Q4 2025', priority: 'medium' },
  { id: '4', name: 'RDX-789', indication: 'Cystic Fibrosis', phase: 'Phase I', completion: 30, targetDate: 'Q1 2026', priority: 'medium' },
  { id: '5', name: 'ONC-456', indication: 'Pancreatic Cancer', phase: 'Preclinical', completion: 15, targetDate: 'Q2 2026', priority: 'low' },
];

const PHASE_COLORS = {
  'Phase III': 'var(--ios-green)',
  'Phase II': 'var(--ios-blue)',
  'Phase I': 'var(--ios-orange)',
  'Preclinical': 'var(--ios-purple)',
};

export const MobilePipeline: FC = () => {
  const [filter, setFilter] = useState<string>('all');

  const filteredData = filter === 'all' 
    ? PIPELINE_DATA 
    : PIPELINE_DATA.filter(drug => drug.phase === filter);

  return (
    <div className="mobile-pipeline">
      <div className="mobile-page-title">Pipeline</div>

      {/* Filter Pills */}
      <div className="mobile-filter-pills">
        <button 
          className={`mobile-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Programs
        </button>
        <button 
          className={`mobile-pill ${filter === 'Phase III' ? 'active' : ''}`}
          onClick={() => setFilter('Phase III')}
        >
          Phase III
        </button>
        <button 
          className={`mobile-pill ${filter === 'Phase II' ? 'active' : ''}`}
          onClick={() => setFilter('Phase II')}
        >
          Phase II
        </button>
        <button 
          className={`mobile-pill ${filter === 'Phase I' ? 'active' : ''}`}
          onClick={() => setFilter('Phase I')}
        >
          Phase I
        </button>
      </div>

      {/* Pipeline Overview Card */}
      <div className="mobile-glass-panel">
        <h2 className="mobile-panel-title">Overview</h2>
        <div className="mobile-grid-3">
          <div className="mobile-stat-box">
            <div className="mobile-stat-value">5</div>
            <div className="mobile-stat-label">Total Programs</div>
          </div>
          <div className="mobile-stat-box">
            <div className="mobile-stat-value">3</div>
            <div className="mobile-stat-label">Clinical Stage</div>
          </div>
          <div className="mobile-stat-box">
            <div className="mobile-stat-value">$8.9B</div>
            <div className="mobile-stat-label">Est. Value</div>
          </div>
        </div>
      </div>

      {/* Drug Candidates List */}
      <div className="mobile-pipeline-cards">
        {filteredData.map((drug) => (
          <div key={drug.id} className="mobile-drug-card ios-glass-panel">
            <div className="mobile-drug-header">
              <div>
                <div className="mobile-drug-name">{drug.name}</div>
                <div className="mobile-drug-indication">{drug.indication}</div>
              </div>
              <span className={`ios-badge ios-badge-${
                drug.priority === 'high' ? 'error' :
                drug.priority === 'medium' ? 'warning' :
                'success'
              }`}>
                {drug.priority.toUpperCase()}
              </span>
            </div>

            <div className="mobile-drug-phase-bar">
              <div className="mobile-drug-phase-label">
                <span 
                  className="mobile-phase-dot"
                  style={{ backgroundColor: PHASE_COLORS[drug.phase as keyof typeof PHASE_COLORS] }}
                />
                {drug.phase}
              </div>
              <div className="mobile-drug-target-date">Target: {drug.targetDate}</div>
            </div>

            <div className="mobile-drug-progress">
              <div className="mobile-drug-progress-bar">
                <div 
                  className="mobile-drug-progress-fill"
                  style={{ 
                    width: `${drug.completion}%`,
                    backgroundColor: PHASE_COLORS[drug.phase as keyof typeof PHASE_COLORS]
                  }}
                />
              </div>
              <div className="mobile-drug-progress-text">{drug.completion}%</div>
            </div>

            <div className="mobile-drug-actions">
              <button className="ios-button-glass">View Details</button>
              <button className="ios-button-glass">Timeline</button>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="mobile-empty-state">
          <div className="mobile-empty-icon">🔍</div>
          <div className="mobile-empty-text">No programs found</div>
        </div>
      )}
    </div>
  );
};
