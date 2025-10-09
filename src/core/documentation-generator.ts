/**
 * Architecture Documentation Generator
 * 
 * Automatically generates comprehensive documentation from the system's
 * self-describing modules and infrastructure components.
 */

import { ServiceRegistry } from '../core/service-registry';
import { ConfigurationManager } from '../core/configuration-manager';
import { DiagnosticSystem } from '../core/diagnostic-system';
import { EventBus } from '../core/event-bus';

export class DocumentationGenerator {
  /**
   * Generate complete system documentation
   */
  static async generateSystemDocs(): Promise<string> {
    let docs = '# Biotech Terminal - System Architecture Documentation\n\n';
    docs += `*Generated: ${new Date().toISOString()}*\n\n`;
    docs += '---\n\n';

    // System Overview
    docs += await this.generateOverview();

    // Module Documentation
    docs += await this.generateModuleDocs();

    // Configuration Documentation
    docs += this.generateConfigDocs();

    // Architecture Diagrams
    docs += this.generateArchitectureDiagrams();

    // Health and Metrics
    docs += await this.generateHealthDocs();

    // API Reference
    docs += this.generateAPIReference();

    return docs;
  }

  /**
   * Generate system overview
   */
  private static async generateOverview(): Promise<string> {
    let docs = '## System Overview\n\n';
    
    const services = ServiceRegistry.listServices();
    const health = await DiagnosticSystem.getHealth();
    const busStats = EventBus.getStats();

    docs += '### Architecture Principles\n\n';
    docs += '- **Modular Design**: Independent, autonomous modules with clear interfaces\n';
    docs += '- **Event-Driven**: Communication through an intelligent event bus\n';
    docs += '- **Self-Healing**: Circuit breakers and fault tolerance built-in\n';
    docs += '- **Observable**: Deep introspection and diagnostic capabilities\n';
    docs += '- **Adaptive**: Intelligent caching and routing based on patterns\n\n';

    docs += '### System Status\n\n';
    docs += `- **Overall Health**: ${health.overall.toUpperCase()}\n`;
    docs += `- **Registered Services**: ${services.length}\n`;
    docs += `- **Total Events Processed**: ${busStats.totalEvents}\n`;
    docs += `- **Event Subscribers**: ${busStats.subscriberCount}\n\n`;

    return docs;
  }

  /**
   * Generate module documentation
   */
  private static async generateModuleDocs(): Promise<string> {
    let docs = '## Registered Modules\n\n';

    const services = ServiceRegistry.listServices();

    for (const service of services) {
      try {
        const module = ServiceRegistry.get<any>(service.name);
        
        if (typeof module.describe === 'function') {
          const description = module.describe();
          
          docs += `### ${description.name}\n\n`;
          docs += `**Version**: ${description.version}\n\n`;
          docs += `${description.description}\n\n`;

          // Dependencies
          if (description.dependencies.length > 0) {
            docs += '**Dependencies**:\n';
            description.dependencies.forEach(dep => {
              docs += `- ${dep}\n`;
            });
            docs += '\n';
          }

          // Provides
          if (description.provides.length > 0) {
            docs += '**Provides**:\n';
            description.provides.forEach(cap => {
              docs += `- ${cap}\n`;
            });
            docs += '\n';
          }

          // Capabilities
          if (description.capabilities.length > 0) {
            docs += '**Capabilities**:\n\n';
            description.capabilities.forEach(cap => {
              docs += `#### ${cap.name}\n`;
              docs += `${cap.description}\n\n`;
              docs += `- **Inputs**: ${cap.inputTypes.join(', ')}\n`;
              docs += `- **Outputs**: ${cap.outputTypes.join(', ')}\n\n`;
            });
          }

          // Configuration
          docs += '**Configuration**:\n\n';
          docs += `Required fields: ${description.configuration.required.join(', ') || 'none'}\n\n`;
          
          if (description.configuration.optional.length > 0) {
            docs += `Optional fields: ${description.configuration.optional.join(', ')}\n\n`;
          }

          // Examples
          if (description.examples && description.examples.length > 0) {
            docs += '**Usage Examples**:\n\n';
            description.examples.forEach(ex => {
              docs += `*${ex.description}*\n`;
              docs += '```typescript\n';
              docs += ex.code.trim();
              docs += '\n```\n\n';
            });
          }

          docs += '---\n\n';
        }
      } catch (error) {
        console.error(`Error documenting module ${service.name}:`, error);
      }
    }

    return docs;
  }

