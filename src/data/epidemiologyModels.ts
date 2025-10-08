import type {
  DiseaseModel,
  SurvivalCurve,
  SurvivalData,
  TreatmentPattern,
  CohortData,
  GeospatialDiseaseData,
} from '../types/biotech';

/**
 * Disease-Specific Epidemiologic Models
 * 
 * This file contains comprehensive epidemiologic data for:
 * 1. Duchenne Muscular Dystrophy (DMD) - Rare Disease
 * 2. Non-Small Cell Lung Cancer (nSCLC) - Oncology
 * 3. Type 2 Diabetes (T2D) - Chronic Disease
 * 4. COVID-19 - Infectious Disease
 * 5. Sickle Cell Disease (SCD) - Rare Disease
 */

// ============================================================================
// 1. DUCHENNE MUSCULAR DYSTROPHY (DMD) MODEL
// ============================================================================

export const DMD_MODEL: DiseaseModel = {
  id: 'dmd-001',
  name: 'Duchenne Muscular Dystrophy',
  diseaseArea: 'DMD',
  description: 'Progressive muscle-wasting disease caused by mutations in the dystrophin gene. Affects primarily males with onset in early childhood.',
  prevalence: 1.5, // per 100,000 (rare disease)
  incidence: 0.05, // per 100,000 per year
  mortality: 0.03, // 3% annual mortality in affected population
  targetPopulation: 15000, // ~15,000 patients in US
  averageAge: 12, // Average age at diagnosis
  genderRatio: 100, // Almost exclusively male
  geographicDistribution: {
    'North America': 0.25,
    'Europe': 0.30,
    'Asia Pacific': 0.28,
    'Latin America': 0.12,
    'Middle East & Africa': 0.05,
    'Global': 1.0,
  },
  lastUpdated: new Date().toISOString(),
};

export const DMD_SURVIVAL_CURVES: SurvivalCurve[] = [
  {
    id: 'dmd-natural-history',
    label: 'Natural History (No Treatment)',
    cohort: 'Untreated',
    medianSurvival: 216, // 18 years
    color: '#ef4444',
    data: Array.from({ length: 30 }, (_, i) => {
      const time = i * 12; // months
      const survival = Math.max(0, 1 - Math.pow(time / 360, 1.8));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(100 * survival),
        events: Math.round(100 * (1 - survival)),
        censored: 0,
        ci_lower: Math.max(0, survival - 0.05),
        ci_upper: Math.min(1, survival + 0.05),
      };
    }),
  },
  {
    id: 'dmd-steroid-treatment',
    label: 'Corticosteroid Treatment',
    cohort: 'Standard of Care',
    medianSurvival: 276, // 23 years
    hazardRatio: 0.65,
    pValue: 0.001,
    color: '#3b82f6',
    data: Array.from({ length: 35 }, (_, i) => {
      const time = i * 12;
      const survival = Math.max(0, 1 - Math.pow(time / 420, 1.6));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(100 * survival),
        events: Math.round(100 * (1 - survival)),
        censored: 2,
        ci_lower: Math.max(0, survival - 0.04),
        ci_upper: Math.min(1, survival + 0.04),
      };
    }),
  },
  {
    id: 'dmd-gene-therapy',
    label: 'Gene Therapy (Projected)',
    cohort: 'Experimental',
    medianSurvival: 360, // 30 years projected
    hazardRatio: 0.45,
    pValue: 0.05,
    color: '#10b981',
    data: Array.from({ length: 40 }, (_, i) => {
      const time = i * 12;
      const survival = Math.max(0, 1 - Math.pow(time / 540, 1.4));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(100 * survival),
        events: Math.round(100 * (1 - survival)),
        censored: 15,
        ci_lower: Math.max(0, survival - 0.08),
        ci_upper: Math.min(1, survival + 0.08),
      };
    }),
  },
];

