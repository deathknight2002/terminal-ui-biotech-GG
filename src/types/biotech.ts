import type { Status, Theme } from '.';

/**
 * Biotech Domain Types
 * Comprehensive type definitions for pharmaceutical intelligence and financial modeling
 */

// Core Drug Development Types
export type RiskLevel = "High" | "Medium" | "Low";
export type ImpactLevel = "High" | "Medium" | "Low";
export type CompanyType = "Big Pharma" | "SMid" | "Biotech" | "China Pharma" | "Academic" | "Unknown";
export type PhaseType = "Preclinical" | "Phase I" | "Phase II" | "Phase III" | "Filed" | "Approved" | "Discontinued";
export type TherapeuticArea = "Oncology" | "Immunology" | "Neurology" | "Rare Disease" | "Cardiovascular" | "Ophthalmology" | "Other";
export type MarketPosition = "Leader" | "Challenger" | "Follower" | "Niche";
export type MarketConcentration = "High" | "Medium" | "Low";

// Financial Modeling Types
export interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: string;
  stage: PipelineStage;
  indication: string;
  modality: string;
  mechanism: string;
  sponsor: string;
  targetMarket: string;
  riskProfile: string;
  marketCap: number;
  lastUpdated: string;
  pricing_us: number;
  pricing_eur: number;
  pricing_row: number;
}

export interface PatientScheduleEntry {
  year: number;
  us_patients: number;
  eur_patients: number;
  row_patients: number;
}

export interface DevelopmentMilestone {
  id: string;
  amount: number;
  achievement_year: number;
  description?: string;
}

export interface SalesMilestone {
  id: string;
  sales_exceeding: number;
  amount: number;
  description?: string;
}

export interface RoyaltyTier {
  min: number;
  max: number;
  rate: number;
}

export interface GlobalParameters {
  sales_margin: number;
  tax_rate: number;
  discount_rate: number;
}

// Catalyst and Timeline Types
export interface Catalyst {
  id: string;
  label: string;
  date: string;
  risk: RiskLevel;
  artStyle?: "ripple" | "spark" | "bar" | "halo";
  description?: string;
  expectedImpact?: ImpactLevel;
  category?: "Clinical" | "Regulatory" | "Commercial" | "Corporate";
}

export interface PipelineStage {
  name: string;
  progress: number; // 0-1
  startDate?: string;
  endDate?: string;
  estimatedCost?: number;
}

// Company and Competitive Intelligence
export interface Sponsor {
  name: string;
  type: CompanyType;
  exclusivityUntil?: string;
  marketCap?: number;
  headquarters?: string;
}

export interface Competitor {
  name: string;
  mechanism: string;
  company: string;
  phase: string;
  nextMilestone: string;
  marketPosition?: MarketPosition;
}

// Drug and Indication Intelligence
export interface Indication {
  id: string;
  name: string;
  area: TherapeuticArea;
  summary: string;
  competitors: string[] | Competitor[];
  tags: string[];
  catalysts: Catalyst[];
  pipeline: PipelineStage[];
  refs?: string[];
  sponsors?: Sponsor[];
  marketSize?: number;
  prevalence?: number;
  unmetNeed?: ImpactLevel;
  competitiveIntensity?: ImpactLevel;
}

// Research and Documentation
export interface LauraDoc {
  id: string;
  title: string;
  url?: string;
  pages?: number;
  date?: string;
  highlights?: string[];
  category?: "Clinical" | "Regulatory" | "Patent" | "Financial" | "Research";
  relevanceScore?: number;
}

export interface RagAnswer {
  answer: string;
  cites?: { docId: string; snippet: string; relevance?: number }[];
  confidence?: number;
}

// Aurora Adapters Interface
export interface AuroraAdapters {
  searchIndications?: (query: string) => Promise<string[]>;
  ragAsk?: (query: string, docIds?: string[]) => Promise<RagAnswer>;
  onOpenDoc?: (docId: string) => void;
  getExclusivity?: (drugName: string) => Promise<{ drug: string; exclusivityUntil?: string } | null>;
  login?: (payload: { email: string; password: string }) => Promise<void>;
  signup?: (payload: { name: string; email: string; password: string }) => Promise<void>;
  getMarketData?: (indication: string) => Promise<MarketData>;
}

