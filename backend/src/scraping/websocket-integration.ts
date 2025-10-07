/**
 * WebSocket Integration for Real-Time Scraping Updates
 * Streams scraping events and data to connected clients
 */

import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger.js';
import { getScrapingManager } from './scraping-manager.js';
import { getPerformanceMonitor } from './performance-monitor.js';

export interface ScrapingEvent {
  type: 'scraping:started' | 'scraping:completed' | 'scraping:failed' | 'scraping:progress';
  source: 'pubmed' | 'fda' | 'clinical-trials';
  data: any;
  timestamp: number;
}

/**
 * Setup WebSocket handlers for scraping events
 */
export function setupScrapingWebSocket(io: SocketServer): void {
  const manager = getScrapingManager();
  const monitor = getPerformanceMonitor();

  logger.info('🔌 Setting up scraping WebSocket handlers');

  // Subscribe to scraping manager events
  manager.on('scraping:success', (data) => {
    io.to('scraping:updates').emit('scraping:completed', {
      type: 'scraping:completed',
      data,
      timestamp: Date.now(),
    });
  });

  manager.on('scraping:failure', (data) => {
    io.to('scraping:updates').emit('scraping:failed', {
      type: 'scraping:failed',
      data,
      timestamp: Date.now(),
    });
  });

  manager.on('health:change', (data) => {
    io.to('scraping:health').emit('health:change', {
      type: 'health:change',
      data,
      timestamp: Date.now(),
    });
  });

  manager.on('health:update', (health) => {
    io.to('scraping:health').emit('health:update', {
      type: 'health:update',
      data: health,
      timestamp: Date.now(),
    });
  });

  // Subscribe to performance monitor events
  monitor.on('snapshot', (snapshot) => {
    io.to('scraping:metrics').emit('performance:snapshot', {
      type: 'performance:snapshot',
      data: snapshot,
      timestamp: Date.now(),
    });
  });

  monitor.on('metric', (metric) => {
    io.to('scraping:metrics').emit('performance:metric', {
      type: 'performance:metric',
      data: metric,
      timestamp: Date.now(),
    });
  });

  // Client connection handlers
  io.on('connection', (socket) => {
    // Subscribe to scraping updates
    socket.on('scraping:subscribe', (options: { channels?: string[] }) => {
      const channels = options.channels || ['updates', 'health', 'metrics'];
      
      channels.forEach(channel => {
        const room = `scraping:${channel}`;
        socket.join(room);
        logger.debug(`Client ${socket.id} subscribed to ${room}`);
      });

      socket.emit('scraping:subscribed', {
        channels,
        timestamp: Date.now(),
      });
    });

    // Unsubscribe from scraping updates
    socket.on('scraping:unsubscribe', (options: { channels?: string[] }) => {
      const channels = options.channels || ['updates', 'health', 'metrics'];
      
      channels.forEach(channel => {
        const room = `scraping:${channel}`;
        socket.leave(room);
        logger.debug(`Client ${socket.id} unsubscribed from ${room}`);
      });

      socket.emit('scraping:unsubscribed', {
        channels,
        timestamp: Date.now(),
      });
    });

    // Get current health status
    socket.on('scraping:get-health', async () => {
      try {
        const health = await manager.getHealth();
        socket.emit('scraping:health', {
          type: 'scraping:health',
          data: health,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get scraping health:', error);
        socket.emit('scraping:error', {
          type: 'error',
          message: 'Failed to get health status',
          timestamp: Date.now(),
        });
      }
    });

    // Get current statistics
    socket.on('scraping:get-stats', () => {
      try {
        const stats = manager.getStats();
        socket.emit('scraping:stats', {
          type: 'scraping:stats',
          data: stats,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get scraping stats:', error);
        socket.emit('scraping:error', {
          type: 'error',
          message: 'Failed to get statistics',
          timestamp: Date.now(),
        });
      }
    });

    // Get performance snapshot
    socket.on('scraping:get-performance', () => {
      try {
        const snapshot = monitor.getSnapshot();
        socket.emit('scraping:performance', {
          type: 'scraping:performance',
          data: snapshot,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to get performance snapshot:', error);
        socket.emit('scraping:error', {
          type: 'error',
          message: 'Failed to get performance data',
          timestamp: Date.now(),
        });
      }
    });

    // Search PubMed with real-time updates
    socket.on('scraping:pubmed-search', async (query: any) => {
      try {
        socket.emit('scraping:started', {
          type: 'scraping:started',
          source: 'pubmed',
          query,
          timestamp: Date.now(),
        });

        const scraper = manager.getPubMedScraper();
        const results = await scraper.search(query);

        socket.emit('scraping:completed', {
          type: 'scraping:completed',
          source: 'pubmed',
          data: results,
          count: results.length,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('PubMed search via WebSocket failed:', error);
        socket.emit('scraping:failed', {
          type: 'scraping:failed',
          source: 'pubmed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      }
    });

    // Search FDA with real-time updates
    socket.on('scraping:fda-search', async (query: any) => {
      try {
        socket.emit('scraping:started', {
          type: 'scraping:started',
          source: 'fda',
          query,
          timestamp: Date.now(),
        });

        const scraper = manager.getFDAScraper();
        const results = await scraper.searchDrugApprovals(query);

        socket.emit('scraping:completed', {
          type: 'scraping:completed',
          source: 'fda',
          data: results,
          count: results.length,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('FDA search via WebSocket failed:', error);
        socket.emit('scraping:failed', {
          type: 'scraping:failed',
          source: 'fda',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      }
    });

    // Search Clinical Trials with real-time updates
    socket.on('scraping:trials-search', async (query: any) => {
      try {
        socket.emit('scraping:started', {
          type: 'scraping:started',
          source: 'clinical-trials',
          query,
          timestamp: Date.now(),
        });

        const scraper = manager.getClinicalTrialsScraper();
        const results = await scraper.search(query);

        socket.emit('scraping:completed', {
          type: 'scraping:completed',
          source: 'clinical-trials',
          data: results,
          count: results.length,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Clinical Trials search via WebSocket failed:', error);
        socket.emit('scraping:failed', {
          type: 'scraping:failed',
          source: 'clinical-trials',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      }
    });
  });

  logger.info('✅ Scraping WebSocket handlers configured');
}

/**
 * Broadcast scraping event to all connected clients
 */
export function broadcastScrapingEvent(
  io: SocketServer,
  event: ScrapingEvent
): void {
  io.to('scraping:updates').emit(event.type, event);
}

/**
 * Broadcast health update to subscribed clients
 */
export function broadcastHealthUpdate(
  io: SocketServer,
  health: any
): void {
  io.to('scraping:health').emit('health:update', {
    type: 'health:update',
    data: health,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast performance metrics to subscribed clients
 */
export function broadcastPerformanceMetrics(
  io: SocketServer,
  metrics: any
): void {
  io.to('scraping:metrics').emit('performance:snapshot', {
    type: 'performance:snapshot',
    data: metrics,
    timestamp: Date.now(),
  });
}