  /**
   * Generate configuration documentation
   */
  private static generateConfigDocs(): string {
    let docs = '## Configuration Guide\n\n';

    const schemas = ConfigurationManager.getSchemas();

    docs += 'All modules support declarative configuration through:\n';
    docs += '1. Environment variables\n';
    docs += '2. Configuration files\n';
    docs += '3. Runtime overrides\n\n';

    schemas.forEach((schema, moduleName) => {
      docs += ConfigurationManager.generateDocs(moduleName);
      docs += '\n---\n\n';
    });

    return docs;
  }

  /**
   * Generate architecture diagrams
   */
  private static generateArchitectureDiagrams(): string {
    let docs = '## Architecture Diagrams\n\n';

    // Service dependency graph
    docs += '### Service Dependencies\n\n';
    docs += '```\n';
    docs += ServiceRegistry.visualizeDependencies();
    docs += '```\n\n';

    // Event flow diagram
    docs += '### Event Flow\n\n';
    docs += '```\n';
    docs += 'Event Bus (Central Hub)\n';
    docs += '    ├── Publishers\n';
    docs += '    │   ├── Modules (via BaseModule.publish)\n';
    docs += '    │   ├── Services (via EventBus.publish)\n';
    docs += '    │   └── UI Components\n';
    docs += '    │\n';
    docs += '    └── Subscribers\n';
    docs += '        ├── Modules (via BaseModule.subscribe)\n';
    docs += '        ├── Diagnostic System\n';
    docs += '        ├── Cache (predictive hints)\n';
    docs += '        └── Circuit Breakers\n';
    docs += '```\n\n';

    // Data flow
    docs += '### Data Flow\n\n';
    docs += '```\n';
    docs += 'Client Request\n';
    docs += '    ↓\n';
    docs += 'Intelligent Router\n';
    docs += '    ├── Check Cache (Adaptive Cache)\n';
    docs += '    ├── Select Module (based on health, load, capabilities)\n';
    docs += '    └── Execute via Circuit Breaker\n';
    docs += '        ↓\n';
    docs += '    Data Provider Module\n';
    docs += '        ├── Query Processing\n';
    docs += '        ├── Data Validation (Contracts)\n';
    docs += '        └── Result Caching\n';
    docs += '            ↓\n';
    docs += '        Response\n';
    docs += '```\n\n';

    return docs;
  }

