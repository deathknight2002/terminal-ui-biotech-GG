/**
 * ETL Runner - Orchestrates all ETL pipelines
 * Can be run on a schedule or manually to refresh data
 */

import { logger } from '../utils/logger';
import { runSEERETL } from './seer';
import { runWHOETL } from './who';
import { runCDCETL } from './cdc';
import { initializeCrosswalks } from './icd_crosswalk';
import type { ETLResult } from './common';

/**
 * Run all ETL pipelines
 */
async function runAllETL(): Promise<{
  seer: ETLResult;
  who: ETLResult;
  cdc: ETLResult;
  summary: {
    totalDiseases: number;
    totalCreated: number;
    totalUpdated: number;
    totalSkipped: number;
    totalErrors: number;
    duration: number;
  };
}> {
  logger.info('Starting all ETL pipelines...');
  const startTime = Date.now();
  
  try {
    // Initialize crosswalks first (idempotent)
    logger.info('Ensuring ICD crosswalks are initialized...');
    await initializeCrosswalks();
    
    // Run all ETL pipelines in parallel for faster execution
    const [seerResult, whoResult, cdcResult] = await Promise.all([
      runSEERETL(),
      runWHOETL(),
      runCDCETL(),
    ]);
    
    const duration = Date.now() - startTime;
    
    const summary = {
      totalDiseases: seerResult.diseasesProcessed + whoResult.diseasesProcessed + cdcResult.diseasesProcessed,
      totalCreated: seerResult.metricsCreated + whoResult.metricsCreated + cdcResult.metricsCreated,
      totalUpdated: seerResult.metricsUpdated + whoResult.metricsUpdated + cdcResult.metricsUpdated,
      totalSkipped: seerResult.metricsSkipped + whoResult.metricsSkipped + cdcResult.metricsSkipped,
      totalErrors: seerResult.errors.length + whoResult.errors.length + cdcResult.errors.length,
      duration,
    };
    
    logger.info('All ETL pipelines completed', {
      duration: `${(duration / 1000).toFixed(2)}s`,
      summary,
    });
    
    console.log('\n✅ ETL pipelines completed successfully!');
    console.log(`   Total diseases processed: ${summary.totalDiseases}`);
    console.log(`   Metrics created: ${summary.totalCreated}`);
    console.log(`   Metrics updated: ${summary.totalUpdated}`);
    console.log(`   Metrics skipped (unchanged): ${summary.totalSkipped}`);
    console.log(`   Errors: ${summary.totalErrors}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s\n`);
    
    return {
      seer: seerResult,
      who: whoResult,
      cdc: cdcResult,
      summary,
    };
  } catch (error) {
    logger.error('ETL pipeline failed', error);
    throw error;
  }
}

/**
 * Run a specific ETL pipeline
 */
async function runSpecificETL(source: 'seer' | 'who' | 'cdc'): Promise<ETLResult> {
  logger.info(`Running ${source.toUpperCase()} ETL pipeline...`);
  
  switch (source) {
    case 'seer':
      return await runSEERETL();
    case 'who':
      return await runWHOETL();
    case 'cdc':
      return await runCDCETL();
    default:
      throw new Error(`Unknown ETL source: ${source}`);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const source = args[0] as 'seer' | 'who' | 'cdc' | 'all';
  
  if (!source || source === 'all') {
    runAllETL()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('ETL failed:', error);
        process.exit(1);
      });
  } else if (['seer', 'who', 'cdc'].includes(source)) {
    runSpecificETL(source)
      .then((result) => {
        console.log(`\n✅ ${source.toUpperCase()} ETL completed:`, result);
        process.exit(0);
      })
      .catch((error) => {
        console.error(`${source.toUpperCase()} ETL failed:`, error);
        process.exit(1);
      });
  } else {
    console.error('Usage: tsx run_all.ts [seer|who|cdc|all]');
    process.exit(1);
  }
}

export { runAllETL, runSpecificETL };
