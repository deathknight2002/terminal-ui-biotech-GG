/**
 * News Scraping Routes
 * API endpoints for biotech news sources
 */

import express, { Request, Response } from 'express';
import { getScrapingManager } from '../scraping/scraping-manager.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/scraping/news/fierce-biotech/latest
 * Get latest Fierce Biotech articles
 */
router.get('/fierce-biotech/latest', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getFierceBiotechScraper();
    
    const articles = await scraper.getLatestNews(maxResults);
    
    res.json({
      success: true,
      source: 'Fierce Biotech',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch Fierce Biotech articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/fierce-biotech/search
 * Search Fierce Biotech articles
 */
router.post('/fierce-biotech/search', async (req: Request, res: Response) => {
  try {
    const { query, category, maxResults, sortBy } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getFierceBiotechScraper();
    
    const articles = await scraper.searchArticles({
      query,
      category,
      maxResults: maxResults || 20,
      sortBy,
    });
    
    res.json({
      success: true,
      source: 'Fierce Biotech',
      query,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search Fierce Biotech:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/fierce-biotech/category/:category
 * Get articles by category
 */
router.get('/fierce-biotech/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getFierceBiotechScraper();
    
    const articles = await scraper.getArticlesByCategory(category, maxResults);
    
    res.json({
      success: true,
      source: 'Fierce Biotech',
      category,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch category articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/science-daily/top
 * Get Science Daily top stories
 */
router.get('/science-daily/top', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 10;
    
    const manager = getScrapingManager();
    const scraper = manager.getScienceDailyScraper();
    
    const articles = await scraper.getTopStories(maxResults);
    
    res.json({
      success: true,
      source: 'Science Daily',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch Science Daily top stories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/science-daily/health
 * Get Science Daily health news
 */
router.get('/science-daily/health', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getScienceDailyScraper();
    
    const articles = await scraper.getHealthNews(maxResults);
    
    res.json({
      success: true,
      source: 'Science Daily',
      category: 'Health & Medicine',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch Science Daily health news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/science-daily/biotech
 * Get Science Daily biotech news
 */
router.get('/science-daily/biotech', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getScienceDailyScraper();
    
    const articles = await scraper.getBiotechNews(maxResults);
    
    res.json({
      success: true,
      source: 'Science Daily',
      category: 'Biotechnology',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch Science Daily biotech news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/science-daily/search
 * Search Science Daily
 */
router.post('/science-daily/search', async (req: Request, res: Response) => {
  try {
    const { query, category, maxResults, dateFrom } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getScienceDailyScraper();
    
    const articles = await scraper.searchArticles({
      query,
      category,
      maxResults: maxResults || 20,
      dateFrom,
    });
    
    res.json({
      success: true,
      source: 'Science Daily',
      query,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search Science Daily:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/biospace/latest
 * Get latest BioSpace articles
 */
router.get('/biospace/latest', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getBioSpaceScraper();
    
    const articles = await scraper.getLatestNews(maxResults);
    
    res.json({
      success: true,
      source: 'BioSpace',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch BioSpace articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/biospace/company/:company
 * Get company news from BioSpace
 */
router.get('/biospace/company/:company', async (req: Request, res: Response) => {
  try {
    const { company } = req.params;
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getBioSpaceScraper();
    
    const articles = await scraper.getCompanyNews(company, maxResults);
    
    res.json({
      success: true,
      source: 'BioSpace',
      company,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch BioSpace company news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/biospace/search
 * Search BioSpace
 */
router.post('/biospace/search', async (req: Request, res: Response) => {
  try {
    const { query, category, maxResults } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getBioSpaceScraper();
    
    const articles = await scraper.searchArticles({
      query,
      category,
      maxResults: maxResults || 20,
    });
    
    res.json({
      success: true,
      source: 'BioSpace',
      query,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search BioSpace:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/endpoints/latest
 * Get latest Endpoints News articles
 */
router.get('/endpoints/latest', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getEndpointsNewsScraper();
    
    const articles = await scraper.getLatestNews(maxResults);
    
    res.json({
      success: true,
      source: 'Endpoints News',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch Endpoints News articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/endpoints/dealmaking
 * Get dealmaking news
 */
router.get('/endpoints/dealmaking', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getEndpointsNewsScraper();
    
    const articles = await scraper.getDealMakingNews(maxResults);
    
    res.json({
      success: true,
      source: 'Endpoints News',
      category: 'Dealmaking',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch Endpoints dealmaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/endpoints/r-d
 * Get R&D news
 */
router.get('/endpoints/r-d', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getEndpointsNewsScraper();
    
    const articles = await scraper.getRAndDNews(maxResults);
    
    res.json({
      success: true,
      source: 'Endpoints News',
      category: 'R&D',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch Endpoints R&D news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/endpoints/regulation
 * Get regulatory news
 */
router.get('/endpoints/regulation', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    
    const manager = getScrapingManager();
    const scraper = manager.getEndpointsNewsScraper();
    
    const articles = await scraper.getRegulatoryNews(maxResults);
    
    res.json({
      success: true,
      source: 'Endpoints News',
      category: 'Regulation',
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch Endpoints regulatory news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/scraping/news/endpoints/search
 * Search Endpoints News
 */
router.post('/endpoints/search', async (req: Request, res: Response) => {
  try {
    const { query, category, maxResults } = req.body;
    
    const manager = getScrapingManager();
    const scraper = manager.getEndpointsNewsScraper();
    
    const articles = await scraper.searchArticles({
      query,
      category,
      maxResults: maxResults || 20,
    });
    
    res.json({
      success: true,
      source: 'Endpoints News',
      query,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search Endpoints News:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/all
 * Get aggregated news from all sources
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const maxResultsPerSource = parseInt(req.query.maxResults as string) || 10;
    
    const manager = getScrapingManager();
    
    // Fetch from all sources in parallel
    const [fierceBiotech, scienceDaily, bioSpace, endpoints] = await Promise.allSettled([
      manager.getFierceBiotechScraper().getLatestNews(maxResultsPerSource),
      manager.getScienceDailyScraper().getTopStories(maxResultsPerSource),
      manager.getBioSpaceScraper().getLatestNews(maxResultsPerSource),
      manager.getEndpointsNewsScraper().getLatestNews(maxResultsPerSource),
    ]);
    
    const aggregated = {
      fierceBiotech: fierceBiotech.status === 'fulfilled' ? fierceBiotech.value : [],
      scienceDaily: scienceDaily.status === 'fulfilled' ? scienceDaily.value : [],
      bioSpace: bioSpace.status === 'fulfilled' ? bioSpace.value : [],
      endpoints: endpoints.status === 'fulfilled' ? endpoints.value : [],
    };
    
    const totalCount = 
      aggregated.fierceBiotech.length +
      aggregated.scienceDaily.length +
      aggregated.bioSpace.length +
      aggregated.endpoints.length;
    
    res.json({
      success: true,
      count: totalCount,
      sources: {
        fierceBiotech: { count: aggregated.fierceBiotech.length, articles: aggregated.fierceBiotech },
        scienceDaily: { count: aggregated.scienceDaily.length, articles: aggregated.scienceDaily },
        bioSpace: { count: aggregated.bioSpace.length, articles: aggregated.bioSpace },
        endpoints: { count: aggregated.endpoints.length, articles: aggregated.endpoints },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch aggregated news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scraping/news/health
 * Get health status of all news scrapers
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const manager = getScrapingManager();
    
    const health = {
      fierceBiotech: manager.getFierceBiotechScraper().getHealth(),
      scienceDaily: manager.getScienceDailyScraper().getHealth(),
      bioSpace: manager.getBioSpaceScraper().getHealth(),
      endpoints: manager.getEndpointsNewsScraper().getHealth(),
      timestamp: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      health,
    });
  } catch (error) {
    logger.error('Failed to get news scrapers health:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
