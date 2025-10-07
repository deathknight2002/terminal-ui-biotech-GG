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

/**
 * GET /api/scraping/metrics
 * Export metrics in Prometheus format
 */
router.get('/metrics', async (req, res) => {
  try {
    const { getPerformanceMonitor } = await import('../scraping/performance-monitor.js');
    const monitor = getPerformanceMonitor();
    
    const metrics = monitor.exportPrometheusMetrics();
    
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics export error:', error);
    res.status(500).json({
      error: 'Failed to export metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =============================================================================
// NEW SCRAPER ROUTES
// =============================================================================

/**
 * GET /api/scraping/fierce-biotech/latest
 * Get latest Fierce Biotech news
 */
router.get('/fierce-biotech/latest', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const manager = getScrapingManager();
    const scraper = manager.getFierceBiotechScraper();

    const articles = await scraper.getLatestNews({ maxResults });

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Fierce Biotech latest news error:', error);
    res.status(500).json({
      error: 'Failed to fetch Fierce Biotech news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/fierce-biotech/search
 * Search Fierce Biotech articles
 */
router.get('/fierce-biotech/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    if (!query) {
      res.status(400).json({
        error: 'Query parameter "q" is required',
      });
      return;
    }

    const manager = getScrapingManager();
    const scraper = manager.getFierceBiotechScraper();

    const articles = await scraper.search(query, maxResults);

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Fierce Biotech search error:', error);
    res.status(500).json({
      error: 'Failed to search Fierce Biotech',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/science-daily/latest
 * Get latest Science Daily biotech news
 */
router.get('/science-daily/latest', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const category = req.query.category as string;
    const manager = getScrapingManager();
    const scraper = manager.getScienceDailyScraper();

    const articles = await scraper.getLatestNews({
      maxResults,
      category: category as any,
    });

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Science Daily latest news error:', error);
    res.status(500).json({
      error: 'Failed to fetch Science Daily news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/science-daily/biotech
 * Get recent biotechnology articles from Science Daily
 */
router.get('/science-daily/biotech', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 50;
    const manager = getScrapingManager();
    const scraper = manager.getScienceDailyScraper();

    const articles = await scraper.getRecentBiotech(maxResults);

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Science Daily biotech error:', error);
    res.status(500).json({
      error: 'Failed to fetch Science Daily biotech articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/biospace/news
 * Get latest BioSpace news
 */
router.get('/biospace/news', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const manager = getScrapingManager();
    const scraper = manager.getBioSpaceScraper();

    const articles = await scraper.getLatestNews({ maxResults });

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('BioSpace news error:', error);
    res.status(500).json({
      error: 'Failed to fetch BioSpace news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/biospace/jobs
 * Get BioSpace job postings
 */
router.get('/biospace/jobs', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const query = req.query.q as string;
    const location = req.query.location as string;
    const manager = getScrapingManager();
    const scraper = manager.getBioSpaceScraper();

    const jobs = await scraper.getJobPostings({
      maxResults,
      query,
      location,
    });

    res.json({
      status: 'ok',
      data: jobs,
      count: jobs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('BioSpace jobs error:', error);
    res.status(500).json({
      error: 'Failed to fetch BioSpace jobs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/biospace/press-releases
 * Get BioSpace press releases
 */
router.get('/biospace/press-releases', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const manager = getScrapingManager();
    const scraper = manager.getBioSpaceScraper();

    const releases = await scraper.getPressReleases(maxResults);

    res.json({
      status: 'ok',
      data: releases,
      count: releases.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('BioSpace press releases error:', error);
    res.status(500).json({
      error: 'Failed to fetch BioSpace press releases',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/biopharmdive/news
 * Get latest BioPharm Dive news
 */
router.get('/biopharmdive/news', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const type = req.query.type as string;
    const manager = getScrapingManager();
    const scraper = manager.getBioPharmDiveScraper();

    const articles = await scraper.getLatestNews({
      maxResults,
      type: type as any,
    });

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('BioPharm Dive news error:', error);
    res.status(500).json({
      error: 'Failed to fetch BioPharm Dive news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/biopharmdive/pipeline
 * Get BioPharm Dive pipeline updates
 */
router.get('/biopharmdive/pipeline', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const manager = getScrapingManager();
    const scraper = manager.getBioPharmDiveScraper();

    const updates = await scraper.getPipelineUpdates(maxResults);

    res.json({
      status: 'ok',
      data: updates,
      count: updates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('BioPharm Dive pipeline error:', error);
    res.status(500).json({
      error: 'Failed to fetch BioPharm Dive pipeline updates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/biopharmdive/ma
 * Get BioPharm Dive M&A activity
 */
router.get('/biopharmdive/ma', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const manager = getScrapingManager();
    const scraper = manager.getBioPharmDiveScraper();

    const activity = await scraper.getMnAActivity(maxResults);

    res.json({
      status: 'ok',
      data: activity,
      count: activity.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('BioPharm Dive M&A error:', error);
    res.status(500).json({
      error: 'Failed to fetch BioPharm Dive M&A activity',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/endpoints-news/latest
 * Get latest Endpoints News articles
 */
router.get('/endpoints-news/latest', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const type = req.query.type as string;
    const manager = getScrapingManager();
    const scraper = manager.getEndpointsNewsScraper();

    const articles = await scraper.getLatestNews({
      maxResults,
      type: type as any,
    });

    res.json({
      status: 'ok',
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Endpoints News latest error:', error);
    res.status(500).json({
      error: 'Failed to fetch Endpoints News articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/endpoints-news/fda-approvals
 * Get FDA approval news from Endpoints
 */
router.get('/endpoints-news/fda-approvals', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const manager = getScrapingManager();
    const scraper = manager.getEndpointsNewsScraper();

    const approvals = await scraper.getFDAApprovals(maxResults);

    res.json({
      status: 'ok',
      data: approvals,
      count: approvals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Endpoints FDA approvals error:', error);
    res.status(500).json({
      error: 'Failed to fetch Endpoints FDA approvals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/endpoints-news/clinical-trials
 * Get clinical trial news from Endpoints
 */
router.get('/endpoints-news/clinical-trials', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const manager = getScrapingManager();
    const scraper = manager.getEndpointsNewsScraper();

    const trials = await scraper.getClinicalTrialNews(maxResults);

    res.json({
      status: 'ok',
      data: trials,
      count: trials.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Endpoints clinical trials error:', error);
    res.status(500).json({
      error: 'Failed to fetch Endpoints clinical trial news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/aggregated
 * Get aggregated news from all sources
 */
router.get('/news/aggregated', async (req, res) => {
  try {
    const maxResultsPerSource = parseInt(req.query.maxResults as string) || 10;
    const manager = getScrapingManager();

    // Fetch from all news sources in parallel
    const [
      fierceBiotech,
      scienceDaily,
      bioSpace,
      bioPharmDive,
      endpointsNews,
    ] = await Promise.all([
      manager.getFierceBiotechScraper().getLatestNews({ maxResults: maxResultsPerSource }),
      manager.getScienceDailyScraper().getLatestNews({ maxResults: maxResultsPerSource }),
      manager.getBioSpaceScraper().getLatestNews({ maxResults: maxResultsPerSource }),
      manager.getBioPharmDiveScraper().getLatestNews({ maxResults: maxResultsPerSource }),
      manager.getEndpointsNewsScraper().getLatestNews({ maxResults: maxResultsPerSource }),
    ]);

    // Combine and add source information
    const aggregated = [
      ...fierceBiotech.map(a => ({ ...a, source: 'Fierce Biotech' })),
      ...scienceDaily.map(a => ({ ...a, source: 'Science Daily' })),
      ...bioSpace.map(a => ({ ...a, source: 'BioSpace' })),
      ...bioPharmDive.map(a => ({ ...a, source: 'BioPharm Dive' })),
      ...endpointsNews.map(a => ({ ...a, source: 'Endpoints News' })),
    ];

    // Sort by published date (most recent first)
    aggregated.sort((a, b) => {
      const dateA = new Date(a.publishedDate).getTime();
      const dateB = new Date(b.publishedDate).getTime();
      return dateB - dateA;
    });

    res.json({
      status: 'ok',
      data: aggregated,
      count: aggregated.length,
      sources: {
        fierceBiotech: fierceBiotech.length,
        scienceDaily: scienceDaily.length,
        bioSpace: bioSpace.length,
        bioPharmDive: bioPharmDive.length,
        endpointsNews: endpointsNews.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Aggregated news error:', error);
    res.status(500).json({
      error: 'Failed to fetch aggregated news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as scrapingRouter };
