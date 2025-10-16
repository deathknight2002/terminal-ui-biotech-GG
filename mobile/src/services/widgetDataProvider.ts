/**
 * iOS Widget Data Provider
 * Provides data for iOS widgets (portfolio summary and news headlines)
 */

export interface PortfolioSummaryData {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  topHoldings: {
    symbol: string;
    name: string;
    value: number;
    change: number;
  }[];
  lastUpdated: string;
}

export interface NewsHeadlineData {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  category: 'fda' | 'trial' | 'market' | 'earnings';
  sentiment?: 'positive' | 'negative' | 'neutral';
}

class WidgetDataProvider {
  private baseUrl: string = 'http://localhost:3001';

  /**
   * Get portfolio summary for widget
   */
  async getPortfolioSummary(): Promise<PortfolioSummaryData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/widgets/portfolio-summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio summary: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[WidgetDataProvider] Failed to fetch portfolio summary:', error);
      // Return mock data as fallback
      return this.getMockPortfolioSummary();
    }
  }

  /**
   * Get news headlines for widget
   */
  async getNewsHeadlines(limit: number = 5): Promise<NewsHeadlineData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/widgets/news-headlines?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch news headlines: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[WidgetDataProvider] Failed to fetch news headlines:', error);
      // Return mock data as fallback
      return this.getMockNewsHeadlines(limit);
    }
  }

  /**
   * Export data for iOS widget consumption
   * iOS widgets can read from shared container using App Groups
   */
  async exportForWidgets(): Promise<void> {
    try {
      const [portfolio, news] = await Promise.all([
        this.getPortfolioSummary(),
        this.getNewsHeadlines(5),
      ]);

      const widgetData = {
        portfolio,
        news,
        lastUpdated: new Date().toISOString(),
      };

      // Store in localStorage for web app
      localStorage.setItem('biotech-widget-data', JSON.stringify(widgetData));

      // For native iOS app, this would write to App Group shared container
      // Example: UserDefaults(suiteName: "group.com.bioterminal.app")
      console.log('[WidgetDataProvider] Widget data exported');
    } catch (error) {
      console.error('[WidgetDataProvider] Failed to export widget data:', error);
    }
  }

  /**
   * Schedule periodic widget data refresh
   */
  startPeriodicRefresh(intervalMinutes: number = 15): void {
    // Refresh immediately
    this.exportForWidgets();

    // Schedule periodic refresh
    setInterval(() => {
      this.exportForWidgets();
    }, intervalMinutes * 60 * 1000);

    console.log(`[WidgetDataProvider] Periodic refresh scheduled (${intervalMinutes} min)`);
  }

  /**
   * Mock portfolio summary data
   */
  private getMockPortfolioSummary(): PortfolioSummaryData {
    return {
      totalValue: 145250.75,
      dayChange: 3420.50,
      dayChangePercent: 2.41,
      topHoldings: [
        {
          symbol: 'VRTX',
          name: 'Vertex Pharmaceuticals',
          value: 45200.00,
          change: 1250.00,
        },
        {
          symbol: 'REGN',
          name: 'Regeneron',
          value: 38500.00,
          change: 890.00,
        },
        {
          symbol: 'MRNA',
          name: 'Moderna',
          value: 32100.00,
          change: 720.50,
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Mock news headlines data
   */
  private getMockNewsHeadlines(limit: number): NewsHeadlineData[] {
    const headlines: NewsHeadlineData[] = [
      {
        id: '1',
        title: 'FDA Approves Vertex CF Drug for Expanded Use',
        source: 'Reuters',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'fda',
        sentiment: 'positive',
      },
      {
        id: '2',
        title: 'Moderna Reports Strong Q4 Earnings, Beats Estimates',
        source: 'Bloomberg',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        category: 'earnings',
        sentiment: 'positive',
      },
      {
        id: '3',
        title: 'Phase III Trial Shows Promising Results for Cancer Drug',
        source: 'BioSpace',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        category: 'trial',
        sentiment: 'positive',
      },
      {
        id: '4',
        title: 'Biotech Sector Rallies on FDA Reform News',
        source: 'CNBC',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        category: 'market',
        sentiment: 'positive',
      },
      {
        id: '5',
        title: 'Gilead Acquires Oncology Startup for $2.1B',
        source: 'FierceBiotech',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        category: 'market',
        sentiment: 'neutral',
      },
    ];

    return headlines.slice(0, limit);
  }
}

export const widgetDataProvider = new WidgetDataProvider();
