// Ionis Pharmaceuticals 42-program pipeline
import type { PipelineProgram } from '../components/visualizations/PipelineVisualization';

export const IONIS_PIPELINE: PipelineProgram[] = [
  // Cardiovascular (8 programs)
  { id: 'IONS-1', name: 'Olezarsen', genericName: 'olezarsen', indication: 'Familial Chylomicronemia Syndrome', phase: 'Phase III', therapeuticArea: 'Cardiovascular', mechanism: 'APOC3 antisense', target: 'APOC3 mRNA', nextMilestone: 'Phase 3 data readout Q2 2025', probability: 0.68, peakSales: 850 },
  { id: 'IONS-2', name: 'Pelacarsen', genericName: 'pelacarsen', indication: 'Cardiovascular Disease with Elevated Lp(a)', phase: 'Phase III', therapeuticArea: 'Cardiovascular', mechanism: 'LPA antisense', target: 'LPA mRNA', nextMilestone: 'HORIZON outcomes trial interim Q4 2024', probability: 0.65, peakSales: 3500 },
  { id: 'IONS-3', name: 'ION-373', genericName: 'ION-373', indication: 'Hypertriglyceridemia', phase: 'Phase II', therapeuticArea: 'Cardiovascular', mechanism: 'ANGPTL3 antisense', target: 'ANGPTL3 mRNA', probability: 0.42, peakSales: 1200 },
  { id: 'IONS-4', name: 'ION-224', genericName: 'ION-224', indication: 'Familial Hypercholesterolemia', phase: 'Phase II', therapeuticArea: 'Cardiovascular', mechanism: 'PCSK9 antisense', target: 'PCSK9 mRNA', probability: 0.40, peakSales: 950 },
  { id: 'IONS-5', name: 'ION-682', genericName: 'ION-682', indication: 'Atherosclerotic CVD', phase: 'Phase I', therapeuticArea: 'Cardiovascular', mechanism: 'PNPLA3 antisense', target: 'PNPLA3 mRNA', probability: 0.28, peakSales: 1500 },
  { id: 'IONS-6', name: 'ION-904', genericName: 'ION-904', indication: 'Heart Failure', phase: 'Preclinical', therapeuticArea: 'Cardiovascular', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.15, peakSales: 2800 },
  { id: 'IONS-7', name: 'ION-905', genericName: 'ION-905', indication: 'Thrombotic Disorders', phase: 'Preclinical', therapeuticArea: 'Cardiovascular', mechanism: 'Factor XI antisense', target: 'F11 mRNA', probability: 0.15, peakSales: 1100 },
  { id: 'IONS-8', name: 'ION-906', genericName: 'ION-906', indication: 'Cardiac Fibrosis', phase: 'Preclinical', therapeuticArea: 'Cardiovascular', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.15, peakSales: 850 },

  // Neurology (10 programs)
  { id: 'IONS-9', name: 'Tofersen (BIIB067)', genericName: 'tofersen', indication: 'SOD1-ALS', phase: 'Approved', therapeuticArea: 'Neurology', mechanism: 'SOD1 antisense', target: 'SOD1 mRNA', probability: 1.0, peakSales: 650 },
  { id: 'IONS-10', name: 'ION-363', genericName: 'ION-363', indication: 'FUS-ALS', phase: 'Phase II', therapeuticArea: 'Neurology', mechanism: 'FUS antisense', target: 'FUS mRNA', probability: 0.35, peakSales: 420 },
  { id: 'IONS-11', name: 'ION-464', genericName: 'ION-464', indication: "Huntington's Disease", phase: 'Phase II', therapeuticArea: 'Neurology', mechanism: 'HTT antisense', target: 'HTT mRNA', probability: 0.30, peakSales: 1800 },
  { id: 'IONS-12', name: 'ION-803', genericName: 'ION-803', indication: 'Frontotemporal Dementia', phase: 'Phase II', therapeuticArea: 'Neurology', mechanism: 'MAPT antisense', target: 'MAPT mRNA', probability: 0.32, peakSales: 2200 },
  { id: 'IONS-13', name: 'ION-859', genericName: 'ION-859', indication: "Alzheimer's Disease", phase: 'Phase I', therapeuticArea: 'Neurology', mechanism: 'MAPT antisense', target: 'MAPT mRNA', probability: 0.22, peakSales: 8500 },
  { id: 'IONS-14', name: 'ION-541', genericName: 'ION-541', indication: "Parkinson's Disease", phase: 'Phase I', therapeuticArea: 'Neurology', mechanism: 'SNCA antisense', target: 'SNCA mRNA', probability: 0.20, peakSales: 5500 },
  { id: 'IONS-15', name: 'ION-621', genericName: 'ION-621', indication: 'Multiple Sclerosis', phase: 'Preclinical', therapeuticArea: 'Neurology', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 3200 },
  { id: 'IONS-16', name: 'ION-717', genericName: 'ION-717', indication: 'Epilepsy', phase: 'Preclinical', therapeuticArea: 'Neurology', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 1800 },
  { id: 'IONS-17', name: 'ION-850', genericName: 'ION-850', indication: 'Stroke', phase: 'Preclinical', therapeuticArea: 'Neurology', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 4500 },
  { id: 'IONS-18', name: 'ION-907', genericName: 'ION-907', indication: 'Neuropathic Pain', phase: 'Preclinical', therapeuticArea: 'Neurology', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 2100 },

  // Oncology (6 programs)
  { id: 'IONS-19', name: 'ION-537', genericName: 'ION-537', indication: 'Solid Tumors', phase: 'Phase I', therapeuticArea: 'Oncology', mechanism: 'MYC antisense', target: 'MYC mRNA', probability: 0.18, peakSales: 3500 },
  { id: 'IONS-20', name: 'ION-849', genericName: 'ION-849', indication: 'Hepatocellular Carcinoma', phase: 'Phase I', therapeuticArea: 'Oncology', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.16, peakSales: 2800 },
  { id: 'IONS-21', name: 'ION-722', genericName: 'ION-722', indication: 'Breast Cancer', phase: 'Preclinical', therapeuticArea: 'Oncology', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.10, peakSales: 4200 },
  { id: 'IONS-22', name: 'ION-834', genericName: 'ION-834', indication: 'Prostate Cancer', phase: 'Preclinical', therapeuticArea: 'Oncology', mechanism: 'AR antisense', target: 'AR mRNA', probability: 0.10, peakSales: 3100 },
  { id: 'IONS-23', name: 'ION-908', genericName: 'ION-908', indication: 'Lung Cancer', phase: 'Preclinical', therapeuticArea: 'Oncology', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.10, peakSales: 5500 },
  { id: 'IONS-24', name: 'ION-909', genericName: 'ION-909', indication: 'Melanoma', phase: 'Preclinical', therapeuticArea: 'Oncology', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.10, peakSales: 1900 },

  // Metabolic (8 programs)
  { id: 'IONS-25', name: 'Vupanorsen', genericName: 'vupanorsen', indication: 'Dyslipidemia', phase: 'Phase II', therapeuticArea: 'Metabolic', mechanism: 'ANGPTL3 antisense', target: 'ANGPTL3 mRNA', probability: 0.35, peakSales: 1800 },
  { id: 'IONS-26', name: 'ION-396', genericName: 'ION-396', indication: 'Type 2 Diabetes', phase: 'Phase II', therapeuticArea: 'Metabolic', mechanism: 'GCGR antisense', target: 'GCGR mRNA', probability: 0.38, peakSales: 4500 },
  { id: 'IONS-27', name: 'ION-703', genericName: 'ION-703', indication: 'NASH/NAFLD', phase: 'Phase I', therapeuticArea: 'Metabolic', mechanism: 'DGAT2 antisense', target: 'DGAT2 mRNA', probability: 0.25, peakSales: 6200 },
  { id: 'IONS-28', name: 'ION-775', genericName: 'ION-775', indication: 'Obesity', phase: 'Preclinical', therapeuticArea: 'Metabolic', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 8900 },
  { id: 'IONS-29', name: 'ION-826', genericName: 'ION-826', indication: 'Metabolic Syndrome', phase: 'Preclinical', therapeuticArea: 'Metabolic', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 3400 },
  { id: 'IONS-30', name: 'ION-910', genericName: 'ION-910', indication: 'Hyperlipidemia', phase: 'Preclinical', therapeuticArea: 'Metabolic', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 2800 },
  { id: 'IONS-31', name: 'ION-911', genericName: 'ION-911', indication: 'Glycogen Storage Disease', phase: 'Preclinical', therapeuticArea: 'Metabolic', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 650 },
  { id: 'IONS-32', name: 'ION-912', genericName: 'ION-912', indication: 'Familial Partial Lipodystrophy', phase: 'Preclinical', therapeuticArea: 'Metabolic', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 420 },

  // Renal (5 programs)
  { id: 'IONS-33', name: 'Donidalorsen', genericName: 'donidalorsen', indication: 'Hereditary Angioedema', phase: 'Phase III', therapeuticArea: 'Renal', mechanism: 'Prekallikrein antisense', target: 'KLKB1 mRNA', probability: 0.70, peakSales: 980 },
  { id: 'IONS-34', name: 'ION-449', genericName: 'ION-449', indication: 'IgA Nephropathy', phase: 'Phase II', therapeuticArea: 'Renal', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.32, peakSales: 1500 },
  { id: 'IONS-35', name: 'ION-913', genericName: 'ION-913', indication: 'Chronic Kidney Disease', phase: 'Preclinical', therapeuticArea: 'Renal', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 5800 },
  { id: 'IONS-36', name: 'ION-914', genericName: 'ION-914', indication: 'Polycystic Kidney Disease', phase: 'Preclinical', therapeuticArea: 'Renal', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 2200 },
  { id: 'IONS-37', name: 'ION-915', genericName: 'ION-915', indication: 'Glomerulonephritis', phase: 'Preclinical', therapeuticArea: 'Renal', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 1100 },

  // Rare Disease (5 programs)
  { id: 'IONS-38', name: 'ION-827', genericName: 'ION-827', indication: 'Prion Disease', phase: 'Phase I', therapeuticArea: 'Rare Disease', mechanism: 'PRNP antisense', target: 'PRNP mRNA', probability: 0.24, peakSales: 850 },
  { id: 'IONS-39', name: 'ION-682', genericName: 'ION-682', indication: 'Alpha-1 Antitrypsin Deficiency', phase: 'Preclinical', therapeuticArea: 'Rare Disease', mechanism: 'SERPINA1 antisense', target: 'SERPINA1 mRNA', probability: 0.12, peakSales: 1200 },
  { id: 'IONS-40', name: 'ION-916', genericName: 'ION-916', indication: 'Transthyretin Amyloidosis', phase: 'Preclinical', therapeuticArea: 'Rare Disease', mechanism: 'TTR antisense', target: 'TTR mRNA', probability: 0.12, peakSales: 2800 },
  { id: 'IONS-41', name: 'ION-917', genericName: 'ION-917', indication: 'Fabry Disease', phase: 'Preclinical', therapeuticArea: 'Rare Disease', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 950 },
  { id: 'IONS-42', name: 'ION-918', genericName: 'ION-918', indication: 'Pompe Disease', phase: 'Preclinical', therapeuticArea: 'Rare Disease', mechanism: 'Proprietary antisense', target: 'Undisclosed', probability: 0.12, peakSales: 720 },
];
