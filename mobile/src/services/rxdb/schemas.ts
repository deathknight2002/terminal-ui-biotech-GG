/**
 * RxDB Schemas
 * 
 * Database schemas for local-first storage.
 * Uses RxDB with IndexedDB storage and encryption.
 */

import { RxJsonSchema } from 'rxdb';

/**
 * Company Schema
 */
export const companySchema: RxJsonSchema<{
  id: string;
  symbol: string;
  name: string;
  sector: string;
  marketCap?: number;
  description?: string;
  updatedAt: number;
}> = {
  title: 'company schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    symbol: {
      type: 'string',
      maxLength: 20,
    },
    name: {
      type: 'string',
      maxLength: 200,
    },
    sector: {
      type: 'string',
      maxLength: 100,
    },
    marketCap: {
      type: 'number',
      minimum: 0,
    },
    description: {
      type: 'string',
      maxLength: 5000,
    },
    updatedAt: {
      type: 'number',
      minimum: 0,
    },
  },
  required: ['id', 'symbol', 'name', 'sector', 'updatedAt'],
  indexes: ['symbol', 'updatedAt'],
};

/**
 * Pipeline Schema
 */
export const pipelineSchema: RxJsonSchema<{
  id: string;
  companyId: string;
  drugName: string;
  phase: string;
  indication: string;
  updatedAt: number;
}> = {
  title: 'pipeline schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    companyId: {
      type: 'string',
      maxLength: 100,
    },
    drugName: {
      type: 'string',
      maxLength: 200,
    },
    phase: {
      type: 'string',
      maxLength: 50,
    },
    indication: {
      type: 'string',
      maxLength: 500,
    },
    updatedAt: {
      type: 'number',
      minimum: 0,
    },
  },
  required: ['id', 'companyId', 'drugName', 'phase', 'indication', 'updatedAt'],
  indexes: ['companyId', 'phase', 'updatedAt'],
};

/**
 * News Schema
 */
export const newsSchema: RxJsonSchema<{
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: number;
  summary?: string;
  tags?: string[];
  updatedAt: number;
}> = {
  title: 'news schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
      maxLength: 500,
    },
    source: {
      type: 'string',
      maxLength: 100,
    },
    url: {
      type: 'string',
      maxLength: 2000,
    },
    publishedAt: {
      type: 'number',
      minimum: 0,
    },
    summary: {
      type: 'string',
      maxLength: 2000,
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    updatedAt: {
      type: 'number',
      minimum: 0,
    },
  },
  required: ['id', 'title', 'source', 'url', 'publishedAt', 'updatedAt'],
  indexes: ['publishedAt', 'updatedAt'],
};

/**
 * Portfolio Schema
 */
export const portfolioSchema: RxJsonSchema<{
  id: string;
  userId: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  notes?: string;
  updatedAt: number;
}> = {
  title: 'portfolio schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    userId: {
      type: 'string',
      maxLength: 100,
    },
    symbol: {
      type: 'string',
      maxLength: 20,
    },
    quantity: {
      type: 'number',
      minimum: 0,
    },
    avgPrice: {
      type: 'number',
      minimum: 0,
    },
    notes: {
      type: 'string',
      maxLength: 2000,
    },
    updatedAt: {
      type: 'number',
      minimum: 0,
    },
  },
  required: ['id', 'userId', 'symbol', 'quantity', 'avgPrice', 'updatedAt'],
  indexes: ['userId', 'symbol', 'updatedAt'],
  encrypted: ['notes'], // PII field-level encryption
};

/**
 * Notes Schema
 */
export const notesSchema: RxJsonSchema<{
  id: string;
  userId: string;
  companyId?: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}> = {
  title: 'notes schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    userId: {
      type: 'string',
      maxLength: 100,
    },
    companyId: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
      maxLength: 200,
    },
    content: {
      type: 'string',
      maxLength: 10000,
    },
    createdAt: {
      type: 'number',
      minimum: 0,
    },
    updatedAt: {
      type: 'number',
      minimum: 0,
    },
  },
  required: ['id', 'userId', 'title', 'content', 'createdAt', 'updatedAt'],
  indexes: ['userId', 'companyId', 'updatedAt'],
  encrypted: ['content'], // PII field-level encryption
};
