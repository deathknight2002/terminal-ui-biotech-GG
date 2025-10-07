import { Client as PostgresClient } from 'pg';
import { createClient as createRedisClient } from 'redis';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

// Database clients
export let postgresClient: PostgresClient;
export let questDbClient: PostgresClient;
export let timescaleClient: PostgresClient;
export let redisClient: ReturnType<typeof createRedisClient>;

export async function connectDatabases(): Promise<void> {
  try {
    // Connect to PostgreSQL (main database)
    postgresClient = new PostgresClient(config.database.postgres);
    await postgresClient.connect();
    logger.info('✅ Connected to PostgreSQL');

    // Connect to QuestDB (time-series data)
    questDbClient = new PostgresClient(config.database.questdb);
    await questDbClient.connect();
    logger.info('✅ Connected to QuestDB');

    // Connect to TimescaleDB (time-series analytics)
    timescaleClient = new PostgresClient(config.database.timescale);
    await timescaleClient.connect();
    logger.info('✅ Connected to TimescaleDB');

    // Connect to Redis (caching and sessions)
    redisClient = createRedisClient({ url: config.redis.url });
    await redisClient.connect();
    logger.info('✅ Connected to Redis');

    // Test connections
    await testConnections();

  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function testConnections(): Promise<void> {
  try {
    // Test PostgreSQL
    const pgResult = await postgresClient.query('SELECT NOW() as timestamp');
    logger.info(`📊 PostgreSQL test: ${pgResult.rows[0].timestamp}`);

    // Test QuestDB
    const questResult = await questDbClient.query('SELECT NOW() as timestamp');
    logger.info(`📊 QuestDB test: ${questResult.rows[0].timestamp}`);

    // Test TimescaleDB
    const tsResult = await timescaleClient.query('SELECT NOW() as timestamp');
    logger.info(`📊 TimescaleDB test: ${tsResult.rows[0].timestamp}`);

    // Test Redis
    await redisClient.set('health_check', Date.now().toString());
    const redisResult = await redisClient.get('health_check');
    logger.info(`📊 Redis test: ${redisResult}`);

  } catch (error) {
    logger.error('❌ Database health check failed:', error);
    throw error;
  }
}

export async function closeDatabases(): Promise<void> {
  try {
    await postgresClient?.end();
    await questDbClient?.end();
    await timescaleClient?.end();
    await redisClient?.quit();
    logger.info('✅ All database connections closed');
  } catch (error) {
    logger.error('❌ Error closing database connections:', error);
  }
}

// Database health check function
export async function checkDatabaseHealth(): Promise<{
  postgres: boolean;
  questdb: boolean;
  timescale: boolean;
  redis: boolean;
}> {
  const health = {
    postgres: false,
    questdb: false,
    timescale: false,
    redis: false,
  };

  try {
    await postgresClient.query('SELECT 1');
    health.postgres = true;
  } catch (error) {
    logger.warn('PostgreSQL health check failed:', error);
  }

  try {
    await questDbClient.query('SELECT 1');
    health.questdb = true;
  } catch (error) {
    logger.warn('QuestDB health check failed:', error);
  }

  try {
    await timescaleClient.query('SELECT 1');
    health.timescale = true;
  } catch (error) {
    logger.warn('TimescaleDB health check failed:', error);
  }

  try {
    await redisClient.ping();
    health.redis = true;
  } catch (error) {
    logger.warn('Redis health check failed:', error);
  }

  return health;
}