export const DMD_COHORTS: CohortData[] = [
  { id: 'dmd-age-0-5', stratification: 'Age', category: '0-5 years', population: 3500, percentage: 23.3, prevalence: 1.8, incidence: 0.08 },
  { id: 'dmd-age-6-12', stratification: 'Age', category: '6-12 years', population: 4800, percentage: 32.0, prevalence: 1.6, incidence: 0.05 },
  { id: 'dmd-age-13-18', stratification: 'Age', category: '13-18 years', population: 3900, percentage: 26.0, prevalence: 1.4, incidence: 0.03 },
  { id: 'dmd-age-18+', stratification: 'Age', category: '18+ years', population: 2800, percentage: 18.7, prevalence: 1.2, incidence: 0.01 },
  { id: 'dmd-ambulatory', stratification: 'Stage', category: 'Ambulatory', population: 5250, percentage: 35.0, mortality: 0.01 },
  { id: 'dmd-non-ambulatory', stratification: 'Stage', category: 'Non-Ambulatory', population: 6750, percentage: 45.0, mortality: 0.04 },
  { id: 'dmd-ventilation', stratification: 'Stage', category: 'Ventilation Required', population: 3000, percentage: 20.0, mortality: 0.08 },
];

export const DMD_GEOSPATIAL: GeospatialDiseaseData[] = [
  { region: 'North America', country: 'United States', prevalence: 1.6, incidence: 0.05, mortality: 0.03, population: 330000000, cases: 5280 },
  { region: 'North America', country: 'Canada', prevalence: 1.4, incidence: 0.04, mortality: 0.02, population: 38000000, cases: 532 },
  { region: 'Europe', country: 'United Kingdom', prevalence: 1.5, incidence: 0.05, mortality: 0.03, population: 67000000, cases: 1005 },
  { region: 'Europe', country: 'Germany', prevalence: 1.6, incidence: 0.05, mortality: 0.03, population: 83000000, cases: 1328 },
  { region: 'Asia Pacific', country: 'Japan', prevalence: 1.3, incidence: 0.04, mortality: 0.02, population: 126000000, cases: 1638 },
];

// ============================================================================
// 2. NON-SMALL CELL LUNG CANCER (nSCLC) MODEL
// ============================================================================

export const NSCLC_MODEL: DiseaseModel = {
  id: 'nsclc-001',
  name: 'Non-Small Cell Lung Cancer',
  diseaseArea: 'nSCLC',
  description: 'Most common type of lung cancer, accounting for ~85% of all lung cancer cases. Includes adenocarcinoma, squamous cell carcinoma, and large cell carcinoma.',
  prevalence: 65, // per 100,000
  incidence: 42, // per 100,000 per year
  mortality: 0.35, // 35% annual mortality
  targetPopulation: 215000, // ~215,000 new cases annually in US
  averageAge: 68,
  genderRatio: 1.2, // slightly more common in males
  geographicDistribution: {
    'North America': 0.22,
    'Europe': 0.25,
    'Asia Pacific': 0.40,
    'Latin America': 0.08,
    'Middle East & Africa': 0.05,
    'Global': 1.0,
  },
  lastUpdated: new Date().toISOString(),
};

export const NSCLC_SURVIVAL_CURVES: SurvivalCurve[] = [
  {
    id: 'nsclc-stage1',
    label: 'Stage I',
    cohort: 'Early Stage',
    medianSurvival: 72, // 6 years
    color: '#10b981',
    data: Array.from({ length: 11 }, (_, i) => {
      const time = i * 12;
      const survival = Math.max(0, 1 - Math.pow(time / 120, 1.2));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(1000 * survival),
        events: Math.round(1000 * (1 - survival)),
        censored: 5,
        ci_lower: Math.max(0, survival - 0.03),
        ci_upper: Math.min(1, survival + 0.03),
      };
    }),
  },
  {
    id: 'nsclc-stage3',
    label: 'Stage III',
    cohort: 'Locally Advanced',
    medianSurvival: 24, // 2 years
    hazardRatio: 2.5,
    pValue: 0.0001,
    color: '#f59e0b',
    data: Array.from({ length: 11 }, (_, i) => {
      const time = i * 12;
      const survival = Math.max(0, 1 - Math.pow(time / 48, 1.8));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(1000 * survival),
        events: Math.round(1000 * (1 - survival)),
        censored: 8,
        ci_lower: Math.max(0, survival - 0.05),
        ci_upper: Math.min(1, survival + 0.05),
      };
    }),
  },
  {
    id: 'nsclc-stage4',
    label: 'Stage IV (Immunotherapy)',
    cohort: 'Metastatic - Modern Treatment',
    medianSurvival: 18, // 1.5 years
    hazardRatio: 3.2,
    pValue: 0.0001,
    color: '#ef4444',
    data: Array.from({ length: 11 }, (_, i) => {
      const time = i * 12;
      const survival = Math.max(0, 1 - Math.pow(time / 36, 2.0));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(1000 * survival),
        events: Math.round(1000 * (1 - survival)),
        censored: 12,
        ci_lower: Math.max(0, survival - 0.06),
        ci_upper: Math.min(1, survival + 0.06),
      };
    }),
  },
];

