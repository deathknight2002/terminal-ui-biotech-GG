/**
 * Enhanced News Aggregation API
 * Provides intelligent news feed with category filtering, scoring, and ranking
 */

import express, { Request, Response } from 'express';
import { newsIntelligenceService } from '../services/news-intelligence.js';
import { getScrapingManager } from '../scraping/scraping-manager.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/news/aggregate
 * Aggregate news from all sources with intelligent scoring
 */
router.get('/aggregate', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 50;
    const category = req.query.category as string; // therapeutic area filter
    const onlyTradable = req.query.tradable === 'true';
    const watchlist = req.query.watchlist
      ? (req.query.watchlist as string).split(',')
      : [];

    const manager = getScrapingManager();
    const allArticles: any[] = [];

    // Fetch from all sources in parallel
    const [pharmaNews, genNews, bioDive, fdaNews] = await Promise.allSettled([
      manager.getPharmaNewsWireScraper().getLatestNews(20).catch(() => []),
      manager.getGenEngNewsScraper().getLatestNews(20).catch(() => []),
      manager.getBioPharmaDigestScraper().getLatestNews(20).catch(() => []),
      manager.getFDANewsTrackerScraper().getLatestNews(10).catch(() => []),
    ]);

    // Combine all results
    if (pharmaNews.status === 'fulfilled') allArticles.push(...pharmaNews.value);
    if (genNews.status === 'fulfilled') allArticles.push(...genNews.value);
    if (bioDive.status === 'fulfilled') allArticles.push(...bioDive.value);
    if (fdaNews.status === 'fulfilled') allArticles.push(...fdaNews.value);

    // Process with intelligence service
    let processedArticles = newsIntelligenceService.processBatch(allArticles, watchlist);

    // Apply filters
    if (category && category !== 'all') {
      processedArticles = processedArticles.filter(
        (article) =>
          article.therapeuticAreas &&
          article.therapeuticAreas.includes(category as any)
      );
    }

    if (onlyTradable) {
      processedArticles = processedArticles.filter((article) => article.isTradable);
    }

    // Limit results
    processedArticles = processedArticles.slice(0, maxResults);

    // Get category counts for UI
    const categoryCounts = getCategoryCounts(processedArticles);

    res.json({
      success: true,
      count: processedArticles.length,
      totalFetched: allArticles.length,
      articles: processedArticles,
      categoryCounts,
      filters: {
        category,
        onlyTradable,
        watchlist,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to aggregate news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news/top-news
 * Get top news of the day (Critical/High importance only)
 */
router.get('/top-news', async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 10;

    const manager = getScrapingManager();
    const allArticles: any[] = [];

    // Fetch from all sources
    const [pharmaNews, genNews, bioDive, fdaNews] = await Promise.allSettled([
      manager.getPharmaNewsWireScraper().getLatestNews(15).catch(() => []),
      manager.getGenEngNewsScraper().getLatestNews(15).catch(() => []),
      manager.getBioPharmaDigestScraper().getLatestNews(15).catch(() => []),
      manager.getFDANewsTrackerScraper().getLatestNews(10).catch(() => []),
    ]);

    if (pharmaNews.status === 'fulfilled') allArticles.push(...pharmaNews.value);
    if (genNews.status === 'fulfilled') allArticles.push(...genNews.value);
    if (bioDive.status === 'fulfilled') allArticles.push(...bioDive.value);
    if (fdaNews.status === 'fulfilled') allArticles.push(...fdaNews.value);

    // Process and filter for top news only
    let processedArticles = newsIntelligenceService.processBatch(allArticles);
    const topNews = processedArticles.filter(
      (article) => article.importance === 'Critical' || article.importance === 'High'
    );

    res.json({
      success: true,
      count: topNews.slice(0, maxResults).length,
      articles: topNews.slice(0, maxResults),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch top news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news/by-category/:category
 * Get news for a specific therapeutic area
 */
router.get('/by-category/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    const maxResults = parseInt(req.query.maxResults as string) || 30;

    const manager = getScrapingManager();
    const allArticles: any[] = [];

    // Fetch from all sources
    const [pharmaNews, genNews, bioDive] = await Promise.allSettled([
      manager.getPharmaNewsWireScraper().getLatestNews(20).catch(() => []),
      manager.getGenEngNewsScraper().getLatestNews(20).catch(() => []),
      manager.getBioPharmaDigestScraper().getLatestNews(20).catch(() => []),
    ]);

    if (pharmaNews.status === 'fulfilled') allArticles.push(...pharmaNews.value);
    if (genNews.status === 'fulfilled') allArticles.push(...genNews.value);
    if (bioDive.status === 'fulfilled') allArticles.push(...bioDive.value);

    // Process and filter by category
    let processedArticles = newsIntelligenceService.processBatch(allArticles);
    const categoryNews = processedArticles.filter(
      (article) =>
        article.therapeuticAreas &&
        article.therapeuticAreas.includes(category as any)
    );

    res.json({
      success: true,
      category,
      count: categoryNews.slice(0, maxResults).length,
      articles: categoryNews.slice(0, maxResults),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Failed to fetch news for category ${req.params.category}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category news',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/news/search
 * Search news with filters
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, categories, companies, tickers, onlyTradable, onlyPortfolio, maxResults = 50 } = req.body;

    const manager = getScrapingManager();
    const allArticles: any[] = [];

    // Fetch from all sources
    const [pharmaNews, genNews, bioDive, fdaNews] = await Promise.allSettled([
      manager.getPharmaNewsWireScraper().getLatestNews(30).catch(() => []),
      manager.getGenEngNewsScraper().getLatestNews(30).catch(() => []),
      manager.getBioPharmaDigestScraper().getLatestNews(30).catch(() => []),
      manager.getFDANewsTrackerScraper().getLatestNews(15).catch(() => []),
    ]);

    if (pharmaNews.status === 'fulfilled') allArticles.push(...pharmaNews.value);
    if (genNews.status === 'fulfilled') allArticles.push(...genNews.value);
    if (bioDive.status === 'fulfilled') allArticles.push(...bioDive.value);
    if (fdaNews.status === 'fulfilled') allArticles.push(...fdaNews.value);

    // Process articles
    let processedArticles = newsIntelligenceService.processBatch(allArticles, tickers || []);

    // Apply search filters
    if (query) {
      const lowerQuery = query.toLowerCase();
      processedArticles = processedArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(lowerQuery) ||
          article.summary.toLowerCase().includes(lowerQuery)
      );
    }

    if (categories && categories.length > 0) {
      processedArticles = processedArticles.filter(
        (article) =>
          article.therapeuticAreas &&
          article.therapeuticAreas.some((area: string) => categories.includes(area))
      );
    }

    if (companies && companies.length > 0) {
      processedArticles = processedArticles.filter(
        (article) =>
          article.companies &&
          article.companies.some((comp: string) =>
            companies.some((c: string) => comp.toLowerCase().includes(c.toLowerCase()))
          )
      );
    }

    if (onlyTradable) {
      processedArticles = processedArticles.filter((article) => article.isTradable);
    }

    if (onlyPortfolio) {
      processedArticles = processedArticles.filter((article) => article.isPortfolioRelevant);
    }

    res.json({
      success: true,
      count: processedArticles.slice(0, maxResults).length,
      articles: processedArticles.slice(0, maxResults),
      query: { query, categories, companies, tickers, onlyTradable, onlyPortfolio },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to search news:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Helper: Get category counts from articles
 */
function getCategoryCounts(articles: any[]): Record<string, number> {
  const counts: Record<string, number> = {
    'all': articles.length,
    'SMA': 0,
    'GLP-1': 0,
    'Metabolic': 0,
    'Oncology': 0,
    'Rare Disease': 0,
    'Immunology': 0,
    'Neurology': 0,
    'Cardiovascular': 0,
    'Ophthalmology': 0,
    'Other': 0,
  };

  for (const article of articles) {
    if (article.therapeuticAreas) {
      for (const area of article.therapeuticAreas) {
        if (counts[area] !== undefined) {
          counts[area]++;
        }
      }
    }
  }

  return counts;
}

export { router as enhancedNewsRouter };