// Market and Financial Data
export interface MarketData {
  marketSize: number;
  growthRate: number;
  segments: MarketSegment[];
  competitiveLandscape: CompetitiveLandscape;
}

export interface MarketSegment {
  name: string;
  size: number;
  growthRate: number;
  keyPlayers: string[];
}

export interface CompetitiveLandscape {
  leaders: string[];
  challengers: string[];
  followers: string[];
  marketConcentration: MarketConcentration;
}

// Financial Calculation Results
export interface FinancialProjection {
  assetId: string;
  npv: number;
  irr: number;
  peakSales: number;
  timeToMarket: number;
  probability: number;
  scenario: string;
  assumptions: {
    discountRate: number;
    patentLife: number;
    marketPenetration: number;
    pricingPower: number;
  };
  milestones: {
    id: string;
    name: string;
    date: string;
    probability: number;
    value: number;
    type: string;
  }[];
  royaltyTiers: {
    min: number;
    max: number;
    rate: number;
  }[];
  patientProjections: {
    year: number;
    patients: number;
    revenue: number;
  }[];
}

export interface CashFlowAnalysis {
  projections: FinancialProjection[];
  totalNPV: number;
  breakEvenYear?: number;
  peakRevenue: number;
  cumulativeRevenue: number;
}

// UI Component Props
export interface MetricCardProps {
  title?: string;
  label?: string;
  value: string | number;
  change?: number;
  variant?: "primary" | "secondary" | "accent" | "currency" | "percentage" | "default" | "revenue" | "expense" | "milestone" | "royalty";
  trend?: "up" | "down" | "neutral" | "flat";
  subtitle?: string;
  className?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export interface CatalystChipProps {
  catalyst: Catalyst;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onClick?: (catalyst: Catalyst) => void;
}

export interface PipelineVisualizationProps {
  stages: PipelineStage[];
  currentStage?: string;
  interactive?: boolean;
  onStageClick?: (stage: PipelineStage) => void;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
  [key: string]: any;
}

export interface TimeSeriesDataPoint {
  year: number | string;
  [metric: string]: number | string;
}

// Search and Filter Types
export interface SearchFilters {
  therapeuticAreas?: TherapeuticArea[];
  riskLevels?: RiskLevel[];
  phases?: PhaseType[];
  companies?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  summary: string;
  relevanceScore: number;
  category: "Indication" | "Company" | "Drug" | "Document";
  metadata?: Record<string, any>;
}

// Event and Analytics Types
export interface UserEvent {
  type: "search" | "view" | "export" | "filter" | "navigate";
  timestamp: string;
  data: Record<string, any>;
  userId?: string;
}

export interface AnalyticsData {
  pageViews: number;
  uniqueUsers: number;
  searchQueries: string[];
  popularContent: string[];
  userEngagement: {
    avgSessionDuration: number;
    bounceRate: number;
    returnUsers: number;
  };
}

// Portfolio Intelligence Structures
export interface PortfolioPosition {
  id: string;
  ticker: string;
  company: string;
  weight: number;
  pnl: number;
  catalystDate?: string;
  thesis?: string;
  risk: RiskLevel;
  region?: string;
}

export interface ExposureSlice {
  id: string;
  label: string;
  weight: number;
  performance?: number;
  color?: string;
}

export interface BioAuroraMetric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'primary' | 'secondary' | 'accent';
  supportText?: string;
}

export interface BioAuroraDashboardProps {
  theme?: 'aurora-red' | Theme;
  headline?: {
    fundName: string;
    strategy: string;
    status: Status;
    lastUpdated: string;
    nav: number;
    navChange: number;
    navChangePercent: number;
  };
  metrics?: BioAuroraMetric[];
  catalysts?: Catalyst[];
  positions?: PortfolioPosition[];
  exposures?: ExposureSlice[];
  pipeline?: PipelineStage[];
  documents?: LauraDoc[];
  analytics?: AnalyticsData;
  onSelectCatalyst?: (catalyst: Catalyst) => void;
  onSelectPosition?: (position: PortfolioPosition) => void;
}