export const NSCLC_COHORTS: CohortData[] = [
  { id: 'nsclc-stage1', stratification: 'Stage', category: 'Stage I', population: 32250, percentage: 15, prevalence: 9.75, mortality: 0.12 },
  { id: 'nsclc-stage2', stratification: 'Stage', category: 'Stage II', population: 43000, percentage: 20, prevalence: 13, mortality: 0.22 },
  { id: 'nsclc-stage3', stratification: 'Stage', category: 'Stage III', population: 64500, percentage: 30, prevalence: 19.5, mortality: 0.35 },
  { id: 'nsclc-stage4', stratification: 'Stage', category: 'Stage IV', population: 75250, percentage: 35, prevalence: 22.75, mortality: 0.52 },
  { id: 'nsclc-adenocarcinoma', stratification: 'Severity', category: 'Adenocarcinoma', population: 137600, percentage: 64, prevalence: 41.6 },
  { id: 'nsclc-squamous', stratification: 'Severity', category: 'Squamous Cell', population: 51600, percentage: 24, prevalence: 15.6 },
  { id: 'nsclc-large-cell', stratification: 'Severity', category: 'Large Cell', population: 25800, percentage: 12, prevalence: 7.8 },
];

export const NSCLC_TREATMENT_PATTERNS: TreatmentPattern[] = [
  { id: 'nsclc-surgery', name: 'Surgical Resection', lineOfTherapy: 1, percentage: 25, duration: 0, cost: 45000, effectiveness: 0.85 },
  { id: 'nsclc-chemo', name: 'Platinum-Based Chemotherapy', lineOfTherapy: 1, percentage: 50, duration: 4, cost: 15000, effectiveness: 0.45 },
  { id: 'nsclc-immunotherapy', name: 'PD-1/PD-L1 Inhibitor', lineOfTherapy: 1, percentage: 40, duration: 12, cost: 150000, effectiveness: 0.62 },
  { id: 'nsclc-tki', name: 'Targeted TKI (EGFR/ALK)', lineOfTherapy: 1, percentage: 15, duration: 18, cost: 180000, effectiveness: 0.75 },
  { id: 'nsclc-radiation', name: 'Radiation Therapy', lineOfTherapy: 1, percentage: 35, duration: 2, cost: 30000, effectiveness: 0.55 },
];

// ============================================================================
// 3. TYPE 2 DIABETES (T2D) MODEL
// ============================================================================

export const T2D_MODEL: DiseaseModel = {
  id: 't2d-001',
  name: 'Type 2 Diabetes Mellitus',
  diseaseArea: 'T2D',
  description: 'Chronic metabolic disorder characterized by insulin resistance and impaired glucose metabolism. Most common form of diabetes.',
  prevalence: 10500, // per 100,000 (10.5%)
  incidence: 550, // per 100,000 per year
  mortality: 0.015, // 1.5% annual excess mortality
  targetPopulation: 34600000, // ~34.6M patients in US
  averageAge: 55,
  genderRatio: 1.1, // slightly more common in males
  geographicDistribution: {
    'North America': 0.15,
    'Europe': 0.12,
    'Asia Pacific': 0.55,
    'Latin America': 0.10,
    'Middle East & Africa': 0.08,
    'Global': 1.0,
  },
  lastUpdated: new Date().toISOString(),
};

