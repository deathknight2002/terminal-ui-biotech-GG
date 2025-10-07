/**
 * Scraping API Routes
 * Endpoints for accessing biotech data via scrapers
 */

import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { getScrapingManager } from '../scraping/index.js';

const router = Router();

// Request validation schemas
const pubmedSearchSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'citations']).optional(),
});

const fdaSearchSchema = z.object({
  search: z.string().optional(),
  limit: z.number().optional(),
  skip: z.number().optional(),
});

const clinicalTrialsSearchSchema = z.object({
  condition: z.string().optional(),
  intervention: z.string().optional(),
  sponsor: z.string().optional(),
  phase: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  pageSize: z.number().optional(),
});

/**
 * GET /api/scraping/health
 * Get health status of all scrapers
 */
router.get('/health', async (req, res) => {
  try {
    const manager = getScrapingManager();
    const health = await manager.getHealth();

    res.json({
      status: 'ok',
      scrapers: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Scraping health check error:', error);
    res.status(500).json({
      error: 'Failed to get scraping health',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/stats
 * Get statistics for all scrapers
 */
router.get('/stats', async (req, res) => {
  try {
    const manager = getScrapingManager();
    const stats = manager.getStats();

    res.json({
      status: 'ok',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Scraping stats error:', error);
    res.status(500).json({
      error: 'Failed to get scraping stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/pubmed/search
 * Search PubMed for articles
 */
router.post('/pubmed/search', async (req, res) => {
  try {
    const params = pubmedSearchSchema.parse(req.body);
    const manager = getScrapingManager();
    const scraper = manager.getPubMedScraper();

    const articles = await scraper.search(params);

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request parameters',
        details: error.errors,
      });
      return;
    }

    logger.error('PubMed search error:', error);
    res.status(500).json({
      error: 'Failed to search PubMed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/pubmed/article/:pmid
 * Get a specific PubMed article by PMID
 */
router.get('/pubmed/article/:pmid', async (req, res) => {
  try {
    const { pmid } = req.params;
    const manager = getScrapingManager();
    const scraper = manager.getPubMedScraper();

    const article = await scraper.getArticle(pmid);

    if (!article) {
      res.status(404).json({
        error: 'Article not found',
        pmid,
      });
      return;
    }

    res.json({
      status: 'ok',
      data: article,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('PubMed article fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch article',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/pubmed/drug/:name
 * Search PubMed by drug name
 */
router.get('/pubmed/drug/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const maxResults = parseInt(req.query.maxResults as string) || 50;
    
    const manager = getScrapingManager();
    const scraper = manager.getPubMedScraper();

    const articles = await scraper.searchByDrug(name, maxResults);

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      drug: name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('PubMed drug search error:', error);
    res.status(500).json({
      error: 'Failed to search drug',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/fda/approvals
 * Search FDA drug approvals
 */
router.post('/fda/approvals', async (req, res) => {
  try {
    const params = fdaSearchSchema.parse(req.body);
    const manager = getScrapingManager();
    const scraper = manager.getFDAScraper();

    const approvals = await scraper.searchDrugApprovals(params);

    res.json({
      status: 'ok',
      data: approvals,
      count: approvals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request parameters',
        details: error.errors,
      });
      return;
    }

    logger.error('FDA approvals search error:', error);
    res.status(500).json({
      error: 'Failed to search FDA approvals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/fda/approvals/recent
 * Get recent FDA approvals
 */
router.get('/fda/approvals/recent', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const manager = getScrapingManager();
    const scraper = manager.getFDAScraper();

    const approvals = await scraper.getRecentApprovals(days);

    res.json({
      status: 'ok',
      data: approvals,
      count: approvals.length,
      days,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('FDA recent approvals error:', error);
    res.status(500).json({
      error: 'Failed to fetch recent approvals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/fda/adverse-events/:drug
 * Search adverse events for a drug
 */
router.get('/fda/adverse-events/:drug', async (req, res) => {
  try {
    const { drug } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const manager = getScrapingManager();
    const scraper = manager.getFDAScraper();

    const events = await scraper.searchAdverseEvents(drug, { limit });

    res.json({
      status: 'ok',
      data: events,
      count: events.length,
      drug,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('FDA adverse events error:', error);
    res.status(500).json({
      error: 'Failed to fetch adverse events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/clinical-trials/search
 * Search clinical trials
 */
router.post('/clinical-trials/search', async (req, res) => {
  try {
    const params = clinicalTrialsSearchSchema.parse(req.body);
    const manager = getScrapingManager();
    const scraper = manager.getClinicalTrialsScraper();

    const trials = await scraper.search(params);

    res.json({
      status: 'ok',
      data: trials,
      count: trials.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request parameters',
        details: error.errors,
      });
      return;
    }

    logger.error('Clinical trials search error:', error);
    res.status(500).json({
      error: 'Failed to search clinical trials',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/clinical-trials/:nctId
 * Get a specific clinical trial by NCT ID
 */
router.get('/clinical-trials/:nctId', async (req, res) => {
  try {
    const { nctId } = req.params;
    const manager = getScrapingManager();
    const scraper = manager.getClinicalTrialsScraper();

    const trial = await scraper.getTrial(nctId);

    if (!trial) {
      res.status(404).json({
        error: 'Trial not found',
        nctId,
      });
      return;
    }

    res.json({
      status: 'ok',
      data: trial,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Clinical trial fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch clinical trial',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/clinical-trials/drug/:name
 * Search clinical trials by drug
 */
router.get('/clinical-trials/drug/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const maxResults = parseInt(req.query.maxResults as string) || 50;
    
    const manager = getScrapingManager();
    const scraper = manager.getClinicalTrialsScraper();

    const trials = await scraper.searchByDrug(name, maxResults);

    res.json({
      status: 'ok',
      data: trials,
      count: trials.length,
      drug: name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Clinical trials drug search error:', error);
    res.status(500).json({
      error: 'Failed to search drug trials',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/clinical-trials/oncology/active
 * Get active oncology trials
 */
router.get('/clinical-trials/oncology/active', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 100;
    
    const manager = getScrapingManager();
    const scraper = manager.getClinicalTrialsScraper();

    const trials = await scraper.getActiveOncologyTrials(maxResults);

    res.json({
      status: 'ok',
      data: trials,
      count: trials.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Oncology trials error:', error);
    res.status(500).json({
      error: 'Failed to fetch oncology trials',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/cache/clear
 * Clear all scraper caches
 */
router.post('/cache/clear', async (req, res) => {
  try {
    const manager = getScrapingManager();
    manager.clearAllCaches();

    res.json({
      status: 'ok',
      message: 'All caches cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({
      error: 'Failed to clear caches',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/circuit-breakers/reset
 * Reset all circuit breakers
 */
router.post('/circuit-breakers/reset', async (req, res) => {
  try {
    const manager = getScrapingManager();
    manager.resetCircuitBreakers();

    res.json({
      status: 'ok',
      message: 'All circuit breakers reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Circuit breaker reset error:', error);
    res.status(500).json({
      error: 'Failed to reset circuit breakers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as scrapingRouter };
