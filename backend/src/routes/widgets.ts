import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Get portfolio summary for widget
 */
router.get('/portfolio-summary', async (req, res) => {
  try {
    // In production, this would fetch real data from database
    const portfolioSummary = {
      totalValue: 145250.75,
      dayChange: 3420.50,
      dayChangePercent: 2.41,
      topHoldings: [
        {
          symbol: 'VRTX',
          name: 'Vertex Pharmaceuticals',
          value: 45200.00,
          change: 1250.00,
        },
        {
          symbol: 'REGN',
          name: 'Regeneron',
          value: 38500.00,
          change: 890.00,
        },
        {
          symbol: 'MRNA',
          name: 'Moderna',
          value: 32100.00,
          change: 720.50,
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    logger.info('[Widgets] Portfolio summary requested');

    res.json(portfolioSummary);
  } catch (error) {
    logger.error('[Widgets] Portfolio summary error:', error);
    res.status(500).json({
      error: 'Failed to get portfolio summary',
    });
  }
});

/**
 * Get news headlines for widget
 */
router.get('/news-headlines', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    // In production, this would fetch real news from database
    const headlines = [
      {
        id: '1',
        title: 'FDA Approves Vertex CF Drug for Expanded Use',
        source: 'Reuters',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'fda',
        sentiment: 'positive',
      },
      {
        id: '2',
        title: 'Moderna Reports Strong Q4 Earnings, Beats Estimates',
        source: 'Bloomberg',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        category: 'earnings',
        sentiment: 'positive',
      },
      {
        id: '3',
        title: 'Phase III Trial Shows Promising Results for Cancer Drug',
        source: 'BioSpace',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        category: 'trial',
        sentiment: 'positive',
      },
      {
        id: '4',
        title: 'Biotech Sector Rallies on FDA Reform News',
        source: 'CNBC',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        category: 'market',
        sentiment: 'positive',
      },
      {
        id: '5',
        title: 'Gilead Acquires Oncology Startup for $2.1B',
        source: 'FierceBiotech',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        category: 'market',
        sentiment: 'neutral',
      },
      {
        id: '6',
        title: 'New Alzheimer\'s Drug Shows Promise in Early Trials',
        source: 'Nature',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        category: 'trial',
        sentiment: 'positive',
      },
      {
        id: '7',
        title: 'Biotech ETF XBI Surges 5% on Strong Sector Performance',
        source: 'MarketWatch',
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        category: 'market',
        sentiment: 'positive',
      },
    ];

    const limitedHeadlines = headlines.slice(0, limit);

    logger.info(`[Widgets] News headlines requested (limit: ${limit})`);

    res.json(limitedHeadlines);
  } catch (error) {
    logger.error('[Widgets] News headlines error:', error);
    res.status(500).json({
      error: 'Failed to get news headlines',
    });
  }
});

/**
 * Get catalyst calendar for widget
 */
router.get('/catalyst-calendar', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;

    // In production, this would fetch real catalysts from database
    const catalysts = [
      {
        id: '1',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        company: 'Amgen',
        symbol: 'AMGN',
        event: 'PDUFA Date - Lumakras',
        type: 'fda_decision',
        impact: 'high',
      },
      {
        id: '2',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        company: 'Gilead',
        symbol: 'GILD',
        event: 'Q4 Earnings Release',
        type: 'earnings',
        impact: 'medium',
      },
      {
        id: '3',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        company: 'BioNTech',
        symbol: 'BNTX',
        event: 'Phase III Data Readout',
        type: 'clinical_data',
        impact: 'high',
      },
    ];

    const filteredCatalysts = catalysts.filter((catalyst) => {
      const daysUntil = (new Date(catalyst.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntil <= days;
    });

    logger.info(`[Widgets] Catalyst calendar requested (days: ${days})`);

    res.json(filteredCatalysts);
  } catch (error) {
    logger.error('[Widgets] Catalyst calendar error:', error);
    res.status(500).json({
      error: 'Failed to get catalyst calendar',
    });
  }
});

export { router as widgetRouter };
