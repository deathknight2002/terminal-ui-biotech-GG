/**
 * Seed Script for Epidemiology Database
 * Initializes database with sample data and runs all ETL pipelines
 */

import { getPrismaClient } from '../db';
import { logger } from '../utils/logger';
import { initializeCrosswalks } from './icd_crosswalk';
import { runSEERETL } from './seer';
import { runWHOETL } from './who';
import { runCDCETL } from './cdc';

/**
 * Main seed function
 */
async function seed() {
  logger.info('Starting database seed...');
  const startTime = Date.now();
  
  try {
    const prisma = getPrismaClient();
    
    // 1. Clear existing data (optional - comment out to preserve data)
    logger.info('Clearing existing data...');
    await prisma.provenance.deleteMany({});
    await prisma.metric.deleteMany({});
    await prisma.disease.deleteMany({});
    await prisma.crosswalk.deleteMany({});
    
    // 2. Initialize ICD crosswalks
    logger.info('Initializing ICD crosswalks...');
    await initializeCrosswalks();
    
    // 3. Run SEER ETL
    logger.info('Running SEER ETL...');
    const seerResult = await runSEERETL();
    logger.info('SEER ETL completed', seerResult);
    
    // 4. Run WHO ETL
    logger.info('Running WHO ETL...');
    const whoResult = await runWHOETL();
    logger.info('WHO ETL completed', whoResult);
    
    // 5. Run CDC ETL
    logger.info('Running CDC ETL...');
    const cdcResult = await runCDCETL();
    logger.info('CDC ETL completed', cdcResult);
    
    // Summary
    const totalDiseases = await prisma.disease.count();
    const totalMetrics = await prisma.metric.count();
    const totalProvenance = await prisma.provenance.count();
    const totalCrosswalks = await prisma.crosswalk.count();
    
    const duration = Date.now() - startTime;
    
    logger.info('Database seed completed successfully', {
      duration: `${(duration / 1000).toFixed(2)}s`,
      diseases: totalDiseases,
      metrics: totalMetrics,
      provenance: totalProvenance,
      crosswalks: totalCrosswalks,
      seer: seerResult,
      who: whoResult,
      cdc: cdcResult,
    });
    
    console.log('\n✅ Seed completed successfully!');
    console.log(`   Diseases: ${totalDiseases}`);
    console.log(`   Metrics: ${totalMetrics}`);
    console.log(`   Provenance records: ${totalProvenance}`);
    console.log(`   Crosswalks: ${totalCrosswalks}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s\n`);
    
  } catch (error) {
    logger.error('Seed failed', error);
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error during seed:', error);
    process.exit(1);
  });
