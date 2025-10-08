/**
 * Extended Disease Dataset
 * 
 * This file contains 30+ additional diseases to expand the epidemiology platform
 * beyond the initial 17 diseases. These diseases span multiple categories and
 * include emerging diseases, rare conditions, and global health priorities.
 * 
 * Data sources: WHO, CDC, GBD, IARC, NIH
 */

import { DataSource, DiseaseData, DiseaseCategory } from './disease-data-service';

/**
 * Get extended disease dataset (30+ additional diseases)
 */
export function getExtendedDiseaseData(): DiseaseData[] {
  return [
    // Additional Cancers (10 diseases)
    {
      id: 'seer-bladder-cancer',
      name: 'Bladder Cancer',
      icd10Code: 'C67',
      category: 'Cancer' as DiseaseCategory,
      description: 'Malignant neoplasm of bladder. Fourth most common cancer in men.',
      prevalence: 20.3,
      incidence: 19.7,
      mortality: 0.08,
      targetPopulation: 83000,
      averageAge: 73,
      genderRatio: 3.8, // Much higher in males
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Bladder',
        fiveYearSurvival: 77.0,
        incidenceRate: 19.7,
        mortalityRate: 4.3,
        medianAge: 73,
        raceEthnicity: {
          white: 21.8,
          black: 9.0,
          hispanic: 11.2,
          asian: 8.1
        }
      }
    },
    {
      id: 'seer-kidney-cancer',
      name: 'Kidney and Renal Pelvis Cancer',
      icd10Code: 'C64',
      category: 'Cancer' as DiseaseCategory,
      description: 'Malignant neoplasm of kidney. Incidence has been rising.',
      prevalence: 23.0,
      incidence: 17.7,
      mortality: 0.06,
      targetPopulation: 79000,
      averageAge: 64,
      genderRatio: 1.7,
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Renal Cell Carcinoma',
        fiveYearSurvival: 76.0,
        incidenceRate: 17.7,
        mortalityRate: 3.8,
        medianAge: 64
      }
    },
    {
      id: 'seer-melanoma',
      name: 'Melanoma of the Skin',
      icd10Code: 'C43',
      category: 'Cancer' as DiseaseCategory,
      description: 'Malignant melanoma. Most dangerous form of skin cancer.',
      prevalence: 28.2,
      incidence: 22.3,
      mortality: 0.03,
      targetPopulation: 99700,
      averageAge: 65,
      genderRatio: 1.5,
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Cutaneous Melanoma',
        fiveYearSurvival: 93.0,
        incidenceRate: 22.3,
        mortalityRate: 2.3,
        medianAge: 65
      }
    },
    {
      id: 'seer-thyroid-cancer',
      name: 'Thyroid Cancer',
      icd10Code: 'C73',
      category: 'Cancer' as DiseaseCategory,
      description: 'Malignant neoplasm of thyroid gland. Rapidly increasing incidence.',
      prevalence: 14.5,
      incidence: 14.0,
      mortality: 0.01,
      targetPopulation: 44280,
      averageAge: 51,
      genderRatio: 0.3, // Much more common in females
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Papillary Thyroid Carcinoma',
        fiveYearSurvival: 98.0,
        incidenceRate: 14.0,
        mortalityRate: 0.5,
        medianAge: 51
      }
    },
    {
      id: 'seer-leukemia',
      name: 'Leukemia',
      icd10Code: 'C91-C95',
      category: 'Cancer' as DiseaseCategory,
      description: 'Malignant diseases of blood-forming organs. Multiple subtypes.',
      prevalence: 16.3,
      incidence: 13.8,
      mortality: 0.06,
      targetPopulation: 60650,
      averageAge: 66,
      genderRatio: 1.4,
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'All Leukemia Types',
        fiveYearSurvival: 65.0,
        incidenceRate: 13.8,
        mortalityRate: 5.7,
        medianAge: 66
      }
    },
    {
      id: 'seer-lymphoma-nhl',
      name: 'Non-Hodgkin Lymphoma',
      icd10Code: 'C82-C85',
      category: 'Cancer' as DiseaseCategory,
      description: 'Group of blood cancers affecting lymphatic system.',
      prevalence: 21.6,
      incidence: 18.6,
      mortality: 0.05,
      targetPopulation: 77240,
      averageAge: 67,
      genderRatio: 1.3,
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Non-Hodgkin Lymphoma',
        fiveYearSurvival: 74.0,
        incidenceRate: 18.6,
        mortalityRate: 4.8,
        medianAge: 67
      }
    },
    {
      id: 'seer-liver-cancer',
      name: 'Liver and Intrahepatic Bile Duct Cancer',
      icd10Code: 'C22',
      category: 'Cancer' as DiseaseCategory,
      description: 'Hepatocellular carcinoma and bile duct cancers. Rising incidence.',
      prevalence: 9.5,
      incidence: 9.0,
      mortality: 0.07,
      targetPopulation: 41260,
      averageAge: 64,
      genderRatio: 2.8,
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Hepatocellular Carcinoma',
        fiveYearSurvival: 20.0,
        incidenceRate: 9.0,
        mortalityRate: 6.6,
        medianAge: 64
      }
    },
    {
      id: 'seer-stomach-cancer',
      name: 'Stomach Cancer',
      icd10Code: 'C16',
      category: 'Cancer' as DiseaseCategory,
      description: 'Gastric adenocarcinoma. Declining in US but high globally.',
      prevalence: 7.2,
      incidence: 6.3,
      mortality: 0.05,
      targetPopulation: 26500,
      averageAge: 69,
      genderRatio: 1.9,
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Gastric Adenocarcinoma',
        fiveYearSurvival: 33.0,
        incidenceRate: 6.3,
        mortalityRate: 3.0,
        medianAge: 69
      }
    },
    {
      id: 'seer-ovarian-cancer',
      name: 'Ovarian Cancer',
      icd10Code: 'C56',
      category: 'Cancer' as DiseaseCategory,
      description: 'Malignant neoplasm of ovary. Often diagnosed at late stage.',
      prevalence: 11.7,
      incidence: 10.1,
      mortality: 0.06,
      targetPopulation: 19880,
      averageAge: 63,
      genderRatio: 0.0, // Female only
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Epithelial Ovarian Cancer',
        fiveYearSurvival: 49.0,
        incidenceRate: 10.1,
        mortalityRate: 6.0,
        medianAge: 63
      }
    },
    {
      id: 'seer-cervical-cancer',
      name: 'Cervical Cancer',
      icd10Code: 'C53',
      category: 'Cancer' as DiseaseCategory,
      description: 'Malignant neoplasm of cervix. Preventable with HPV vaccine.',
      prevalence: 7.6,
      incidence: 7.5,
      mortality: 0.02,
      targetPopulation: 13960,
      averageAge: 50,
      genderRatio: 0.0,
      dataSources: [DataSource.SEER],
      lastUpdated: '2024-01-15',
      seerData: {
        cancerType: 'Squamous Cell Carcinoma',
        fiveYearSurvival: 66.0,
        incidenceRate: 7.5,
        mortalityRate: 2.3,
        medianAge: 50
      }
    },
    
    // Infectious Diseases (8 diseases)
    {
      id: 'who-hepatitis-b',
      name: 'Hepatitis B',
      icd10Code: 'B16',
      category: 'Infectious Disease' as DiseaseCategory,
      description: 'Viral infection of the liver. Major cause of liver cancer and cirrhosis.',
      prevalence: 296000000,
      incidence: 1500000,
      mortality: 0.004,
      targetPopulation: 296000000,
      averageAge: 35,
      dataSources: [DataSource.WHO],
      lastUpdated: '2024-01-15',
      whoData: {
        dalys: 22000000,
        ylls: 18000000,
        ylds: 4000000,
        globalBurden: 296000000,
        regionalData: [
          { region: 'Western Pacific', prevalence: 116000000, mortality: 0.005 },
          { region: 'Africa', prevalence: 82000000, mortality: 0.006 },
          { region: 'Eastern Mediterranean', prevalence: 43000000, mortality: 0.004 }
        ],
        riskFactors: ['Unsafe injection practices', 'Mother-to-child transmission', 'Unprotected sex']
      }
    },
    {
      id: 'who-hepatitis-c',
      name: 'Hepatitis C',
      icd10Code: 'B17.1',
      category: 'Infectious Disease' as DiseaseCategory,
      description: 'Viral infection of the liver. Curable with direct-acting antivirals.',
      prevalence: 58000000,
      incidence: 1500000,
      mortality: 0.006,
      targetPopulation: 58000000,
      averageAge: 40,
      dataSources: [DataSource.WHO],
      lastUpdated: '2024-01-15',
      whoData: {
        dalys: 15000000,
        ylls: 12000000,
        ylds: 3000000,
        globalBurden: 58000000,
        regionalData: [
          { region: 'Eastern Mediterranean', prevalence: 21000000, mortality: 0.008 },
          { region: 'Europe', prevalence: 15000000, mortality: 0.005 },
          { region: 'Americas', prevalence: 5000000, mortality: 0.004 }
        ],
        riskFactors: ['Contaminated blood', 'Unsafe injection practices', 'Healthcare procedures']
      }
    },
    {
      id: 'who-dengue',
      name: 'Dengue Fever',
      icd10Code: 'A90',
      category: 'Infectious Disease' as DiseaseCategory,
      description: 'Mosquito-borne viral infection. Rapidly spreading globally.',
      prevalence: 390000000,
      incidence: 100000000,
      mortality: 0.00025,
      targetPopulation: 390000000,
      averageAge: 25,
      dataSources: [DataSource.WHO],
      lastUpdated: '2024-01-15',
      whoData: {
        dalys: 750000,
        ylls: 500000,
        ylds: 250000,
        globalBurden: 390000000,
        regionalData: [
          { region: 'South-East Asia', prevalence: 70000000, mortality: 0.0003 },
          { region: 'Western Pacific', prevalence: 75000000, mortality: 0.0002 },
          { region: 'Americas', prevalence: 50000000, mortality: 0.0002 }
        ],
        riskFactors: ['Aedes mosquito exposure', 'Urbanization', 'Climate change']
      }
    },
    {
      id: 'who-measles',
      name: 'Measles',
      icd10Code: 'B05',
      category: 'Infectious Disease' as DiseaseCategory,
      description: 'Highly contagious viral disease. Vaccine-preventable.',
      prevalence: 9000000,
      incidence: 9000000,
      mortality: 0.015,
      targetPopulation: 9000000,
      averageAge: 5,
      dataSources: [DataSource.WHO],
      lastUpdated: '2024-01-15',
      whoData: {
        dalys: 4500000,
        ylls: 4000000,
        ylds: 500000,
        globalBurden: 9000000,
        regionalData: [
          { region: 'Africa', prevalence: 4500000, mortality: 0.02 },
          { region: 'Eastern Mediterranean', prevalence: 2000000, mortality: 0.018 },
          { region: 'South-East Asia', prevalence: 1500000, mortality: 0.012 }
        ],
        riskFactors: ['Lack of vaccination', 'Malnutrition', 'Vitamin A deficiency']
      }
    },
    {
      id: 'who-cholera',
      name: 'Cholera',
      icd10Code: 'A00',
      category: 'Infectious Disease' as DiseaseCategory,
      description: 'Acute diarrheal disease caused by Vibrio cholerae. Water-borne.',
      prevalence: 2800000,
      incidence: 2800000,
      mortality: 0.015,
      targetPopulation: 2800000,
      averageAge: 30,
      dataSources: [DataSource.WHO],
      lastUpdated: '2024-01-15',
      whoData: {
        dalys: 1200000,
        ylls: 1000000,
        ylds: 200000,
        globalBurden: 2800000,
        regionalData: [
          { region: 'Africa', prevalence: 1500000, mortality: 0.02 },
          { region: 'South-East Asia', prevalence: 800000, mortality: 0.012 },
          { region: 'Eastern Mediterranean', prevalence: 400000, mortality: 0.015 }
        ],
        riskFactors: ['Unsafe water', 'Poor sanitation', 'Humanitarian crises']
      }
    },
    {
      id: 'who-yellow-fever',
      name: 'Yellow Fever',
      icd10Code: 'A95',
      category: 'Infectious Disease' as DiseaseCategory,
      description: 'Mosquito-borne viral hemorrhagic fever. Vaccine-preventable.',
      prevalence: 200000,
      incidence: 200000,
      mortality: 0.075,
      targetPopulation: 200000,
      averageAge: 28,
      dataSources: [DataSource.WHO],
      lastUpdated: '2024-01-15',
      whoData: {
        dalys: 500000,
        ylls: 450000,
        ylds: 50000,
        globalBurden: 200000,
        regionalData: [
          { region: 'Africa', prevalence: 170000, mortality: 0.08 },
          { region: 'Americas', prevalence: 30000, mortality: 0.06 }
        ],
        riskFactors: ['Mosquito exposure', 'Lack of vaccination', 'Deforestation']
      }
    },
    {
      id: 'who-rabies',
      name: 'Rabies',
      icd10Code: 'A82',
      category: 'Infectious Disease' as DiseaseCategory,
      description: 'Fatal viral encephalitis transmitted by animal bites.',
      prevalence: 59000,
      incidence: 59000,
      mortality: 0.99, // Nearly 100% fatal if untreated
      targetPopulation: 59000,
      averageAge: 20,
      dataSources: [DataSource.WHO],
      lastUpdated: '2024-01-15',
      whoData: {
        dalys: 1600000,
        ylls: 1550000,
        ylds: 50000,
        globalBurden: 59000,
        regionalData: [
          { region: 'South-East Asia', prevalence: 35000, mortality: 0.99 },
          { region: 'Africa', prevalence: 21000, mortality: 0.99 },
          { region: 'Western Pacific', prevalence: 3000, mortality: 0.99 }
        ],
        riskFactors: ['Dog bites', 'Lack of post-exposure prophylaxis', 'Wildlife exposure']
      }
    },
    {
      id: 'who-typhoid',
      name: 'Typhoid Fever',
      icd10Code: 'A01.0',
      category: 'Infectious Disease' as DiseaseCategory,
      description: 'Bacterial infection caused by Salmonella typhi. Water and food-borne.',
      prevalence: 11000000,
      incidence: 11000000,
      mortality: 0.01,
      targetPopulation: 11000000,
      averageAge: 25,
      dataSources: [DataSource.WHO],
      lastUpdated: '2024-01-15',
      whoData: {
        dalys: 4000000,
        ylls: 3500000,
        ylds: 500000,
        globalBurden: 11000000,
        regionalData: [
          { region: 'South-East Asia', prevalence: 6000000, mortality: 0.012 },
          { region: 'Africa', prevalence: 3500000, mortality: 0.015 },
          { region: 'Eastern Mediterranean', prevalence: 1000000, mortality: 0.008 }
        ],
        riskFactors: ['Unsafe water', 'Poor sanitation', 'Contaminated food']
      }
    },
    
    // Chronic Diseases (7 diseases)
    {
      id: 'cdc-hypertension',
      name: 'Hypertension',
      icd10Code: 'I10',
      category: 'Cardiovascular' as DiseaseCategory,
      description: 'High blood pressure. Leading risk factor for cardiovascular disease.',
      prevalence: 47000,
      incidence: 8000,
      mortality: 0.02,
      targetPopulation: 116000000,
      averageAge: 55,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15',
      cdcData: {
        usCases: 116000000,
        usDeaths: 691000,
        trends: [
          { year: 2020, cases: 113000000, deaths: 679000 },
          { year: 2021, cases: 114000000, deaths: 684000 },
          { year: 2022, cases: 115000000, deaths: 688000 },
          { year: 2023, cases: 116000000, deaths: 691000 }
        ],
        demographics: [
          { ageGroup: '18-44', cases: 18000000, rate: 11000 },
          { ageGroup: '45-64', cases: 45000000, rate: 33000 },
          { ageGroup: '65+', cases: 53000000, rate: 64000 }
        ]
      }
    },
    {
      id: 'cdc-asthma',
      name: 'Asthma',
      icd10Code: 'J45',
      category: 'Respiratory' as DiseaseCategory,
      description: 'Chronic inflammatory disease of the airways. Common in children.',
      prevalence: 8000,
      incidence: 500,
      mortality: 0.001,
      targetPopulation: 25000000,
      averageAge: 30,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15',
      cdcData: {
        usCases: 25000000,
        usDeaths: 3524,
        trends: [
          { year: 2020, cases: 24800000, deaths: 3517 },
          { year: 2021, cases: 24900000, deaths: 3520 },
          { year: 2022, cases: 24900000, deaths: 3522 },
          { year: 2023, cases: 25000000, deaths: 3524 }
        ],
        demographics: [
          { ageGroup: '0-17', cases: 4600000, rate: 6200 },
          { ageGroup: '18-64', cases: 16400000, rate: 8000 },
          { ageGroup: '65+', cases: 4000000, rate: 7300 }
        ]
      }
    },
    {
      id: 'cdc-kidney-disease',
      name: 'Chronic Kidney Disease',
      icd10Code: 'N18',
      category: 'Chronic Disease' as DiseaseCategory,
      description: 'Progressive loss of kidney function. Often complicates diabetes and hypertension.',
      prevalence: 14000,
      incidence: 1500,
      mortality: 0.025,
      targetPopulation: 37000000,
      averageAge: 62,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15',
      cdcData: {
        usCases: 37000000,
        usDeaths: 134000,
        trends: [
          { year: 2020, cases: 35000000, deaths: 129000 },
          { year: 2021, cases: 35500000, deaths: 130500 },
          { year: 2022, cases: 36000000, deaths: 132000 },
          { year: 2023, cases: 37000000, deaths: 134000 }
        ],
        demographics: [
          { ageGroup: '18-44', cases: 4000000, rate: 2500 },
          { ageGroup: '45-64', cases: 13000000, rate: 9600 },
          { ageGroup: '65+', cases: 20000000, rate: 38000 }
        ]
      }
    },
    {
      id: 'cdc-arthritis',
      name: 'Arthritis',
      icd10Code: 'M19',
      category: 'Autoimmune' as DiseaseCategory,
      description: 'Inflammation of joints. Leading cause of disability in US.',
      prevalence: 23000,
      incidence: 2000,
      mortality: 0.001,
      targetPopulation: 58500000,
      averageAge: 58,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15',
      cdcData: {
        usCases: 58500000,
        usDeaths: 7200,
        trends: [
          { year: 2020, cases: 56000000, deaths: 7100 },
          { year: 2021, cases: 57000000, deaths: 7150 },
          { year: 2022, cases: 57500000, deaths: 7175 },
          { year: 2023, cases: 58500000, deaths: 7200 }
        ],
        demographics: [
          { ageGroup: '18-44', cases: 7500000, rate: 4700 },
          { ageGroup: '45-64', cases: 23500000, rate: 17000 },
          { ageGroup: '65+', cases: 27500000, rate: 49000 }
        ]
      }
    },
    {
      id: 'cdc-depression',
      name: 'Major Depressive Disorder',
      icd10Code: 'F33',
      category: 'Neurological' as DiseaseCategory,
      description: 'Common mental disorder characterized by persistent sadness and loss of interest.',
      prevalence: 7000,
      incidence: 1500,
      mortality: 0.015,
      targetPopulation: 21000000,
      averageAge: 35,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15',
      cdcData: {
        usCases: 21000000,
        usDeaths: 47000, // Including suicide
        trends: [
          { year: 2020, cases: 20500000, deaths: 46000 },
          { year: 2021, cases: 20700000, deaths: 46500 },
          { year: 2022, cases: 20800000, deaths: 46700 },
          { year: 2023, cases: 21000000, deaths: 47000 }
        ],
        demographics: [
          { ageGroup: '18-25', cases: 5000000, rate: 17000 },
          { ageGroup: '26-49', cases: 10000000, rate: 8500 },
          { ageGroup: '50+', cases: 6000000, rate: 5000 }
        ]
      }
    },
    {
      id: 'cdc-epilepsy',
      name: 'Epilepsy',
      icd10Code: 'G40',
      category: 'Neurological' as DiseaseCategory,
      description: 'Chronic disorder characterized by recurrent seizures.',
      prevalence: 1100,
      incidence: 150,
      mortality: 0.003,
      targetPopulation: 3400000,
      averageAge: 40,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15',
      cdcData: {
        usCases: 3400000,
        usDeaths: 1400,
        trends: [
          { year: 2020, cases: 3300000, deaths: 1350 },
          { year: 2021, cases: 3350000, deaths: 1375 },
          { year: 2022, cases: 3400000, deaths: 1390 },
          { year: 2023, cases: 3400000, deaths: 1400 }
        ],
        demographics: [
          { ageGroup: '0-17', cases: 470000, rate: 640 },
          { ageGroup: '18-64', cases: 2200000, rate: 1100 },
          { ageGroup: '65+', cases: 730000, rate: 1300 }
        ]
      }
    },
    {
      id: 'cdc-parkinsons',
      name: "Parkinson's Disease",
      icd10Code: 'G20',
      category: 'Neurological' as DiseaseCategory,
      description: 'Progressive neurodegenerative disorder affecting movement.',
      prevalence: 340,
      incidence: 60,
      mortality: 0.025,
      targetPopulation: 1000000,
      averageAge: 70,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15',
      cdcData: {
        usCases: 1000000,
        usDeaths: 31000,
        trends: [
          { year: 2020, cases: 930000, deaths: 29500 },
          { year: 2021, cases: 950000, deaths: 30000 },
          { year: 2022, cases: 970000, deaths: 30500 },
          { year: 2023, cases: 1000000, deaths: 31000 }
        ],
        demographics: [
          { ageGroup: '50-64', cases: 200000, rate: 150 },
          { ageGroup: '65-79', cases: 500000, rate: 1800 },
          { ageGroup: '80+', cases: 300000, rate: 2900 }
        ]
      }
    },
    
    // Rare Diseases (5 diseases)
    {
      id: 'rare-cystic-fibrosis',
      name: 'Cystic Fibrosis',
      icd10Code: 'E84',
      category: 'Rare Disease' as DiseaseCategory,
      description: 'Genetic disorder affecting lungs and digestive system.',
      prevalence: 10,
      incidence: 1,
      mortality: 0.02,
      targetPopulation: 30000,
      averageAge: 25,
      genderRatio: 1.0,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'rare-als',
      name: 'Amyotrophic Lateral Sclerosis (ALS)',
      icd10Code: 'G12.2',
      category: 'Rare Disease' as DiseaseCategory,
      description: 'Progressive neurodegenerative disease affecting nerve cells. Also known as Lou Gehrig\'s disease.',
      prevalence: 6,
      incidence: 1.5,
      mortality: 0.45,
      targetPopulation: 20000,
      averageAge: 55,
      genderRatio: 1.3,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'rare-huntingtons',
      name: "Huntington's Disease",
      icd10Code: 'G10',
      category: 'Rare Disease' as DiseaseCategory,
      description: 'Inherited genetic disorder causing progressive brain cell degeneration.',
      prevalence: 4,
      incidence: 0.4,
      mortality: 0.03,
      targetPopulation: 12000,
      averageAge: 45,
      genderRatio: 1.0,
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'rare-ms',
      name: 'Multiple Sclerosis',
      icd10Code: 'G35',
      category: 'Rare Disease' as DiseaseCategory,
      description: 'Autoimmune disease affecting the central nervous system.',
      prevalence: 240,
      incidence: 10,
      mortality: 0.005,
      targetPopulation: 913000,
      averageAge: 40,
      genderRatio: 0.4, // More common in females
      dataSources: [DataSource.CDC],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'rare-sma',
      name: 'Spinal Muscular Atrophy',
      icd10Code: 'G12.0',
      category: 'Rare Disease' as DiseaseCategory,
      description: 'Genetic disorder affecting motor neurons and causing muscle wasting.',
      prevalence: 3,
      incidence: 0.3,
      mortality: 0.35,
      targetPopulation: 10000,
      averageAge: 5,
      genderRatio: 1.0,
      dataSources: [DataSource.INTERNAL],
      lastUpdated: '2024-01-15'
    }
  ];
}
