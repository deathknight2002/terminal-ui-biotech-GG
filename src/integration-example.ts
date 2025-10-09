/**
 * Integration Example - P0/P1 Infrastructure Demo
 * 
 * Shows how to use all new components together:
 * - DI Container for service management
 * - CloudEventBus for event-driven architecture
 * - FAERS, Drugs@FDA, and Catalyst Engine connectors
 * - Contract validation
 */

import { container, ServiceTokens } from './core/di-container';
import { createCloudEventBus } from './core/cloudevent-bus';
import { FAERSConnector } from './connectors/faers';
import { DrugsAtFDAConnector } from './connectors/drugsfda';
import { CTGovV2Connector } from './connectors/ctgov-v2';
import { CatalystEngine } from './connectors/catalyst-engine';
import { ConfigurationManager } from './core/configuration-manager';
import { Telemetry } from './core/telemetry';
import { Metrics } from './core/metrics';
import { Health, HealthChecks } from './core/health';

/**
 * Initialize the platform infrastructure
 */
export async function initializePlatform() {
  console.log('🚀 Initializing Biotech Terminal Platform...\n');

  // Step 1: Configure services
  console.log('📝 Step 1: Registering configuration schemas...');
  ConfigurationManager.registerSchema('platform', {
    apiKey: {
      type: 'string',
      description: 'OpenFDA API key for higher rate limits',
      env: 'OPENFDA_API_KEY',
      secret: true,
      required: false,
    },
    enableTelemetry: {
      type: 'boolean',
      description: 'Enable distributed tracing',
      env: 'ENABLE_TELEMETRY',
      default: true,
    },
    enableMetrics: {
      type: 'boolean',
      description: 'Enable Prometheus metrics',
      env: 'ENABLE_METRICS',
      default: true,
    },
  });

  const config = ConfigurationManager.loadConfig('platform');
  console.log('✅ Configuration loaded\n');

  // Step 2: Set up health checks
  console.log('🏥 Step 2: Setting up health checks...');
  Health.setMetadata({
    version: '1.0.0',
    serviceId: 'biotech-terminal',
    description: 'Production-grade biotech intelligence platform',
  });

  // Register health checks
  Health.registerCheck('database', HealthChecks.database(async () => true));
  Health.registerCheck('cache', HealthChecks.cache(async () => true));
  console.log('✅ Health checks registered\n');

  // Step 3: Register services in DI container
  console.log('📦 Step 3: Registering services in DI container...');

  // Register telemetry
  container.registerSingleton(ServiceTokens.Telemetry, () => Telemetry);

  // Register metrics
  container.registerSingleton(ServiceTokens.Metrics, () => Metrics);

  // Register health
  container.registerSingleton(ServiceTokens.Health, () => Health);

  // Register connectors
  container.registerSingleton(ServiceTokens.CTGovV2Connector, () => 
    new CTGovV2Connector()
  );

  container.registerSingleton(ServiceTokens.FAERSConnector, () => 
    new FAERSConnector(config.apiKey)
  );

  container.registerSingleton(ServiceTokens.DrugsAtFDAConnector, () => 
    new DrugsAtFDAConnector(config.apiKey)
  );

  // Register catalyst engine with dependencies
  container.registerSingleton(ServiceTokens.CatalystEngine, (c) => 
    new CatalystEngine({
      ctgovConnector: c.resolve(ServiceTokens.CTGovV2Connector),
      faersConnector: c.resolve(ServiceTokens.FAERSConnector),
      drugsAtFDAConnector: c.resolve(ServiceTokens.DrugsAtFDAConnector),
    })
  );

  console.log('✅ Services registered\n');

  // Step 4: Create CloudEventBus
  console.log('☁️  Step 4: Creating CloudEventBus...');
  const cloudEventBus = createCloudEventBus({
    source: 'biotech-terminal',
    validateContracts: true,
  });
  console.log('✅ CloudEventBus ready\n');

  // Step 5: Subscribe to events
  console.log('📡 Step 5: Setting up event subscriptions...');
  
  // Subscribe to FAERS events
  cloudEventBus.subscribeCloudEvent('biotech.faers.v1', async (event) => {
    const span = Telemetry.startSpan('process-faers-event', {
      eventId: event.id,
      drugName: event.data.data.drugName,
    });

    try {
      console.log(`📊 FAERS Event: ${event.data.data.drugName} - ${event.data.data.reactionMeddrapt}`);
      Metrics.recordEvent('faers_event_processed', {
        seriousness: event.data.data.seriousnessCode || 'unknown',
      });
      Telemetry.endSpan(span, { code: 'OK' });
    } catch (error) {
      Telemetry.endSpan(span, {
        code: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });

  // Subscribe to FDA approval events
  cloudEventBus.subscribeCloudEvent('biotech.drugApproval.v1', async (event) => {
    console.log(`✅ FDA Approval: ${event.data.data.brandName} (${event.data.data.genericName})`);
    Metrics.recordEvent('fda_approval_processed', {
      approvalType: event.data.data.approvalType || 'standard',
    });
  });

  // Subscribe to catalyst events
  cloudEventBus.subscribeCloudEvent('biotech.catalyst.v1', async (event) => {
    console.log(`📅 Catalyst: ${event.data.data.title} - ${event.data.data.impact}`);
    Metrics.recordEvent('catalyst_processed', {
      type: event.data.data.type,
      impact: event.data.data.impact || 'neutral',
    });
  });

  console.log('✅ Event subscriptions active\n');

  return {
    container,
    cloudEventBus,
    config,
  };
}

/**
 * Example: Fetch and process FAERS adverse events
 */
export async function processFAERSData(drugName: string) {
  console.log(`\n🔍 Fetching FAERS data for: ${drugName}`);
  
  const span = Telemetry.startSpan('fetch-faers-data', { drugName });
  const startTime = Date.now();

  try {
    const connector = container.resolve<FAERSConnector>(ServiceTokens.FAERSConnector);
    const events = await connector.getByDrug(drugName, 10);

    const duration = Date.now() - startTime;
    Metrics.recordLatency('faers_fetch', duration);
    Metrics.recordEvent('faers_fetch_success', { drugName, count: events.length });

    console.log(`✅ Found ${events.length} adverse events`);
    
    // Publish as CloudEvents (example - in real app this would be from the connector)
    // const cloudEventBus = ... // get from context
    // for (const event of events) {
    //   await cloudEventBus.publishContract('faers', event);
    // }

    Telemetry.endSpan(span, { code: 'OK' });
    return events;
  } catch (error) {
    Metrics.recordEvent('faers_fetch_error', { drugName });
    Telemetry.endSpan(span, {
      code: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Example: Fetch FDA approvals
 */
export async function processDrugApprovals(drugName: string) {
  console.log(`\n💊 Fetching FDA approvals for: ${drugName}`);

  const span = Telemetry.startSpan('fetch-fda-approvals', { drugName });

  try {
    const connector = container.resolve<DrugsAtFDAConnector>(ServiceTokens.DrugsAtFDAConnector);
    const approvals = await connector.getByBrandName(drugName, 5);

    console.log(`✅ Found ${approvals.length} approvals`);
    
    for (const approval of approvals) {
      console.log(`  - ${approval.data.brandName} (${approval.data.approvalDate}): ${approval.data.approvalType}`);
    }

    Telemetry.endSpan(span, { code: 'OK' });
    return approvals;
  } catch (error) {
    Telemetry.endSpan(span, {
      code: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Example: Build catalyst timeline
 */
export async function buildCatalystTimeline(drugName: string) {
  console.log(`\n📅 Building catalyst timeline for: ${drugName}`);

  const span = Telemetry.startSpan('build-catalyst-timeline', { drugName });

  try {
    const engine = container.resolve<CatalystEngine>(ServiceTokens.CatalystEngine);

    // Sync from various sources
    console.log('  Syncing from FDA approvals...');
    const approvalCount = await engine.syncFromFDAApprovals(drugName);
    console.log(`  ✅ Added ${approvalCount} FDA approval catalysts`);

    // Note: FAERS sync would typically look for serious adverse events
    // console.log('  Syncing from FAERS adverse events...');
    // const faersCount = await engine.syncFromAdverseEvents(drugName);
    // console.log(`  ✅ Added ${faersCount} adverse event catalysts`);

    // Get timeline
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    const timeline = engine.getTimeline(
      oneYearAgo.toISOString().split('T')[0],
      now.toISOString().split('T')[0]
    );

    console.log(`\n📊 Timeline Summary:`);
    console.log(`  Total Events: ${timeline.summary.total}`);
    console.log(`  By Type:`, timeline.summary.byType);
    console.log(`  By Impact:`, timeline.summary.byImpact);

    // Get upcoming catalysts
    const upcoming = engine.getUpcoming(90);
    console.log(`  Upcoming (90 days): ${upcoming.length} events`);

    Telemetry.endSpan(span, { code: 'OK' });
    return timeline;
  } catch (error) {
    Telemetry.endSpan(span, {
      code: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Example: Health check
 */
export async function checkPlatformHealth() {
  console.log('\n🏥 Checking platform health...');

  const health = container.resolve(ServiceTokens.Health);
  const status = await health.getReadiness();

  console.log(`\nHealth Status: ${status.status.toUpperCase()}`);
  console.log(`Version: ${status.version}`);
  console.log(`Service ID: ${status.serviceId}`);

  if (status.checks) {
    console.log('\nChecks:');
    for (const [name, check] of Object.entries(status.checks)) {
      console.log(`  - ${name}: ${check.status}`);
    }
  }

  return status;
}

/**
 * Example: View metrics
 */
export function viewMetrics() {
  console.log('\n📊 Platform Metrics:');

  const metrics = container.resolve(ServiceTokens.Metrics);
  const summary = metrics.getSummary();

  console.log(`\nEvents: ${summary.events.total}`);
  console.log(`Cache Hit Rate: ${(summary.cache.hitRate * 100).toFixed(2)}%`);
  console.log(`Circuit Breaker Trips: ${summary.circuitBreakers.totalTrips}`);

  return summary;
}

/**
 * Example: Run full demo
 */
export async function runDemo() {
  try {
    // Initialize platform
    const platform = await initializePlatform();

    // Example drug name
    const drugName = 'Keytruda';

    // Fetch FAERS data (note: requires API access)
    // await processFAERSData(drugName);

    // Fetch FDA approvals (note: requires API access)
    // await processDrugApprovals(drugName);

    // Build catalyst timeline (note: requires API access)
    // await buildCatalystTimeline(drugName);

    // Check health
    await checkPlatformHealth();

    // View metrics
    viewMetrics();

    console.log('\n✅ Demo complete!\n');
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    throw error;
  }
}

// Export for use in terminal app
export {
  container,
  ServiceTokens,
  createCloudEventBus,
  FAERSConnector,
  DrugsAtFDAConnector,
  CTGovV2Connector,
  CatalystEngine,
};
