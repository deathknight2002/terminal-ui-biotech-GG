import { http, HttpResponse } from 'msw';

// OpenBB API base URL
const OPENBB_API_BASE = 'https://api.openbb.co/v1';

// Mock data for different endpoints
const mockMarketData = {
  AAPL: {
    symbol: 'AAPL',
    price: 175.43,
    change: 2.15,
    changePercent: 1.24,
    volume: 45234567,
    marketCap: 2750000000000,
    pe: 28.5,
    dividend: 0.96,
    lastUpdated: new Date().toISOString()
  },
  AMGN: {
    symbol: 'AMGN',
    price: 264.12,
    change: -3.44,
    changePercent: -1.29,
    volume: 2456789,
    marketCap: 145000000000,
    pe: 15.2,
    dividend: 7.28,
    lastUpdated: new Date().toISOString()
  },
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

const mockBiotechScreener = [
  {
    symbol: 'AMGN',
    name: 'Amgen Inc.',
    marketCap: 145000000000,
    price: 264.12,
    change: -1.29,
    volume: 2456789,
    pe: 15.2,
    pipeline: 'Oncology/Inflammation',
    phase: 'Marketed',
    indication: 'Multiple'
  },
  {
    symbol: 'GILD',
    name: 'Gilead Sciences Inc.',
    marketCap: 85000000000,
    price: 68.45,
    change: 1.83,
    volume: 5234567,
    pe: 11.5,
    pipeline: 'Virology/Oncology',
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

const mockClinicalTrials = {
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

const mockFDAEvents = [
  {
    id: 'fda-001',
    date: '2024-11-15',
    type: 'PDUFA Date',
    drug: 'AMG-510',
    company: 'Amgen',
    indication: 'KRAS G12C NSCLC',
    status: 'Scheduled'
  },
  {
    id: 'fda-002',
    date: '2024-12-03',
    type: 'Advisory Committee',
    drug: 'GS-9674',
    company: 'Gilead',
    indication: 'NASH',
    status: 'Scheduled'
  },
  {
    id: 'fda-003',
    date: '2025-01-20',
    type: 'BLA Submission',
    drug: 'REGN2810',
    company: 'Regeneron',
    indication: 'Solid Tumors',
    status: 'Expected'
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