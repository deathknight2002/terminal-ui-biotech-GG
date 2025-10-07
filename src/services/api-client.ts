/**
 * API Client for Biotech Terminal Backend
 * Handles all communication with the backend services
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  pipeline: Array<{
    name: string;
    phase: string;
    indication: string;
    pdufa?: string;
    timeline?: string;
  }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

class ApiClient {
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:3001/api',
      timeout: 10000,
      retries: 3,
      ...config,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Market Data API
  async getMarketQuote(symbol: string, timeframe = '1h'): Promise<ApiResponse<{
    symbol: string;
    current: MarketQuote;
    historical: Array<{
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    timeframe: string;
    lastUpdated: string;
  }>> {
    return this.request(`/market/quote/${symbol}?timeframe=${timeframe}`);
  }

  async getMultipleQuotes(symbols: string[], timeframe = '1h'): Promise<ApiResponse<{
    quotes: Array<{
      symbol: string;
      found: boolean;
      data: MarketQuote | null;
    }>;
    timeframe: string;
    lastUpdated: string;
  }>> {
    const symbolsParam = symbols.join(',');
    return this.request(`/market/quotes?symbols=${symbolsParam}&timeframe=${timeframe}`);
  }

  async getBiotechScreener(): Promise<ApiResponse<{
    data: Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      volume: number;
      marketCap: number;
      sector: string;
      pipelineCount: number;
      nextCatalyst: string;
      riskRating: string;
    }>;
    total: number;
    lastUpdated: string;
  }>> {
    return this.request('/market/biotech/screener');
  }

  // Biotech Data API
  async getBiotechAssets(): Promise<ApiResponse<any>> {
    return this.request('/biotech/assets');
  }

  async getPipelineData(): Promise<ApiResponse<any>> {
    return this.request('/biotech/pipeline');
  }

  async getCatalysts(): Promise<ApiResponse<any>> {
    return this.request('/biotech/catalysts');
  }

  // Financial Modeling API
  async calculateDCF(params: any): Promise<ApiResponse<any>> {
    return this.request('/financial/dcf', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async calculateNPV(params: any): Promise<ApiResponse<any>> {
    return this.request('/financial/npv', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getFinancialModel(id: string): Promise<ApiResponse<any>> {
    return this.request(`/financial/models/${id}`);
  }

  // User API
  async authenticate(credentials: { username: string; password: string }): Promise<ApiResponse<any>> {
    return this.request('/user/auth', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.request('/user/profile');
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.request('/user/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  // Analytics API
  async getPerformanceAnalytics(): Promise<ApiResponse<any>> {
    return this.request('/analytics/performance');
  }

  async getMarketTrends(): Promise<ApiResponse<any>> {
    return this.request('/analytics/trends');
  }

  async generateReport(params: any): Promise<ApiResponse<any>> {
    return this.request('/analytics/reports', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    services: {
      database: boolean;
      externalApis: boolean;
      cache: boolean;
    };
  }>> {
    return this.request('/market/health');
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Export API client class for custom configurations
export { ApiClient };