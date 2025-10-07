import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './ClinicalTrialsTimeline.module.css';
import { Panel } from '../../../terminal/organisms/Panel';
import { Badge } from '../../../terminal/atoms/Badge';
import { Text } from '../../../terminal/atoms/Text';
import { Button } from '../../../terminal/atoms/Button';

export interface ClinicalTrial {
  id: string;
  title: string;
  phase: 'Preclinical' | 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV';
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

const phaseColors: Record<ClinicalTrial['phase'], string> = {
  Preclinical: '#64748b',
  'Phase I': '#f59e0b',
  'Phase II': '#3b82f6',
  'Phase III': '#10b981',
  'Phase IV': '#8b5cf6',
};

const statusColors: Record<ClinicalTrial['status'], string> = {
  Recruiting: '#10b981',
  'Active, not recruiting': '#3b82f6',
  Completed: '#6b7280',
  Terminated: '#ef4444',
  Suspended: '#f59e0b',
};

const phaseOrder: ClinicalTrial['phase'][] = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const calculateProgress = (trial: ClinicalTrial) => {
  let baseProgress = phaseOrder.indexOf(trial.phase);
  if (baseProgress < 0) baseProgress = 0;

  const basePercent = Math.min((baseProgress / (phaseOrder.length - 1)) * 80, 90);

  if (trial.status === 'Completed') return 100;
  if (trial.status === 'Terminated') return Math.max(basePercent - 20, 0);
  if (trial.status === 'Suspended') return Math.max(basePercent - 10, 0);

  const updatedTime = new Date(trial.lastUpdated).getTime();
  const completionTime = new Date(trial.primaryCompletion).getTime();

  if (Number.isNaN(updatedTime) || Number.isNaN(completionTime) || completionTime <= updatedTime) {
    return Math.round(basePercent);
  }

  const elapsed = Date.now() - updatedTime;
  const total = completionTime - updatedTime;
  const timeProgress = Math.min(elapsed / total, 1) * 15;

  return Math.min(Math.round(basePercent + timeProgress), 95);
};

export const ClinicalTrialsTimeline: React.FC<ClinicalTrialsTimelineProps> = ({
  symbol,
  trials = [],
  className,
  onTrialSelect,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'all' | ClinicalTrial['phase']>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ClinicalTrial['status']>('all');

  const availablePhases = useMemo(
    () => Array.from(new Set(trials.map((trial) => trial.phase))).sort((a, b) => phaseOrder.indexOf(a) - phaseOrder.indexOf(b)),
    [trials],
  );

  const availableStatuses = useMemo(() => Array.from(new Set(trials.map((trial) => trial.status))), [trials]);

  const filteredTrials = useMemo(
    () =>
      trials.filter((trial) => {
        const matchesPhase = selectedPhase === 'all' || trial.phase === selectedPhase;
        const matchesStatus = selectedStatus === 'all' || trial.status === selectedStatus;
        return matchesPhase && matchesStatus;
      }),
    [trials, selectedPhase, selectedStatus],
  );

  const sortedTrials = useMemo(
    () =>
      [...filteredTrials].sort((a, b) => {
        const completionDiff = new Date(a.primaryCompletion).getTime() - new Date(b.primaryCompletion).getTime();
        if (completionDiff !== 0) return completionDiff;
        return phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
      }),
    [filteredTrials],
  );

  if (trials.length === 0) {
    return (
      <Panel title={`Clinical Trials Timeline - ${symbol}`} className={clsx(styles.container, className)}>
        <div className={styles.emptyState}>
          <Text variant="body" color="secondary">
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
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Text variant="caption" color="secondary" className={styles.filterLabel}>
              Phase:
            </Text>
            <select value={selectedPhase} onChange={(event) => setSelectedPhase(event.target.value as typeof selectedPhase)} className={styles.filterSelect}>
              <option value="all">All Phases</option>
              {availablePhases.map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <Text variant="caption" color="secondary" className={styles.filterLabel}>
              Status:
            </Text>
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as typeof selectedStatus)} className={styles.filterSelect}>
              <option value="all">All Status</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.timeline}>
          {sortedTrials.map((trial, index) => {
            const progress = calculateProgress(trial);

            return (
              <div
                key={trial.id}
                className={styles.timelineItem}
                onClick={() => {
                  onTrialSelect?.(trial);
                }}
              >
                <div className={styles.timelineMarker}>
                  <div className={styles.phaseIndicator} style={{ backgroundColor: phaseColors[trial.phase] }}>
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
                          variant="default"
                          style={{
                            borderColor: phaseColors[trial.phase],
                            color: phaseColors[trial.phase],
                          }}
                        >
                          {trial.phase}
                        </Badge>
                        <Badge
                          variant="default"
                          style={{
                            borderColor: statusColors[trial.status],
                            color: statusColors[trial.status],
                          }}
                        >
                          {trial.status}
                        </Badge>
                      </div>
                    </div>

                    <div className={styles.trialMeta}>
                      <Text variant="caption" color="secondary">
                        {trial.indication} | {trial.estimatedEnrollment} patients
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
                          backgroundColor: phaseColors[trial.phase],
                        }}
                      />
                    </div>
                    <Text variant="caption" color="secondary" className={styles.progressText}>
                      {progress}%
                    </Text>
                  </div>

                  <div className={styles.trialDetails}>
                    <div className={styles.sponsors}>
                      <Text variant="caption" color="secondary">
                        Sponsors:
                      </Text>
                      <Text variant="caption" color="primary">
                        {trial.sponsors.join(', ')}
                      </Text>
                    </div>
                    <div className={styles.locations}>
                      <Text variant="caption" color="secondary">
                        Locations:
                      </Text>
                      <Text variant="caption" color="primary">
                        {trial.locations.join(', ')}
                      </Text>
                    </div>
                  </div>
                </div>

                {index < sortedTrials.length - 1 && <div className={styles.timelineConnector} />}
              </div>
            );
          })}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryStats}>
            <div className={styles.stat}>
              <Text variant="h4" color="primary">
                {sortedTrials.length}
              </Text>
              <Text variant="caption" color="secondary">
                Active Trials
              </Text>
            </div>

            <div className={styles.stat}>
              <Text variant="h4" color="primary">
                {sortedTrials.filter((trial) => trial.status === 'Recruiting').length}
              </Text>
              <Text variant="caption" color="secondary">
                Recruiting
              </Text>
            </div>

            <div className={styles.stat}>
              <Text variant="h4" color="primary">
                {sortedTrials.reduce((sum, trial) => sum + trial.estimatedEnrollment, 0).toLocaleString()}
              </Text>
              <Text variant="caption" color="secondary">
                Total Patients
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ClinicalTrialsTimeline;
