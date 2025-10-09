/**
 * Ontology - Canonical biomedical ontology mappings
 * 
 * Provides standardized ID mapping for genes, proteins, diseases, and units
 * Supporting: HGNC, UniProt, MONDO, DOID, OncoTree, UCUM
 */

/**
 * Gene/Target Ontology
 */
export interface GeneTarget {
  hgncId?: string;        // HGNC:5 (EGFR)
  hgncSymbol: string;     // EGFR
  uniprotId?: string;     // P00533
  entrezId?: number;      // 1956
  ensemblId?: string;     // ENSG00000146648
}

/**
 * Disease Ontology
 */
export interface DiseaseOntology {
  mondoId?: string;       // MONDO:0004992 (cancer)
  doidId?: string;        // DOID:162 (cancer)
  oncoTreeCode?: string;  // LUAD (lung adenocarcinoma)
  icd10?: string;         // C34.9
  icd11?: string;         // 2C25
  name: string;
}

/**
 * Unit Normalization (UCUM - Unified Code for Units of Measure)
 */
export interface UnitNormalized {
  value: number;
  unit: string;         // UCUM format: mg/m2, ng/mL.h
  standardUnit: string; // Normalized: mg_per_m2
  siValue?: number;     // SI conversion if applicable
}

/**
 * Gene/Target mapping utilities
 */
export const GeneMapper = {
  /**
   * Common HGNC symbol to UniProt mappings
   */
  hgncToUniprot: new Map<string, string>([
    ['EGFR', 'P00533'],
    ['KRAS', 'P01116'],
    ['TP53', 'P04637'],
    ['BRAF', 'P15056'],
    ['PIK3CA', 'P42336'],
    ['ALK', 'Q9UM73'],
    ['ROS1', 'P08922'],
    ['MET', 'P08581'],
    ['HER2', 'P04626'],  // ERBB2
    ['ERBB2', 'P04626'],
    ['VEGF', 'P15692'],  // VEGFA
    ['VEGFA', 'P15692'],
    ['PD1', 'Q15116'],   // PDCD1
    ['PDCD1', 'Q15116'],
    ['PDL1', 'Q9NZQ7'],  // CD274
    ['CD274', 'Q9NZQ7'],
    ['CTLA4', 'P16410'],
  ]),

  /**
   * Get UniProt ID from HGNC symbol
   */
  getUniProt(hgncSymbol: string): string | undefined {
    return this.hgncToUniprot.get(hgncSymbol.toUpperCase());
  },

  /**
   * Create a gene target object
   */
  createTarget(hgncSymbol: string, options?: {
    uniprotId?: string;
    entrezId?: number;
  }): GeneTarget {
    const symbol = hgncSymbol.toUpperCase();
    return {
      hgncSymbol: symbol,
      uniprotId: options?.uniprotId || this.getUniProt(symbol),
      entrezId: options?.entrezId,
    };
  },
};

/**
 * Disease mapping utilities
 */
export const DiseaseMapper = {
  /**
   * OncoTree to MONDO mappings (cancer subtypes)
   */
  oncoTreeToMondo: new Map<string, string>([
    ['LUAD', 'MONDO:0005061'],  // Lung adenocarcinoma
    ['LUSC', 'MONDO:0005097'],  // Lung squamous cell carcinoma
    ['SCLC', 'MONDO:0008433'],  // Small cell lung cancer
    ['NSCLC', 'MONDO:0005233'], // Non-small cell lung cancer
    ['BRCA', 'MONDO:0007254'],  // Breast carcinoma
    ['CRC', 'MONDO:0005575'],   // Colorectal cancer
    ['COAD', 'MONDO:0005008'],  // Colon adenocarcinoma
    ['PAAD', 'MONDO:0005192'],  // Pancreatic adenocarcinoma
    ['GBM', 'MONDO:0018177'],   // Glioblastoma
    ['MM', 'MONDO:0009693'],    // Multiple myeloma
    ['AML', 'MONDO:0018874'],   // Acute myeloid leukemia
    ['CLL', 'MONDO:0004948'],   // Chronic lymphocytic leukemia
  ]),

  /**
   * Common disease names to ontology codes
   */
  nameToOntology: new Map<string, { mondo?: string; doid?: string; oncoTree?: string }>([
    ['lung adenocarcinoma', { mondo: 'MONDO:0005061', oncoTree: 'LUAD' }],
    ['lung cancer', { mondo: 'MONDO:0008903', doid: 'DOID:1324' }],
    ['breast cancer', { mondo: 'MONDO:0007254', doid: 'DOID:1612', oncoTree: 'BRCA' }],
    ['colorectal cancer', { mondo: 'MONDO:0005575', doid: 'DOID:9256', oncoTree: 'CRC' }],
    ['melanoma', { mondo: 'MONDO:0005105', doid: 'DOID:1909' }],
    ['glioblastoma', { mondo: 'MONDO:0018177', doid: 'DOID:3068', oncoTree: 'GBM' }],
  ]),

  /**
   * Get MONDO ID from OncoTree code
   */
  getMondoFromOncoTree(oncoTreeCode: string): string | undefined {
    return this.oncoTreeToMondo.get(oncoTreeCode.toUpperCase());
  },

  /**
   * Create a disease ontology object
   */
  createDisease(name: string, options?: {
    mondoId?: string;
    doidId?: string;
    oncoTreeCode?: string;
  }): DiseaseOntology {
    const normalized = name.toLowerCase();
    const ontology = this.nameToOntology.get(normalized);
    
    return {
      name,
      mondoId: options?.mondoId || ontology?.mondo,
      doidId: options?.doidId || ontology?.doid,
      oncoTreeCode: options?.oncoTreeCode || ontology?.oncoTree,
    };
  },
};

/**
 * Unit normalization utilities (UCUM)
 */
export const UnitMapper = {
  /**
   * Common unit conversions to UCUM format
   */
  toUCUM: new Map<string, string>([
    ['mg/m2', 'mg/m2'],
    ['mg/m²', 'mg/m2'],
    ['ng/mL', 'ng/mL'],
    ['ng/ml', 'ng/mL'],
    ['ng/mL*h', 'ng.mL-1.h'],
    ['ng/mL·h', 'ng.mL-1.h'],
    ['µg/mL', 'ug/mL'],
    ['mcg/mL', 'ug/mL'],
    ['mg/kg', 'mg/kg'],
    ['mg/dL', 'mg/dL'],
    ['mmol/L', 'mmol/L'],
    ['IU/mL', '[IU]/mL'],
  ]),

  /**
   * Normalize a unit to UCUM format
   */
  normalize(value: number, unit: string): UnitNormalized {
    const ucumUnit = this.toUCUM.get(unit) || unit;
    const standardUnit = ucumUnit.replace(/[^a-zA-Z0-9]/g, '_');
    
    return {
      value,
      unit: ucumUnit,
      standardUnit,
    };
  },

  /**
   * Parse dose string (e.g., "150 mg/m2" -> normalized)
   */
  parseDose(doseString: string): UnitNormalized | null {
    const match = doseString.match(/^([\d.]+)\s*([^\d\s].*)$/);
    if (!match) return null;
    
    const value = parseFloat(match[1]);
    const unit = match[2].trim();
    
    return this.normalize(value, unit);
  },
};

/**
 * Export all mappers
 */
export const Ontology = {
  Gene: GeneMapper,
  Disease: DiseaseMapper,
  Unit: UnitMapper,
};