export const T2D_COHORTS: CohortData[] = [
  { id: 't2d-prediabetes', stratification: 'Stage', category: 'Prediabetes', population: 88000000, percentage: 34, prevalence: 26600, incidence: 1500 },
  { id: 't2d-controlled', stratification: 'Stage', category: 'Controlled (HbA1c <7%)', population: 13840000, percentage: 40, prevalence: 4200, mortality: 0.008 },
  { id: 't2d-uncontrolled', stratification: 'Stage', category: 'Uncontrolled (HbA1c 7-9%)', population: 13840000, percentage: 40, prevalence: 4200, mortality: 0.015 },
  { id: 't2d-severe', stratification: 'Stage', category: 'Severe (HbA1c >9%)', population: 6920000, percentage: 20, prevalence: 2100, mortality: 0.025 },
  { id: 't2d-no-complications', stratification: 'Severity', category: 'No Complications', population: 20760000, percentage: 60, prevalence: 6300 },
  { id: 't2d-microvascular', stratification: 'Severity', category: 'Microvascular Complications', population: 10380000, percentage: 30, prevalence: 3150 },
  { id: 't2d-macrovascular', stratification: 'Severity', category: 'Macrovascular Complications', population: 3460000, percentage: 10, prevalence: 1050 },
];

export const T2D_TREATMENT_PATTERNS: TreatmentPattern[] = [
  { id: 't2d-metformin', name: 'Metformin', lineOfTherapy: 1, percentage: 85, duration: 999, cost: 480, effectiveness: 0.70 },
  { id: 't2d-sulfonyl', name: 'Sulfonylurea', lineOfTherapy: 2, percentage: 35, duration: 999, cost: 720, effectiveness: 0.60 },
  { id: 't2d-dpp4', name: 'DPP-4 Inhibitor', lineOfTherapy: 2, percentage: 30, duration: 999, cost: 4800, effectiveness: 0.65 },
  { id: 't2d-glp1', name: 'GLP-1 Agonist', lineOfTherapy: 2, percentage: 25, duration: 999, cost: 12000, effectiveness: 0.80 },
  { id: 't2d-sglt2', name: 'SGLT-2 Inhibitor', lineOfTherapy: 2, percentage: 20, duration: 999, cost: 8400, effectiveness: 0.75 },
  { id: 't2d-insulin', name: 'Insulin', lineOfTherapy: 3, percentage: 30, duration: 999, cost: 6000, effectiveness: 0.85 },
];

// ============================================================================
// 4. COVID-19 MODEL
// ============================================================================

export const COVID19_MODEL: DiseaseModel = {
  id: 'covid19-001',
  name: 'COVID-19 (SARS-CoV-2)',
  diseaseArea: 'COVID19',
  description: 'Infectious respiratory disease caused by SARS-CoV-2 virus. Pandemic disease with variable severity and transmission dynamics.',
  prevalence: 450, // per 100,000 (active cases)
  incidence: 1200, // per 100,000 per year (varies by wave)
  mortality: 0.008, // 0.8% case fatality rate (overall)
  targetPopulation: 1485000, // active cases at any given time
  averageAge: 42,
  genderRatio: 1.0,
  geographicDistribution: {
    'North America': 0.18,
    'Europe': 0.22,
    'Asia Pacific': 0.35,
    'Latin America': 0.15,
    'Middle East & Africa': 0.10,
    'Global': 1.0,
  },
  lastUpdated: new Date().toISOString(),
};

export const COVID19_COHORTS: CohortData[] = [
  { id: 'covid-age-0-17', stratification: 'Age', category: '0-17 years', population: 110000, percentage: 7.4, mortality: 0.0001 },
  { id: 'covid-age-18-49', stratification: 'Age', category: '18-49 years', population: 742500, percentage: 50, mortality: 0.002 },
  { id: 'covid-age-50-64', stratification: 'Age', category: '50-64 years', population: 371250, percentage: 25, mortality: 0.008 },
  { id: 'covid-age-65+', stratification: 'Age', category: '65+ years', population: 261250, percentage: 17.6, mortality: 0.05 },
  { id: 'covid-asymptomatic', stratification: 'Severity', category: 'Asymptomatic', population: 445500, percentage: 30, mortality: 0.0001 },
  { id: 'covid-mild', stratification: 'Severity', category: 'Mild', population: 668250, percentage: 45, mortality: 0.001 },
  { id: 'covid-moderate', stratification: 'Severity', category: 'Moderate', population: 222750, percentage: 15, mortality: 0.01 },
  { id: 'covid-severe-critical', stratification: 'Severity', category: 'Severe/Critical', population: 148500, percentage: 10, mortality: 0.15 },
];

