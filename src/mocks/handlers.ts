import { http, HttpResponse } from 'msw';

// OpenBB API base URL
const OPENBB_API_BASE = 'https://api.openbb.co/v1';

// Mock data for different endpoints - Real Biotech Companies from DMD and Cardiology Primers
const mockMarketData = {
  // DMD Companies (from Duchenne Muscular Dystrophy primer)
  SRPT: {
    symbol: 'SRPT',
    price: 115.42,
    change: 3.25,
    changePercent: 2.90,
    volume: 1234567,
    marketCap: 11200000000,
    pe: -18.5,  // Not profitable yet
    dividend: 0.0,
    lastUpdated: new Date().toISOString()
  },
  BMRN: {
    symbol: 'BMRN',
    price: 78.34,
    change: -1.23,
    changePercent: -1.55,
    volume: 987654,
    marketCap: 15800000000,
    pe: -12.3,
    dividend: 0.0,
    lastUpdated: new Date().toISOString()
  },
  ARWR: {
    symbol: 'ARWR',
    price: 28.67,
    change: 1.45,
    changePercent: 5.33,
    volume: 2345678,
    marketCap: 4100000000,
    pe: -8.7,
    dividend: 0.0,
    lastUpdated: new Date().toISOString()
  },
  // Cardiology Companies
  AMGN: {
    symbol: 'AMGN',
    price: 295.12,
    change: -3.44,
    changePercent: -1.15,
    volume: 2456789,
    marketCap: 148000000000,
    pe: 15.2,
    dividend: 7.28,
    lastUpdated: new Date().toISOString()
  },
  CYTK: {
    symbol: 'CYTK',
    price: 52.18,
    change: 2.34,
    changePercent: 4.69,
    volume: 856234,
    marketCap: 3200000000,
    pe: -15.6,
    dividend: 0.0,
    lastUpdated: new Date().toISOString()
  },
  LLY: {
    symbol: 'LLY',
    price: 825.43,
    change: 12.55,
    changePercent: 1.54,
    volume: 3456789,
    marketCap: 750000000000,
    pe: 68.5,
    dividend: 3.92,
    lastUpdated: new Date().toISOString()
  },
  // Additional Biotech Companies
  GILD: {
    symbol: 'GILD',
    price: 68.45,
    change: 1.23,
    changePercent: 1.83,
    volume: 5234567,
    marketCap: 85000000000,
    pe: 11.5,
    dividend: 2.84,
    lastUpdated: new Date().toISOString()
  },
  BIIB: {
    symbol: 'BIIB',
    price: 245.67,
    change: 4.32,
    changePercent: 1.79,
    volume: 1234567,
    marketCap: 35000000000,
    pe: 13.8,
    dividend: 0.0,
    lastUpdated: new Date().toISOString()
  },
  REGN: {
    symbol: 'REGN',
    price: 876.23,
    change: -12.45,
    changePercent: -1.40,
    volume: 876543,
    marketCap: 95000000000,
    pe: 16.7,
    dividend: 0.0,
    lastUpdated: new Date().toISOString()
  }
};

