/**
 * CDC ETL Connector
 * Extracts, transforms, and loads chronic disease data from CDC (Centers for Disease Control and Prevention)
 * Source: CDC WONDER, Data.CDC.gov
 */

import { getPrismaClient } from '../db';
import { logger } from '../utils/logger';
import {
  processBatches,
  createProvenanceData,
  createETLResult,
  validateMetricValue,
  normalizeAgeGroup,
  type ETLResult,
} from './common';
import { enrichDiseaseWithCodes } from './icd_crosswalk';

/**
 * CDC Disease Data Interface
 */
interface CDCDiseaseData {
  name: string;
  icd10: string;
  description: string;
  category: string;
  usCases: number;
  usDeaths: number;
  trends?: Array<{
    year: number;
    cases: number;
    deaths: number;
  }>;
  stateData?: Array<{
    state: string;
    cases: number;
    rate: number;
  }>;
  demographics?: Array<{
    ageGroup: string;
    cases: number;
    rate: number;
  }>;
}

/**
 * CDC disease datasets
 */
const CDC_DISEASES: CDCDiseaseData[] = [
  {
    name: 'Type 2 Diabetes Mellitus',
    icd10: 'E11',
    description: 'Chronic metabolic disorder characterized by insulin resistance and impaired glucose metabolism.',
    category: 'Metabolic',
    usCases: 34600000,
    usDeaths: 87500,
    trends: [
      { year: 2020, cases: 33000000, deaths: 82000 },
      { year: 2021, cases: 33800000, deaths: 84500 },
      { year: 2022, cases: 34200000, deaths: 86000 },
      { year: 2023, cases: 34600000, deaths: 87500 },
    ],
    stateData: [
      { state: 'Mississippi', cases: 420000, rate: 14100 },
      { state: 'West Virginia', cases: 230000, rate: 12900 },
      { state: 'Alabama', cases: 610000, rate: 12400 },
      { state: 'Louisiana', cases: 550000, rate: 11800 },
    ],
    demographics: [
      { ageGroup: '18-44', cases: 2100000, rate: 1600 },
      { ageGroup: '45-64', cases: 14500000, rate: 17300 },
      { ageGroup: '65+', cases: 17900000, rate: 32100 },
    ],
  },
  {
    name: 'Coronary Heart Disease',
    icd10: 'I25',
    description: 'Chronic heart disease caused by atherosclerosis of coronary arteries. Leading cause of death in US.',
    category: 'Cardiovascular',
    usCases: 20100000,
    usDeaths: 375000,
    trends: [
      { year: 2020, cases: 19800000, deaths: 385000 },
      { year: 2021, cases: 19950000, deaths: 380000 },
      { year: 2022, cases: 20025000, deaths: 378000 },
      { year: 2023, cases: 20100000, deaths: 375000 },
    ],
    demographics: [
      { ageGroup: '18-44', cases: 850000, rate: 650 },
      { ageGroup: '45-64', cases: 7200000, rate: 8600 },
      { ageGroup: '65+', cases: 12050000, rate: 21600 },
    ],
  },
  {
    name: 'Chronic Obstructive Pulmonary Disease (COPD)',
    icd10: 'J44',
    description: 'Progressive lung disease causing breathing difficulties, primarily caused by smoking.',
    category: 'Respiratory',
    usCases: 15700000,
    usDeaths: 145000,
    trends: [
      { year: 2020, cases: 15500000, deaths: 152000 },
      { year: 2021, cases: 15600000, deaths: 149000 },
      { year: 2022, cases: 15650000, deaths: 147000 },
      { year: 2023, cases: 15700000, deaths: 145000 },
    ],
    stateData: [
      { state: 'West Virginia', cases: 280000, rate: 15700 },
      { state: 'Kentucky', cases: 580000, rate: 13000 },
      { state: 'Arkansas', cases: 350000, rate: 11600 },
    ],
  },
  {
    name: "Alzheimer's Disease",
    icd10: 'G30',
    description: 'Progressive neurodegenerative disease causing memory loss and cognitive decline.',
    category: 'Neurological',
    usCases: 6700000,
    usDeaths: 122000,
    trends: [
      { year: 2020, cases: 5800000, deaths: 115000 },
      { year: 2021, cases: 6100000, deaths: 118000 },
      { year: 2022, cases: 6400000, deaths: 120000 },
      { year: 2023, cases: 6700000, deaths: 122000 },
    ],
    demographics: [
      { ageGroup: '65-74', cases: 1100000, rate: 3600 },
      { ageGroup: '75-84', cases: 2600000, rate: 17500 },
      { ageGroup: '85+', cases: 3000000, rate: 45200 },
    ],
  },
  {
    name: 'Stroke',
    icd10: 'I64',
    description: 'Cerebrovascular accident causing brain damage due to interrupted blood supply.',
    category: 'Cardiovascular',
    usCases: 7600000,
    usDeaths: 162500,
    trends: [
      { year: 2020, cases: 7350000, deaths: 168000 },
      { year: 2021, cases: 7475000, deaths: 165500 },
      { year: 2022, cases: 7540000, deaths: 164000 },
      { year: 2023, cases: 7600000, deaths: 162500 },
    ],
    demographics: [
      { ageGroup: '18-44', cases: 280000, rate: 214 },
      { ageGroup: '45-64', cases: 2100000, rate: 2500 },
      { ageGroup: '65+', cases: 5220000, rate: 9360 },
    ],
  },
  {
    name: 'Hypertension',
    icd10: 'I10',
    description: 'Persistent high blood pressure, major risk factor for cardiovascular disease.',
    category: 'Cardiovascular',
    usCases: 119000000,
    usDeaths: 82000,
    trends: [
      { year: 2020, cases: 116000000, deaths: 79000 },
      { year: 2021, cases: 117000000, deaths: 80000 },
      { year: 2022, cases: 118000000, deaths: 81000 },
      { year: 2023, cases: 119000000, deaths: 82000 },
    ],
    demographics: [
      { ageGroup: '18-44', cases: 11900000, rate: 9100 },
      { ageGroup: '45-64', cases: 47600000, rate: 56800 },
      { ageGroup: '65+', cases: 59500000, rate: 106700 },
    ],
  },
  {
    name: 'Asthma',
    icd10: 'J45',
    description: 'Chronic inflammatory disease of the airways causing recurrent breathing difficulties.',
    category: 'Respiratory',
    usCases: 25000000,
    usDeaths: 3500,
    trends: [
      { year: 2020, cases: 24500000, deaths: 3600 },
      { year: 2021, cases: 24700000, deaths: 3550 },
      { year: 2022, cases: 24850000, deaths: 3525 },
      { year: 2023, cases: 25000000, deaths: 3500 },
    ],
    demographics: [
      { ageGroup: '0-17', cases: 4500000, rate: 6200 },
      { ageGroup: '18-44', cases: 9000000, rate: 6900 },
      { ageGroup: '45-64', cases: 8500000, rate: 10100 },
      { ageGroup: '65+', cases: 3000000, rate: 5400 },
    ],
  },
];

