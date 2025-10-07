/**
 * WebSocket Integration for Change Detection & Portfolio Monitoring
 * Real-time updates for monitored changes and portfolio alerts
 */

import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger.js';
import { getChangeDetectionService } from '../services/change-detection-service.js';
import { getPortfolioMonitor } from '../services/portfolio-monitor.js';
import { getNewsMonitor } from '../services/news-monitor.js';

export interface MonitoringWebSocketEvent {
  type: 'change:detected' | 'alert:created' | 'monitor:added' | 'monitor:removed' | 'monitor:updated';
  data: any;
  timestamp: number;
}

/**
 * Setup WebSocket handlers for monitoring events
 */
export function setupMonitoringWebSocket(io: SocketServer): void {
  const changeDetection = getChangeDetectionService();
  const portfolioMonitor = getPortfolioMonitor();
  const newsMonitor = getNewsMonitor();

  logger.info('🔌 Setting up monitoring WebSocket handlers');

  // Subscribe to change detection events
  changeDetection.on('change:detected', (change) => {
    io.to('monitoring:changes').emit('change:detected', {
      type: 'change:detected',
      data: change,
      timestamp: Date.now(),
    });
    
    logger.debug(`📡 Broadcast change: ${change.name}`);
  });

  changeDetection.on('monitor:added', (monitor) => {
    io.to('monitoring:monitors').emit('monitor:added', {
      type: 'monitor:added',
      data: monitor,
      timestamp: Date.now(),
    });
  });

  changeDetection.on('monitor:removed', (data) => {
    io.to('monitoring:monitors').emit('monitor:removed', {
      type: 'monitor:removed',
      data,
      timestamp: Date.now(),
    });
  });

  changeDetection.on('monitor:updated', (monitor) => {
    io.to('monitoring:monitors').emit('monitor:updated', {
      type: 'monitor:updated',
      data: monitor,
      timestamp: Date.now(),
    });
  });

  changeDetection.on('monitor:toggled', (data) => {
    io.to('monitoring:monitors').emit('monitor:toggled', {
      type: 'monitor:toggled',
      data,
      timestamp: Date.now(),
    });
  });

  changeDetection.on('monitor:error', (data) => {
    io.to('monitoring:errors').emit('monitor:error', {
      type: 'monitor:error',
      data,
      timestamp: Date.now(),
    });
  });

  // Subscribe to portfolio monitor events
  portfolioMonitor.on('alert:created', (alert) => {
    io.to('monitoring:alerts').emit('alert:created', {
      type: 'alert:created',
      data: alert,
      timestamp: Date.now(),
    });
    
    logger.debug(`📡 Broadcast alert: ${alert.title} (${alert.severity})`);
  });

  portfolioMonitor.on('company:added', (company) => {
    io.to('monitoring:portfolio').emit('company:added', {
      type: 'company:added',
      data: company,
      timestamp: Date.now(),
    });
  });

  portfolioMonitor.on('company:removed', (data) => {
    io.to('monitoring:portfolio').emit('company:removed', {
      type: 'company:removed',
      data,
      timestamp: Date.now(),
    });
  });

  portfolioMonitor.on('company:monitoring-toggled', (data) => {
    io.to('monitoring:portfolio').emit('company:monitoring-toggled', {
      type: 'company:monitoring-toggled',
      data,
      timestamp: Date.now(),
    });
  });

  // Subscribe to news monitor events
  newsMonitor.on('news:alert', (alert) => {
    io.to('monitoring:news').emit('news:alert', {
      type: 'news:alert',
      data: alert,
      timestamp: Date.now(),
    });
    
    logger.debug(`📡 Broadcast news alert: ${alert.article.title}`);
  });

  newsMonitor.on('news:article', (article) => {
    io.to('monitoring:news').emit('news:article', {
      type: 'news:article',
      data: article,
      timestamp: Date.now(),
    });
  });

  newsMonitor.on('config:updated', (config) => {
    io.to('monitoring:news').emit('news:config-updated', {
      type: 'news:config-updated',
      data: config,
      timestamp: Date.now(),
    });
  });

  // Client connection handlers
  io.on('connection', (socket) => {
    logger.debug(`Client ${socket.id} connected to monitoring`);

    // Subscribe to monitoring updates
    socket.on('monitoring:subscribe', (options: { channels?: string[] }) => {
      const channels = options.channels || ['changes', 'alerts', 'monitors', 'portfolio', 'news', 'errors'];
      
      channels.forEach(channel => {
        const room = `monitoring:${channel}`;
        socket.join(room);
        logger.debug(`Client ${socket.id} subscribed to ${room}`);
      });

      socket.emit('monitoring:subscribed', {
        channels,
        timestamp: Date.now(),
      });
    });

    // Unsubscribe from monitoring updates
    socket.on('monitoring:unsubscribe', (options: { channels?: string[] }) => {
      const channels = options.channels || ['changes', 'alerts', 'monitors', 'portfolio', 'news', 'errors'];
      
      channels.forEach(channel => {
        const room = `monitoring:${channel}`;
        socket.leave(room);
        logger.debug(`Client ${socket.id} unsubscribed from ${room}`);
      });

      socket.emit('monitoring:unsubscribed', {
        channels,
        timestamp: Date.now(),
      });
    });

    // Get current monitoring stats
    socket.on('monitoring:get-stats', () => {
      try {
        const changeStats = changeDetection.getStats();
        const portfolioStats = portfolioMonitor.getStats();
        const newsStats = newsMonitor.getStats();
        
        socket.emit('monitoring:stats', {
          type: 'monitoring:stats',
          data: {
            changeDetection: changeStats,
            portfolio: portfolioStats,
            news: newsStats,
          },
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get monitoring stats:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to get statistics',
          timestamp: Date.now(),
        });
      }
    });

    // Get all monitors
    socket.on('monitoring:get-monitors', () => {
      try {
        const monitors = changeDetection.getMonitors();
        socket.emit('monitoring:monitors', {
          type: 'monitoring:monitors',
          data: monitors,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get monitors:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to get monitors',
          timestamp: Date.now(),
        });
      }
    });

    // Get recent changes
    socket.on('monitoring:get-changes', (options: { limit?: number }) => {
      try {
        const limit = options.limit || 50;
        const changes = changeDetection.getRecentChanges(limit);
        socket.emit('monitoring:changes', {
          type: 'monitoring:changes',
          data: changes,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get changes:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to get changes',
          timestamp: Date.now(),
        });
      }
    });

    // Get portfolio companies
    socket.on('monitoring:get-companies', () => {
      try {
        const companies = portfolioMonitor.getCompanies();
        socket.emit('monitoring:companies', {
          type: 'monitoring:companies',
          data: companies,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get companies:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to get companies',
          timestamp: Date.now(),
        });
      }
    });

    // Get portfolio alerts
    socket.on('monitoring:get-alerts', (options: { limit?: number }) => {
      try {
        const limit = options.limit || 50;
        const alerts = portfolioMonitor.getRecentAlerts(limit);
        socket.emit('monitoring:alerts', {
          type: 'monitoring:alerts',
          data: alerts,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get alerts:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to get alerts',
          timestamp: Date.now(),
        });
      }
    });

    // Force check a monitor
    socket.on('monitoring:force-check', async (data: { monitorId: string }) => {
      try {
        await changeDetection.forceCheck(data.monitorId);
        socket.emit('monitoring:check-started', {
          type: 'monitoring:check-started',
          data: { monitorId: data.monitorId },
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to force check:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to force check',
          timestamp: Date.now(),
        });
      }
    });

    // Add a new monitor
    socket.on('monitoring:add-monitor', (monitor: any) => {
      try {
        const id = changeDetection.addMonitor(monitor);
        socket.emit('monitoring:monitor-added', {
          type: 'monitoring:monitor-added',
          data: { id },
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to add monitor:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to add monitor',
          timestamp: Date.now(),
        });
      }
    });

    // Remove a monitor
    socket.on('monitoring:remove-monitor', (data: { monitorId: string }) => {
      try {
        const success = changeDetection.removeMonitor(data.monitorId);
        socket.emit('monitoring:monitor-removed', {
          type: 'monitoring:monitor-removed',
          data: { success, monitorId: data.monitorId },
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to remove monitor:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to remove monitor',
          timestamp: Date.now(),
        });
      }
    });

    // Toggle monitor
    socket.on('monitoring:toggle-monitor', (data: { monitorId: string; enabled: boolean }) => {
      try {
        const success = changeDetection.setMonitorEnabled(data.monitorId, data.enabled);
        socket.emit('monitoring:monitor-toggled', {
          type: 'monitoring:monitor-toggled',
          data: { success, ...data },
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to toggle monitor:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to toggle monitor',
          timestamp: Date.now(),
        });
      }
    });

    // Add company to portfolio
    socket.on('monitoring:add-company', (company: any) => {
      try {
        portfolioMonitor.addCompany(company);
        socket.emit('monitoring:company-added', {
          type: 'monitoring:company-added',
          data: company,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to add company:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to add company',
          timestamp: Date.now(),
        });
      }
    });

    // Remove company from portfolio
    socket.on('monitoring:remove-company', (data: { symbol: string }) => {
      try {
        const success = portfolioMonitor.removeCompany(data.symbol);
        socket.emit('monitoring:company-removed', {
          type: 'monitoring:company-removed',
          data: { success, symbol: data.symbol },
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to remove company:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to remove company',
          timestamp: Date.now(),
        });
      }
    });

    // Toggle company monitoring
    socket.on('monitoring:toggle-company', (data: { symbol: string; enabled: boolean }) => {
      try {
        const success = portfolioMonitor.setCompanyMonitoring(data.symbol, data.enabled);
        socket.emit('monitoring:company-toggled', {
          type: 'monitoring:company-toggled',
          data: { success, ...data },
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to toggle company:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to toggle company',
          timestamp: Date.now(),
        });
      }
    });

    // Get news alerts
    socket.on('monitoring:get-news-alerts', (options: { limit?: number }) => {
      try {
        const limit = options.limit || 50;
        const alerts = newsMonitor.getAlerts(limit);
        socket.emit('monitoring:news-alerts', {
          type: 'monitoring:news-alerts',
          data: alerts,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get news alerts:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to get news alerts',
          timestamp: Date.now(),
        });
      }
    });

    // Get news configuration
    socket.on('monitoring:get-news-config', () => {
      try {
        const config = newsMonitor.getConfig();
        socket.emit('monitoring:news-config', {
          type: 'monitoring:news-config',
          data: config,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get news config:', error);
        socket.emit('monitoring:error', {
          type: 'error',
          message: 'Failed to get news configuration',
          timestamp: Date.now(),
        });
      }
    });
  });

  logger.info('✅ Monitoring WebSocket handlers configured');
}

/**
 * Broadcast monitoring event to all connected clients
 */
export function broadcastMonitoringEvent(
  io: SocketServer,
  event: MonitoringWebSocketEvent
): void {
  const channel = event.type.split(':')[0];
  io.to(`monitoring:${channel}`).emit(event.type, event);
}
