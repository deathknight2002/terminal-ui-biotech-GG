/**
 * New Biotech News Scraping Routes
 * API endpoints for 5 new biotech news scrapers
 */

import express, { Request, Response } from 'express';
import { getScrapingManager } from '../scraping/scraping-manager.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// ==================== PharmaNewsWire Routes ====================

/**
 * GET /api/scraping/news/pharmanewswire/latest
 * Get latest pharmaceutical industry news
 */
router.get('/pharmanewswire/latest', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getPharmaNewsWireScraper();
    
    const articles = await scraper.getLatestNews(maxResults);
    
    res.json({
      success: true,
      source: 'PharmaNewsWire',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch PharmaNewsWire articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/pharmanewswire/search
 * Search pharmaceutical news
 */
router.post('/pharmanewswire/search', async (req: Request, res: Response) => {
  try {
    const { query, category, maxResults, dateFrom, dateTo } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getPharmaNewsWireScraper();
    
    const articles = await scraper.searchArticles({
      query,
      category,
      maxResults: maxResults || 20,
      dateFrom,
      dateTo,
    });
    
    res.json({
      success: true,
      source: 'PharmaNewsWire',
      query,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search PharmaNewsWire:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/pharmanewswire/category/:category
 * Get pharmaceutical news by category
 */
router.get('/pharmanewswire/category/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category as 'market-analysis' | 'mergers-acquisitions' | 'regulatory' | 'clinical-data';
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getPharmaNewsWireScraper();
    
    const articles = await scraper.getNewsByCategory(category, maxResults);
    
    res.json({
      success: true,
      source: 'PharmaNewsWire',
      category,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Failed to fetch PharmaNewsWire ${req.params.category} articles:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== GEN News Routes ====================

/**
 * GET /api/scraping/news/genengnews/latest
 * Get latest research updates
 */
router.get('/genengnews/latest', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getGenEngNewsScraper();
    
    const articles = await scraper.getLatestNews(maxResults);
    
    res.json({
      success: true,
      source: 'GEN News',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch GEN News articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/genengnews/research
 * Get research news by topic
 */
router.get('/genengnews/research', async (req: Request, res: Response) => {
  try {
    const topic = req.query.topic as string || 'biotechnology';
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getGenEngNewsScraper();
    
    const articles = await scraper.getResearchNews(topic, maxResults);
    
    res.json({
      success: true,
      source: 'GEN News',
      topic,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch GEN research news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/genengnews/search
 * Search research and biotech news
 */
router.post('/genengnews/search', async (req: Request, res: Response) => {
  try {
    const { query, category, researchArea, maxResults } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getGenEngNewsScraper();
    
    const articles = await scraper.searchArticles({
      query,
      category,
      researchArea,
      maxResults: maxResults || 20,
    });
    
    res.json({
      success: true,
      source: 'GEN News',
      query,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search GEN News:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== BioPharma Dive Routes ====================

/**
 * GET /api/scraping/news/biopharmadive/latest
 * Get latest pipeline tracking news
 */
router.get('/biopharmadive/latest', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getBioPharmaDigestScraper();
    
    const articles = await scraper.getLatestNews(maxResults);
    
    res.json({
      success: true,
      source: 'BioPharma Dive',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch BioPharma Dive articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/biopharmadive/pipeline
 * Get drug pipeline updates
 */
router.get('/biopharmadive/pipeline', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getBioPharmaDigestScraper();
    
    const articles = await scraper.getPipelineUpdates(maxResults);
    
    res.json({
      success: true,
      source: 'BioPharma Dive',
      category: 'Pipeline Updates',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch pipeline updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/biopharmadive/search
 * Search pipeline and development news
 */
router.post('/biopharmadive/search', async (req: Request, res: Response) => {
  try {
    const { query, category, company, therapeuticArea, maxResults } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getBioPharmaDigestScraper();
    
    const articles = await scraper.searchArticles({
      query,
      category,
      company,
      therapeuticArea,
      maxResults: maxResults || 20,
    });
    
    res.json({
      success: true,
      source: 'BioPharma Dive',
      query,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search BioPharma Dive:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== FDA News Tracker Routes ====================

/**
 * GET /api/scraping/news/fda-news/latest
 * Get latest FDA news and announcements
 */
router.get('/fda-news/latest', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getFDANewsTrackerScraper();
    
    const articles = await scraper.getLatestNews(maxResults);
    
    res.json({
      success: true,
      source: 'FDA News Tracker',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch FDA news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/fda-news/approvals
 * Get recent FDA drug approvals
 */
router.get('/fda-news/approvals', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getFDANewsTrackerScraper();
    
    const articles = await scraper.getRecentApprovals(maxResults);
    
    res.json({
      success: true,
      source: 'FDA News Tracker',
      category: 'Drug Approvals',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch FDA approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approvals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/fda-news/search
 * Search FDA news and regulatory updates
 */
router.post('/fda-news/search', async (req: Request, res: Response) => {
  try {
    const { query, category, drugName, company, dateFrom, dateTo, maxResults } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getFDANewsTrackerScraper();
    
    const articles = await scraper.searchNews({
      query,
      category,
      drugName,
      company,
      dateFrom,
      dateTo,
      maxResults: maxResults || 20,
    });
    
    res.json({
      success: true,
      source: 'FDA News Tracker',
      query,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search FDA news:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== BioSpace Jobs Routes ====================

/**
 * GET /api/scraping/news/biospace-jobs/latest
 * Get latest biotech job postings
 */
router.get('/biospace-jobs/latest', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getBioSpaceJobsScraper();
    
    const jobs = await scraper.getLatestJobs(maxResults);
    
    res.json({
      success: true,
      source: 'BioSpace Jobs',
      count: jobs.length,
      jobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch BioSpace jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/biospace-jobs/search
 * Search biotech job postings
 */
router.post('/biospace-jobs/search', async (req: Request, res: Response) => {
  try {
    const { query, location, company, jobType, experienceLevel, therapeuticArea, maxResults } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getBioSpaceJobsScraper();
    
    const jobs = await scraper.searchJobs({
      query,
      location,
      company,
      jobType,
      experienceLevel,
      therapeuticArea,
      maxResults: maxResults || 20,
    });
    
    res.json({
      success: true,
      source: 'BioSpace Jobs',
      query,
      count: jobs.length,
      jobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search BioSpace jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as newBiotechNewsRouter };
