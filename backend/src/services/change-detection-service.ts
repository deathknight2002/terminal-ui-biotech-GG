/**
 * Change Detection Service
 * Monitors URLs for changes and tracks differences over time
 * Inspired by changedetection.io patterns
 */

import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { LRUCache } from '../scraping/lru-cache.js';
import { EventEmitter } from 'events';

export interface MonitoredUrl {
  id: string;
  url: string;
  name: string;
  category: 'portfolio' | 'news' | 'fda' | 'clinical-trial' | 'company';
  checkInterval: number; // in milliseconds
  selector?: string; // CSS selector for specific content
  lastCheck?: Date;
  lastChange?: Date;
  changeCount: number;
  enabled: boolean;
  metadata?: Record<string, any>;
}

export interface ChangeDetection {
  id: string;
  urlId: string;
  url: string;
  name: string;
  timestamp: Date;
  changeType: 'new' | 'modified' | 'deleted';
  previousHash?: string;
  currentHash: string;
  previousContent?: string;
  currentContent: string;
  diff?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringStats {
  totalMonitored: number;
  activeMonitors: number;
  totalChecks: number;
  totalChanges: number;
  lastCheckTime?: Date;
  uptime: number;
}

/**
 * Change Detection Service
 * Manages URL monitoring and change detection
 */
export class ChangeDetectionService extends EventEmitter {
  private monitoredUrls: Map<string, MonitoredUrl> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private contentCache: LRUCache<string>;
  private changeHistory: ChangeDetection[] = [];
  private client: AxiosInstance;
  private stats = {
    totalChecks: 0,
    totalChanges: 0,
    startTime: Date.now(),
  };

  constructor() {
    super();
    
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Biotech-Terminal-Monitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    // Cache for storing content hashes and content
    this.contentCache = new LRUCache<string>({
      maxSize: 500,
      defaultTTL: 86400000, // 24 hours
    });

    logger.info('📡 Change Detection Service initialized');
  }

  /**
   * Add a URL to monitor
   */
  addMonitor(config: Omit<MonitoredUrl, 'id' | 'changeCount' | 'enabled'>): string {
    const id = this.generateId(config.url);
    
    const monitor: MonitoredUrl = {
      id,
      ...config,
      changeCount: 0,
      enabled: true,
    };

    this.monitoredUrls.set(id, monitor);
    this.startMonitoring(id);

    logger.info(`✅ Added monitor: ${monitor.name} (${monitor.url})`);
    this.emit('monitor:added', monitor);

    return id;
  }

  /**
   * Remove a monitor
   */
  removeMonitor(id: string): boolean {
    const monitor = this.monitoredUrls.get(id);
    if (!monitor) {
      return false;
    }

    this.stopMonitoring(id);
    this.monitoredUrls.delete(id);
    
    logger.info(`🗑️ Removed monitor: ${monitor.name}`);
    this.emit('monitor:removed', { id, monitor });

    return true;
  }

  /**
   * Start monitoring a URL
   */
  private startMonitoring(id: string): void {
    const monitor = this.monitoredUrls.get(id);
    if (!monitor || !monitor.enabled) {
      return;
    }

    // Clear any existing interval
    this.stopMonitoring(id);

    // Perform initial check immediately
    this.checkForChanges(id).catch(error => {
      logger.error(`Error in initial check for ${monitor.name}:`, error);
    });

    // Set up periodic checking
    const interval = setInterval(() => {
      this.checkForChanges(id).catch(error => {
        logger.error(`Error checking ${monitor.name}:`, error);
      });
    }, monitor.checkInterval);

    this.monitoringIntervals.set(id, interval);
    logger.debug(`🔄 Started monitoring: ${monitor.name} (every ${monitor.checkInterval / 1000}s)`);
  }

  /**
   * Stop monitoring a URL
   */
  private stopMonitoring(id: string): void {
    const interval = this.monitoringIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(id);
    }
  }

