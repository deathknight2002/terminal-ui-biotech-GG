
import { FC } from 'react';
import './MobileTrials.css';

const TRIAL_DATA = [
  { id: 'NCT001', name: 'BTX-101 Safety Study', phase: 'Phase III', status: 'Active', enrolled: 450, target: 500, completion: 90 },
  { id: 'NCT002', name: 'IMM-205 Efficacy Trial', phase: 'Phase II', status: 'Recruiting', enrolled: 120, target: 200, completion: 60 },
  { id: 'NCT003', name: 'NEU-340 Dose Finding', phase: 'Phase I', status: 'Active', enrolled: 35, target: 50, completion: 70 },
];

export const MobileTrials: FC = () => {
  return (
    <div className="mobile-trials">
      <div className="mobile-page-title">Clinical Trials</div>

      {/* Stats Overview */}
      <div className="mobile-glass-panel">
        <div className="mobile-grid-3">
          <div className="mobile-stat-box">
            <div className="mobile-stat-value">247</div>
            <div className="mobile-stat-label">Active Trials</div>
          </div>
          <div className="mobile-stat-box">
            <div className="mobile-stat-value">12.4K</div>
            <div className="mobile-stat-label">Patients</div>
          </div>
          <div className="mobile-stat-box">
            <div className="mobile-stat-value">89%</div>
            <div className="mobile-stat-label">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <input 
        type="search" 
        className="mobile-search-bar" 
        placeholder="Search trials..."
      />

      {/* Trial Cards */}
      <div className="mobile-trials-list">
        {TRIAL_DATA.map((trial) => (
          <div key={trial.id} className="mobile-trial-card ios-glass-panel">
            <div className="mobile-trial-header">
              <div className="mobile-trial-id">{trial.id}</div>
              <span className={`ios-badge ${
                trial.status === 'Active' ? 'ios-badge-success' : 'ios-badge-warning'
              }`}>
                {trial.status}
              </span>
            </div>
            
            <div className="mobile-trial-name">{trial.name}</div>
            <div className="mobile-trial-phase">{trial.phase}</div>

            <div className="mobile-trial-enrollment">
              <div className="mobile-trial-enrollment-text">
                Enrollment: {trial.enrolled} / {trial.target}
              </div>
              <div className="mobile-trial-enrollment-bar">
                <div 
                  className="mobile-trial-enrollment-fill"
                  style={{ width: `${(trial.enrolled / trial.target) * 100}%` }}
                />
              </div>
            </div>

            <div className="mobile-trial-completion">
              Trial Completion: {trial.completion}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