export interface BiotechFinancialDashboardProps {
  asset: Asset;
  projection: FinancialProjection;
  className?: string;
}

export interface AuroraBackdropProps {
  intensity?: "low" | "medium" | "high";
  showParticles?: boolean;
  className?: string;
}

export interface PanelProps {
  title?: string;
  variant?: "default" | "glass" | "transparent";
  className?: string;
  children: React.ReactNode;
}

export type TextColor = "primary" | "secondary" | "muted" | "success" | "error" | "warning";

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Evidence Journal Types (for science-first biotech intelligence)
export type RefreshMode = "manual" | "scheduled" | "live";
export type CatalystType = "readout" | "AdComm" | "PDUFA" | "CHMP" | "EMA-Opinion" | "CRL" | "Approval" | "Other";
export type DateConfidence = "estimated" | "likely" | "confirmed";
export type CatalystStatus = "Upcoming" | "Past" | "Completed";
export type EvidenceClass = "genetic" | "translational" | "clinical" | "safety" | "rwe";
export type TrialPhase = "Preclinical" | "Phase I" | "Phase II" | "Phase III" | "Phase IV";
export type TrialStatus = "Not yet recruiting" | "Recruiting" | "Active" | "Completed" | "Terminated" | "Withdrawn";
export type EndpointType = "primary" | "secondary" | "exploratory";
export type LineOfTherapy = "1L" | "2L" | "3L+" | "Adjuvant" | "Neoadjuvant" | "Maintenance";

// Provenance - mandatory for all data
export interface Citation {
  url: string;
  domain: string;
  pulledAt: string;
  verifiedAt?: string;
}

export interface Provenance {
  source: {
    url: string;
    domain: string;
    pulledAt: string;
  };
  verifiedAt?: string;
}

// Company - exact fields per problem statement
export interface Company {
  id: string;
  name: string;
  ticker?: string;
  cashRunwayEst?: number; // months
  disclosures: Citation[];
}

// Evidence Journal Company (expanded from existing Sponsor)
export interface EvidenceCompany {
  name: string;
  ticker?: string;
  stage_mix: string; // e.g., "Phase II/III focused"
  cash_runway_est?: number; // months
  company_type: CompanyType;
  disclosures: string[]; // Links to 8-K filings, press releases
  market_cap?: number;
  headquarters?: string;
  pipeline_count?: number;
}

// Asset (Drug/Program) - exact fields per problem statement
export interface Asset {
  id: string;
  companyId: string;
  name: string;
  moa: string; // Mechanism of Action
  targets: string[];
  indications: string[];
  competitorSet: Competitor[];
}

// Evidence Journal Asset/Drug (enhanced version of existing Drug)
export interface EvidenceDrug {
  id: string;
  name: string;
  moa: string; // Mechanism of Action
  targets: string[]; // e.g., ["IL-23", "TL1A"]
  indications: string[];
  line_of_therapy?: LineOfTherapy;
  route: string; // e.g., "SC", "IV", "Oral"
  competitor_set: Competitor[];
  sponsor: string;
  phase: PhaseType;
  differentiation_score?: number; // 0-100
  genetic_evidence_score?: number; // from Open Targets
  last_updated: string;
}

// Trial - exact fields per problem statement
export interface Trial {
  id: string;
  nct: string; // NCT number
  phase: TrialPhase;
  designSummary: string;
  endpoints: {
    primary: TrialEndpoint[];
    secondary: TrialEndpoint[];
  };
  status: TrialStatus;
  readoutWindow?: { start: string; end: string };
  links: Citation[];
}

// Catalyst - exact fields per problem statement
export interface Catalyst {
  id: string;
  trialId?: string;
  assetId?: string;
  type: CatalystType;
  dateEst: string;
  dateConfidence: DateConfidence;
  rationale: string;
}

// Evidence - exact fields per problem statement with provenance
export interface Evidence {
  id: string;
  assetId?: string;
  trialId?: string;
  class: EvidenceClass;
  strength: number; // 0-1
  summary: string;
  citations: Citation[];
}