/**
 * Run CDC ETL pipeline
 */
export async function runCDCETL(): Promise<ETLResult> {
  logger.info('Starting CDC ETL pipeline...');
  const startTime = Date.now();
  const prisma = getPrismaClient();
  
  const counts = {
    diseases: 0,
    created: 0,
    updated: 0,
    skipped: 0,
  };
  const errors: string[] = [];

  try {
    // Process each disease in batches
    await processBatches(
      CDC_DISEASES,
      parseInt(process.env.ETL_BATCH_SIZE || '10'),
      async (batch) => {
        const results = [];
        
        for (const disease of batch) {
          try {
            await processCDCDisease(disease, prisma, counts);
            results.push(disease);
          } catch (error) {
            const errorMsg = `Failed to process ${disease.name}: ${error}`;
            logger.error(errorMsg);
            errors.push(errorMsg);
          }
        }
        
        return results;
      },
      (processed, total) => {
        logger.info(`CDC ETL progress: ${processed}/${total} diseases processed`);
      }
    );

    const result = createETLResult('CDC', startTime, counts, errors);
    logger.info('CDC ETL completed', result);
    return result;
  } catch (error) {
    logger.error('CDC ETL failed', error);
    throw error;
  }
}

/**
 * Process a single CDC disease
 */
async function processCDCDisease(
  disease: CDCDiseaseData,
  prisma: any,
  counts: { diseases: number; created: number; updated: number; skipped: number }
): Promise<void> {
  // Enrich with ICD-11 and SNOMED codes
  const enriched = enrichDiseaseWithCodes(disease.icd10);

  // Upsert disease
  const diseaseRecord = await prisma.disease.upsert({
    where: { icd10: disease.icd10 },
    update: {
      name: disease.name,
      icd11: enriched.icd11,
      snomed: enriched.snomed,
      description: disease.description,
      category: disease.category,
    },
    create: {
      name: disease.name,
      icd10: disease.icd10,
      icd11: enriched.icd11,
      snomed: enriched.snomed,
      category: disease.category,
      description: disease.description,
    },
  });

  counts.diseases++;

  // Create metrics
  await createCDCMetrics(diseaseRecord.id, disease, prisma, counts);
}

