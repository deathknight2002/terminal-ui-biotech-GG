/**
 * SEC EDGAR Connector for 8-K Filings
 * 
 * Surfaces 8-K filings that mention clinical endpoints or regulatory updates
 * Uses SEC EDGAR JSON API for efficient retrieval
 */

import { z } from 'zod';

/**
 * SEC 8-K filing schema
 */
const SEC8KFilingSchema = z.object({
  cik: z.string(),
  company: z.string(),
  ticker: z.string().optional(),
  filingDate: z.string(), // ISO 8601 date
  reportDate: z.string().optional(),
  accessionNumber: z.string(),
  filingUrl: z.string(),
  mentionsEndpoints: z.boolean(),
  summary: z.string().optional(),
  clinicalKeywords: z.array(z.string()).optional(),
});

export type SEC8KFiling = z.infer<typeof SEC8KFilingSchema>;

/**
 * 8-K filing contract with provenance
 */
export interface SEC8KFilingContract {
  version: '1.0';
  schema: 'sec-8k-filing';
  data: SEC8KFiling;
  metadata: {
    source: 'SEC EDGAR';
    pulledAt: string; // ISO 8601 timestamp
    indexed: boolean; // Whether filing is indexed by SEC
  };
}

/**
 * SEC EDGAR connector for 8-K filings
 */
export class SECEdgarConnector {
  private baseUrl = 'https://www.sec.gov';
  private headers = {
    'User-Agent': 'Biotech Terminal research@biotech-terminal.com',
    'Accept-Encoding': 'gzip, deflate',
    'Host': 'www.sec.gov',
  };
  
  // Clinical endpoint keywords to filter relevant 8-Ks
  private clinicalKeywords = [
    'phase i', 'phase ii', 'phase iii', 'phase 1', 'phase 2', 'phase 3',
    'clinical trial', 'readout', 'data readout', 'topline',
    'endpoint', 'primary endpoint', 'secondary endpoint',
    'pdufa', 'nda', 'bla', 'fda approval',
    'complete response letter', 'crl',
    'orphan designation', 'breakthrough therapy',
    'fast track', 'priority review',
    'efficacy', 'safety data',
    'pivotal trial', 'pivotal study',
    'regulatory submission', 'regulatory approval',
  ];
  
  /**
   * Get recent 8-K filings for a company by CIK
   */
  async getFilingsByCIK(cik: string, count = 10): Promise<SEC8KFilingContract[]> {
    const pulledAt = new Date().toISOString();
    
    // In production, query SEC EDGAR API:
    // https://data.sec.gov/submissions/CIK{cik}.json
    // Then parse recent 8-K filings
    
    // Mock data for demonstration
    return [
      {
        version: '1.0',
        schema: 'sec-8k-filing',
        data: {
          cik: '0001234567',
          company: 'Company X',
          ticker: 'XYZ',
          filingDate: '2026-03-15',
          reportDate: '2026-03-15',
          accessionNumber: '0001234567-26-000001',
          filingUrl: `${this.baseUrl}/cgi-bin/browse-edgar?action=getcompany&CIK=0001234567`,
          mentionsEndpoints: true,
          summary: 'Phase III readout for DMD program mentioned; primary endpoint NSAA',
          clinicalKeywords: ['phase iii', 'readout', 'primary endpoint'],
        },
        metadata: {
          source: 'SEC EDGAR',
          pulledAt,
          indexed: true,
        },
      },
    ];
  }
  
  /**
   * Get recent 8-K filings for a ticker symbol
   */
  async getFilingsByTicker(ticker: string, count = 10): Promise<SEC8KFilingContract[]> {
    // In production, first resolve ticker to CIK via SEC ticker lookup
    // https://www.sec.gov/files/company_tickers.json
    // Then call getFilingsByCIK
    
    return this.getFilingsByCIK('0001234567', count);
  }
  
  /**
   * Search recent 8-Ks mentioning clinical endpoints
   */
  async searchClinicalEndpointFilings(daysBack = 30): Promise<SEC8KFilingContract[]> {
    const pulledAt = new Date().toISOString();
    
    // In production, use SEC Full-Text Search API:
    // https://www.sec.gov/cgi-bin/srch-edgar
    // Filter by form type "8-K" and keywords
    
    // Mock data showing multiple companies
    return [
      {
        version: '1.0',
        schema: 'sec-8k-filing',
        data: {
          cik: '0001234567',
          company: 'Company X',
          ticker: 'XYZ',
          filingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          accessionNumber: '0001234567-26-000002',
          filingUrl: `${this.baseUrl}/cgi-bin/browse-edgar?action=getcompany&CIK=0001234567`,
          mentionsEndpoints: true,
          summary: 'Announced Phase III trial initiation with primary endpoint of clinical remission',
          clinicalKeywords: ['phase iii', 'clinical trial', 'primary endpoint'],
        },
        metadata: {
          source: 'SEC EDGAR',
          pulledAt,
          indexed: true,
        },
      },
      {
        version: '1.0',
        schema: 'sec-8k-filing',
        data: {
          cik: '0007654321',
          company: 'Company Y',
          ticker: 'ABC',
          filingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          accessionNumber: '0007654321-26-000005',
          filingUrl: `${this.baseUrl}/cgi-bin/browse-edgar?action=getcompany&CIK=0007654321`,
          mentionsEndpoints: true,
          summary: 'Complete Response Letter received; addressing chemistry manufacturing controls',
          clinicalKeywords: ['complete response letter', 'crl'],
        },
        metadata: {
          source: 'SEC EDGAR',
          pulledAt,
          indexed: true,
        },
      },
    ];
  }
  
  /**
   * Check if filing text contains clinical keywords
   */
  private containsClinicalKeywords(text: string): { matches: boolean; keywords: string[] } {
    const lowerText = text.toLowerCase();
    const foundKeywords = this.clinicalKeywords.filter(keyword => 
      lowerText.includes(keyword)
    );
    
    return {
      matches: foundKeywords.length > 0,
      keywords: foundKeywords,
    };
  }
}
