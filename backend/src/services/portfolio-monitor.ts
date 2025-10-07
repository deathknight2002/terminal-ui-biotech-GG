/**
 * Portfolio Monitoring Service
 * Monitors portfolio companies for important updates
 * - FDA announcements
 * - Clinical trial status changes
 * - Company press releases
 * - SEC filings
 */

import { logger } from '../utils/logger.js';
import { getChangeDetectionService, MonitoredUrl } from './change-detection-service.js';
import { EventEmitter } from 'events';

export interface PortfolioCompany {
  symbol: string;
  name: string;
  therapeuticArea: string;
  websites: {
    company?: string;
    investors?: string;
    pressReleases?: string;
  };
  monitoringEnabled: boolean;
}

export interface PortfolioAlert {
  id: string;
  company: string;
  symbol: string;
  type: 'fda' | 'clinical-trial' | 'press-release' | 'sec-filing' | 'price-change';
  title: string;
  description: string;
  url: string;
  timestamp: Date;
  severity: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

/**
 * Portfolio Monitoring Service
 * Coordinates monitoring of portfolio companies
 */
export class PortfolioMonitorService extends EventEmitter {
  private companies: Map<string, PortfolioCompany> = new Map();
  private changeDetection = getChangeDetectionService();
  private alerts: PortfolioAlert[] = [];

  // Important biotech URLs to monitor
  private readonly biotechUrls = {
    fdaApprovals: 'https://www.fda.gov/drugs/news-events-human-drugs',
    fdaCalendar: 'https://www.fda.gov/drugs/news-events-human-drugs/drug-approvals-and-databases',
    clinicalTrialsGov: 'https://clinicaltrials.gov/search',
    fierceBiotech: 'https://www.fiercebiotech.com',
    bioSpace: 'https://www.biospace.com',
  };

  constructor() {
    super();
    
    // Listen to change detection events
    this.changeDetection.on('change:detected', (change) => {
      this.handleChangeDetected(change);
    });

    logger.info('📊 Portfolio Monitor Service initialized');
  }

  /**
   * Add a company to the portfolio
   */
  addCompany(company: PortfolioCompany): void {
    this.companies.set(company.symbol, company);
    
    if (company.monitoringEnabled) {
      this.setupCompanyMonitoring(company);
    }

    logger.info(`✅ Added company to portfolio: ${company.name} (${company.symbol})`);
    this.emit('company:added', company);
  }

  /**
   * Remove a company from the portfolio
   */
  removeCompany(symbol: string): boolean {
    const company = this.companies.get(symbol);
    if (!company) {
      return false;
    }

    // Remove all monitors for this company
    const monitors = this.changeDetection.getMonitors();
    monitors
      .filter(m => m.metadata?.symbol === symbol)
      .forEach(m => this.changeDetection.removeMonitor(m.id));

    this.companies.delete(symbol);
    
    logger.info(`🗑️ Removed company from portfolio: ${company.name}`);
    this.emit('company:removed', { symbol, company });

    return true;
  }

  /**
   * Setup monitoring for a company
   */
  private setupCompanyMonitoring(company: PortfolioCompany): void {
    const checkInterval = 300000; // 5 minutes

    // Monitor company website if available
    if (company.websites.company) {
      this.changeDetection.addMonitor({
        url: company.websites.company,
        name: `${company.name} - Company Website`,
        category: 'company',
        checkInterval,
        metadata: {
          symbol: company.symbol,
          companyName: company.name,
          monitorType: 'company-website',
        },
      });
    }

    // Monitor investor relations if available
    if (company.websites.investors) {
      this.changeDetection.addMonitor({
        url: company.websites.investors,
        name: `${company.name} - Investor Relations`,
        category: 'company',
        checkInterval,
        metadata: {
          symbol: company.symbol,
          companyName: company.name,
          monitorType: 'investor-relations',
        },
      });
    }

    // Monitor press releases if available
    if (company.websites.pressReleases) {
      this.changeDetection.addMonitor({
        url: company.websites.pressReleases,
        name: `${company.name} - Press Releases`,
        category: 'company',
        checkInterval: 600000, // 10 minutes
        metadata: {
          symbol: company.symbol,
          companyName: company.name,
          monitorType: 'press-releases',
        },
      });
    }

    // Monitor ClinicalTrials.gov for this company's trials
    const trialsUrl = `https://clinicaltrials.gov/search?term=${encodeURIComponent(company.name)}`;
    this.changeDetection.addMonitor({
      url: trialsUrl,
      name: `${company.name} - Clinical Trials`,
      category: 'clinical-trial',
      checkInterval: 3600000, // 1 hour
      metadata: {
        symbol: company.symbol,
        companyName: company.name,
        monitorType: 'clinical-trials',
      },
    });

    logger.info(`🔍 Set up monitoring for ${company.name}`);
  }

  /**
   * Setup global biotech monitoring
   */
  setupGlobalMonitoring(): void {
    // Monitor FDA approvals page
    this.changeDetection.addMonitor({
      url: this.biotechUrls.fdaApprovals,
      name: 'FDA - Drug Approvals',
      category: 'fda',
      checkInterval: 3600000, // 1 hour
      metadata: {
        monitorType: 'fda-approvals',
      },
    });

    // Monitor Fierce Biotech news
    this.changeDetection.addMonitor({
      url: this.biotechUrls.fierceBiotech,
      name: 'Fierce Biotech - Latest News',
      category: 'news',
      checkInterval: 600000, // 10 minutes
      metadata: {
        monitorType: 'fierce-biotech-news',
      },
    });

    // Monitor BioSpace news
    this.changeDetection.addMonitor({
      url: this.biotechUrls.bioSpace,
      name: 'BioSpace - Latest News',
      category: 'news',
      checkInterval: 900000, // 15 minutes
      metadata: {
        monitorType: 'biospace-news',
      },
    });

    logger.info('🌐 Global biotech monitoring enabled');
  }

