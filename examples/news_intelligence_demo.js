#!/usr/bin/env node
/**
 * News Intelligence Demo
 * Demonstrates the news archive, trend analysis, and prediction capabilities
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function main() {
  console.log('🧬 Biotech Terminal - News Intelligence Demo\n');

  try {
    // 1. Seed the archive with initial data
    console.log('1️⃣  Seeding archive with latest news...');
    const seedResponse = await fetch(`${API_BASE}/api/news-intelligence/seed`, {
      method: 'POST',
    });
    const seedData = await seedResponse.json();
    console.log(`   ✅ Seeded ${seedData.stats.totalEvents} events\n`);

    // 2. Get archive statistics
    console.log('2️⃣  Fetching archive statistics...');
    const statsResponse = await fetch(`${API_BASE}/api/news-intelligence/stats`);
    const statsData = await statsResponse.json();
    console.log(`   📊 Total events: ${statsData.stats.totalEvents}`);
    console.log(`   📂 Categories:`, statsData.stats.eventsByCategory);
    console.log(`   ⭐ Importance:`, statsData.stats.eventsByImportance);
    console.log('');

    // 3. Query specific company events (Tectonic Therapeutic)
    console.log('3️⃣  Querying Tectonic Therapeutic (TECX) events...');
    const tecxResponse = await fetch(`${API_BASE}/api/news-intelligence/company/Tectonic`);
    const tecxData = await tecxResponse.json();
    console.log(`   🔬 Found ${tecxData.count} events for ${tecxData.company}`);
    if (tecxData.events.length > 0) {
      const event = tecxData.events[0];
      console.log(`   📰 Latest: "${event.title}"`);
      console.log(`   📅 Date: ${new Date(event.publishedDate).toLocaleDateString()}`);
      console.log(`   ⚡ Importance: ${event.importance}`);
      if (event.clinicalData) {
        console.log(`   🧪 Clinical Data:`);
        console.log(`      Phase: ${event.clinicalData.phase}`);
        console.log(`      Indication: ${event.clinicalData.indication}`);
        console.log(`      Patients: ${event.clinicalData.patientCount}`);
        console.log(`      Endpoints:`);
        event.clinicalData.endpoints?.slice(0, 3).forEach(ep => {
          console.log(`        - ${ep.name}: ${ep.percentChange > 0 ? '+' : ''}${ep.percentChange}% (${ep.unit})`);
        });
      }
    }
    console.log('');

    // 4. Query M&A events (Thermo Fisher)
    console.log('4️⃣  Querying M&A events...');
    const maResponse = await fetch(`${API_BASE}/api/news-intelligence/archive?category=M%26A`);
    const maData = await maResponse.json();
    console.log(`   💼 Found ${maData.count} M&A events`);
    if (maData.events.length > 0) {
      const deal = maData.events[0];
      console.log(`   📰 Latest: "${deal.title}"`);
      if (deal.dealData) {
        console.log(`   💰 Deal Structure:`);
        console.log(`      Acquirer: ${deal.dealData.acquirer}`);
        console.log(`      Target: ${deal.dealData.target}`);
        console.log(`      Upfront: $${(deal.dealData.upfrontValue / 1000).toFixed(2)}B`);
        console.log(`      Total Value: $${(deal.dealData.totalValue / 1000).toFixed(2)}B`);
        console.log(`      Earnout: $${(deal.dealData.earnoutValue / 1000).toFixed(2)}B`);
        console.log(`      Synergies: $${deal.dealData.synergies}M`);
        console.log(`      Closing: ${deal.dealData.closingDate}`);
      }
    }
    console.log('');

    // 5. Analyze cardiovascular trial trends
    console.log('5️⃣  Analyzing Trial Results trends in Cardiovascular...');
    const trendResponse = await fetch(
      `${API_BASE}/api/news-intelligence/trends/Trial%20Results?therapeuticArea=Cardiovascular&timeframe=month`
    );
    const trendData = await trendResponse.json();
    console.log(`   📈 Trend Analysis (Last Month):`);
    console.log(`      Event Count: ${trendData.trend.eventCount}`);
    console.log(`      Momentum: ${trendData.trend.momentum.toUpperCase()}`);
    console.log(`      Avg Importance: ${trendData.trend.averageImportance.toFixed(2)}/4`);
    console.log(`      Top Companies:`);
    trendData.trend.topCompanies.slice(0, 3).forEach((company, idx) => {
      console.log(`        ${idx + 1}. ${company.name} (${company.count} events)`);
    });
    console.log('');

    // 6. Get predictions for upcoming events
    console.log('6️⃣  Generating predictions for next 30 days...');
    const predResponse = await fetch(`${API_BASE}/api/news-intelligence/predictions?lookbackDays=90`);
    const predData = await predResponse.json();
    console.log(`   🔮 Generated ${predData.count} predictions:`);
    console.log('');

    predData.predictions.slice(0, 3).forEach((pred, idx) => {
      console.log(`   Prediction ${idx + 1}:`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   🎯 Event Type: ${pred.predicted_event_type}`);
      if (pred.predicted_therapeutic_area) {
        console.log(`   🔬 Therapeutic Area: ${pred.predicted_therapeutic_area}`);
      }
      console.log(`   📊 Probability: ${pred.probability.toFixed(1)}%`);
      console.log(`   📉 Confidence Interval: [${pred.confidence_interval[0].toFixed(1)}%, ${pred.confidence_interval[1].toFixed(1)}%]`);
      console.log(`   ⏰ Expected: ${pred.expected_timeframe}`);
      console.log(`   💡 Reasoning:`);
      pred.reasoning.forEach(reason => {
        console.log(`      • ${reason}`);
      });
      console.log(`   📚 Similar Past Events: ${pred.similar_historical_events.length}`);
      console.log('');
    });

    // 7. Query all archived events
    console.log('7️⃣  Listing recent archived events (last 5)...');
    const archiveResponse = await fetch(`${API_BASE}/api/news-intelligence/archive?limit=5`);
    const archiveData = await archiveResponse.json();
    console.log(`   📚 Recent Events:`);
    archiveData.events.forEach((event, idx) => {
      console.log(`   ${idx + 1}. [${event.category}] ${event.title}`);
      console.log(`      ${event.importance} | ${event.therapeuticAreas.join(', ')}`);
      console.log(`      ${new Date(event.publishedDate).toLocaleDateString()} | Score: ${event.relevanceScore}/100`);
      console.log('');
    });

    console.log('✅ Demo completed successfully!\n');
    console.log('💡 Tip: Use the REST API endpoints to integrate with your application:');
    console.log('   - GET /api/news-intelligence/archive');
    console.log('   - GET /api/news-intelligence/trends/:category');
    console.log('   - GET /api/news-intelligence/predictions');
    console.log('   - GET /api/news-intelligence/company/:company');
    console.log('\n📖 See NEWS_INTELLIGENCE_README.md for full documentation');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n⚠️  Make sure the backend server is running:');
    console.error('   cd backend && npm run dev');
    process.exit(1);
  }
}

main();
