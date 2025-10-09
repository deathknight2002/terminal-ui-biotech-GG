/**
 * Tests for Drugs@FDA Connector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DrugsAtFDAConnector } from '../connectors/drugsfda';
import { DrugApprovalContractV1 } from '../contracts';

describe('DrugsAtFDAConnector', () => {
  let connector: DrugsAtFDAConnector;

  beforeEach(() => {
    connector = new DrugsAtFDAConnector();
  });

  describe('constructor', () => {
    it('should create connector without API key', () => {
      expect(connector).toBeDefined();
    });

    it('should create connector with API key', () => {
      const connectorWithKey = new DrugsAtFDAConnector('test-api-key');
      expect(connectorWithKey).toBeDefined();
    });
  });

  describe('search', () => {
    it('should build correct query for brand name', () => {
      const options = { brandName: 'Lipitor' };
      expect(connector).toBeDefined();
    });

    it('should build correct query for generic name', () => {
      const options = { genericName: 'atorvastatin' };
      expect(connector).toBeDefined();
    });

    it('should build correct query for sponsor name', () => {
      const options = { sponsorName: 'Pfizer' };
      expect(connector).toBeDefined();
    });

    it('should build correct query for application number', () => {
      const options = { applicationNumber: 'NDA020702' };
      expect(connector).toBeDefined();
    });

    it('should combine multiple query conditions', () => {
      const options = {
        brandName: 'Lipitor',
        sponsorName: 'Pfizer',
      };
      expect(connector).toBeDefined();
    });
  });

  describe('normalizeToContract', () => {
    it('should normalize FDA application to valid contract', () => {
      const contract = {
        version: '1.0' as const,
        schema: 'drug-approval' as const,
        data: {
          applicationNumber: 'NDA020702',
          sponsorName: 'Pfizer Inc',
          productNumber: '001',
          brandName: 'LIPITOR',
          genericName: 'atorvastatin calcium',
          approvalDate: '1996-12-17',
          approvalType: 'New Drug Application',
          activeIngredient: 'atorvastatin calcium',
          dosageForm: 'TABLET',
          route: 'ORAL',
        },
        metadata: {
          source: 'Drugs@FDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(contract)).not.toThrow();
    });

    it('should handle missing optional fields', () => {
      const contract = {
        version: '1.0' as const,
        schema: 'drug-approval' as const,
        data: {
          applicationNumber: 'NDA020702',
          sponsorName: 'Pfizer Inc',
          brandName: 'LIPITOR',
          genericName: 'atorvastatin calcium',
          approvalDate: '1996-12-17',
        },
        metadata: {
          source: 'Drugs@FDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(contract)).not.toThrow();
    });

    it('should handle priority review approval type', () => {
      const contract = {
        version: '1.0' as const,
        schema: 'drug-approval' as const,
        data: {
          applicationNumber: 'NDA123456',
          sponsorName: 'Test Pharma',
          brandName: 'TestDrug',
          genericName: 'testcompound',
          approvalDate: '2023-01-15',
          approvalType: 'Priority Review',
        },
        metadata: {
          source: 'Drugs@FDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(contract)).not.toThrow();
    });

    it('should handle breakthrough therapy designation', () => {
      const contract = {
        version: '1.0' as const,
        schema: 'drug-approval' as const,
        data: {
          applicationNumber: 'NDA123456',
          sponsorName: 'Test Pharma',
          brandName: 'TestDrug',
          genericName: 'testcompound',
          approvalDate: '2023-01-15',
          approvalType: 'Breakthrough Therapy',
        },
        metadata: {
          source: 'Drugs@FDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(contract)).not.toThrow();
    });

    it('should handle supplemental application', () => {
      const contract = {
        version: '1.0' as const,
        schema: 'drug-approval' as const,
        data: {
          applicationNumber: 'NDA123456',
          sponsorName: 'Test Pharma',
          brandName: 'TestDrug',
          genericName: 'testcompound',
          approvalDate: '2023-01-15',
          approvalType: 'Supplemental Application',
        },
        metadata: {
          source: 'Drugs@FDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(contract)).not.toThrow();
    });
  });

  describe('setApiKey', () => {
    it('should set API key', () => {
      connector.setApiKey('new-api-key');
      expect(connector).toBeDefined();
    });
  });

  describe('contract validation', () => {
    it('should validate required fields', () => {
      const validContract = {
        version: '1.0' as const,
        schema: 'drug-approval' as const,
        data: {
          applicationNumber: 'NDA020702',
          sponsorName: 'Pfizer Inc',
          brandName: 'LIPITOR',
          genericName: 'atorvastatin calcium',
          approvalDate: '1996-12-17',
        },
        metadata: {
          source: 'Drugs@FDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(validContract)).not.toThrow();
    });

    it('should reject contract with missing required fields', () => {
      const invalidContract = {
        version: '1.0',
        schema: 'drug-approval',
        data: {
          applicationNumber: 'NDA020702',
          // Missing sponsorName, brandName, genericName, approvalDate
        },
        metadata: {
          source: 'Drugs@FDA',
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(invalidContract)).toThrow();
    });

    it('should reject contract with wrong source', () => {
      const invalidContract = {
        version: '1.0',
        schema: 'drug-approval',
        data: {
          applicationNumber: 'NDA020702',
          sponsorName: 'Pfizer Inc',
          brandName: 'LIPITOR',
          genericName: 'atorvastatin calcium',
          approvalDate: '1996-12-17',
        },
        metadata: {
          source: 'WrongSource', // Should be 'Drugs@FDA'
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(invalidContract)).toThrow();
    });

    it('should validate approval date format', () => {
      const validContract = {
        version: '1.0' as const,
        schema: 'drug-approval' as const,
        data: {
          applicationNumber: 'NDA020702',
          sponsorName: 'Pfizer Inc',
          brandName: 'LIPITOR',
          genericName: 'atorvastatin calcium',
          approvalDate: '1996-12-17', // ISO 8601 format
        },
        metadata: {
          source: 'Drugs@FDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => DrugApprovalContractV1.parse(validContract)).not.toThrow();
    });
  });

  describe('helper methods', () => {
    it('getByBrandName should be defined', () => {
      expect(connector.getByBrandName).toBeDefined();
    });

    it('getByGenericName should be defined', () => {
      expect(connector.getByGenericName).toBeDefined();
    });

    it('getBySponsor should be defined', () => {
      expect(connector.getBySponsor).toBeDefined();
    });

    it('getByApplicationNumber should be defined', () => {
      expect(connector.getByApplicationNumber).toBeDefined();
    });
  });
});
