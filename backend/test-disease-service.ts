/**
 * Test script for disease-data-service
 * Run with: npx tsx test-disease-service.ts
 */

import { diseaseDataService } from './src/services/disease-data-service';

console.log('='.repeat(80));
console.log('Disease Data Service Test');
console.log('='.repeat(80));
console.log();

// Test 1: Get all diseases
console.log('Test 1: Get All Diseases');
console.log('-'.repeat(80));
const allDiseases = diseaseDataService.getAllDiseases();
console.log(`Total diseases: ${allDiseases.length}`);
allDiseases.forEach(d => {
  console.log(`  - ${d.name} (${d.category}) [${d.dataSources.join(', ')}]`);
});
console.log();

// Test 2: Search functionality
console.log('Test 2: Search for "cancer"');
console.log('-'.repeat(80));
const cancerResults = diseaseDataService.searchDiseases('cancer');
console.log(`Found ${cancerResults.length} results:`);
cancerResults.forEach(d => {
  console.log(`  - ${d.name} (Prevalence: ${d.prevalence.toFixed(1)})`);
});
console.log();

// Test 3: Filter by category
console.log('Test 3: Filter by Category "Cancer"');
console.log('-'.repeat(80));
const cancerDiseases = diseaseDataService.getDiseasesByCategory('Cancer');
console.log(`Found ${cancerDiseases.length} cancer types:`);
cancerDiseases.forEach(d => {
  console.log(`  - ${d.name}`);
  if (d.seerData) {
    console.log(`    5-year survival: ${d.seerData.fiveYearSurvival}%`);
  }
});
console.log();

// Test 4: Filter by data source
console.log('Test 4: Filter by Data Source "WHO"');
console.log('-'.repeat(80));
const whoDiseases = diseaseDataService.getDiseasesBySource('WHO');
console.log(`Found ${whoDiseases.length} WHO diseases:`);
whoDiseases.forEach(d => {
  console.log(`  - ${d.name}`);
  if (d.whoData) {
    console.log(`    DALYs: ${(d.whoData.dalys / 1000000).toFixed(1)}M`);
  }
});
console.log();

// Test 5: Get specific disease
console.log('Test 5: Get Specific Disease (seer-lung-cancer)');
console.log('-'.repeat(80));
const lungCancer = diseaseDataService.getDiseaseById('seer-lung-cancer');
if (lungCancer) {
  console.log(`Name: ${lungCancer.name}`);
  console.log(`ICD-10: ${lungCancer.icd10Code}`);
  console.log(`Category: ${lungCancer.category}`);
  console.log(`Prevalence: ${lungCancer.prevalence} per 100,000`);
  console.log(`Incidence: ${lungCancer.incidence} per 100,000`);
  console.log(`Mortality: ${(lungCancer.mortality * 100).toFixed(2)}%`);
  console.log(`Target Population: ${lungCancer.targetPopulation.toLocaleString()}`);
  console.log(`Data Sources: ${lungCancer.dataSources.join(', ')}`);
  if (lungCancer.seerData) {
    console.log(`SEER 5-year survival: ${lungCancer.seerData.fiveYearSurvival}%`);
    console.log(`SEER Median Age: ${lungCancer.seerData.medianAge}`);
  }
}
console.log();

// Test 6: Get statistics
console.log('Test 6: Database Statistics');
console.log('-'.repeat(80));
const stats = diseaseDataService.getStatistics();
console.log(`Total diseases: ${stats.totalDiseases}`);
console.log(`Total population affected: ${stats.totalPopulation.toLocaleString()}`);
console.log(`Average prevalence: ${stats.averagePrevalence.toFixed(1)}`);
console.log();
console.log('By Category:');
Object.entries(stats.byCategory).forEach(([cat, count]) => {
  console.log(`  - ${cat}: ${count}`);
});
console.log();
console.log('By Data Source:');
Object.entries(stats.bySource).forEach(([source, count]) => {
  console.log(`  - ${source}: ${count}`);
});
console.log();

// Test 7: Advanced search with filters
console.log('Test 7: Advanced Search with Filters');
console.log('-'.repeat(80));
const filteredResults = diseaseDataService.searchDiseases('', {
  category: ['Infectious Disease'],
  dataSource: ['WHO'],
  minPrevalence: 100
});
console.log(`Found ${filteredResults.length} infectious diseases with prevalence > 100:`);
filteredResults.forEach(d => {
  console.log(`  - ${d.name} (Prevalence: ${d.prevalence.toFixed(1)})`);
});
console.log();

console.log('='.repeat(80));
console.log('All tests completed successfully!');
console.log('='.repeat(80));