// Real biotech companies from DMD, Cardiology, and IBD research primers
const mockBiotechScreener = [
  // DMD Companies
  {
    symbol: 'SRPT',
    name: 'Sarepta Therapeutics',
    marketCap: 11200000000,
    price: 115.42,
    change: 2.90,
    volume: 1234567,
    pe: -18.5,
    pipeline: 'Gene Therapy/DMD',
    phase: 'Marketed/Phase III',
    indication: 'Duchenne Muscular Dystrophy'
  },
  {
    symbol: 'BMRN',
    name: 'BioMarin Pharmaceutical',
    marketCap: 15800000000,
    price: 78.34,
    change: -1.55,
    volume: 987654,
    pe: -12.3,
    pipeline: 'Rare Disease/Gene Therapy',
    phase: 'Marketed',
    indication: 'Multiple Rare Diseases'
  },
  {
    symbol: 'ARWR',
    name: 'Arrowhead Pharmaceuticals',
    marketCap: 4100000000,
    price: 28.67,
    change: 5.33,
    volume: 2345678,
    pe: -8.7,
    pipeline: 'RNAi Therapeutics',
    phase: 'Phase II/III',
    indication: 'Cardiology/Rare Disease'
  },
  // Cardiology Companies
  {
    symbol: 'AMGN',
    name: 'Amgen Inc.',
    marketCap: 148000000000,
    price: 295.12,
    change: -1.15,
    volume: 2456789,
    pe: 15.2,
    pipeline: 'Cardiology/Oncology/Inflammation',
    phase: 'Marketed',
    indication: 'Multiple'
  },
  {
    symbol: 'CYTK',
    name: 'Cytokinetics Inc',
    marketCap: 3200000000,
    price: 52.18,
    change: 4.69,
    volume: 856234,
    pe: -15.6,
    pipeline: 'Cardiac Myosin Inhibition',
    phase: 'Phase III',
    indication: 'Hypertrophic Cardiomyopathy'
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    marketCap: 750000000000,
    price: 825.43,
    change: 1.54,
    volume: 3456789,
    pe: 68.5,
    pipeline: 'Diabetes/Obesity/Cardiology',
    phase: 'Marketed',
    indication: 'Multiple'
  },
  // Other Key Biotech
  {
    symbol: 'GILD',
    name: 'Gilead Sciences Inc.',
    marketCap: 85000000000,
    price: 68.45,
    change: 1.83,
    volume: 5234567,
    pe: 11.5,
    pipeline: 'Virology/Oncology/IBD',
    phase: 'Marketed',
    indication: 'HIV/HBV/Cancer'
  },
  {
    symbol: 'BIIB',
    name: 'Biogen Inc.',
    marketCap: 35000000000,
    price: 245.67,
    change: 1.79,
    volume: 1234567,
    pe: 13.8,
    pipeline: 'Neurology',
    phase: 'Phase III',
    indication: 'Alzheimer\'s/MS'
  },
  {
    symbol: 'REGN',
    name: 'Regeneron Pharmaceuticals',
    marketCap: 95000000000,
    price: 876.23,
    change: -1.40,
    volume: 876543,
    pe: 16.7,
    pipeline: 'Oncology/Ophthalmology',
    phase: 'Marketed',
    indication: 'Cancer/AMD'
  }
];