// EndpointTruth (by indication)
export interface EndpointTruth {
  indication: string;
  endpoints: Array<{
    name: string;
    decisionGrade: boolean;
    mcidDescription: string;
    regulatoryPrecedent?: string;
  }>;
}

// DifferentiationScore
export interface DifferentiationScore {
  assetId: string;
  total: number; // 0-100
  subscores: {
    genetic: number;
    mechanistic: number;
    translational: number;
    clinical: number;
    comp: number;
    execution: number;
  };
  rationale: string[];
}

// Bayesian snapshot for catalysts
export interface BayesianSnapshot {
  prior: number; // class/base rate
  likelihood: string; // design/power/multiplicity description
  posterior: {
    win: number;
    meh: number;
    kill: number;
  };
}

// Trial Audit
export type AuditColor = "green" | "yellow" | "red";

export interface TrialAudit {
  randomization: boolean;
  blinded: boolean;
  controlQuality: AuditColor;
  ittVsPp: "ITT" | "PP" | "Both";
  alphaSpending: boolean;
  missingDataPlan: boolean;
  overallColor: AuditColor;
}

// Evidence Journal Catalyst (enhanced from existing Catalyst)
export interface EvidenceCatalyst {
  id: string;
  type: CatalystType;
  date: string;
  confidence: "High" | "Medium" | "Low"; // confidence in date/outcome
  source_urls: string[]; // FDA, CT.gov, EMA, etc.
  status: CatalystStatus;
  drug_name?: string;
  company?: string;
  indication?: string;
  description?: string;
  impact_score?: number; // Readout credibility × Market relevance × Competitive density
  readout_window?: { start: string; end: string }; // uncertainty window
  bayesianSnapshot?: BayesianSnapshot;
  trialAudit?: TrialAudit;
}

// Evidence Record (legacy, keeping for backward compatibility)
export interface EvidenceRecord {
  id: string;
  class: EvidenceClass;
  strength_score: number; // 0-100, weighted by class
  citations: string[]; // PubMed IDs, DOIs, etc.
  summary: string;
  drug_id?: string;
  indication?: string;
  date_published?: string;
  source: string; // "Open Targets", "PubMed", "ClinicalTrials.gov"
  source_url?: string;
  linkage_verified: boolean; // Flag if no matching PubMed link to NCT
}

// Clinical Trial (expanded for Evidence Journal)
export interface EvidenceTrial {
  nct_id: string; // NCT number
  phase: TrialPhase;
  design: string; // e.g., "Randomized, Double-blind, Placebo-controlled"
  endpoints: TrialEndpoint[];
  status: TrialStatus;
  arm_schema: string; // e.g., "2:1 randomization"
  readout_window?: { start: string; end: string };
  links: string[]; // ClinicalTrials.gov, publications
  drug_name: string;
  indication: string;
  sponsor: string;
  enrollment?: number;
  primary_completion_date?: string;
  multiplicity_controlled?: boolean; // for credibility
  powered?: boolean; // adequate statistical power
  historical_effect_size?: string; // precedent data
}

export interface TrialEndpoint {
  name: string;
  type: EndpointType;
  measure: string; // e.g., "OS", "PFS", "ORR", "MMS", "CDAI"
  time_point?: string;
  pre_specified: boolean; // vs post-hoc
}

// MoA (Mechanism of Action) Data
export interface MoaData {
  target: string; // e.g., "IL-23"
  genetic_evidence: {
    source: "Open Targets";
    score: number; // 0-1
    associations: Array<{ disease: string; score: number }>;
  };
  bench_potency: {
    source: "ChEMBL";
    ic50?: number; // nM
    selectivity?: string;
  };
  biomarker_linkage?: string;
  competitor_heatmap: Array<{
    drug: string;
    company: string;
    phase: string;
    target: string;
  }>;
  differentiation_score: number; // f(genetic_prior, selectivity, PoC markers, class precedents)
}

// Company Scorecard
export interface CompanyScorecard {
  company: EvidenceCompany;
  evidence_stack: {
    genetic: Evidence[];
    translational: Evidence[];
    clinical: Evidence[];
  };
  cash_runway_months?: number;
  near_catalysts: EvidenceCatalyst[]; // next 90 days
  risk_score?: number;
  opportunity_score?: number;
}

