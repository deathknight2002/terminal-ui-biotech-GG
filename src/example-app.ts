/**
 * Example Application - Demonstrates Neural Architecture
 * 
 * Shows how to initialize and use the modular ecosystem for a
 * biotech intelligence terminal.
 */

import {
  initializeCore,
  EventBus,
  EventTypes,
  ServiceRegistry,
  DiagnosticSystem,
  IntelligentRouter,
  ConfigurationManager,
  DocumentationGenerator,
  AdaptiveCache,
  CircuitBreaker,
} from './core';

import { DrugDataModule } from './modules/drug-data-module';

/**
 * Initialize and run the biotech terminal system
 */
async function main() {
  console.log('🧬 Biotech Terminal - Neural Architecture Demo\n');

  // ============================================
  // STEP 1: Initialize Core Infrastructure
  // ============================================
  console.log('📦 Initializing core infrastructure...');
  
  await initializeCore({
    cache: {
      maxSize: 1000,
      defaultTTL: 300000, // 5 minutes
    },
    diagnostics: {
      enableMonitoring: true,
    },
  });

  // ============================================
  // STEP 2: Register Circuit Breakers
  // ============================================
  console.log('🔌 Setting up circuit breakers...');
  
  CircuitBreaker.create('drug-data-provider', {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 60000,
    resetTimeout: 30000,
  });

  // ============================================
  // STEP 3: Initialize Modules
  // ============================================
  console.log('🧩 Initializing modules...');
  
  const drugModule = new DrugDataModule();
  await drugModule.initialize({
    apiEndpoint: 'https://api.biotech-terminal.example/drugs',
    updateInterval: 300000,
    cacheTTL: 600000,
  });

  // ============================================
  // STEP 4: Subscribe to Events
  // ============================================
  console.log('📡 Setting up event listeners...');
  
  EventBus.subscribe(EventTypes.DATA_LOADED, (event) => {
    console.log(`✅ Data loaded from ${event.source}:`, event.payload);
  });

  EventBus.subscribe(EventTypes.SYSTEM_DEGRADED, (event) => {
    console.warn(`⚠️ System degraded:`, event.payload);
  });

  EventBus.subscribe(EventTypes.MODULE_ERROR, (event) => {
    console.error(`❌ Module error:`, event.payload);
  });

  // ============================================
  // STEP 5: Demo Queries
  // ============================================
  console.log('\n🔍 Running demo queries...\n');

  // Query 1: Get all Phase III drugs
  console.log('Query 1: All Phase III drugs');
  const result1 = await IntelligentRouter.route({
    id: 'query-1',
    type: 'drug-query',
    filters: { phase: 'Phase III' },
    pagination: { page: 1, pageSize: 10 },
  }, {
    cacheable: true,
    priority: 'high',
  });

  console.log(`  Found ${result1.data.data.length} drugs`);
  console.log(`  Execution time: ${result1.executionTime.toFixed(2)}ms`);
  console.log(`  Source: ${result1.source}`);
  console.log(`  Cached: ${result1.cached}\n`);

  // Query 2: Same query (should hit cache)
  console.log('Query 2: Same query (testing cache)');
  const result2 = await IntelligentRouter.route({
    id: 'query-2',
    type: 'drug-query',
    filters: { phase: 'Phase III' },
    pagination: { page: 1, pageSize: 10 },
  });

  console.log(`  Found ${result2.data.data.length} drugs`);
  console.log(`  Execution time: ${result2.executionTime.toFixed(2)}ms`);
  console.log(`  Source: ${result2.source}`);
  console.log(`  Cached: ${result2.cached}\n`);

  // Query 3: Different phase
  console.log('Query 3: All Phase II drugs');
  const result3 = await IntelligentRouter.route({
    id: 'query-3',
    type: 'drug-query',
    filters: { phase: 'Phase II' },
  });

  console.log(`  Found ${result3.data.data.length} drugs`);
  console.log(`  Execution time: ${result3.executionTime.toFixed(2)}ms\n`);

  // ============================================
  // STEP 6: System Diagnostics
  // ============================================
  console.log('📊 System Diagnostics\n');

  // Health check
  const health = await DiagnosticSystem.getHealth();
  console.log(`Overall Health: ${health.overall.toUpperCase()}`);
  console.log(`\nComponent Status:`);
  health.components.forEach(comp => {
    const icon = comp.status === 'healthy' ? '✅' : comp.status === 'degraded' ? '⚠️' : '❌';
    console.log(`  ${icon} ${comp.name}: ${comp.status}`);
  });

  // Performance metrics
  console.log(`\nPerformance Metrics:`);
  const busStats = EventBus.getStats();
  console.log(`  Event Bus:`);
  console.log(`    - Total events: ${busStats.totalEvents}`);
  console.log(`    - Avg processing: ${busStats.averageProcessingTime.toFixed(2)}ms`);
  console.log(`    - Subscribers: ${busStats.subscriberCount}`);

  const cacheStats = AdaptiveCache.getStats();
  console.log(`  Cache:`);
  console.log(`    - Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
  console.log(`    - Size: ${cacheStats.currentSize}/${cacheStats.maxSize}`);
  console.log(`    - Evictions: ${cacheStats.evictions}`);

  const routerStats = IntelligentRouter.getStats();
  console.log(`  Router:`);
  console.log(`    - Total requests: ${routerStats.totalRequests}`);
  console.log(`    - Success rate: ${((routerStats.successfulRequests / routerStats.totalRequests) * 100).toFixed(1)}%`);
  console.log(`    - Avg response: ${routerStats.averageResponseTime.toFixed(2)}ms`);

  // Trends
  const trends = DiagnosticSystem.getHealthTrends();
  console.log(`\nTrends:`);
  console.log(`  - Overall: ${trends.overallTrend}`);
  console.log(`  - Cache performance: ${trends.cacheHitRateTrend > 0 ? 'improving' : 'stable'}`);
  console.log(`  - Event processing: ${trends.eventProcessingTrend < 0 ? 'improving' : 'stable'}`);

  // Recommendations
  if (health.recommendations.length > 0) {
    console.log(`\nRecommendations:`);
    health.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  // ============================================
  // STEP 7: Service Registry Visualization
  // ============================================
  console.log('\n🌐 Service Architecture\n');
  console.log(ServiceRegistry.visualizeDependencies());

  // ============================================
  // STEP 8: Cache Predictions
  // ============================================
  const predictions = AdaptiveCache.getPredictions(3);
  if (predictions.length > 0) {
    console.log('🔮 Predicted next accesses:');
    predictions.forEach(key => console.log(`  - ${key}`));
    console.log();
  }

  // ============================================
  // STEP 9: Generate Documentation
  // ============================================
  console.log('📚 Generating system documentation...');
  const docs = await DocumentationGenerator.generateSystemDocs();
  console.log(`Generated ${docs.length} characters of documentation`);
  
  // Optional: export to file
  // await DocumentationGenerator.exportToFile('./SYSTEM_DOCS.md');

  // ============================================
  // STEP 10: Configuration Export
  // ============================================
  console.log('\n⚙️ Configuration Summary\n');
  const configs = ConfigurationManager.exportConfigs(true);
  console.log(JSON.stringify(configs, null, 2));

  // ============================================
  // STEP 11: Demonstrate Adaptive Behavior
  // ============================================
  console.log('\n🧠 Demonstrating Adaptive Intelligence\n');

  // Simulate multiple accesses to track patterns
  console.log('Simulating access patterns...');
  for (let i = 0; i < 5; i++) {
    await IntelligentRouter.route({
      id: `pattern-${i}`,
      type: 'drug-query',
      filters: { phase: 'Phase III' },
    });
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Check updated predictions
  const newPredictions = AdaptiveCache.getPredictions(5);
  console.log(`\nUpdated predictions (${newPredictions.length} keys):`);
  newPredictions.forEach(key => console.log(`  - ${key}`));

  // ============================================
  // STEP 12: Test Circuit Breaker
  // ============================================
  console.log('\n🔌 Testing Circuit Breaker\n');

  try {
    await CircuitBreaker.execute('drug-data-provider', async () => {
      // Simulate successful request
      return 'success';
    });
    console.log('✅ Circuit breaker test passed');
  } catch (error) {
    console.error('❌ Circuit breaker test failed:', error);
  }

  const cbStats = CircuitBreaker.getStats('drug-data-provider');
  console.log(`Circuit breaker state: ${cbStats?.state}`);
  console.log(`Total requests: ${cbStats?.totalRequests}`);

  // ============================================
  // STEP 13: Module Capabilities
  // ============================================
  console.log('\n🎯 Module Capabilities\n');
  
  const moduleDesc = drugModule.describe();
  console.log(`Module: ${moduleDesc.name} v${moduleDesc.version}`);
  console.log(`Description: ${moduleDesc.description}`);
  console.log(`\nCapabilities:`);
  moduleDesc.capabilities.forEach(cap => {
    console.log(`  - ${cap.name}: ${cap.description}`);
    console.log(`    Inputs: ${cap.inputTypes.join(', ')}`);
    console.log(`    Outputs: ${cap.outputTypes.join(', ')}`);
  });

  // ============================================
  // STEP 14: Export Diagnostic Report
  // ============================================
  console.log('\n📋 Generating Diagnostic Report\n');
  
  const report = await DiagnosticSystem.generateReport();
  console.log(`Report generated in ${report.duration}ms`);
  console.log(`Event history entries: ${report.eventHistory.length}`);
  console.log(`Top cached keys: ${report.cacheAnalysis.topKeys.slice(0, 3).join(', ')}`);

  // ============================================
  // Cleanup
  // ============================================
  console.log('\n🛑 Shutting down...');
  
  await drugModule.shutdown();
  DiagnosticSystem.stopMonitoring();
  
  console.log('\n✅ Demo complete!');
  console.log('\nKey Achievements:');
  console.log('  ✅ Modular architecture with autonomous components');
  console.log('  ✅ Event-driven communication');
  console.log('  ✅ Intelligent caching with predictions');
  console.log('  ✅ Circuit breaker protection');
  console.log('  ✅ Self-documenting modules');
  console.log('  ✅ Real-time diagnostics and health monitoring');
  console.log('  ✅ Adaptive routing and optimization');
  console.log('  ✅ Declarative configuration');
  console.log('\n🎉 System coherence achieved!\n');
}

// Run the demo
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
