import winston from 'winston';
import { config } from '../config/environment.js';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const baseLog = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      return `${baseLog}\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      return `${baseLog} ${JSON.stringify(meta)}`;
    }
    
    return baseLog;
  })
);

// Create Winston logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'biotech-terminal-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: config.logging.file.replace('.log', '-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create request logger middleware
export const requestLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: './logs/access.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Performance logger for monitoring
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: './logs/performance.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console as well
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaString}`;
      })
    )
  }));
}

// Create structured logging helpers
export const log = {
  // API request logging
  request: (method: string, url: string, statusCode: number, duration: number, userId?: string) => {
    requestLogger.info('API Request', {
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Performance monitoring
  performance: (operation: string, duration: number, metadata?: Record<string, any>) => {
    performanceLogger.info('Performance Metric', {
      operation,
      duration,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  },

  // Database query logging
  query: (query: string, duration: number, database: string) => {
    if (config.nodeEnv === 'development') {
      logger.debug('Database Query', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration,
        database,
      });
    }
  },

  // Error logging with context
  error: (error: Error, context?: Record<string, any>) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  },

  // Market data logging
  marketData: (symbol: string, dataType: string, source: string, recordCount?: number) => {
    logger.info('Market Data', {
      symbol,
      dataType,
      source,
      recordCount,
      timestamp: new Date().toISOString(),
    });
  },

  // User activity logging
  userActivity: (userId: string, action: string, metadata?: Record<string, any>) => {
    logger.info('User Activity', {
      userId,
      action,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  },
};