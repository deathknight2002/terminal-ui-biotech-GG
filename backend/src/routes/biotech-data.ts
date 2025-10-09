import { Router } from 'express';
import { realDataService } from '../services/real-data-service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Dashboard endpoint - provides real-time BioAuroraDashboard data
router.get('/dashboard', async (req, res) => {
  try {
    console.log('🔍 Dashboard endpoint called');
    const dashboardData = await realDataService.getDashboardData();

    logger.info('📊 LIVE Dashboard data requested - Real market data');
    console.log('✅ Dashboard data retrieved successfully');

    // Set Cache-Control headers for manual refresh model (30 min TTL)
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes
    res.setHeader('Last-Modified', new Date(dashboardData.headline?.lastUpdated || Date.now()).toUTCString());
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Error in dashboard endpoint:', error);
    logger.error('❌ Error fetching live dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch live dashboard data',
      message: 'Real-time data collection failed'
    });
  }
});

// Clinical trials endpoint - LIVE data from ClinicalTrials.gov
router.get('/trials', async (req, res) => {
  try {
    const trialsData = await realDataService.getClinicalTrialsData();

    logger.info('🧬 LIVE Clinical trials data - Active trials: ' + trialsData.trials.length);

    // Set Cache-Control headers for manual refresh model (30 min TTL)
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes
    res.setHeader('Last-Modified', new Date(trialsData.lastUpdated || Date.now()).toUTCString());
    
    res.json(trialsData);
  } catch (error) {
    logger.error('❌ Error fetching live trials data:', error);
    res.status(500).json({
      error: 'Failed to fetch live trials data',
      message: 'ClinicalTrials.gov scraping failed'
    });
  }
});

// Financial modeling endpoint - REAL financial data
router.get('/financial-models', async (req, res) => {
  try {
    const financialData = await realDataService.getFinancialModelsData();

    logger.info('💰 LIVE Financial models - Real market valuations');

    // Set Cache-Control headers for manual refresh model (30 min TTL)
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    res.json(financialData);
  } catch (error) {
    logger.error('❌ Error fetching live financial data:', error);
    res.status(500).json({
      error: 'Failed to fetch live financial data',
      message: 'Yahoo Finance data collection failed'
    });
  }
});

// Pipeline endpoint - REAL clinical pipeline data
router.get('/pipeline', async (req, res) => {
  try {
    const pipelineData = await realDataService.getPipelineData();

    logger.info('🔬 LIVE Pipeline data - Real clinical programs');

    res.json(pipelineData);
  } catch (error) {
    logger.error('❌ Error fetching live pipeline data:', error);
    res.status(500).json({
      error: 'Failed to fetch live pipeline data',
      message: 'Clinical pipeline scraping failed'
    });
  }
});

// Market intelligence endpoint - REAL institutional data
router.get('/intelligence', async (req, res) => {
  try {
    const intelligenceData = await realDataService.getIntelligenceData();

    logger.info('🔍 LIVE Market intelligence - Real institutional holdings');

    res.json(intelligenceData);
  } catch (error) {
    logger.error('❌ Error fetching live intelligence data:', error);
    res.status(500).json({
      error: 'Failed to fetch live intelligence data',
      message: 'Market intelligence scraping failed'
    });
  }
});

// Data explorer endpoint - DISABLED (method not implemented)
// router.get('/explorer', async (req, res) => {
//   try {
//     const explorerData = await realDataService.getDataExplorerData();
//
//     logger.info('🗃️ LIVE Data explorer - Real datasets available');
//
//     res.json(explorerData);
//   } catch (error) {
//     logger.error('❌ Error fetching live explorer data:', error);
//     res.status(500).json({
//       error: 'Failed to fetch live explorer data',
//       message: 'Data source enumeration failed'
//     });
//   }
// });

// Data collection status endpoint
router.get('/status', async (req, res) => {
  try {
    const statusData = await realDataService.getServiceStatus();

    res.json(statusData);
  } catch (error) {
    logger.error('❌ Error getting collection status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Force data refresh endpoint - DISABLED (method not implemented)
// router.post('/refresh', async (req, res) => {
//   try {
//     logger.info('🔄 FORCED data refresh requested - Starting live collection...');
//
//     const refreshedData = await realDataService.collectLiveData();
//
//     res.json({
//       message: 'Data refresh completed',
//       timestamp: new Date().toISOString(),
//       dataQuality: 'LIVE',
//       collectionTime: refreshedData.collection_time
//     });
//   } catch (error) {
//     logger.error('❌ Error refreshing data:', error);
//     res.status(500).json({
//       error: 'Failed to refresh data',
//       message: 'Live data collection failed'
//     });
//   }
// });

// Legacy endpoints (for backward compatibility)
router.get('/assets', async (req, res) => {
  try {
    const dashboardData = await realDataService.getDashboardData();
    res.json({ assets: dashboardData.positions });
  } catch (error) {
    logger.error('❌ Error fetching live assets:', error);
    res.status(500).json({ error: 'Failed to fetch live assets' });
  }
});

router.get('/catalysts', async (req, res) => {
  try {
    const dashboardData = await realDataService.getDashboardData();
    res.json({ catalysts: dashboardData.catalysts });
  } catch (error) {
    logger.error('❌ Error fetching live catalysts:', error);
    res.status(500).json({ error: 'Failed to fetch live catalysts' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'LIVE Biotech Terminal API',
    dataType: 'REAL_TIME_SCRAPING',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /dashboard - LIVE Aurora Fund data',
      'GET /trials - LIVE Clinical trials from ClinicalTrials.gov',
      'GET /financial-models - REAL Financial data from Yahoo Finance',
      'GET /pipeline - LIVE Drug development pipeline',
      'GET /intelligence - REAL Market intelligence & institutional data',
      'GET /explorer - LIVE Data source explorer',
      'POST /refresh - Force live data refresh'
    ],
    dataSources: [
      'ClinicalTrials.gov API',
      'Yahoo Finance API',
      'FDA Orange Book',
      'SEC EDGAR Filings',
      'Institutional Holdings Data'
    ]
  });
});

export { router as biotechDataRouter };