// Journal Entry (the notebook feature)
export interface JournalEntry {
  id: string;
  user_id?: string;
  title: string;
  content: string; // user's note
  evidence_snippets: Array<{
    evidence_id: string;
    snippet: string;
    citation: string;
    permalink: string; // deep link to source
    so_what: string; // user's one-sentence "Why it matters?"
  }>;
  created_at: string;
  updated_at: string;
  refresh_timestamp: string; // when evidence was fetched
  tags?: string[];
  pinned?: boolean;
  catalysts?: string[]; // catalyst IDs on watchlist
}

// Today's Evidence update
export interface TodaysEvidence {
  new_trial_events: Array<{
    nct_id: string;
    event: string; // "Status changed to Recruiting"
    date: string;
    drug: string;
  }>;
  label_guidance_changes: Array<{
    drug: string;
    change: string;
    source_url: string;
    date: string;
  }>;
  adcomm_docket_changes: Array<{
    drug: string;
    meeting_date: string;
    source_url: string;
  }>;
  new_8k_filings: Array<{
    company: string;
    filing_type: string; // "8-K"
    mentions_endpoints: boolean;
    filing_url: string;
    date: string;
  }>;
  last_refresh: string;
}

// Diff Preview (for scheduled/live modes)
export interface EvidenceDiff {
  added: Array<{ type: string; item: any }>;
  changed: Array<{ type: string; before: any; after: any }>;
  removed: Array<{ type: string; item: any }>;
}

// Evidence Journal Aggregator Response
export interface EvidenceJournalData {
  companies: Company[];
  assets: Asset[];
  trials: Trial[];
  catalysts: Catalyst[];
  evidence: Evidence[];
  endpointTruth: EndpointTruth[];
  differentiationScores?: DifferentiationScore[];
}

// Epidemiology Types
export type DiseaseAreaType = 
  | "DMD" // Duchenne Muscular Dystrophy
  | "nSCLC" // Non-Small Cell Lung Cancer
  | "T2D" // Type 2 Diabetes
  | "COVID19" // COVID-19
  | "SCD" // Sickle Cell Disease
  | "Rare Disease"
  | "Chronic Disease"
  | "Infectious Disease"
  | "Other";

export type EpidemiologicModelType = 
  | "Survival"
  | "Hazard"
  | "Incidence"
  | "Prevalence"
  | "Mortality"
  | "Progression";

export type GeographicRegion = 
  | "North America"
  | "Europe"
  | "Asia Pacific"
  | "Latin America"
  | "Middle East & Africa"
  | "Global";

export type CohortStratification = 
  | "Age"
  | "Gender"
  | "Ethnicity"
  | "Severity"
  | "Stage"
  | "Treatment History"
  | "Biomarker"
  | "Geographic";

export type InterventionType = 
  | "Treatment"
  | "Prevention"
  | "Screening"
  | "Policy"
  | "Behavioral"
  | "Combination";

// Disease Model Interfaces
export interface DiseaseModel {
  id: string;
  name: string;
  diseaseArea: DiseaseAreaType;
  description: string;
  prevalence: number; // per 100,000 population
  incidence: number; // per 100,000 population per year
  mortality: number; // annual mortality rate
  targetPopulation: number; // total addressable population
  averageAge: number;
  genderRatio?: number; // male-to-female ratio
  geographicDistribution?: Record<GeographicRegion, number>;
  lastUpdated: string;
}

// Survival Analysis Types
export interface SurvivalData {
  time: number; // time in months or years
  survival: number; // survival probability (0-1)
  atRisk: number; // number at risk
  events: number; // number of events (deaths/progressions)
  censored: number; // number censored
  ci_lower?: number; // confidence interval lower bound
  ci_upper?: number; // confidence interval upper bound
}

export interface SurvivalCurve {
  id: string;
  label: string;
  cohort: string;
  data: SurvivalData[];
  medianSurvival: number; // in months/years
  hazardRatio?: number;
  pValue?: number;
  color?: string;
}