// Real clinical trials from DMD and Cardiology companies
const mockClinicalTrials = {
  SRPT: [
    {
      id: 'NCT05096221',
      title: 'SRP-9001 Gene Therapy for Duchenne Muscular Dystrophy',
      phase: 'Phase III',
      status: 'Active, not recruiting',
      indication: 'Duchenne Muscular Dystrophy',
      primaryCompletion: '2025-06-15',
      estimatedEnrollment: 99,
      sponsors: ['Sarepta Therapeutics'],
      locations: ['United States', 'Europe'],
      lastUpdated: '2024-10-01'
    },
    {
      id: 'NCT04626674',
      title: 'Long-term Follow-up of SRP-9001 Gene Therapy',
      phase: 'Phase IV',
      status: 'Recruiting',
      indication: 'Duchenne Muscular Dystrophy',
      primaryCompletion: '2028-12-31',
      estimatedEnrollment: 150,
      sponsors: ['Sarepta Therapeutics'],
      locations: ['United States'],
      lastUpdated: '2024-09-28'
    }
  ],
  BMRN: [
    {
      id: 'NCT05251207',
      title: 'BMN 307 Gene Therapy for Hemophilia A',
      phase: 'Phase III',
      status: 'Recruiting',
      indication: 'Hemophilia A',
      primaryCompletion: '2026-03-20',
      estimatedEnrollment: 134,
      sponsors: ['BioMarin Pharmaceutical Inc.'],
      locations: ['Global'],
      lastUpdated: '2024-10-05'
    }
  ],
  ARWR: [
    {
      id: 'NCT05936372',
      title: 'ARO-APOC3 for Mixed Dyslipidemia',
      phase: 'Phase III',
      status: 'Recruiting',
      indication: 'Cardiovascular Disease',
      primaryCompletion: '2025-08-15',
      estimatedEnrollment: 650,
      sponsors: ['Arrowhead Pharmaceuticals'],
      locations: ['United States', 'Europe', 'Asia'],
      lastUpdated: '2024-10-02'
    }
  ],
  CYTK: [
    {
      id: 'NCT05601440',
      title: 'Aficamten in Hypertrophic Cardiomyopathy (SEQUOIA-HCM)',
      phase: 'Phase III',
      status: 'Active, not recruiting',
      indication: 'Hypertrophic Cardiomyopathy',
      primaryCompletion: '2025-03-30',
      estimatedEnrollment: 282,
      sponsors: ['Cytokinetics, Inc.'],
      locations: ['United States', 'Europe'],
      lastUpdated: '2024-09-15'
    }
  ],
  AMGN: [
    {
      id: 'NCT05234567',
      title: 'Phase III Study of AMG-510 in KRAS G12C-Mutated NSCLC',
      phase: 'Phase III',
      status: 'Recruiting',
      indication: 'Non-Small Cell Lung Cancer',
      primaryCompletion: '2025-12-15',
      estimatedEnrollment: 650,
      sponsors: ['Amgen Inc.'],
      locations: ['United States', 'Europe', 'Asia'],
      lastUpdated: '2024-10-01'
    },
    {
      id: 'NCT05123456',
      title: 'AMG-133 for Obesity and Type 2 Diabetes',
      phase: 'Phase II',
      status: 'Active, not recruiting',
      indication: 'Obesity, Type 2 Diabetes',
      primaryCompletion: '2025-06-30',
      estimatedEnrollment: 425,
      sponsors: ['Amgen Inc.'],
      locations: ['United States', 'Canada'],
      lastUpdated: '2024-09-15'
    }
  ],
  GILD: [
    {
      id: 'NCT05345678',
      title: 'Gilead GS-9674 in NASH Patients',
      phase: 'Phase III',
      status: 'Recruiting',
      indication: 'Non-alcoholic Steatohepatitis',
      primaryCompletion: '2026-03-20',
      estimatedEnrollment: 800,
      sponsors: ['Gilead Sciences Inc.'],
      locations: ['Global'],
      lastUpdated: '2024-10-05'
    }
  ],
  BIIB: [
    {
      id: 'NCT05456789',
      title: 'Aducanumab Long-term Safety Study',
      phase: 'Phase IV',
      status: 'Recruiting',
      indication: 'Alzheimer\'s Disease',
      primaryCompletion: '2027-12-31',
      estimatedEnrollment: 1200,
      sponsors: ['Biogen Inc.'],
      locations: ['United States', 'Europe'],
      lastUpdated: '2024-09-28'
    }
  ],
  REGN: [
    {
      id: 'NCT05567890',
      title: 'REGN2810 + Cemiplimab in Advanced Solid Tumors',
      phase: 'Phase II',
      status: 'Recruiting',
      indication: 'Solid Tumors',
      primaryCompletion: '2025-08-15',
      estimatedEnrollment: 300,
      sponsors: ['Regeneron Pharmaceuticals Inc.'],
      locations: ['United States', 'Europe'],
      lastUpdated: '2024-10-02'
    }
  ]
};

