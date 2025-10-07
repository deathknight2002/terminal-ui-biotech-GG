import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import styles from './ClinicalTrialsTimeline.module.css';
import { Panel } from '../../organisms/Panel';
import { Badge } from '../../atoms/Badge';
import { Text } from '../../atoms/Text';
import { Button } from '../../atoms/Button';

export interface ClinicalTrial {
  id: string;
  title: string;
  phase: 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV' | 'Preclinical';
  status: 'Recruiting' | 'Active, not recruiting' | 'Completed' | 'Terminated' | 'Suspended';
  indication: string;
  primaryCompletion: string;
  estimatedEnrollment: number;
  sponsors: string[];
  locations: string[];
  lastUpdated: string;
}

export interface ClinicalTrialsTimelineProps {
  symbol: string;
  trials?: ClinicalTrial[];
  className?: string;
  onTrialSelect?: (trial: ClinicalTrial) => void;
}

const phaseColors = {
  'Preclinical': '#64748b',
  'Phase I': '#f59e0b',
  'Phase II': '#3b82f6',
  'Phase III': '#10b981',
  'Phase IV': '#8b5cf6'
};

const statusColors = {
  'Recruiting': '#10b981',
  'Active, not recruiting': '#3b82f6',
  'Completed': '#6b7280',
  'Terminated': '#ef4444',
  'Suspended': '#f59e0b'
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const calculateProgress = (trial: ClinicalTrial) => {
  const now = new Date();
  const completion = new Date(trial.primaryCompletion);
  const updated = new Date(trial.lastUpdated);
  
  // Estimate progress based on phase and status
  let baseProgress = 0;
  switch (trial.phase) {
    case 'Preclinical':
      baseProgress = 10;
      break;
    case 'Phase I':
      baseProgress = 25;
      break;
    case 'Phase II':
      baseProgress = 50;
      break;
    case 'Phase III':
      baseProgress = 75;
      break;
    case 'Phase IV':
      baseProgress = 90;
      break;
  }
  
  // Adjust based on status
  if (trial.status === 'Completed') return 100;
  if (trial.status === 'Terminated') return Math.max(baseProgress - 20, 0);
  if (trial.status === 'Suspended') return Math.max(baseProgress - 10, 0);
  
  // Calculate time-based progress
  const timeSinceUpdate = now.getTime() - updated.getTime();
  const timeToCompletion = completion.getTime() - updated.getTime();
  
  if (timeToCompletion > 0) {
    const timeProgress = Math.min(timeSinceUpdate / timeToCompletion, 1) * 20;
    return Math.min(baseProgress + timeProgress, 95);
  }
  
  return baseProgress;
};

export const ClinicalTrialsTimeline: React.FC<ClinicalTrialsTimelineProps> = ({
  symbol,
  trials = [],
  className,
  onTrialSelect
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredTrials = useMemo(() => {
    return trials.filter(trial => {
      const phaseMatch = selectedPhase === 'all' || trial.phase === selectedPhase;
      const statusMatch = selectedStatus === 'all' || trial.status === selectedStatus;
      return phaseMatch && statusMatch;
    });
  }, [trials, selectedPhase, selectedStatus]);

  const sortedTrials = useMemo(() => {
    return [...filteredTrials].sort((a, b) => {
      // Sort by completion date, then by phase
      const dateCompare = new Date(a.primaryCompletion).getTime() - new Date(b.primaryCompletion).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      const phaseOrder = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'];
      return phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
    });
  }, [filteredTrials]);

  const phases = useMemo(() => {
    const uniquePhases = [...new Set(trials.map(t => t.phase))];
    return uniquePhases.sort((a, b) => {
      const phaseOrder = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'];
      return phaseOrder.indexOf(a) - phaseOrder.indexOf(b);
    });
  }, [trials]);

  const statuses = useMemo(() => {
    return [...new Set(trials.map(t => t.status))];
  }, [trials]);

  if (trials.length === 0) {
    return (
      <Panel title={`Clinical Trials Timeline - ${symbol}`} className={clsx(styles.container, className)}>
        <div className={styles.emptyState}>
          <Text variant="body" color="muted">
            No clinical trials data available for {symbol}
          </Text>
          <Button variant="primary" size="sm" className={styles.loadButton}>
            Load Trials Data
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={`Clinical Trials Timeline - ${symbol}`} className={clsx(styles.container, className)}>
      <div className={styles.content}>
        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Text variant="caption" color="secondary" className={styles.filterLabel}>
              Phase:
            </Text>
            <select 
              value={selectedPhase} 
              onChange={(e) => setSelectedPhase(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Phases</option>
              {phases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <Text variant="caption" color="secondary" className={styles.filterLabel}>
              Status:
            </Text>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          {sortedTrials.map((trial, index) => {
            const progress = calculateProgress(trial);
            
            return (
              <div 
                key={trial.id} 
                className={styles.timelineItem}
                onClick={() => onTrialSelect?.(trial)}
              >
                <div className={styles.timelineMarker}>
                  <div 
                    className={styles.phaseIndicator}
                    style={{ backgroundColor: phaseColors[trial.phase] }}
                  >
                    {trial.phase.replace('Phase ', 'P')}
                  </div>
                </div>

                <div className={styles.timelineContent}>
                  <div className={styles.trialHeader}>
                    <div className={styles.trialTitle}>
                      <Text variant="body" color="primary" className={styles.trialName}>
                        {trial.title}
                      </Text>
                      <div className={styles.trialBadges}>
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: phaseColors[trial.phase],
                            color: phaseColors[trial.phase]
                          }}
                        >
                          {trial.phase}
                        </Badge>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: statusColors[trial.status],
                            color: statusColors[trial.status]
                          }}
                        >
                          {trial.status}
                        </Badge>
                      </div>
                    </div>

                    <div className={styles.trialMeta}>
                      <Text variant="caption" color="secondary">
                        {trial.indication} • {trial.estimatedEnrollment} patients
                      </Text>
                      <Text variant="caption" color="secondary">
                        Completion: {formatDate(trial.primaryCompletion)}
                      </Text>
                    </div>
                  </div>

                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: phaseColors[trial.phase]
                        }}
                      />
                    </div>
                    <Text variant="caption" color="secondary" className={styles.progressText}>
                      {Math.round(progress)}%
                    </Text>
                  </div>

                  <div className={styles.trialDetails}>
                    <div className={styles.sponsors}>
                      <Text variant="caption" color="secondary">Sponsors: </Text>
                      <Text variant="caption" color="primary">
                        {trial.sponsors.join(', ')}
                      </Text>
                    </div>
                    <div className={styles.locations}>
                      <Text variant="caption" color="secondary">Locations: </Text>
                      <Text variant="caption" color="primary">
                        {trial.locations.join(', ')}
                      </Text>
                    </div>
                  </div>
                </div>

                {index < sortedTrials.length - 1 && (
                  <div className={styles.timelineConnector} />
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryStats}>
            <div className={styles.stat}>
              <Text variant="h4" color="primary">{sortedTrials.length}</Text>
              <Text variant="caption" color="secondary">Active Trials</Text>
            </div>
            <div className={styles.stat}>
              <Text variant="h4" color="primary">
                {sortedTrials.filter(t => t.status === 'Recruiting').length}
              </Text>
              <Text variant="caption" color="secondary">Recruiting</Text>
            </div>
            <div className={styles.stat}>
              <Text variant="h4" color="primary">
                {sortedTrials.reduce((sum, t) => sum + t.estimatedEnrollment, 0).toLocaleString()}
              </Text>
              <Text variant="caption" color="secondary">Total Patients</Text>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ClinicalTrialsTimeline;