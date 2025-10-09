/**
 * Tests for Ontology mappings
 */

import { describe, it, expect } from 'vitest';
import { GeneMapper, DiseaseMapper, UnitMapper, Ontology } from '../ontology';

describe('Ontology', () => {
  describe('GeneMapper', () => {
    it('should map HGNC symbol to UniProt ID', () => {
      expect(GeneMapper.getUniProt('EGFR')).toBe('P00533');
      expect(GeneMapper.getUniProt('KRAS')).toBe('P01116');
      expect(GeneMapper.getUniProt('TP53')).toBe('P04637');
    });

    it('should handle case-insensitive symbols', () => {
      expect(GeneMapper.getUniProt('egfr')).toBe('P00533');
      expect(GeneMapper.getUniProt('EgFr')).toBe('P00533');
    });

    it('should return undefined for unknown genes', () => {
      expect(GeneMapper.getUniProt('UNKNOWN_GENE')).toBeUndefined();
    });

    it('should create gene target object', () => {
      const target = GeneMapper.createTarget('EGFR');
      
      expect(target.hgncSymbol).toBe('EGFR');
      expect(target.uniprotId).toBe('P00533');
    });

    it('should create gene target with custom UniProt ID', () => {
      const target = GeneMapper.createTarget('TEST', { uniprotId: 'P12345' });
      
      expect(target.hgncSymbol).toBe('TEST');
      expect(target.uniprotId).toBe('P12345');
    });
  });

  describe('DiseaseMapper', () => {
    it('should map OncoTree code to MONDO ID', () => {
      expect(DiseaseMapper.getMondoFromOncoTree('LUAD')).toBe('MONDO:0005061');
      expect(DiseaseMapper.getMondoFromOncoTree('BRCA')).toBe('MONDO:0007254');
      expect(DiseaseMapper.getMondoFromOncoTree('GBM')).toBe('MONDO:0018177');
    });

    it('should handle case-insensitive OncoTree codes', () => {
      expect(DiseaseMapper.getMondoFromOncoTree('luad')).toBe('MONDO:0005061');
    });

    it('should return undefined for unknown OncoTree codes', () => {
      expect(DiseaseMapper.getMondoFromOncoTree('UNKNOWN')).toBeUndefined();
    });

    it('should create disease ontology object from name', () => {
      const disease = DiseaseMapper.createDisease('lung adenocarcinoma');
      
      expect(disease.name).toBe('lung adenocarcinoma');
      expect(disease.mondoId).toBe('MONDO:0005061');
      expect(disease.oncoTreeCode).toBe('LUAD');
    });

    it('should create disease ontology with custom codes', () => {
      const disease = DiseaseMapper.createDisease('Custom Disease', {
        mondoId: 'MONDO:9999999',
        doidId: 'DOID:9999999',
      });
      
      expect(disease.name).toBe('Custom Disease');
      expect(disease.mondoId).toBe('MONDO:9999999');
      expect(disease.doidId).toBe('DOID:9999999');
    });
  });

  describe('UnitMapper', () => {
    it('should normalize common units to UCUM', () => {
      const normalized = UnitMapper.normalize(150, 'mg/m2');
      
      expect(normalized.value).toBe(150);
      expect(normalized.unit).toBe('mg/m2');
      expect(normalized.standardUnit).toBe('mg_m2');
    });

    it('should convert µg to ug in UCUM', () => {
      const normalized = UnitMapper.normalize(10, 'µg/mL');
      
      expect(normalized.unit).toBe('ug/mL');
    });

    it('should parse dose string', () => {
      const dose = UnitMapper.parseDose('150 mg/m2');
      
      expect(dose).not.toBeNull();
      expect(dose?.value).toBe(150);
      expect(dose?.unit).toBe('mg/m2');
    });

    it('should parse dose with decimal', () => {
      const dose = UnitMapper.parseDose('2.5 mg/kg');
      
      expect(dose).not.toBeNull();
      expect(dose?.value).toBe(2.5);
      expect(dose?.unit).toBe('mg/kg');
    });

    it('should return null for invalid dose string', () => {
      expect(UnitMapper.parseDose('invalid')).toBeNull();
      expect(UnitMapper.parseDose('no numbers')).toBeNull();
    });
  });

  describe('Ontology combined', () => {
    it('should export all mappers', () => {
      expect(Ontology.Gene).toBe(GeneMapper);
      expect(Ontology.Disease).toBe(DiseaseMapper);
      expect(Ontology.Unit).toBe(UnitMapper);
    });
  });
});