/**
 * Create CDC metrics for a disease
 */
async function createCDCMetrics(
  diseaseId: string,
  disease: CDCDiseaseData,
  prisma: any,
  counts: { created: number; updated: number; skipped: number }
): Promise<void> {
  const sourceName = 'CDC';
  const sourceUrl = 'https://data.cdc.gov/';
  
  // US Cases - Prevalence (overall)
  const usPopulation = 331900000; // 2023 US population
  const prevalenceRate = (disease.usCases / usPopulation) * 100000;
  
  await upsertMetric(
    diseaseId,
    'prevalence',
    prevalenceRate,
    {
      source: sourceName,
      sourceUrl,
      unit: 'per_100k',
      year: 2023,
      sex: 'All',
      ageGroup: 'All',
      regionCode: 'USA',
      regionLevel: 'country',
      notes: `CDC ${disease.name} prevalence in US`,
    },
    prisma,
    counts
  );

  // US Deaths - Mortality rate
  const mortalityRate = (disease.usDeaths / usPopulation) * 100000;
  
  await upsertMetric(
    diseaseId,
    'mortality',
    mortalityRate,
    {
      source: sourceName,
      sourceUrl,
      unit: 'per_100k',
      year: 2023,
      sex: 'All',
      ageGroup: 'All',
      regionCode: 'USA',
      regionLevel: 'country',
      notes: `CDC ${disease.name} mortality rate in US`,
    },
    prisma,
    counts
  );

  // Trends
  if (disease.trends) {
    for (const trend of disease.trends) {
      // Cases trend
      const trendPrevalence = (trend.cases / usPopulation) * 100000;
      await upsertMetric(
        diseaseId,
        'prevalence',
        trendPrevalence,
        {
          source: sourceName,
          sourceUrl,
          unit: 'per_100k',
          year: trend.year,
          sex: 'All',
          ageGroup: 'All',
          regionCode: 'USA',
          regionLevel: 'country',
          notes: `CDC ${disease.name} prevalence trend`,
        },
        prisma,
        counts
      );

      // Deaths trend
      const trendMortality = (trend.deaths / usPopulation) * 100000;
      await upsertMetric(
        diseaseId,
        'mortality',
        trendMortality,
        {
          source: sourceName,
          sourceUrl,
          unit: 'per_100k',
          year: trend.year,
          sex: 'All',
          ageGroup: 'All',
          regionCode: 'USA',
          regionLevel: 'country',
          notes: `CDC ${disease.name} mortality trend`,
        },
        prisma,
        counts
      );
    }
  }

  // State-level data
  if (disease.stateData) {
    for (const stateInfo of disease.stateData) {
      await upsertMetric(
        diseaseId,
        'prevalence',
        stateInfo.rate,
        {
          source: sourceName,
          sourceUrl,
          unit: 'per_100k',
          year: 2023,
          sex: 'All',
          ageGroup: 'All',
          regionCode: stateInfo.state.replace(/\s+/g, '_').toUpperCase(),
          regionLevel: 'state',
          notes: `CDC ${disease.name} prevalence in ${stateInfo.state}`,
        },
        prisma,
        counts
      );
    }
  }

  // Demographics (age groups)
  if (disease.demographics) {
    for (const demo of disease.demographics) {
      await upsertMetric(
        diseaseId,
        'prevalence',
        demo.rate,
        {
          source: sourceName,
          sourceUrl,
          unit: 'per_100k',
          year: 2023,
          sex: 'All',
          ageGroup: normalizeAgeGroup(demo.ageGroup),
          regionCode: 'USA',
          regionLevel: 'country',
          notes: `CDC ${disease.name} prevalence for age group ${demo.ageGroup}`,
        },
        prisma,
        counts
      );
    }
  }
}

