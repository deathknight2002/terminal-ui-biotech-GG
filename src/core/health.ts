/**
 * Health - K8s-friendly health check system
 * 
 * Provides readiness and liveness probes with dependency tracking
 * Compatible with Kubernetes health check patterns
 */

export interface HealthStatus {
  status: 'pass' | 'fail' | 'warn';
  version?: string;
  releaseId?: string;
  notes?: string[];
  output?: string;
  checks?: Record<string, HealthCheck>;
  serviceId?: string;
  description?: string;
}

export interface HealthCheck {
  componentId?: string;
  componentType?: string;
  observedValue?: any;
  observedUnit?: string;
  status: 'pass' | 'fail' | 'warn';
  affectedEndpoints?: string[];
  time?: string;
  output?: string;
  links?: Record<string, string>;
}

export interface HealthCheckFunction {
  (): Promise<HealthCheck>;
}

class HealthImpl {
  private checks: Map<string, HealthCheckFunction> = new Map();
  private version: string = '1.0.0';
  private serviceId: string = 'biotech-terminal';
  private description: string = 'Biotech Terminal Intelligence Platform';

  /**
   * Register a health check
   */
  registerCheck(name: string, checkFn: HealthCheckFunction): void {
    this.checks.set(name, checkFn);
  }

  /**
   * Unregister a health check
   */
  unregisterCheck(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Set service metadata
   */
  setMetadata(metadata: {
    version?: string;
    serviceId?: string;
    description?: string;
  }): void {
    if (metadata.version) this.version = metadata.version;
    if (metadata.serviceId) this.serviceId = metadata.serviceId;
    if (metadata.description) this.description = metadata.description;
  }

  /**
   * Get readiness status - checks if service can handle requests
   */
  async getReadiness(): Promise<HealthStatus> {
    const checks: Record<string, HealthCheck> = {};
    let overallStatus: 'pass' | 'fail' | 'warn' = 'pass';
    const notes: string[] = [];

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const check = await checkFn();
        checks[name] = check;

        if (check.status === 'fail') {
          overallStatus = 'fail';
          notes.push(`Check '${name}' failed: ${check.output || 'unknown reason'}`);
        } else if (check.status === 'warn' && overallStatus === 'pass') {
          overallStatus = 'warn';
          notes.push(`Check '${name}' warning: ${check.output || 'degraded'}`);
        }
      } catch (error) {
        overallStatus = 'fail';
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        checks[name] = {
          status: 'fail',
          output: `Health check failed: ${errorMsg}`,
          time: new Date().toISOString(),
        };
        notes.push(`Check '${name}' threw error: ${errorMsg}`);
      }
    }

    return {
      status: overallStatus,
      version: this.version,
      serviceId: this.serviceId,
      description: this.description,
      checks,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  /**
   * Get liveness status - checks if service is alive (simple check)
   */
  async getLiveness(): Promise<HealthStatus> {
    return {
      status: 'pass',
      version: this.version,
      serviceId: this.serviceId,
      description: this.description,
      output: 'Service is alive',
    };
  }

  /**
   * Create a simple check function
   */
  createCheck(
    componentType: string,
    checkFn: () => Promise<boolean>,
    options?: {
      componentId?: string;
      errorMessage?: string;
    }
  ): HealthCheckFunction {
    return async (): Promise<HealthCheck> => {
      try {
        const isHealthy = await checkFn();
        return {
          componentType,
          componentId: options?.componentId,
          status: isHealthy ? 'pass' : 'fail',
          output: isHealthy ? 'OK' : (options?.errorMessage || 'Check failed'),
          time: new Date().toISOString(),
        };
      } catch (error) {
        return {
          componentType,
          componentId: options?.componentId,
          status: 'fail',
          output: error instanceof Error ? error.message : 'Unknown error',
          time: new Date().toISOString(),
        };
      }
    };
  }

  /**
   * Clear all registered checks
   */
  clear(): void {
    this.checks.clear();
  }
}

// Singleton instance
export const Health = new HealthImpl();

/**
 * Common health check helpers
 */
export const HealthChecks = {
  /**
   * Database connection check
   */
  database: (checkConnection: () => Promise<boolean>): HealthCheckFunction => {
    return Health.createCheck('database', checkConnection, {
      componentId: 'primary-db',
      errorMessage: 'Database connection failed',
    });
  },

  /**
   * Cache connection check
   */
  cache: (checkConnection: () => Promise<boolean>): HealthCheckFunction => {
    return Health.createCheck('cache', checkConnection, {
      componentId: 'cache-redis',
      errorMessage: 'Cache connection failed',
    });
  },

  /**
   * External API check
   */
  externalAPI: (name: string, checkAPI: () => Promise<boolean>): HealthCheckFunction => {
    return Health.createCheck('external-api', checkAPI, {
      componentId: name,
      errorMessage: `External API ${name} is unreachable`,
    });
  },

  /**
   * Message queue check
   */
  messageQueue: (checkConnection: () => Promise<boolean>): HealthCheckFunction => {
    return Health.createCheck('message-queue', checkConnection, {
      componentId: 'nats',
      errorMessage: 'Message queue connection failed',
    });
  },
};
