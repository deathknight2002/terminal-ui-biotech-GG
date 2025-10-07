/**
 * Example Script: Testing New News Scrapers
 * Demonstrates how to use the new biotech news scrapers
 */

import { initializeScrapingManager } from '../src/scraping/index.js';
import { logger } from '../src/utils/logger.js';

async function testNewScrapers() {
  logger.info('🚀 Starting scraper tests...\n');

  try {
    // Initialize scraping manager
    const manager = await initializeScrapingManager({
      pubmedApiKey: process.env.PUBMED_API_KEY,
      fdaApiKey: process.env.FDA_API_KEY,
    });

    logger.info('✅ Scraping Manager initialized\n');

    // Test 1: Fierce Biotech
    logger.info('📰 Testing Fierce Biotech scraper...');
    try {
      const fierceBiotech = manager.getFierceBiotechScraper();
      const fierceBiotechNews = await fierceBiotech.getLatestNews(5);
      logger.info(`   ✓ Fetched ${fierceBiotechNews.length} articles`);
      if (fierceBiotechNews.length > 0) {
        logger.info(`   Sample: "${fierceBiotechNews[0].title}"`);
      }
    } catch (error) {
      logger.error('   ✗ Failed:', error instanceof Error ? error.message : error);
    }
    logger.info('');

    // Test 2: Science Daily
    logger.info('🔬 Testing Science Daily scraper...');
    try {
      const scienceDaily = manager.getScienceDailyScraper();
      const scienceDailyNews = await scienceDaily.getLatestBiotechNews(5);
      logger.info(`   ✓ Fetched ${scienceDailyNews.length} articles`);
      if (scienceDailyNews.length > 0) {
        logger.info(`   Sample: "${scienceDailyNews[0].title}"`);
      }
    } catch (error) {
      logger.error('   ✗ Failed:', error instanceof Error ? error.message : error);
    }
    logger.info('');

    // Test 3: BioSpace
    logger.info('🧬 Testing BioSpace scraper...');
    try {
      const bioSpace = manager.getBioSpaceScraper();
      const bioSpaceNews = await bioSpace.getLatestNews(5);
      logger.info(`   ✓ Fetched ${bioSpaceNews.length} articles`);
      if (bioSpaceNews.length > 0) {
        logger.info(`   Sample: "${bioSpaceNews[0].title}"`);
      }
    } catch (error) {
      logger.error('   ✗ Failed:', error instanceof Error ? error.message : error);
    }
    logger.info('');

    // Test 4: Endpoints News
    logger.info('📰 Testing Endpoints News scraper...');
    try {
      const endpoints = manager.getEndpointsNewsScraper();
      const endpointsNews = await endpoints.getLatestNews(5);
      logger.info(`   ✓ Fetched ${endpointsNews.length} articles`);
      if (endpointsNews.length > 0) {
        logger.info(`   Sample: "${endpointsNews[0].title}"`);
      }
    } catch (error) {
      logger.error('   ✗ Failed:', error instanceof Error ? error.message : error);
    }
    logger.info('');

    // Test 5: BioPharma Dive
    logger.info('💊 Testing BioPharma Dive scraper...');
    try {
      const bioPharmDive = manager.getBioPharmDiveScraper();
      const bioPharmDiveNews = await bioPharmDive.getLatestNews(5);
      logger.info(`   ✓ Fetched ${bioPharmDiveNews.length} articles`);
      if (bioPharmDiveNews.length > 0) {
        logger.info(`   Sample: "${bioPharmDiveNews[0].title}"`);
      }
    } catch (error) {
      logger.error('   ✗ Failed:', error instanceof Error ? error.message : error);
    }
    logger.info('');

    // Test 6: Aggregated News (all sources)
    logger.info('📊 Testing aggregated news fetch...');
    try {
      const [fierce, science, bio, end, pharma] = await Promise.allSettled([
        manager.getFierceBiotechScraper().getLatestNews(3),
        manager.getScienceDailyScraper().getLatestBiotechNews(3),
        manager.getBioSpaceScraper().getLatestNews(3),
        manager.getEndpointsNewsScraper().getLatestNews(3),
        manager.getBioPharmDiveScraper().getLatestNews(3),
      ]);

      const results = {
        fierceBiotech: fierce.status === 'fulfilled' ? fierce.value : [],
        scienceDaily: science.status === 'fulfilled' ? science.value : [],
        bioSpace: bio.status === 'fulfilled' ? bio.value : [],
        endpoints: end.status === 'fulfilled' ? end.value : [],
        bioPharmDive: pharma.status === 'fulfilled' ? pharma.value : [],
      };

      const totalArticles = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
      logger.info(`   ✓ Aggregated ${totalArticles} articles from 5 sources`);
      
      Object.entries(results).forEach(([source, articles]) => {
        logger.info(`   - ${source}: ${articles.length} articles`);
      });
    } catch (error) {
      logger.error('   ✗ Failed:', error instanceof Error ? error.message : error);
    }
    logger.info('');

    // Test 7: Health Check
    logger.info('🏥 Checking scraper health...');
    try {
      const health = await manager.getHealth();
      logger.info('   Scraper Status:');
      logger.info(`   - Fierce Biotech: ${health.fierceBiotech.status}`);
      logger.info(`   - Science Daily: ${health.scienceDaily.status}`);
      logger.info(`   - BioSpace: ${health.bioSpace.status}`);
      logger.info(`   - Endpoints News: ${health.endpointsNews.status}`);
      logger.info(`   - BioPharma Dive: ${health.bioPharmDive.status}`);
    } catch (error) {
      logger.error('   ✗ Failed:', error instanceof Error ? error.message : error);
    }
    logger.info('');

    // Test 8: Statistics
    logger.info('📈 Retrieving scraper statistics...');
    try {
      const stats = manager.getStats();
      logger.info('   Cache Statistics:');
      logger.info(`   - Fierce Biotech: ${stats.fierceBiotech.cache.size} items cached`);
      logger.info(`   - Science Daily: ${stats.scienceDaily.cache.size} items cached`);
      logger.info(`   - BioSpace: ${stats.bioSpace.cache.size} items cached`);
      logger.info(`   - Endpoints: ${stats.endpointsNews.cache.size} items cached`);
      logger.info(`   - BioPharma Dive: ${stats.bioPharmDive.cache.size} items cached`);
    } catch (error) {
      logger.error('   ✗ Failed:', error instanceof Error ? error.message : error);
    }
    logger.info('');

    // Shutdown
    logger.info('🛑 Shutting down scraping manager...');
    await manager.shutdown();
    logger.info('✅ All tests completed!\n');

  } catch (error) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testNewScrapers().catch((error) => {
  logger.error('❌ Unhandled error:', error);
  process.exit(1);
});