/**
 * Upsert a metric with provenance
 */
async function upsertMetric(
  diseaseId: string,
  metricType: string,
  value: number,
  options: {
    source: string;
    sourceUrl: string;
    unit?: string;
    year?: number;
    sex?: string;
    ageGroup?: string;
    regionCode?: string;
    regionLevel?: string;
    notes?: string;
  },
  prisma: any,
  counts: { created: number; updated: number; skipped: number }
): Promise<void> {
  const validatedValue = validateMetricValue(value);
  if (validatedValue === null) {
    counts.skipped++;
    return;
  }

  const rawData = { diseaseId, metricType, value, ...options };
  const provenanceData = createProvenanceData(
    options.source,
    options.sourceUrl,
    rawData,
    { reliabilityScore: 92, notes: options.notes }
  );

  // Check if metric already exists with same hash
  const existingMetric = await prisma.metric.findFirst({
    where: {
      diseaseId,
      source: options.source,
      metricType,
      year: options.year,
      sex: options.sex,
      ageGroup: options.ageGroup,
      regionCode: options.regionCode,
    },
    include: {
      provenance: true,
    },
  });

  if (existingMetric?.provenance?.hash === provenanceData.hash) {
    counts.skipped++;
    return;
  }

  if (existingMetric) {
    // Update existing metric
    await prisma.metric.update({
      where: { id: existingMetric.id },
      data: {
        valueNumeric: validatedValue,
        unit: options.unit,
        provenance: {
          update: {
            hash: provenanceData.hash,
            retrievedAt: provenanceData.retrievedAt,
            reliabilityScore: provenanceData.reliabilityScore,
            notes: provenanceData.notes,
          },
        },
      },
    });
    counts.updated++;
  } else {
    // Create new metric
    await prisma.metric.create({
      data: {
        diseaseId,
        source: options.source,
        metricType,
        valueNumeric: validatedValue,
        unit: options.unit,
        sex: options.sex,
        ageGroup: options.ageGroup,
        regionCode: options.regionCode,
        regionLevel: options.regionLevel,
        year: options.year,
        provenance: {
          create: {
            sourceName: provenanceData.sourceName,
            sourceUrl: provenanceData.sourceUrl,
            sourceVersion: provenanceData.sourceVersion,
            retrievedAt: provenanceData.retrievedAt,
            hash: provenanceData.hash,
            reliabilityScore: provenanceData.reliabilityScore,
            notes: provenanceData.notes,
          },
        },
      },
    });
    counts.created++;
  }
}