// Hazard Ratio Types
export interface HazardRatioData {
  intervention: string;
  control: string;
  hazardRatio: number;
  ci_lower: number;
  ci_upper: number;
  pValue: number;
  events_intervention: number;
  events_control: number;
  n_intervention: number;
  n_control: number;
}

// Incidence and Prevalence Types
export interface EpidemiologyMetric {
  year: number;
  value: number;
  region: GeographicRegion;
  ageGroup?: string;
  gender?: "Male" | "Female" | "All";
  ci_lower?: number;
  ci_upper?: number;
}

// Cohort Stratification Types
export interface CohortData {
  id: string;
  stratification: CohortStratification;
  category: string;
  population: number;
  percentage: number;
  prevalence?: number;
  incidence?: number;
  mortality?: number;
}

// Geospatial Disease Data
export interface GeospatialDiseaseData {
  region: GeographicRegion;
  country: string;
  prevalence: number;
  incidence: number;
  mortality: number;
  population: number;
  cases: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Treatment Pattern Types
export interface TreatmentPattern {
  id: string;
  name: string;
  lineOfTherapy: number;
  percentage: number; // percentage of patients receiving this treatment
  duration: number; // average duration in months
  cost: number; // average annual cost
  effectiveness: number; // relative effectiveness (0-1)
}

export interface TreatmentPatternEvolution {
  year: number;
  patterns: TreatmentPattern[];
}

// Intervention Scenario Types
export interface InterventionScenario {
  id: string;
  name: string;
  type: InterventionType;
  description: string;
  targetPopulation: number;
  penetrationRate: number; // 0-1
  effectiveness: number; // relative risk reduction (0-1)
  costPerPatient: number;
  implementationYear: number;
  duration: number; // years
}

export interface InterventionOutcome {
  scenario: InterventionScenario;
  casesAvoided: number;
  deathsAvoided: number;
  qualityAdjustedLifeYears: number; // QALYs gained
  totalCost: number;
  costEffectiveness: number; // cost per QALY
  returnOnInvestment: number;
}

// Population Health Impact Types
export interface PopulationHealthMetric {
  metric: string;
  baseline: number;
  projected: number;
  change: number;
  changePercent: number;
  unit: string;
}

export interface PopulationHealthImpact {
  year: number;
  population: number;
  cases: number;
  deaths: number;
  disabilityAdjustedLifeYears: number; // DALYs
  healthcareCost: number;
  productivityLoss: number;
  totalBurden: number;
}

// Policy Outcome Types
export interface PolicyOutcome {
  id: string;
  policyName: string;
  targetDisease: DiseaseAreaType;
  implementationDate: string;
  outcomes: {
    year: number;
    metrics: PopulationHealthMetric[];
  }[];
  budgetImpact: number;
  costSavings: number;
  netBenefit: number;
}

// Cross-Disease Burden Comparison
export interface DiseaseBurden {
  disease: DiseaseAreaType;
  diseaseName: string;
  prevalence: number;
  incidence: number;
  mortality: number;
  disabilityAdjustedLifeYears: number;
  healthcareCost: number;
  totalBurden: number;
  rank?: number;
}

// Simulation Parameters
export interface EpidemiologySimulationParams {
  diseaseModel: DiseaseModel;
  timeHorizon: number; // years
  discountRate: number; // for costs and benefits
  populationGrowth: number; // annual growth rate
  baselineScenario: boolean;
  interventions: InterventionScenario[];
  stratifications: CohortStratification[];
}

export interface EpidemiologySimulationResult {
  params: EpidemiologySimulationParams;
  timeSeries: PopulationHealthImpact[];
  interventionOutcomes: InterventionOutcome[];
  costEffectiveness: {
    icer: number; // Incremental Cost-Effectiveness Ratio
    inb: number; // Incremental Net Benefit
    probabilityCostEffective: number;
  };
}

// Terminal-Grade Features (Bloomberg/FactSet/LSEG patterns)

// Context Groups - Linked Workspaces (Bloomberg Launchpad pattern)
export type ContextChannel = "A" | "B" | "C" | "NONE";

export interface ContextGroup {
  channel: ContextChannel;
  activeEntity: ContextEntity | null;
  subscribers: string[]; // Panel IDs subscribed to this channel
}

export interface ContextEntity {
  type: "disease" | "company" | "trial" | "drug" | "catalyst" | "therapeutic";
  id: string;
  name: string;
  metadata?: Record<string, any>;
}

// Command Palette - Function Codes (Bloomberg command line pattern)
export interface FunctionCode {
  code: string; // e.g., "CO", "DI", "TR", "CA"
  label: string;
  description: string;
  path: string;
  keywords?: string[];
  shortcut?: string;
  category: "navigation" | "action" | "data" | "tool";
}

export interface CommandPaletteItem {
  id: string;
  type: "function" | "entity" | "action" | "recent";
  label: string;
  subtitle?: string;
  icon?: string;
  action: () => void;
  keywords?: string[];
  metadata?: Record<string, any>;
}

// Layout Manager - Saved Layouts (Launchpad/Workspace pattern)
export interface WorkspaceLayout {
  id: string;
  name: string;
  description?: string;
  category: "starter" | "custom" | "shared";
  panels: PanelConfig[];
  contextGroups?: Record<ContextChannel, ContextGroup>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  shareToken?: string;
  thumbnail?: string;
}

export interface PanelConfig {
  id: string;
  type: string; // "news", "calendar", "trials", "spiderweb", etc.
  position: PanelPosition;
  size: PanelSize;
  contextChannel?: ContextChannel;
  settings?: Record<string, any>;
  minimized?: boolean;
}

export interface PanelPosition {
  x: number;
  y: number;
  col?: number;
  row?: number;
}

export interface PanelSize {
  width: number | string;
  height: number | string;
  cols?: number;
  rows?: number;
}

// App Library - Launchable Modules
export interface AppModule {
  id: string;
  name: string;
  description: string;
  category: "news" | "science" | "catalysts" | "trials" | "companies" | "analytics" | "data" | "tools";
  icon: string;
  path: string;
  functionCode?: string;
  requiresEntitlement?: string[];
  favorited?: boolean;
  recentlyUsed?: boolean;
  lastUsedAt?: string;
}

// Entitlements & Roles - Permission System (FactSet/LSEG pattern)
export type UserRole = "admin" | "analyst" | "viewer" | "guest";
export type FeatureEntitlement = 
  | "data_export"
  | "manual_refresh"
  | "layout_management"
  | "admin_tools"
  | "premium_data"
  | "api_access"
  | "audit_log_view"
  | "user_management";

export interface UserPermissions {
  userId: string;
  role: UserRole;
  entitlements: FeatureEntitlement[];
  customPermissions?: Record<string, boolean>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName?: string;
  action: "ingest" | "export" | "view" | "edit" | "delete" | "share";
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure" | "warning";
  details?: string;
}

// Data Freshness & Diff System
export interface DataFreshness {
  source: string;
  lastRefreshed: string;
  recordCount: number;
  status: "fresh" | "stale" | "error";
  nextRefreshAvailable?: string;
}

export interface DataDiff {
  source: string;
  lastCheck: string;
  changes: {
    added: number;
    updated: number;
    deleted: number;
  };
  highlights: DiffHighlight[];
}

export interface DiffHighlight {
  type: "new" | "updated" | "deleted";
  entity: string;
  summary: string;
  timestamp: string;
}

// Office Exports
export type ExportFormat = "csv" | "excel" | "powerpoint" | "pdf" | "json";

export interface ExportConfig {
  format: ExportFormat;
  filename?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}

export interface ExportResult {
  id: string;
  filename: string;
  format: ExportFormat;
  size: number;
  downloadUrl: string;
  expiresAt: string;
  createdAt: string;
  status: "ready" | "processing" | "failed";
}

// UI Density & Accessibility
export type UIDensity = "compact" | "comfortable" | "spacious";
export type CVDMode = "normal" | "deuteranopia" | "protanomaly" | "tritanopia";

export interface UIPreferences {
  theme: Theme;
  density: UIDensity;
  cvdMode: CVDMode;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  fontSize: "small" | "medium" | "large";
}
