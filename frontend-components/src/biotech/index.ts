// Biotech-specific components
// Pharmaceutical and drug development focused components

// Molecules - Biotech data display components  
export { BioMetricGrid } from './molecules/BioMetricGrid';
export type { BioMetricGridProps } from './molecules/BioMetricGrid';

export { CatalystTicker } from './molecules/CatalystTicker';
export type { CatalystTickerProps } from './molecules/CatalystTicker';

export { ClinicalTrialsTimeline } from './molecules/ClinicalTrialsTimeline';
export type { ClinicalTrialsTimelineProps, ClinicalTrial } from './molecules/ClinicalTrialsTimeline';

export { BayesianSnapshot } from './molecules/BayesianSnapshot';
export type { BayesianSnapshotProps } from './molecules/BayesianSnapshot';

export { CredenceBadge, CredenceBadgeGroup } from './molecules/CredenceBadge';
export type { CredenceBadgeProps, CredenceBadgeGroupProps, CredenceType } from './molecules/CredenceBadge';

// Organisms - Complex biotech dashboards
export { BioAuroraDashboard } from './organisms/BioAuroraDashboard';

export { BiotechFinancialDashboard } from './organisms/BiotechFinancialDashboard';

// Glass UI Components - October 2025 Concept
export { MolecularGlassGrid } from './organisms/MolecularGlassGrid';
export type { MolecularGlassGridProps } from './organisms/MolecularGlassGrid';

export { ClinicalTrialGlassTimeline } from './organisms/ClinicalTrialGlassTimeline';
export type { 
  ClinicalTrialGlassTimelineProps, 
  TrialPhase, 
  PhaseType 
} from './organisms/ClinicalTrialGlassTimeline';

export { CatalystGlassAlert } from './organisms/CatalystGlassAlert';
export type { 
  CatalystGlassAlertProps, 
  CatalystAlert, 
  AlertPriority, 
  AlertType 
} from './organisms/CatalystGlassAlert';