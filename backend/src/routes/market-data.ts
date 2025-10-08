import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { realDataService } from '../services/real-data-service.js';

const router = Router();

// Request validation schemas
const getMarketDataSchema = z.object({
  symbol: z.string().min(1).max(10),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).default('1h'),
  limit: z.string().transform(Number).default(100),
});

const getMultipleSymbolsSchema = z.object({
  symbols: z.array(z.string()).max(50),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).default('1h'),
});

// Mock market data for demonstration
const mockBiotechData = {
  'BCRX': {
    price: 128.45,
    change: 5.23,
    changePercent: 4.25,
    volume: 2845692,
    marketCap: 8900000000,
    sector: 'Biotech',
    pipeline: [
      { name: 'BCRX-101', phase: 'Phase III', indication: 'NHL', pdufa: '2024-12-15' },
      { name: 'BCRX-202', phase: 'Phase II', indication: 'CLL', timeline: 'Q2 2025' }
    ]
  },
  'GILD': {
    price: 89.67,
    change: -1.23,
    changePercent: -1.35,
    volume: 5234567,
    marketCap: 11200000000,
    sector: 'Pharma',
    pipeline: [
      { name: 'GS-9674', phase: 'Phase III', indication: 'NASH', pdufa: '2024-08-30' }
    ]
  },
  'MRNA': {
    price: 45.89,
    change: 2.34,
    changePercent: 5.38,
    volume: 8934567,
    marketCap: 17800000000,
    sector: 'Biotech',
    pipeline: [
      { name: 'mRNA-1273', phase: 'Commercial', indication: 'COVID-19' },
      { name: 'mRNA-1345', phase: 'Phase III', indication: 'RSV', timeline: 'Q4 2024' }
    ]
  }
};

// GET /api/market/quote/:symbol
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const validation = getMarketDataSchema.safeParse({ 
      symbol: symbol.toUpperCase(),
      ...req.query 
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: validation.error.errors
      });
    }

    const { symbol: validSymbol, timeframe, limit } = validation.data;

    // For demo purposes, return mock data
    // In production, this would fetch from real market data APIs
    const marketData = mockBiotechData[validSymbol as keyof typeof mockBiotechData];
    
    if (!marketData) {
      return res.status(404).json({
        error: 'Symbol not found',
        symbol: validSymbol
      });
    }

    // Simulate historical price data
    const historicalData = Array.from({ length: limit }, (_, i) => ({
      timestamp: Date.now() - (i * 3600000), // 1 hour intervals
      open: marketData.price + (Math.random() - 0.5) * 5,
      high: marketData.price + Math.random() * 3,
      low: marketData.price - Math.random() * 3,
      close: marketData.price + (Math.random() - 0.5) * 2,
      volume: Math.floor(marketData.volume * (0.8 + Math.random() * 0.4))
    })).reverse();

    const response = {
      symbol: validSymbol,
      current: marketData,
      historical: historicalData,
      timeframe,
      lastUpdated: new Date().toISOString()
    };

    logger.info(`📊 Market data requested: ${validSymbol} (${timeframe})`);
    
    res.json(response);

  } catch (error) {
    logger.error('Market data error:', error);
    res.status(500).json({
      error: 'Failed to fetch market data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/market/quotes
router.get('/quotes', async (req, res) => {
  try {
    const validation = getMultipleSymbolsSchema.safeParse({
      symbols: req.query.symbols ? (req.query.symbols as string).split(',') : [],
      timeframe: req.query.timeframe
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: validation.error.errors
      });
    }

    const { symbols, timeframe } = validation.data;

    const quotes = symbols.map(symbol => {
      const upperSymbol = symbol.toUpperCase();
      const data = mockBiotechData[upperSymbol as keyof typeof mockBiotechData];
      
      return {
        symbol: upperSymbol,
        found: !!data,
        data: data || null
      };
    });

    res.json({
      quotes,
      timeframe,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Multiple quotes error:', error);
    res.status(500).json({
      error: 'Failed to fetch market quotes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/market/biotech/screener
router.get('/biotech/screener', async (req, res) => {
  try {
    // Biotech stock screener with pipeline data
    const screenerData = Object.entries(mockBiotechData).map(([symbol, data]) => ({
      symbol,
      name: `${symbol} Inc.`,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      marketCap: data.marketCap,
      sector: data.sector,
      pipelineCount: data.pipeline.length,
      nextCatalyst: data.pipeline[0]?.pdufa || data.pipeline[0]?.timeline || 'TBD',
      riskRating: Math.random() > 0.5 ? 'Medium' : 'High'
    }));

    res.json({
      data: screenerData,
      total: screenerData.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Biotech screener error:', error);
    res.status(500).json({
      error: 'Failed to fetch biotech screener data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/market/health
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: false,
        externalApis: true, // Mock for now
        cache: false
      }
    };

    // Check database connection (using live data service)
    try {
      const status = realDataService.isCollectingData();
      health.services.database = !status; // Database is "healthy" when not collecting
    } catch (error) {
      logger.warn('Live data service health check failed:', error);
    }

    const overallStatus = Object.values(health.services).every(Boolean) ? 'healthy' : 'degraded';
    
    res.json({
      ...health,
      status: overallStatus
    });

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// GET /api/market/openbb/chart
router.get('/openbb/chart', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'BCRX';
    const timeframe = (req.query.timeframe as string) || '1d';

    // Mock OpenBB chart data in the format expected by OpenBBPlot
    const chartData = {
      data: [{
        x: Array.from({length: 100}, (_, i) => new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000).toISOString()),
        y: Array.from({length: 100}, () => Math.random() * 50 + 100 + Math.sin(Math.random() * Math.PI * 2) * 10),
        type: 'scatter',
        mode: 'lines',
        name: symbol,
        line: { color: '#00ff88' }
      }],
      layout: {
        title: `${symbol} Price Chart`,
        xaxis: { title: 'Date' },
        yaxis: { title: 'Price ($)' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#00ff88' }
      },
      frames: [],
      config: {
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d']
      },
      theme: 'dark',
      command_location: 'terminal',
      python_version: '3.11',
      pywry_version: '0.1.0',
      terminal_version: '1.0.0'
    };

    res.json(chartData);

  } catch (error) {
    logger.error('OpenBB chart error:', error);
    res.status(500).json({
      error: 'Failed to fetch OpenBB chart data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as marketDataRouter };