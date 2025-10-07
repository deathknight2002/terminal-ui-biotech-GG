import { logger } from '../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export class RealDataService {
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly DATA_FILE = path.join(process.cwd(), 'live_biotech_data.json');
  private readonly SCRAPER_SCRIPT = path.join(process.cwd(), 'backend', 'python-scrapers', 'biotech_scraper.py');

  constructor() {
    logger.info('RealDataService initialized with Python scraper integration');
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.dataCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(cacheKey: string, data: any): void {
    this.dataCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
  }

  private getCache(cacheKey: string): any {
    return this.dataCache.get(cacheKey)?.data;
  }

  /**
   * Load data from Python scraper JSON file
   */
  private async loadDataFromFile(): Promise<any> {
    try {
      const data = await fs.readFile(this.DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error loading data from file:', error);
      throw new Error('Failed to load data from Python scraper output');
    }
  }

  /**
   * Run the Python scraper to refresh data
   */
  private async runPythonScraper(): Promise<void> {
    return new Promise((resolve, reject) => {
      const scraperProcess = spawn('python', [this.SCRAPER_SCRIPT], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      scraperProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      scraperProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      scraperProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Python scraper completed successfully');
          resolve();
        } else {
          logger.error('Python scraper failed with code:', code, stderr);
          reject(new Error(`Scraper failed: ${stderr}`));
        }
      });

      scraperProcess.on('error', (error) => {
        logger.error('Failed to start Python scraper:', error);
        reject(error);
      });
    });
  }

  async getDashboardData() {
    const cacheKey = 'dashboard';

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const rawData = await this.loadDataFromFile();

      // Transform raw data into BioAuroraDashboard format
      const dashboardData = {
        headline: {
          fundName: "Aurora Biotech Intelligence",
          strategy: "Real-time Pharmaceutical Intelligence",
          status: "active" as const,
          lastUpdated: rawData.summary?.last_updated || new Date().toISOString(),
          nav: rawData.summary?.total_market_cap || 0,
          navChange: rawData.summary?.avg_price_change || 0,
          navChangePercent: rawData.summary?.avg_price_change || 0
        },
        metrics: this._transformMetrics(rawData),
        catalysts: this._transformCatalysts(rawData.catalysts || []),
        positions: this._transformPositions(rawData.market_data?.positions || []),
        exposures: this._transformExposures(rawData),
        pipeline: this._transformPipeline(rawData.clinical_trials || []),
        documents: [],
        analytics: this._transformAnalytics(rawData)
      };

      this.setCache(cacheKey, dashboardData);
      return dashboardData;
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      return this._getDefaultDashboardData();
    }
  }

  private _transformMetrics(rawData: any): any[] {
    const summary = rawData.summary || {};
    return [
      {
        label: "Active Trials",
        value: summary.total_trials || 0,
        change: 0,
        format: "number" as const,
        status: "neutral" as const
      },
      {
        label: "Market Cap",
        value: summary.total_market_cap || 0,
        change: summary.avg_price_change || 0,
        format: "currency" as const,
        status: (summary.avg_price_change || 0) > 0 ? "success" : "error" as const
      },
      {
        label: "Catalysts",
        value: summary.upcoming_catalysts || 0,
        change: 0,
        format: "number" as const,
        status: "warning" as const
      },
      {
        label: "Companies",
        value: summary.total_companies || 0,
        change: 0,
        format: "number" as const,
        status: "neutral" as const
      }
    ];
  }

  private _transformCatalysts(catalysts: any[]): any[] {
    return catalysts.slice(0, 8).map((cat: any) => ({
      id: `${cat.company}-${cat.date}`.toLowerCase().replace(/\s+/g, '-'),
      label: `${cat.company} ${cat.event}`,
      date: cat.date,
      risk: this._getCatalystRisk(cat.importance),
      artStyle: this._getCatalystArtStyle(cat.type),
      description: `${cat.phase} ${cat.indication} - ${cat.type}`,
      expectedImpact: this._getCatalystImpact(cat.importance),
      category: this._getCatalystCategory(cat.type),
      url: this._getCatalystUrl(cat)
    }));
  }

  private _transformPositions(positions: any[]): any[] {
    return positions.slice(0, 10).map((pos: any) => ({
      symbol: pos.symbol,
      company: pos.company,
      price: pos.price,
      change: pos.change,
      volume: pos.volume,
      marketCap: pos.market_cap,
      sector: pos.sector,
      beta: pos.beta,
      peRatio: pos.pe_ratio,
      week52High: pos["52_week_high"],
      week52Low: pos["52_week_low"]
    }));
  }

  private _transformExposures(rawData: any): any[] {
    const phaseDist = rawData.phase_distribution || {};
    const total = Object.values(phaseDist).reduce((sum: number, val: any) => sum + val, 0);

    return Object.entries(phaseDist).map(([phase, count]: [string, any]) => ({
      category: phase,
      percentage: total > 0 ? (count / total) * 100 : 0,
      value: count,
      color: this._getPhaseColor(phase)
    }));
  }

  private _transformPipeline(trials: any[]): any[] {
    const phaseOrder: Record<string, number> = { "Phase III": 1, "Phase II": 2, "Phase I": 3, "Preclinical": 4 };
    return trials
      .filter(trial => trial.phase && trial.phase !== "Unknown")
      .sort((a, b) => (phaseOrder[a.phase] || 5) - (phaseOrder[b.phase] || 5))
      .slice(0, 12)
      .map(trial => ({
        phase: trial.phase,
        count: 1,
        companies: [trial.sponsor].filter(Boolean),
        indications: [trial.condition || trial.title.split(" ")[0]].filter(Boolean)
      }));
  }

  private _transformAnalytics(rawData: any): any {
    return {
      performance: {
        totalReturn: rawData.summary?.avg_price_change || 0,
        volatility: 0.15,
        sharpeRatio: 1.2,
        maxDrawdown: -0.08
      },
      risk: {
        beta: 1.1,
        valueAtRisk: -0.05,
        expectedShortfall: -0.08
      },
      correlations: []
    };
  }

  private _getCatalystUrl(catalyst: any): string {
    // Generate URLs for Fierce Biotech and other sources
    const company = catalyst.company.toLowerCase().replace(/\s+/g, '-');
    const event = catalyst.event.toLowerCase().replace(/\s+/g, '-');

    if (catalyst.type === 'Clinical Data') {
      return `https://www.fiercebiotech.com/biotech/${company}-reports-${event}`;
    } else if (catalyst.type === 'Regulatory') {
      return `https://www.fiercebiotech.com/regulatory/${company}-fda-${event}`;
    }
    return `https://www.fiercebiotech.com/search?query=${encodeURIComponent(catalyst.company + ' ' + catalyst.event)}`;
  }

  private _getPhaseColor(phase: string): string {
    const colors: Record<string, string> = {
      "Phase III": "#10b981",
      "Phase II": "#f59e0b",
      "Phase I": "#ef4444",
      "Preclinical": "#6b7280"
    };
    return colors[phase] || "#6b7280";
  }

  private _getDefaultDashboardData() {
    return {
      headline: {
        fundName: "Aurora Biotech Intelligence",
        strategy: "Real-time Pharmaceutical Intelligence",
        status: "active" as const,
        lastUpdated: new Date().toISOString(),
        nav: 0,
        navChange: 0,
        navChangePercent: 0
      },
      metrics: [],
      catalysts: [],
      positions: [],
      exposures: [],
      pipeline: [],
      documents: [],
      analytics: {
        performance: { totalReturn: 0, volatility: 0, sharpeRatio: 0, maxDrawdown: 0 },
        risk: { beta: 0, valueAtRisk: 0, expectedShortfall: 0 },
        correlations: []
      }
    };
  }

  private groupByPhase(trials: any[]): Record<string, number> {
    return trials.reduce((acc, trial) => {
      const phase = trial.phase || 'Unknown';
      acc[phase] = (acc[phase] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByStatus(trials: any[]): Record<string, number> {
    return trials.reduce((acc, trial) => {
      const status = trial.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  async getClinicalTrialsData() {
    const cacheKey = 'clinicalTrials';

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const rawData = await this.loadDataFromFile();
      const trials = rawData.clinical_trials || [];

      const data = {
        trials: trials.map((trial: any) => ({
          id: trial.id,
          title: trial.title,
          phase: trial.phase,
          status: trial.status,
          sponsor: trial.sponsor,
          startDate: trial.start_date,
          completionDate: trial.completion_date,
          enrollment: trial.enrollment,
          conditions: trial.conditions || [],
          probability: this.getPhaseProbability(trial.phase)
        })),
        summary: {
          total: trials.length,
          byPhase: this.groupByPhase(trials),
          byStatus: this.groupByStatus(trials)
        },
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error getting clinical trials data:', error);
      return {
        trials: [],
        summary: { total: 0, byPhase: {}, byStatus: {} },
        lastUpdated: new Date().toISOString(),
        error: 'Failed to load clinical trials data'
      };
    }
  }

  async getFinancialModelsData() {
    const cacheKey = 'financialModels';

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const rawData = await this.loadDataFromFile();
      const models = rawData.financial_models || [];

      const data = {
        models: models.map((model: any) => ({
          id: model.id,
          company: model.company,
          ticker: model.ticker,
          marketCap: model.market_cap,
          peRatio: model.pe_ratio,
          revenue: model.revenue,
          netIncome: model.net_income,
          sector: model.sector,
          lastUpdated: model.last_updated
        })),
        summary: {
          total: models.length,
          totalMarketCap: models.reduce((sum: number, model: any) =>
            sum + (model.market_cap || 0), 0),
          sectors: models.reduce((acc: Record<string, number>, model: any) => {
            const sector = model.sector || 'Unknown';
            acc[sector] = (acc[sector] || 0) + 1;
            return acc;
          }, {})
        },
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error getting financial models data:', error);
      return {
        models: [],
        summary: { total: 0, totalMarketCap: 0, sectors: {} },
        lastUpdated: new Date().toISOString(),
        error: 'Failed to load financial models data'
      };
    }
  }

  async getPipelineData() {
    const cacheKey = 'pipeline';

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const rawData = await this.loadDataFromFile();
      const pipeline = rawData.pipeline || [];

      const data = {
        drugs: pipeline.map((drug: any) => ({
          id: drug.id,
          name: drug.name,
          company: drug.company,
          phase: drug.phase,
          indication: drug.indication,
          mechanism: drug.mechanism,
          estimatedLaunch: drug.estimated_launch,
          peakSales: drug.peak_sales,
          probability: this.getPhaseProbability(drug.phase)
        })),
        summary: {
          total: pipeline.length,
          byPhase: this.groupByPhase(pipeline),
          totalPeakSales: pipeline.reduce((sum: number, drug: any) =>
            sum + (drug.peak_sales || 0), 0)
        },
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error getting pipeline data:', error);
      return {
        drugs: [],
        summary: { total: 0, byPhase: {}, totalPeakSales: 0 },
        lastUpdated: new Date().toISOString(),
        error: 'Failed to load pipeline data'
      };
    }
  }

  async getIntelligenceData() {
    const cacheKey = 'intelligence';

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const rawData = await this.loadDataFromFile();
      const intelligence = rawData.intelligence || [];

      const data = {
        catalysts: intelligence.map((item: any) => ({
          id: item.id,
          title: item.title,
          company: item.company,
          type: item.type,
          date: item.date,
          impact: item.impact,
          description: item.description
        })),
        summary: {
          total: intelligence.length,
          byType: intelligence.reduce((acc: Record<string, number>, item: any) => {
            const type = item.type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}),
          recent: intelligence.slice(0, 10)
        },
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error getting intelligence data:', error);
      return {
        catalysts: [],
        summary: { total: 0, byType: {}, recent: [] },
        lastUpdated: new Date().toISOString(),
        error: 'Failed to load intelligence data'
      };
    }
  }

  async getServiceStatus() {
    try {
      const dataExists = await fs.access(this.DATA_FILE).then(() => true).catch(() => false);
      const stats = dataExists ? await fs.stat(this.DATA_FILE) : null;

      return {
        status: 'operational',
        dataFileExists: dataExists,
        lastModified: stats?.mtime?.toISOString(),
        cacheSize: this.dataCache.size,
        cacheKeys: Array.from(this.dataCache.keys())
      };
    } catch (error) {
      logger.error('Error getting service status:', error);
      return {
        status: 'error',
        error: 'Failed to check service status'
      };
    }
  }

  async refreshAllData() {
    logger.info('Refreshing all data via Python scraper...');

    try {
      await this.runPythonScraper();
      // Clear cache to force fresh data load
      this.dataCache.clear();
      logger.info('All data refreshed successfully');
      return { success: true, message: 'Data refresh completed' };
    } catch (error) {
      logger.error('Error refreshing data:', error);
      return { success: false, message: 'Refresh failed: Unable to run Python scraper' };
    }
  }

  private getPhaseProbability(phase: string): number {
    const probabilities: Record<string, number> = {
      'Preclinical': 0.10,
      'Phase I': 0.20,
      'Phase II': 0.35,
      'Phase III': 0.65,
      'Filed': 0.85,
      'Approved': 1.00
    };
    return probabilities[phase] || 0.15;
  }
}

export const realDataService = new RealDataService();
