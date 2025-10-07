import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from './config/environment.js';
import { logger } from './utils/logger.js';
import { connectDatabases } from './database/connection-simple.js';
import { setupWebSocket } from './websocket/index.js';
import { initializeScrapingManager } from './scraping/index.js';

// Import route handlers
import { marketDataRouter } from './routes/market-data.js';
import { biotechDataRouter } from './routes/biotech-data.js';
import { financialModelingRouter } from './routes/financial-modeling.js';
import { userRouter } from './routes/user.js';
import { analyticsRouter } from './routes/analytics.js';
import { scrapingRouter } from './routes/scraping.js';
import { monitoringRouter } from './routes/monitoring.js';

async function startServer() {
  try {
    // Connect to databases
    await connectDatabases();
    logger.info('Database connections established');

    // Initialize scraping manager
    await initializeScrapingManager({
      pubmedApiKey: config.externalApis.openbb, // Reuse if available
      fdaApiKey: config.externalApis.fda,
    });
    logger.info('Scraping infrastructure initialized');

    // Create Express app
    const app = express();
    const server = createServer(app);

    // Setup Socket.IO
    const io = new SocketServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST']
      }
    });

    // Middleware
    app.use(helmet());
    app.use(cors({
      origin: config.corsOrigin,
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    app.use('/api/market', marketDataRouter);
    app.use('/api/biotech', biotechDataRouter);
    app.use('/api/financial', financialModelingRouter);
    app.use('/api/user', userRouter);
    app.use('/api/analytics', analyticsRouter);
    app.use('/api/scraping', scrapingRouter);
    app.use('/api/monitoring', monitoringRouter);

    // Setup WebSocket handlers
    setupWebSocket(io);

    // Error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // Start server
    const port = config.apiPort || 3001;
    server.listen(port, () => {
      logger.info(`🚀 Biotech Terminal API running on port ${port}`);
      logger.info(`📊 WebSocket server running on port ${port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();