  /**
   * Handle detected changes
   */
  private handleChangeDetected(change: any): void {
    const metadata = change.metadata || {};
    const symbol = metadata.symbol;
    const monitorType = metadata.monitorType;

    // Determine severity based on monitor type
    let severity: 'high' | 'medium' | 'low' = 'medium';
    let type: PortfolioAlert['type'] = 'press-release';

    if (monitorType === 'fda-approvals') {
      severity = 'high';
      type = 'fda';
    } else if (monitorType === 'clinical-trials') {
      severity = 'high';
      type = 'clinical-trial';
    } else if (monitorType === 'fierce-biotech-news' || monitorType === 'biospace-news') {
      severity = 'medium';
      type = 'press-release';
    }

    const alert: PortfolioAlert = {
      id: change.id,
      company: metadata.companyName || 'Unknown',
      symbol: symbol || 'N/A',
      type,
      title: change.name,
      description: `Content updated on ${new Date(change.timestamp).toLocaleString()}`,
      url: change.url,
      timestamp: new Date(change.timestamp),
      severity,
      metadata: change.metadata,
    };

    this.alerts.push(alert);
    
    // Keep only last 500 alerts
    if (this.alerts.length > 500) {
      this.alerts.shift();
    }

    logger.info(`🔔 Portfolio alert: ${alert.title} (${alert.severity})`);
    this.emit('alert:created', alert);
  }

  /**
   * Get all portfolio companies
   */
  getCompanies(): PortfolioCompany[] {
    return Array.from(this.companies.values());
  }

  /**
   * Get company by symbol
   */
  getCompany(symbol: string): PortfolioCompany | undefined {
    return this.companies.get(symbol);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50): PortfolioAlert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get alerts for a specific company
   */
  getCompanyAlerts(symbol: string, limit: number = 20): PortfolioAlert[] {
    return this.alerts
      .filter(alert => alert.symbol === symbol)
      .slice(-limit)
      .reverse();
  }

  /**
   * Enable/disable monitoring for a company
   */
  setCompanyMonitoring(symbol: string, enabled: boolean): boolean {
    const company = this.companies.get(symbol);
    if (!company) {
      return false;
    }

    company.monitoringEnabled = enabled;

    // Find all monitors for this company
    const monitors = this.changeDetection.getMonitors();
    monitors
      .filter(m => m.metadata?.symbol === symbol)
      .forEach(m => this.changeDetection.setMonitorEnabled(m.id, enabled));

    logger.info(`${enabled ? '▶️' : '⏸️'} ${enabled ? 'Enabled' : 'Disabled'} monitoring for ${company.name}`);
    this.emit('company:monitoring-toggled', { symbol, enabled });

    return true;
  }

  /**
   * Get monitoring statistics
   */
  getStats(): {
    totalCompanies: number;
    monitoredCompanies: number;
    totalAlerts: number;
    highSeverityAlerts: number;
    recentAlerts: number;
  } {
    const companies = this.getCompanies();
    const recentAlerts = this.alerts.filter(
      a => Date.now() - a.timestamp.getTime() < 86400000 // Last 24 hours
    ).length;

    return {
      totalCompanies: companies.length,
      monitoredCompanies: companies.filter(c => c.monitoringEnabled).length,
      totalAlerts: this.alerts.length,
      highSeverityAlerts: this.alerts.filter(a => a.severity === 'high').length,
      recentAlerts,
    };
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    logger.info('🗑️ Portfolio alerts cleared');
  }

  /**
   * Load default portfolio
   */
  loadDefaultPortfolio(): void {
    const defaultCompanies: PortfolioCompany[] = [
      {
        symbol: 'MRNA',
        name: 'Moderna',
        therapeuticArea: 'Vaccines & Oncology',
        websites: {
          company: 'https://www.modernatx.com',
          investors: 'https://investors.modernatx.com',
          pressReleases: 'https://investors.modernatx.com/news-releases',
        },
        monitoringEnabled: true,
      },
      {
        symbol: 'BNTX',
        name: 'BioNTech',
        therapeuticArea: 'Vaccines & Immunotherapy',
        websites: {
          company: 'https://www.biontech.com',
          investors: 'https://investors.biontech.de',
        },
        monitoringEnabled: true,
      },
      {
        symbol: 'VRTX',
        name: 'Vertex Pharmaceuticals',
        therapeuticArea: 'Cystic Fibrosis & Rare Diseases',
        websites: {
          company: 'https://www.vrtx.com',
          investors: 'https://investors.vrtx.com',
        },
        monitoringEnabled: true,
      },
      {
        symbol: 'REGN',
        name: 'Regeneron',
        therapeuticArea: 'Immunology & Oncology',
        websites: {
          company: 'https://www.regeneron.com',
          investors: 'https://investor.regeneron.com',
        },
        monitoringEnabled: true,
      },
      {
        symbol: 'GILD',
        name: 'Gilead Sciences',
        therapeuticArea: 'Virology & Oncology',
        websites: {
          company: 'https://www.gilead.com',
          investors: 'https://investors.gilead.com',
        },
        monitoringEnabled: true,
      },
    ];

    defaultCompanies.forEach(company => this.addCompany(company));
    logger.info(`✅ Loaded ${defaultCompanies.length} companies into portfolio`);
  }
}

// Singleton instance
let instance: PortfolioMonitorService | null = null;

export function getPortfolioMonitor(): PortfolioMonitorService {
  if (!instance) {
    instance = new PortfolioMonitorService();
  }
  return instance;
}