  /**
   * Generate health and metrics documentation
   */
  private static async generateHealthDocs(): Promise<string> {
    let docs = '## System Health & Metrics\n\n';

    const health = await DiagnosticSystem.getHealth();
    const trends = DiagnosticSystem.getHealthTrends();

    docs += `### Overall Status: ${health.overall.toUpperCase()}\n\n`;

    // Components
    docs += '### Component Health\n\n';
    docs += '| Component | Status | Message |\n';
    docs += '|-----------|--------|----------|\n';
    
    health.components.forEach(comp => {
      const statusEmoji = comp.status === 'healthy' ? '✅' : comp.status === 'degraded' ? '⚠️' : '❌';
      docs += `| ${comp.name} | ${statusEmoji} ${comp.status} | ${comp.message || '-'} |\n`;
    });
    docs += '\n';

    // Metrics
    docs += '### Performance Metrics\n\n';
    docs += `- **Event Bus**:\n`;
    docs += `  - Total Events: ${health.metrics.eventBus.totalEvents}\n`;
    docs += `  - Avg Processing Time: ${health.metrics.eventBus.averageProcessingTime.toFixed(2)}ms\n`;
    docs += `  - Subscribers: ${health.metrics.eventBus.subscriberCount}\n\n`;

    docs += `- **Cache**:\n`;
    docs += `  - Hit Rate: ${(health.metrics.cache.hitRate * 100).toFixed(1)}%\n`;
    docs += `  - Size: ${health.metrics.cache.size}\n`;
    docs += `  - Evictions: ${health.metrics.cache.evictions}\n\n`;

    docs += `- **Circuit Breakers**:\n`;
    docs += `  - Open: ${health.metrics.circuitBreakers.open}\n`;
    docs += `  - Half-Open: ${health.metrics.circuitBreakers.halfOpen}\n`;
    docs += `  - Closed: ${health.metrics.circuitBreakers.closed}\n\n`;

    // Trends
    docs += '### Trends\n\n';
    docs += `- **Overall Trend**: ${trends.overallTrend.toUpperCase()}\n`;
    docs += `- **Cache Performance**: ${trends.cacheHitRateTrend > 0 ? 'Improving' : trends.cacheHitRateTrend < 0 ? 'Declining' : 'Stable'}\n`;
    docs += `- **Event Processing**: ${trends.eventProcessingTrend > 0 ? 'Slowing' : trends.eventProcessingTrend < 0 ? 'Improving' : 'Stable'}\n\n`;

    // Recommendations
    if (health.recommendations.length > 0) {
      docs += '### Recommendations\n\n';
      health.recommendations.forEach(rec => {
        docs += `- ${rec}\n`;
      });
      docs += '\n';
    }

    return docs;
  }

  /**
   * Generate API reference
   */
  private static generateAPIReference(): string {
    let docs = '## API Reference\n\n';

    docs += '### Core Components\n\n';

    docs += '#### EventBus\n\n';
    docs += 'Pub/sub communication system.\n\n';
    docs += '```typescript\n';
    docs += 'import { EventBus, EventTypes } from \'@/core\';\n\n';
    docs += '// Subscribe to events\n';
    docs += 'const subscription = EventBus.subscribe(\n';
    docs += '  EventTypes.DATA_LOADED,\n';
    docs += '  (event) => console.log(event.payload)\n';
    docs += ');\n\n';
    docs += '// Publish events\n';
    docs += 'await EventBus.publish(\n';
    docs += '  EventTypes.DATA_UPDATED,\n';
    docs += '  { data: "value" },\n';
    docs += '  { source: "my-module", priority: "high" }\n';
    docs += ');\n\n';
    docs += '// Unsubscribe\n';
    docs += 'subscription.unsubscribe();\n';
    docs += '```\n\n';

    docs += '#### ServiceRegistry\n\n';
    docs += 'Module registration and discovery.\n\n';
    docs += '```typescript\n';
    docs += 'import { ServiceRegistry } from \'@/core\';\n\n';
    docs += '// Register a service\n';
    docs += 'ServiceRegistry.register("my-service", serviceInstance, {\n';
    docs += '  version: "1.0.0",\n';
    docs += '  description: "My service description",\n';
    docs += '  dependencies: [],\n';
    docs += '  provides: ["data-processing"],\n';
    docs += '  health: async () => ({ status: "healthy", timestamp: Date.now() })\n';
    docs += '});\n\n';
    docs += '// Get a service\n';
    docs += 'const service = ServiceRegistry.get("my-service");\n';
    docs += '```\n\n';

    docs += '#### IntelligentRouter\n\n';
    docs += 'Smart request routing.\n\n';
    docs += '```typescript\n';
    docs += 'import { IntelligentRouter } from \'@/core\';\n\n';
    docs += 'const result = await IntelligentRouter.route(query, {\n';
    docs += '  cacheable: true,\n';
    docs += '  timeout: 5000,\n';
    docs += '  priority: "high"\n';
    docs += '});\n';
    docs += '```\n\n';

    return docs;
  }

  /**
   * Export documentation to file
   */
  static async exportToFile(filepath: string): Promise<void> {
    const fs = await import('fs/promises');
    const docs = await this.generateSystemDocs();
    await fs.writeFile(filepath, docs, 'utf-8');
    console.log(`📚 Documentation exported to ${filepath}`);
  }
}
