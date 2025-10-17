import type { Status, Theme } from '.';
/**
 * Biotech Domain Types
 * Comprehensive type definitions for pharmaceutical intelligence and financial modeling
 */
export type RiskLevel = "High" | "Medium" | "Low";
export type ImpactLevel = "High" | "Medium" | "Low";
export type CompanyType = "Big Pharma" | "SMid" | "Biotech" | "China Pharma" | "Academic" | "Unknown";
export type PhaseType = "Preclinical" | "Phase I" | "Phase II" | "Phase III" | "Filed" | "Approved" | "Discontinued";
export type TherapeuticArea = "Oncology" | "Immunology" | "Neurology" | "Rare Disease" | "Cardiovascular" | "Ophthalmology" | "Metabolic" | "SMA" | "GLP-1" | "Other";
export type MarketPosition = "Leader" | "Challenger" | "Follower" | "Niche";
export type MarketConcentration = "High" | "Medium" | "Low";
export type NewsSource = "Fierce Biotech" | "Fierce Pharma" | "BioPharma Dive" | "Endpoints News" | "STAT News" | "BioSpace" | "GEN News" | "FDA News" | "Company PR" | "Bloomberg" | "Reuters" | "Yahoo Finance" | "WSJ" | "Other";
export type NewsCategory = "Clinical" | "Regulatory" | "Commercial" | "Corporate" | "M&A" | "FDA Approval" | "Trial Results" | "Pipeline Update" | "Partnership" | "Financing";
export type MarketCapCategory = "Mega Cap" | "Large Cap" | "Mid Cap" | "Small Cap" | "Micro Cap";
export type NewsImportance = "Critical" | "High" | "Medium" | "Low";
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
export interface Catalyst {
    id: string;
    label: string;
    date: string;
    risk: RiskLevel;
    artStyle?: "ripple" | "spark" | "bar" | "halo";
    description?: string;
    expectedImpact?: ImpactLevel;
    category?: "Clinical" | "Regulatory" | "Commercial" | "Corporate";
    eventLeverage?: number;
    timingClarity?: number;
    surpriseFactor?: number;
    downsideContained?: number;
    marketDepth?: number;
}
export interface PipelineStage {
    name: string;
    progress: number;
    startDate?: string;
    endDate?: string;
    estimatedCost?: number;
}
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
    cites?: {
        docId: string;
        snippet: string;
        relevance?: number;
    }[];
    confidence?: number;
}
export interface AuroraAdapters {
    searchIndications?: (query: string) => Promise<string[]>;
    ragAsk?: (query: string, docIds?: string[]) => Promise<RagAnswer>;
    onOpenDoc?: (docId: string) => void;
    getExclusivity?: (drugName: string) => Promise<{
        drug: string;
        exclusivityUntil?: string;
    } | null>;
    login?: (payload: {
        email: string;
        password: string;
    }) => Promise<void>;
    signup?: (payload: {
        name: string;
        email: string;
        password: string;
    }) => Promise<void>;
    getMarketData?: (indication: string) => Promise<MarketData>;
}
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
export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    date: string;
    source?: NewsSource;
    category?: NewsCategory;
    impact?: ImpactLevel;
    tags?: string[];
    url?: string;
    therapeuticAreas?: TherapeuticArea[];
    companies?: string[];
    tickers?: string[];
    marketCap?: number;
    marketCapCategory?: MarketCapCategory;
    importance?: NewsImportance;
    relevanceScore?: number;
    isTradable?: boolean;
    isPortfolioRelevant?: boolean;
    keywords?: string[];
    publishedAt?: string;
    scrapedAt?: string;
    sourceCount?: number;
    sentiment?: {
        score: number;
        label: 'Positive' | 'Neutral' | 'Negative';
    };
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
    news?: NewsItem[];
    onSelectCatalyst?: (catalyst: Catalyst) => void;
    onSelectPosition?: (position: PortfolioPosition) => void;
    onRefreshNews?: () => void;
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
export type RefreshMode = "manual" | "scheduled" | "live";
export type CatalystType = "readout" | "AdComm" | "PDUFA" | "CHMP" | "EMA-Opinion" | "CRL" | "Approval" | "Other";
export type DateConfidence = "estimated" | "likely" | "confirmed";
export type CatalystStatus = "Upcoming" | "Past" | "Completed";
export type EvidenceClass = "genetic" | "translational" | "clinical" | "safety" | "rwe";
export type TrialPhase = "Preclinical" | "Phase I" | "Phase II" | "Phase III" | "Phase IV";
export type TrialStatus = "Not yet recruiting" | "Recruiting" | "Active" | "Completed" | "Terminated" | "Withdrawn";
export type EndpointType = "primary" | "secondary" | "exploratory";
export type LineOfTherapy = "1L" | "2L" | "3L+" | "Adjuvant" | "Neoadjuvant" | "Maintenance";
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
export interface Company {
    id: string;
    name: string;
    ticker?: string;
    cashRunwayEst?: number;
    disclosures: Citation[];
}
export interface EvidenceCompany {
    name: string;
    ticker?: string;
    stage_mix: string;
    cash_runway_est?: number;
    company_type: CompanyType;
    disclosures: string[];
    market_cap?: number;
    headquarters?: string;
    pipeline_count?: number;
}
export interface Asset {
    id: string;
    companyId: string;
    name: string;
    moa: string;
    targets: string[];
    indications: string[];
    competitorSet: Competitor[];
}
export interface EvidenceDrug {
    id: string;
    name: string;
    moa: string;
    targets: string[];
    indications: string[];
    line_of_therapy?: LineOfTherapy;
    route: string;
    competitor_set: Competitor[];
    sponsor: string;
    phase: PhaseType;
    differentiation_score?: number;
    genetic_evidence_score?: number;
    last_updated: string;
}
export interface Trial {
    id: string;
    nct: string;
    phase: TrialPhase;
    designSummary: string;
    endpoints: {
        primary: TrialEndpoint[];
        secondary: TrialEndpoint[];
    };
    status: TrialStatus;
    readoutWindow?: {
        start: string;
        end: string;
    };
    links: Citation[];
}
export interface Catalyst {
    id: string;
    trialId?: string;
    assetId?: string;
    type: CatalystType;
    dateEst: string;
    dateConfidence: DateConfidence;
    rationale: string;
}
export interface Evidence {
    id: string;
    assetId?: string;
    trialId?: string;
    class: EvidenceClass;
    strength: number;
    summary: string;
    citations: Citation[];
}
export interface EndpointTruth {
    indication: string;
    endpoints: Array<{
        name: string;
        decisionGrade: boolean;
        mcidDescription: string;
        regulatoryPrecedent?: string;
    }>;
}
export interface DifferentiationScore {
    assetId: string;
    total: number;
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
export interface BayesianSnapshot {
    prior: number;
    likelihood: string;
    posterior: {
        win: number;
        meh: number;
        kill: number;
    };
}
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
export interface EvidenceCatalyst {
    id: string;
    type: CatalystType;
    date: string;
    confidence: "High" | "Medium" | "Low";
    source_urls: string[];
    status: CatalystStatus;
    drug_name?: string;
    company?: string;
    indication?: string;
    description?: string;
    impact_score?: number;
    readout_window?: {
        start: string;
        end: string;
    };
    bayesianSnapshot?: BayesianSnapshot;
    trialAudit?: TrialAudit;
}
export interface EvidenceRecord {
    id: string;
    class: EvidenceClass;
    strength_score: number;
    citations: string[];
    summary: string;
    drug_id?: string;
    indication?: string;
    date_published?: string;
    source: string;
    source_url?: string;
    linkage_verified: boolean;
}
export interface EvidenceTrial {
    nct_id: string;
    phase: TrialPhase;
    design: string;
    endpoints: TrialEndpoint[];
    status: TrialStatus;
    arm_schema: string;
    readout_window?: {
        start: string;
        end: string;
    };
    links: string[];
    drug_name: string;
    indication: string;
    sponsor: string;
    enrollment?: number;
    primary_completion_date?: string;
    multiplicity_controlled?: boolean;
    powered?: boolean;
    historical_effect_size?: string;
}
export interface TrialEndpoint {
    name: string;
    type: EndpointType;
    measure: string;
    time_point?: string;
    pre_specified: boolean;
}
export interface MoaData {
    target: string;
    genetic_evidence: {
        source: "Open Targets";
        score: number;
        associations: Array<{
            disease: string;
            score: number;
        }>;
    };
    bench_potency: {
        source: "ChEMBL";
        ic50?: number;
        selectivity?: string;
    };
    biomarker_linkage?: string;
    competitor_heatmap: Array<{
        drug: string;
        company: string;
        phase: string;
        target: string;
    }>;
    differentiation_score: number;
}
export interface CompanyScorecard {
    company: EvidenceCompany;
    evidence_stack: {
        genetic: Evidence[];
        translational: Evidence[];
        clinical: Evidence[];
    };
    cash_runway_months?: number;
    near_catalysts: EvidenceCatalyst[];
    risk_score?: number;
    opportunity_score?: number;
}
export interface JournalEntry {
    id: string;
    user_id?: string;
    title: string;
    content: string;
    evidence_snippets: Array<{
        evidence_id: string;
        snippet: string;
        citation: string;
        permalink: string;
        so_what: string;
    }>;
    created_at: string;
    updated_at: string;
    refresh_timestamp: string;
    tags?: string[];
    pinned?: boolean;
    catalysts?: string[];
}
export interface TodaysEvidence {
    new_trial_events: Array<{
        nct_id: string;
        event: string;
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
        filing_type: string;
        mentions_endpoints: boolean;
        filing_url: string;
        date: string;
    }>;
    last_refresh: string;
}
export interface EvidenceDiff {
    added: Array<{
        type: string;
        item: any;
    }>;
    changed: Array<{
        type: string;
        before: any;
        after: any;
    }>;
    removed: Array<{
        type: string;
        item: any;
    }>;
}
export interface EvidenceJournalData {
    companies: Company[];
    assets: Asset[];
    trials: Trial[];
    catalysts: Catalyst[];
    evidence: Evidence[];
    endpointTruth: EndpointTruth[];
    differentiationScores?: DifferentiationScore[];
}
export type DiseaseAreaType = "DMD" | "nSCLC" | "T2D" | "COVID19" | "SCD" | "Rare Disease" | "Chronic Disease" | "Infectious Disease" | "Other";
export type EpidemiologicModelType = "Survival" | "Hazard" | "Incidence" | "Prevalence" | "Mortality" | "Progression";
export type GeographicRegion = "North America" | "Europe" | "Asia Pacific" | "Latin America" | "Middle East & Africa" | "Global";
export type CohortStratification = "Age" | "Gender" | "Ethnicity" | "Severity" | "Stage" | "Treatment History" | "Biomarker" | "Geographic";
export type InterventionType = "Treatment" | "Prevention" | "Screening" | "Policy" | "Behavioral" | "Combination";
export interface DiseaseModel {
    id: string;
    name: string;
    diseaseArea: DiseaseAreaType;
    description: string;
    prevalence: number;
    incidence: number;
    mortality: number;
    targetPopulation: number;
    averageAge: number;
    genderRatio?: number;
    geographicDistribution?: Record<GeographicRegion, number>;
    lastUpdated: string;
}
export interface SurvivalData {
    time: number;
    survival: number;
    atRisk: number;
    events: number;
    censored: number;
    ci_lower?: number;
    ci_upper?: number;
}
export interface SurvivalCurve {
    id: string;
    label: string;
    cohort: string;
    data: SurvivalData[];
    medianSurvival: number;
    hazardRatio?: number;
    pValue?: number;
    color?: string;
}
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
export interface EpidemiologyMetric {
    year: number;
    value: number;
    region: GeographicRegion;
    ageGroup?: string;
    gender?: "Male" | "Female" | "All";
    ci_lower?: number;
    ci_upper?: number;
}
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
export interface TreatmentPattern {
    id: string;
    name: string;
    lineOfTherapy: number;
    percentage: number;
    duration: number;
    cost: number;
    effectiveness: number;
}
export interface TreatmentPatternEvolution {
    year: number;
    patterns: TreatmentPattern[];
}
export interface InterventionScenario {
    id: string;
    name: string;
    type: InterventionType;
    description: string;
    targetPopulation: number;
    penetrationRate: number;
    effectiveness: number;
    costPerPatient: number;
    implementationYear: number;
    duration: number;
}
export interface InterventionOutcome {
    scenario: InterventionScenario;
    casesAvoided: number;
    deathsAvoided: number;
    qualityAdjustedLifeYears: number;
    totalCost: number;
    costEffectiveness: number;
    returnOnInvestment: number;
}
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
    disabilityAdjustedLifeYears: number;
    healthcareCost: number;
    productivityLoss: number;
    totalBurden: number;
}
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
export interface EpidemiologySimulationParams {
    diseaseModel: DiseaseModel;
    timeHorizon: number;
    discountRate: number;
    populationGrowth: number;
    baselineScenario: boolean;
    interventions: InterventionScenario[];
    stratifications: CohortStratification[];
}
export interface EpidemiologySimulationResult {
    params: EpidemiologySimulationParams;
    timeSeries: PopulationHealthImpact[];
    interventionOutcomes: InterventionOutcome[];
    costEffectiveness: {
        icer: number;
        inb: number;
        probabilityCostEffective: number;
    };
}
export type ContextChannel = "A" | "B" | "C" | "NONE";
export interface ContextGroup {
    channel: ContextChannel;
    activeEntity: ContextEntity | null;
    subscribers: string[];
}
export interface ContextEntity {
    type: "disease" | "company" | "trial" | "drug" | "catalyst" | "therapeutic";
    id: string;
    name: string;
    metadata?: Record<string, any>;
}
export interface FunctionCode {
    code: string;
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
    type: string;
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
export interface AppModule {
    id: string;
    name: string;
    description: string;
    category: "news" | "science" | "catalysts" | "trials" | "companies" | "analytics" | "data" | "tools" | "regulatory";
    icon: string;
    path: string;
    functionCode?: string;
    requiresEntitlement?: string[];
    favorited?: boolean;
    recentlyUsed?: boolean;
    lastUsedAt?: string;
}
export type UserRole = "admin" | "analyst" | "viewer" | "guest";
export type FeatureEntitlement = "data_export" | "manual_refresh" | "layout_management" | "admin_tools" | "premium_data" | "api_access" | "audit_log_view" | "user_management";
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
export type Phase = 'Preclinical' | 'Phase I' | 'Phase II' | 'Phase III' | 'Filed' | 'Approved';
export interface Program {
    id: string;
    companyId: string;
    assetName: string;
    modality: 'ASO' | 'RNAi' | 'mAb' | 'SmallMol' | 'CellTherapy' | string;
    target: string;
    therapeuticArea: string;
    indication: string;
    phase: Phase;
    nextMilestone?: {
        date: string;
        type: 'Data' | 'Filing' | 'AdCom' | 'Approval';
        confidence: 0 | 1 | 2;
    };
    partner?: {
        name: string;
        stage: string;
        royalty?: string;
        milestones?: string;
    };
    peakSalesBase?: number;
    posBase?: number;
    posAdj?: number;
    rnPV?: number;
    sources?: Array<{
        label: string;
        url: string;
        asOf: string;
    }>;
}
export interface SavedView {
    id: string;
    name: string;
    filters: Record<string, string[]>;
    sort?: {
        field: 'rnPV' | 'phase' | 'peakSalesBase';
        dir: 'asc' | 'desc';
    };
    openNodes?: string[];
    layout?: 'pmMode' | 'dragGrid';
    hash?: string;
}
export interface PMHeaderMetrics {
    ticker: string;
    price: number;
    priceChange: number;
    enterpriseValue: number;
    marketCap: number;
    netCash: number;
    cashRunwayMonths: number;
    programCount: number;
    programsOwnedPercent: number;
    avgDailyVolume3M: number;
    shortInterest?: number;
    topRnpvDrivers: Array<{
        name: string;
        value: number;
    }>;
    nextCatalysts: Array<{
        date: string;
        event: string;
        program: string;
    }>;
}
export interface RnpvLadderItem {
    id: string;
    name: string;
    rnpv: number;
    phase: Phase;
    isPartnered: boolean;
    therapeuticArea: string;
}
export interface CatalystTimelineEvent {
    id: string;
    date: string;
    program: string;
    eventType: 'Data' | 'Filing' | 'AdCom' | 'PDUFA' | 'Other';
    importance: number;
    description: string;
    phase: Phase;
    therapeuticArea: string;
    proximity?: number;
    evDelta?: number;
}
//# sourceMappingURL=biotech.d.ts.map