  /**
   * Check a URL for changes
   */
  private async checkForChanges(id: string): Promise<void> {
    const monitor = this.monitoredUrls.get(id);
    if (!monitor || !monitor.enabled) {
      return;
    }

    try {
      this.stats.totalChecks++;
      monitor.lastCheck = new Date();

      // Fetch content
      const response = await this.client.get(monitor.url);
      let content = response.data;

      // If selector is specified, extract only that content
      if (monitor.selector) {
        // For now, we'll work with full content
        // In production, you'd use cheerio to extract specific selectors
        // const $ = cheerio.load(content);
        // content = $(monitor.selector).html() || '';
      }

      // Generate hash of content
      const currentHash = this.hashContent(content);
      const cacheKey = `${id}:hash`;
      const previousHash = this.contentCache.get(cacheKey);

      // Check if content has changed
      if (previousHash && previousHash !== currentHash) {
        const previousContentKey = `${id}:content`;
        const previousContent = this.contentCache.get(previousContentKey);

        monitor.changeCount++;
        monitor.lastChange = new Date();
        this.stats.totalChanges++;

        const change: ChangeDetection = {
          id: this.generateId(`${id}:${Date.now()}`),
          urlId: id,
          url: monitor.url,
          name: monitor.name,
          timestamp: new Date(),
          changeType: 'modified',
          previousHash,
          currentHash,
          previousContent,
          currentContent: content.substring(0, 10000), // Limit stored content
          metadata: {
            ...monitor.metadata,
            category: monitor.category,
          },
        };

        this.changeHistory.push(change);
        
        // Keep only last 1000 changes
        if (this.changeHistory.length > 1000) {
          this.changeHistory.shift();
        }

        logger.info(`🔔 Change detected: ${monitor.name} (change #${monitor.changeCount})`);
        this.emit('change:detected', change);
      } else if (!previousHash) {
        // First check - just store the hash
        logger.debug(`📝 Initial content stored for: ${monitor.name}`);
        
        const change: ChangeDetection = {
          id: this.generateId(`${id}:${Date.now()}`),
          urlId: id,
          url: monitor.url,
          name: monitor.name,
          timestamp: new Date(),
          changeType: 'new',
          currentHash,
          currentContent: content.substring(0, 10000),
          metadata: {
            ...monitor.metadata,
            category: monitor.category,
          },
        };

        this.emit('change:detected', change);
      }

      // Update cache
      this.contentCache.set(cacheKey, currentHash);
      this.contentCache.set(`${id}:content`, content.substring(0, 10000));

    } catch (error) {
      logger.error(`❌ Error checking ${monitor.name}:`, error);
      this.emit('monitor:error', { id, monitor, error });
    }
  }

  /**
   * Get monitoring statistics
   */
  getStats(): MonitoringStats {
    const activeMonitors = Array.from(this.monitoredUrls.values()).filter(m => m.enabled).length;
    
    return {
      totalMonitored: this.monitoredUrls.size,
      activeMonitors,
      totalChecks: this.stats.totalChecks,
      totalChanges: this.stats.totalChanges,
      lastCheckTime: this.getLastCheckTime(),
      uptime: Date.now() - this.stats.startTime,
    };
  }

  /**
   * Get all monitored URLs
   */
  getMonitors(): MonitoredUrl[] {
    return Array.from(this.monitoredUrls.values());
  }

  /**
   * Get monitor by ID
   */
  getMonitor(id: string): MonitoredUrl | undefined {
    return this.monitoredUrls.get(id);
  }

  /**
   * Get recent changes
   */
  getRecentChanges(limit: number = 50): ChangeDetection[] {
    return this.changeHistory.slice(-limit).reverse();
  }

  /**
   * Get changes for a specific URL
   */
  getChangesForUrl(urlId: string, limit: number = 20): ChangeDetection[] {
    return this.changeHistory
      .filter(change => change.urlId === urlId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Enable/disable a monitor
   */
  setMonitorEnabled(id: string, enabled: boolean): boolean {
    const monitor = this.monitoredUrls.get(id);
    if (!monitor) {
      return false;
    }

    monitor.enabled = enabled;

    if (enabled) {
      this.startMonitoring(id);
      logger.info(`▶️ Enabled monitor: ${monitor.name}`);
    } else {
      this.stopMonitoring(id);
      logger.info(`⏸️ Disabled monitor: ${monitor.name}`);
    }

    this.emit('monitor:toggled', { id, enabled });
    return true;
  }

  /**
   * Update monitor configuration
   */
  updateMonitor(id: string, updates: Partial<MonitoredUrl>): boolean {
    const monitor = this.monitoredUrls.get(id);
    if (!monitor) {
      return false;
    }

    Object.assign(monitor, updates);
    
    // Restart monitoring if interval changed
    if (updates.checkInterval && monitor.enabled) {
      this.startMonitoring(id);
    }

    logger.info(`🔄 Updated monitor: ${monitor.name}`);
    this.emit('monitor:updated', monitor);

    return true;
  }

  /**
   * Force check a monitor immediately
   */
  async forceCheck(id: string): Promise<void> {
    await this.checkForChanges(id);
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    for (const id of this.monitoringIntervals.keys()) {
      this.stopMonitoring(id);
    }
    logger.info('🛑 All monitoring stopped');
  }

  /**
   * Get last check time across all monitors
   */
  private getLastCheckTime(): Date | undefined {
    const lastChecks = Array.from(this.monitoredUrls.values())
      .map(m => m.lastCheck)
      .filter(Boolean) as Date[];
    
    if (lastChecks.length === 0) {
      return undefined;
    }

    return new Date(Math.max(...lastChecks.map(d => d.getTime())));
  }

  /**
   * Generate consistent ID from URL
   */
  private generateId(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex').substring(0, 16);
  }

  /**
   * Hash content for comparison
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Clear change history
   */
  clearHistory(): void {
    this.changeHistory = [];
    logger.info('🗑️ Change history cleared');
  }

  /**
   * Get health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  } {
    const stats = this.getStats();
    const recentErrors = this.changeHistory.filter(
      c => Date.now() - c.timestamp.getTime() < 300000 // Last 5 minutes
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (stats.activeMonitors === 0) {
      status = 'degraded';
    }
    
    if (recentErrors > 10) {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        ...stats,
        recentErrors,
      },
    };
  }
}

// Singleton instance
let instance: ChangeDetectionService | null = null;

export function getChangeDetectionService(): ChangeDetectionService {
  if (!instance) {
    instance = new ChangeDetectionService();
  }
  return instance;
}