export const COVID19_TREATMENT_PATTERNS: TreatmentPattern[] = [
  { id: 'covid-supportive', name: 'Supportive Care', lineOfTherapy: 1, percentage: 85, duration: 0.5, cost: 1500, effectiveness: 0.40 },
  { id: 'covid-antiviral', name: 'Antiviral (Paxlovid)', lineOfTherapy: 1, percentage: 30, duration: 0.2, cost: 530, effectiveness: 0.65 },
  { id: 'covid-monoclonal', name: 'Monoclonal Antibodies', lineOfTherapy: 1, percentage: 10, duration: 0.1, cost: 2100, effectiveness: 0.70 },
  { id: 'covid-dexamethasone', name: 'Dexamethasone', lineOfTherapy: 2, percentage: 45, duration: 0.3, cost: 20, effectiveness: 0.75 },
  { id: 'covid-oxygen', name: 'Supplemental Oxygen', lineOfTherapy: 2, percentage: 25, duration: 0.5, cost: 5000, effectiveness: 0.60 },
  { id: 'covid-ventilation', name: 'Mechanical Ventilation', lineOfTherapy: 3, percentage: 5, duration: 0.75, cost: 40000, effectiveness: 0.50 },
];

// ============================================================================
// 5. SICKLE CELL DISEASE (SCD) MODEL
// ============================================================================

export const SCD_MODEL: DiseaseModel = {
  id: 'scd-001',
  name: 'Sickle Cell Disease',
  diseaseArea: 'SCD',
  description: 'Inherited blood disorder causing red blood cells to become rigid and sickle-shaped, leading to vaso-occlusive crises and organ damage.',
  prevalence: 30, // per 100,000
  incidence: 0.9, // per 100,000 per year
  mortality: 0.02, // 2% annual mortality
  targetPopulation: 100000, // ~100,000 patients in US
  averageAge: 25,
  genderRatio: 1.0,
  geographicDistribution: {
    'North America': 0.30,
    'Europe': 0.15,
    'Asia Pacific': 0.10,
    'Latin America': 0.15,
    'Middle East & Africa': 0.30,
    'Global': 1.0,
  },
  lastUpdated: new Date().toISOString(),
};

export const SCD_SURVIVAL_CURVES: SurvivalCurve[] = [
  {
    id: 'scd-standard-care',
    label: 'Standard Care',
    cohort: 'Historical',
    medianSurvival: 480, // 40 years
    color: '#ef4444',
    data: Array.from({ length: 70 }, (_, i) => {
      const time = i * 12;
      const survival = Math.max(0, 1 - Math.pow(time / 720, 1.5));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(1000 * survival),
        events: Math.round(1000 * (1 - survival)),
        censored: 3,
        ci_lower: Math.max(0, survival - 0.04),
        ci_upper: Math.min(1, survival + 0.04),
      };
    }),
  },
  {
    id: 'scd-hydroxyurea',
    label: 'Hydroxyurea Treatment',
    cohort: 'Modern Standard',
    medianSurvival: 540, // 45 years
    hazardRatio: 0.7,
    pValue: 0.002,
    color: '#3b82f6',
    data: Array.from({ length: 75 }, (_, i) => {
      const time = i * 12;
      const survival = Math.max(0, 1 - Math.pow(time / 810, 1.4));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(1000 * survival),
        events: Math.round(1000 * (1 - survival)),
        censored: 5,
        ci_lower: Math.max(0, survival - 0.035),
        ci_upper: Math.min(1, survival + 0.035),
      };
    }),
  },
  {
    id: 'scd-gene-therapy',
    label: 'Gene Therapy (Emerging)',
    cohort: 'Curative',
    medianSurvival: 720, // 60 years (near-normal lifespan)
    hazardRatio: 0.3,
    pValue: 0.01,
    color: '#10b981',
    data: Array.from({ length: 80 }, (_, i) => {
      const time = i * 12;
      const survival = Math.max(0, 1 - Math.pow(time / 1080, 1.2));
      return {
        time,
        survival: Number(survival.toFixed(3)),
        atRisk: Math.round(1000 * survival),
        events: Math.round(1000 * (1 - survival)),
        censored: 20,
        ci_lower: Math.max(0, survival - 0.06),
        ci_upper: Math.min(1, survival + 0.06),
      };
    }),
  },
];

