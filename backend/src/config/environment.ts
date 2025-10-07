import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment configuration schema
const envSchema = z.object({
  // Database
  POSTGRES_DSN: z.string().default('postgresql://localhost:5432/biotech_terminal'),
  QUESTDB_DSN: z.string().default('postgresql://localhost:8812/qdb'),
  TIMESCALE_DSN: z.string().default('postgresql://localhost:5433/timeseries'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // API
  API_PORT: z.string().transform(Number).default(3001),
  WS_PORT: z.string().transform(Number).default(3002),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // External APIs
  OPENBB_API_KEY: z.string().optional(),
  FDA_API_KEY: z.string().optional(),
  CLINICALTRIALS_API_KEY: z.string().optional(),
  EDGAR_API_KEY: z.string().optional(),
  
  // Dagster
  DAGSTER_HOME: z.string().default('./dagster_home'),
  DAGSTER_POSTGRES_DB: z.string().optional(),
  DAGSTER_LAKEHOUSE_ROOT: z.string().default('./data/lakehouse'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('./logs/biotech-terminal.log'),
  
  // Cache
  CACHE_TTL: z.string().transform(Number).default(300),
  CACHE_MAX_SIZE: z.string().transform(Number).default(1000),
  
  // WebSocket
  WS_HEARTBEAT_INTERVAL: z.string().transform(Number).default(30000),
  WS_MAX_CONNECTIONS: z.string().transform(Number).default(1000),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment configuration:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

const env = parseEnv();

export const config = {
  // Database connections
  database: {
    postgres: env.POSTGRES_DSN,
    questdb: env.QUESTDB_DSN,
    timescale: env.TIMESCALE_DSN,
  },
  
  // Redis
  redis: {
    url: env.REDIS_URL,
  },
  
  // API configuration
  apiPort: env.API_PORT,
  wsPort: env.WS_PORT,
  nodeEnv: env.NODE_ENV,
  jwtSecret: env.JWT_SECRET,
  corsOrigin: env.CORS_ORIGIN,
  
  // External APIs
  externalApis: {
    openbb: env.OPENBB_API_KEY,
    fda: env.FDA_API_KEY,
    clinicalTrials: env.CLINICALTRIALS_API_KEY,
    edgar: env.EDGAR_API_KEY,
  },
  
  // Dagster
  dagster: {
    home: env.DAGSTER_HOME,
    postgresDb: env.DAGSTER_POSTGRES_DB,
    lakehouseRoot: env.DAGSTER_LAKEHOUSE_ROOT,
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },
  
  // Cache
  cache: {
    ttl: env.CACHE_TTL,
    maxSize: env.CACHE_MAX_SIZE,
  },
  
  // WebSocket
  websocket: {
    heartbeatInterval: env.WS_HEARTBEAT_INTERVAL,
    maxConnections: env.WS_MAX_CONNECTIONS,
  },
  
  // Feature flags
  features: {
    realTimeData: true,
    aiPredictions: true,
    advancedAnalytics: true,
    multiUser: true,
  }
} as const;

export type Config = typeof config;