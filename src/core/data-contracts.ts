/**
 * Data Contracts - Interface definitions for inter-module communication
 * 
 * Defines explicit contracts that modules must adhere to, ensuring
 * type safety and clear expectations across the ecosystem.
 */

/**
 * Base contract that all data contracts extend
 */
export interface DataContract {
  version: string;
  schema: string;
}

/**
 * Drug data contract
 */
export interface DrugDataContract extends DataContract {
  schema: 'drug';
  data: {
    id: string;
    name: string;
    indication: string;
    phase: 'Preclinical' | 'Phase I' | 'Phase II' | 'Phase III' | 'Filed' | 'Approved';
    sponsor: string;
    therapeuticArea: string;
    targetDate?: string;
    probability?: number;
    marketSize?: number;
  };
  metadata: {
    source: string;
    timestamp: number;
    confidence: number;
  };
}

/**
 * Clinical trial data contract
 */
export interface ClinicalTrialContract extends DataContract {
  schema: 'clinical-trial';
  data: {
    id: string;
    drugId: string;
    phase: string;
    status: 'Recruiting' | 'Active' | 'Completed' | 'Terminated' | 'Suspended';
    enrollmentTarget: number;
    enrollmentActual: number;
    startDate: string;
    completionDate?: string;
    primaryEndpoint: string;
    results?: {
      met: boolean;
      pValue?: number;
      description: string;
    };
  };
  metadata: {
    source: string;
    timestamp: number;
    lastUpdated: number;
  };
}

/**
 * Market data contract
 */
export interface MarketDataContract extends DataContract {
  schema: 'market-data';
  data: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: number;
  };
  metadata: {
    source: string;
    exchange: string;
    delayed: boolean;
  };
}

/**
 * Catalyst event contract
 */
export interface CatalystContract extends DataContract {
  schema: 'catalyst';
  data: {
    id: string;
    type: 'Clinical' | 'Regulatory' | 'Commercial' | 'Corporate';
    title: string;
    description: string;
    date: string;
    impact: 'High' | 'Medium' | 'Low';
    probability: number;
    drugIds: string[];
    companyId: string;
  };
  metadata: {
    source: string;
    timestamp: number;
    confidence: number;
  };
}

/**
 * Financial projection contract
 */
export interface FinancialProjectionContract extends DataContract {
  schema: 'financial-projection';
  data: {
    drugId: string;
    year: number;
    revenue: number;
    cogs: number;
    rdExpense: number;
    operatingExpense: number;
    netIncome: number;
    cashFlow: number;
    probability: number;
  };
  metadata: {
    source: string;
    timestamp: number;
    model: string;
    assumptions: Record<string, any>;
  };
}

/**
 * Analytics result contract
 */
export interface AnalyticsResultContract extends DataContract {
  schema: 'analytics-result';
  data: {
    type: 'npv' | 'dcf' | 'risk-adjusted' | 'scenario' | 'sensitivity';
    result: number;
    breakdown: Record<string, number>;
    inputs: Record<string, any>;
  };
  metadata: {
    source: string;
    timestamp: number;
    calculationTime: number;
  };
}

/**
 * User interaction contract
 */
export interface UserInteractionContract extends DataContract {
  schema: 'user-interaction';
  data: {
    action: string;
    target: string;
    context: Record<string, any>;
    timestamp: number;
  };
  metadata: {
    userId?: string;
    sessionId: string;
    userAgent: string;
  };
}

/**
 * System notification contract
 */
export interface SystemNotificationContract extends DataContract {
  schema: 'system-notification';
  data: {
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    actionable: boolean;
    actions?: Array<{
      label: string;
      action: string;
    }>;
  };
  metadata: {
    source: string;
    timestamp: number;
    expiresAt?: number;
  };
}

/**
 * Cache entry contract
 */
export interface CacheEntryContract extends DataContract {
  schema: 'cache-entry';
  data: {
    key: string;
    value: any;
    ttl: number;
    tags: string[];
  };
  metadata: {
    timestamp: number;
    source: string;
    size: number;
  };
}

/**
 * Query contract for data requests
 */
export interface QueryContract {
  id: string;
  type: string;
  filters: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  metadata?: {
    requestedBy: string;
    priority: 'high' | 'normal' | 'low';
  };
}

/**
 * Query result contract
 */
export interface QueryResultContract<T extends DataContract> {
  query: QueryContract;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  metadata: {
    executionTime: number;
    cacheHit: boolean;
    timestamp: number;
  };
}

/**
 * Error contract
 */
export interface ErrorContract {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  timestamp: number;
  recoverable: boolean;
}

/**
 * Validation result contract
 */
export interface ValidationContract {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Type guard utilities for contract validation
 */
export const ContractValidators = {
  isDrugData: (data: any): data is DrugDataContract => {
    return data?.schema === 'drug' && typeof data?.data?.id === 'string';
  },

  isClinicalTrial: (data: any): data is ClinicalTrialContract => {
    return data?.schema === 'clinical-trial' && typeof data?.data?.id === 'string';
  },

  isMarketData: (data: any): data is MarketDataContract => {
    return data?.schema === 'market-data' && typeof data?.data?.symbol === 'string';
  },

  isCatalyst: (data: any): data is CatalystContract => {
    return data?.schema === 'catalyst' && typeof data?.data?.id === 'string';
  },

  isFinancialProjection: (data: any): data is FinancialProjectionContract => {
    return data?.schema === 'financial-projection' && typeof data?.data?.drugId === 'string';
  },

  isAnalyticsResult: (data: any): data is AnalyticsResultContract => {
    return data?.schema === 'analytics-result' && typeof data?.data?.result === 'number';
  },

  validateContract: <T extends DataContract>(
    data: any,
    expectedSchema: string
  ): ValidationContract => {
    const errors: ValidationContract['errors'] = [];
    const warnings: ValidationContract['warnings'] = [];

    if (!data) {
      errors.push({
        field: 'data',
        message: 'Data is required',
        code: 'REQUIRED',
      });
    }

    if (data?.schema !== expectedSchema) {
      errors.push({
        field: 'schema',
        message: `Expected schema '${expectedSchema}', got '${data?.schema}'`,
        code: 'SCHEMA_MISMATCH',
      });
    }

    if (!data?.version) {
      warnings.push({
        field: 'version',
        message: 'Version not specified',
        code: 'MISSING_VERSION',
      });
    }

    if (!data?.metadata) {
      warnings.push({
        field: 'metadata',
        message: 'Metadata not provided',
        code: 'MISSING_METADATA',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },
};