// Real FDA events for DMD and Cardiology companies
const mockFDAEvents = [
  {
    id: 'fda-001',
    date: '2025-06-21',
    type: 'PDUFA Date',
    drug: 'SRP-9001 (Elevidys)',
    company: 'Sarepta',
    indication: 'Duchenne Muscular Dystrophy',
    status: 'Approved 2023 (Accelerated), sNDA Under Review'
  },
  {
    id: 'fda-002',
    date: '2025-03-15',
    type: 'Advisory Committee',
    drug: 'Aficamten',
    company: 'Cytokinetics',
    indication: 'Hypertrophic Cardiomyopathy',
    status: 'Scheduled'
  },
  {
    id: 'fda-003',
    date: '2025-08-20',
    type: 'BLA Submission Expected',
    drug: 'ARO-APOC3',
    company: 'Arrowhead',
    indication: 'Cardiovascular Disease',
    status: 'Phase III Ongoing'
  },
  {
    id: 'fda-004',
    date: '2024-11-15',
    type: 'PDUFA Date',
    drug: 'AMG-510',
    company: 'Amgen',
    indication: 'KRAS G12C NSCLC',
    status: 'Scheduled'
  },
  {
    id: 'fda-005',
    date: '2024-12-03',
    type: 'Advisory Committee',
    drug: 'GS-9674',
    company: 'Gilead',
    indication: 'NASH',
    status: 'Scheduled'
  }
];

export const handlers = [
  // OpenBB Market Data Endpoints
  http.get(`${OPENBB_API_BASE}/equity/quote`, ({ request }) => {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    
    if (symbol && mockMarketData[symbol as keyof typeof mockMarketData]) {
      return HttpResponse.json({
        results: [mockMarketData[symbol as keyof typeof mockMarketData]]
      });
    }
    
    return HttpResponse.json({ error: 'Symbol not found' }, { status: 404 });
  }),

  http.get(`${OPENBB_API_BASE}/equity/screener`, () => {
    return HttpResponse.json({
      results: mockBiotechScreener
    });
  }),

  http.get(`${OPENBB_API_BASE}/equity/fundamental/metrics`, ({ request }) => {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    
    if (symbol && mockMarketData[symbol as keyof typeof mockMarketData]) {
      const data = mockMarketData[symbol as keyof typeof mockMarketData];
      return HttpResponse.json({
        results: [{
          symbol: data.symbol,
          market_cap: data.marketCap,
          pe_ratio: data.pe,
          dividend_yield: data.dividend,
          price: data.price,
          volume: data.volume
        }]
      });
    }
    
    return HttpResponse.json({ error: 'Symbol not found' }, { status: 404 });
  }),

  // Clinical Trials Endpoints
  http.get('https://clinicaltrials.gov/api/v2/studies', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query.term') || '';
    const symbol = url.searchParams.get('query.spons') || '';
    
    // Extract symbol from sponsor or query
    const searchSymbol = symbol || query.match(/[A-Z]{2,5}/)?.[0] || '';
    
    if (searchSymbol && mockClinicalTrials[searchSymbol as keyof typeof mockClinicalTrials]) {
      return HttpResponse.json({
        studies: mockClinicalTrials[searchSymbol as keyof typeof mockClinicalTrials]
      });
    }
    
    return HttpResponse.json({ studies: [] });
  }),

  // FDA Calendar/Events
  http.get('https://api.fda.gov/drug/event.json', () => {
    return HttpResponse.json({
      results: mockFDAEvents
    });
  }),

  // Generic OpenBB endpoints
  http.get(`${OPENBB_API_BASE}/*`, () => {
    return HttpResponse.json({
      message: 'OpenBB API endpoint mocked',
      timestamp: new Date().toISOString(),
      data: []
    });
  }),

  // Catch-all for other biotech-related APIs
  http.get('*/biotech/*', () => {
    return HttpResponse.json({
      message: 'Biotech API endpoint mocked',
      timestamp: new Date().toISOString(),
      data: []
    });
  }),

  http.get('*/pharmaceutical/*', () => {
    return HttpResponse.json({
      message: 'Pharmaceutical API endpoint mocked', 
      timestamp: new Date().toISOString(),
      data: []
    });
  })
];