/**
 * Tests for Data Contracts
 */

import { describe, it, expect } from 'vitest';
import {
  DrugDataContract,
  ContractValidators,
  ClinicalTrialContract,
  MarketDataContract,
} from '../data-contracts';

describe('Data Contracts', () => {
  describe('DrugDataContract', () => {
    it('should create valid drug data contract', () => {
      const contract: DrugDataContract = {
        version: '1.0',
        schema: 'drug',
        data: {
          id: 'DRUG-001',
          name: 'Test Drug',
          indication: 'Test Indication',
          phase: 'Phase III',
          sponsor: 'Test Pharma',
          therapeuticArea: 'Oncology',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          confidence: 0.9,
        },
      };

      expect(contract.schema).toBe('drug');
      expect(contract.data.id).toBe('DRUG-001');
    });
  });

  describe('ClinicalTrialContract', () => {
    it('should create valid clinical trial contract', () => {
      const contract: ClinicalTrialContract = {
        version: '1.0',
        schema: 'clinical-trial',
        data: {
          id: 'TRIAL-001',
          drugId: 'DRUG-001',
          phase: 'Phase III',
          status: 'Active',
          enrollmentTarget: 500,
          enrollmentActual: 250,
          startDate: '2024-01-01',
          primaryEndpoint: 'Overall Survival',
        },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          lastUpdated: Date.now(),
        },
      };

      expect(contract.schema).toBe('clinical-trial');
      expect(contract.data.status).toBe('Active');
    });
  });

  describe('MarketDataContract', () => {
    it('should create valid market data contract', () => {
      const contract: MarketDataContract = {
        version: '1.0',
        schema: 'market-data',
        data: {
          symbol: 'BIOTECH',
          price: 150.50,
          change: 5.25,
          changePercent: 3.5,
          volume: 1000000,
          timestamp: Date.now(),
        },
        metadata: {
          source: 'market-feed',
          exchange: 'NASDAQ',
          delayed: false,
        },
      };

      expect(contract.schema).toBe('market-data');
      expect(contract.data.symbol).toBe('BIOTECH');
    });
  });

  describe('ContractValidators', () => {
    describe('isDrugData', () => {
      it('should validate correct drug data', () => {
        const contract: DrugDataContract = {
          version: '1.0',
          schema: 'drug',
          data: {
            id: 'DRUG-001',
            name: 'Test',
            indication: 'Test',
            phase: 'Phase III',
            sponsor: 'Test',
            therapeuticArea: 'Test',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            confidence: 0.9,
          },
        };

        expect(ContractValidators.isDrugData(contract)).toBe(true);
      });

      it('should reject invalid drug data', () => {
        const invalid = {
          schema: 'wrong',
          data: {},
        };

        expect(ContractValidators.isDrugData(invalid)).toBe(false);
      });

      it('should reject missing id', () => {
        const invalid = {
          schema: 'drug',
          data: { name: 'Test' },
        };

        expect(ContractValidators.isDrugData(invalid)).toBe(false);
      });
    });

    describe('isClinicalTrial', () => {
      it('should validate correct clinical trial data', () => {
        const contract: ClinicalTrialContract = {
          version: '1.0',
          schema: 'clinical-trial',
          data: {
            id: 'TRIAL-001',
            drugId: 'DRUG-001',
            phase: 'Phase III',
            status: 'Active',
            enrollmentTarget: 500,
            enrollmentActual: 250,
            startDate: '2024-01-01',
            primaryEndpoint: 'Overall Survival',
          },
          metadata: {
            source: 'test',
            timestamp: Date.now(),
            lastUpdated: Date.now(),
          },
        };

        expect(ContractValidators.isClinicalTrial(contract)).toBe(true);
      });

      it('should reject invalid clinical trial data', () => {
        const invalid = {
          schema: 'clinical-trial',
          data: {},
        };

        expect(ContractValidators.isClinicalTrial(invalid)).toBe(false);
      });
    });

    describe('isMarketData', () => {
      it('should validate correct market data', () => {
        const contract: MarketDataContract = {
          version: '1.0',
          schema: 'market-data',
          data: {
            symbol: 'BIOTECH',
            price: 150.50,
            change: 5.25,
            changePercent: 3.5,
            volume: 1000000,
            timestamp: Date.now(),
          },
          metadata: {
            source: 'market-feed',
            exchange: 'NASDAQ',
            delayed: false,
          },
        };

        expect(ContractValidators.isMarketData(contract)).toBe(true);
      });

      it('should reject invalid market data', () => {
        const invalid = {
          schema: 'market-data',
          data: {},
        };

        expect(ContractValidators.isMarketData(invalid)).toBe(false);
      });
    });

    describe('validateContract', () => {
      it('should validate correct contract', () => {
        const contract = {
          version: '1.0',
          schema: 'drug',
          data: { id: 'DRUG-001' },
          metadata: { source: 'test' },
        };

        const result = ContractValidators.validateContract(contract, 'drug');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing data', () => {
        const result = ContractValidators.validateContract(null, 'drug');

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('REQUIRED');
      });

      it('should detect schema mismatch', () => {
        const contract = {
          version: '1.0',
          schema: 'wrong',
          data: {},
        };

        const result = ContractValidators.validateContract(contract, 'drug');

        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'SCHEMA_MISMATCH')).toBe(true);
      });

      it('should warn about missing version', () => {
        const contract = {
          schema: 'drug',
          data: {},
        };

        const result = ContractValidators.validateContract(contract, 'drug');

        expect(result.warnings.some(w => w.code === 'MISSING_VERSION')).toBe(true);
      });

      it('should warn about missing metadata', () => {
        const contract = {
          version: '1.0',
          schema: 'drug',
          data: {},
        };

        const result = ContractValidators.validateContract(contract, 'drug');

        expect(result.warnings.some(w => w.code === 'MISSING_METADATA')).toBe(true);
      });
    });
  });
});
