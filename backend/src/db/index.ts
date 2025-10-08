/**
 * Database Connection Layer
 * Provides Prisma client and Redis client for the epidemiology platform
 */

import { PrismaClient } from '../generated/prisma';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

// Singleton Prisma client
let prisma: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });

    // Handle shutdown gracefully
    process.on('beforeExit', async () => {
      await prisma?.$disconnect();
    });

    logger.info('Prisma client initialized');
  }
  
  return prisma;
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info('Prisma client disconnected');
  }
}

// Singleton Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Redis client instance
 */
export async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
    });

    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis client disconnected');
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    await redis.ping();
    logger.info('Redis connection successful');
    return true;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    return false;
  }
}

/**
 * Initialize all database connections
 */
export async function initializeDatabases(): Promise<void> {
  await Promise.all([
    testDatabaseConnection(),
    testRedisConnection(),
  ]);
}

/**
 * Gracefully shutdown all database connections
 */
export async function shutdownDatabases(): Promise<void> {
  await Promise.all([
    disconnectPrisma(),
    disconnectRedis(),
  ]);
}
