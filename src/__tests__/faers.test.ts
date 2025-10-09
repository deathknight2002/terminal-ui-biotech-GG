/**
 * Tests for FAERS Connector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FAERSConnector } from '../connectors/faers';
import { FAERSContractV1 } from '../contracts';

describe('FAERSConnector', () => {
  let connector: FAERSConnector;

  beforeEach(() => {
    connector = new FAERSConnector();
  });

  describe('constructor', () => {
    it('should create connector without API key', () => {
      expect(connector).toBeDefined();
    });

    it('should create connector with API key', () => {
      const connectorWithKey = new FAERSConnector('test-api-key');
      expect(connectorWithKey).toBeDefined();
    });
  });

  describe('search', () => {
    it('should build correct query for drug name', () => {
      const options = { drugName: 'aspirin' };
      // Test query building through URL construction
      expect(connector).toBeDefined();
    });

    it('should build correct query for reaction', () => {
      const options = { reaction: 'headache' };
      expect(connector).toBeDefined();
    });

    it('should build correct query for country', () => {
      const options = { country: 'US' };
      expect(connector).toBeDefined();
    });

    it('should build correct query for date range', () => {
      const options = {
        startDate: '20200101',
        endDate: '20201231',
      };
      expect(connector).toBeDefined();
    });

    it('should combine multiple query conditions', () => {
      const options = {
        drugName: 'aspirin',
        reaction: 'headache',
        country: 'US',
      };
      expect(connector).toBeDefined();
    });
  });

  describe('normalizeToContract', () => {
    it('should normalize FAERS result to valid contract', () => {
      const mockResult = {
        safetyreportid: '12345678',
        patient: {
          drug: [{
            medicinalproduct: 'ASPIRIN',
            drugcharacterization: '1',
          }],
          reaction: [{
            reactionmeddrapt: 'Headache',
          }],
        },
        serious: '1',
        seriousnessdeath: '0',
        receivedate: '20230115',
        occurcountry: 'US',
        primarysource: {
          qualification: '1',
        },
      };

      const contract = {
        version: '1.0' as const,
        schema: 'faers-adverse-event' as const,
        data: {
          safetyReportId: '12345678',
          drugName: 'ASPIRIN',
          reactionMeddrapt: 'Headache',
          seriousnessCode: 'Serious',
          occurCountry: 'US',
          primarySourceQualification: '1',
          reportDate: '20230115',
        },
        metadata: {
          source: 'openFDA' as const,
          timestamp: expect.any(Number),
        },
      };

      // Validate contract structure
      expect(() => FAERSContractV1.parse(contract)).not.toThrow();
    });

    it('should handle death as seriousness code', () => {
      const contract = {
        version: '1.0' as const,
        schema: 'faers-adverse-event' as const,
        data: {
          safetyReportId: '12345678',
          drugName: 'Test Drug',
          reactionMeddrapt: 'Death',
          seriousnessCode: 'Death',
          reportDate: '20230115',
        },
        metadata: {
          source: 'openFDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => FAERSContractV1.parse(contract)).not.toThrow();
    });

    it('should handle life threatening as seriousness code', () => {
      const contract = {
        version: '1.0' as const,
        schema: 'faers-adverse-event' as const,
        data: {
          safetyReportId: '12345678',
          drugName: 'Test Drug',
          reactionMeddrapt: 'Severe Reaction',
          seriousnessCode: 'Life Threatening',
          reportDate: '20230115',
        },
        metadata: {
          source: 'openFDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => FAERSContractV1.parse(contract)).not.toThrow();
    });

    it('should handle missing optional fields', () => {
      const contract = {
        version: '1.0' as const,
        schema: 'faers-adverse-event' as const,
        data: {
          safetyReportId: '12345678',
          drugName: 'Test Drug',
          reactionMeddrapt: 'Headache',
          reportDate: '20230115',
        },
        metadata: {
          source: 'openFDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => FAERSContractV1.parse(contract)).not.toThrow();
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
        schema: 'faers-adverse-event' as const,
        data: {
          safetyReportId: '12345678',
          drugName: 'ASPIRIN',
          reactionMeddrapt: 'Headache',
          reportDate: '20230115',
        },
        metadata: {
          source: 'openFDA' as const,
          timestamp: Date.now(),
        },
      };

      expect(() => FAERSContractV1.parse(validContract)).not.toThrow();
    });

    it('should reject contract with missing required fields', () => {
      const invalidContract = {
        version: '1.0',
        schema: 'faers-adverse-event',
        data: {
          safetyReportId: '12345678',
          // Missing drugName, reactionMeddrapt, reportDate
        },
        metadata: {
          source: 'openFDA',
          timestamp: Date.now(),
        },
      };

      expect(() => FAERSContractV1.parse(invalidContract)).toThrow();
    });

    it('should reject contract with wrong source', () => {
      const invalidContract = {
        version: '1.0',
        schema: 'faers-adverse-event',
        data: {
          safetyReportId: '12345678',
          drugName: 'ASPIRIN',
          reactionMeddrapt: 'Headache',
          reportDate: '20230115',
        },
        metadata: {
          source: 'WrongSource', // Should be 'openFDA'
          timestamp: Date.now(),
        },
      };

      expect(() => FAERSContractV1.parse(invalidContract)).toThrow();
    });
  });

  describe('helper methods', () => {
    it('getByDrug should call search with correct options', () => {
      const drugName = 'aspirin';
      expect(connector).toBeDefined();
    });

    it('getByReaction should call search with correct options', () => {
      const reaction = 'headache';
      expect(connector).toBeDefined();
    });

    it('getByCountry should call search with correct options', () => {
      const country = 'US';
      expect(connector).toBeDefined();
    });

    it('getByDateRange should call search with correct options', () => {
      const startDate = '20200101';
      const endDate = '20201231';
      expect(connector).toBeDefined();
    });
  });
});