export const SCD_COHORTS: CohortData[] = [
  { id: 'scd-age-0-5', stratification: 'Age', category: '0-5 years', population: 15000, percentage: 15, prevalence: 45, incidence: 0.15 },
  { id: 'scd-age-6-17', stratification: 'Age', category: '6-17 years', population: 25000, percentage: 25, prevalence: 75, incidence: 0.12 },
  { id: 'scd-age-18-35', stratification: 'Age', category: '18-35 years', population: 35000, percentage: 35, prevalence: 105, mortality: 0.015 },
  { id: 'scd-age-35+', stratification: 'Age', category: '35+ years', population: 25000, percentage: 25, prevalence: 75, mortality: 0.035 },
  { id: 'scd-mild', stratification: 'Severity', category: 'Mild (0-2 crises/year)', population: 40000, percentage: 40, mortality: 0.01 },
  { id: 'scd-moderate', stratification: 'Severity', category: 'Moderate (3-5 crises/year)', population: 35000, percentage: 35, mortality: 0.02 },
  { id: 'scd-severe', stratification: 'Severity', category: 'Severe (6+ crises/year)', population: 25000, percentage: 25, mortality: 0.04 },
];

export const SCD_TREATMENT_PATTERNS: TreatmentPattern[] = [
  { id: 'scd-pain-management', name: 'Pain Management', lineOfTherapy: 1, percentage: 95, duration: 999, cost: 3600, effectiveness: 0.50 },
  { id: 'scd-hydroxyurea', name: 'Hydroxyurea', lineOfTherapy: 1, percentage: 60, duration: 999, cost: 2400, effectiveness: 0.70 },
  { id: 'scd-transfusion', name: 'Blood Transfusion', lineOfTherapy: 2, percentage: 35, duration: 999, cost: 15000, effectiveness: 0.65 },
  { id: 'scd-crizanlizumab', name: 'Crizanlizumab', lineOfTherapy: 2, percentage: 15, duration: 12, cost: 85000, effectiveness: 0.75 },
  { id: 'scd-voxelotor', name: 'Voxelotor', lineOfTherapy: 2, percentage: 10, duration: 12, cost: 125000, effectiveness: 0.72 },
  { id: 'scd-hematopoietic-transplant', name: 'Hematopoietic Stem Cell Transplant', lineOfTherapy: 3, percentage: 2, duration: 0, cost: 400000, effectiveness: 0.95 },
];

// ============================================================================
// EXPORT ALL MODELS
// ============================================================================

export const ALL_DISEASE_MODELS = [
  DMD_MODEL,
  NSCLC_MODEL,
  T2D_MODEL,
  COVID19_MODEL,
  SCD_MODEL,
];

export const DISEASE_MODEL_MAP = {
  DMD: DMD_MODEL,
  nSCLC: NSCLC_MODEL,
  T2D: T2D_MODEL,
  COVID19: COVID19_MODEL,
  SCD: SCD_MODEL,
};

export const SURVIVAL_CURVES_MAP = {
  DMD: DMD_SURVIVAL_CURVES,
  nSCLC: NSCLC_SURVIVAL_CURVES,
  SCD: SCD_SURVIVAL_CURVES,
};

export const COHORTS_MAP = {
  DMD: DMD_COHORTS,
  nSCLC: NSCLC_COHORTS,
  T2D: T2D_COHORTS,
  COVID19: COVID19_COHORTS,
  SCD: SCD_COHORTS,
};

export const TREATMENT_PATTERNS_MAP = {
  nSCLC: NSCLC_TREATMENT_PATTERNS,
  T2D: T2D_TREATMENT_PATTERNS,
  COVID19: COVID19_TREATMENT_PATTERNS,
  SCD: SCD_TREATMENT_PATTERNS,
};

export const GEOSPATIAL_MAP = {
  DMD: DMD_GEOSPATIAL,
};
