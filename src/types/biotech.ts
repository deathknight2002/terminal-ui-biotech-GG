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
