/**
 * RxDB Database Service
 * 
 * Local-first database using RxDB with IndexedDB storage.
 * Provides offline-first data access with automatic replication.
 */

import { createRxDatabase, addRxPlugin, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedKeyEncryptionCryptoJsStorage } from 'rxdb/plugins/encryption-crypto-js';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import { logger } from '../logger';
import { featureFlagService } from '../featureFlagService';
import {
  companySchema,
  pipelineSchema,
  newsSchema,
  portfolioSchema,
  notesSchema,
} from './schemas';

// Add dev mode plugin in development
if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}

export type DatabaseCollections = {
  companies: RxCollection;
  pipelines: RxCollection;
  news: RxCollection;
  portfolio: RxCollection;
  notes: RxCollection;
};

export type BiotechDatabase = RxDatabase<DatabaseCollections>;

class RxDBService {
  private db: BiotechDatabase | null = null;
  private isInitialized = false;
  private encryptionPassword = 'biotech-terminal-2025'; // In production, use secure key management

  /**
   * Initialize the RxDB database
   */
  async initialize(): Promise<BiotechDatabase> {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    try {
      logger.info('[RxDB] Initializing database...');

      // Create storage with encryption
      const storage = wrappedKeyEncryptionCryptoJsStorage({
        storage: getRxStorageDexie(),
      });

      // Create database
      this.db = await createRxDatabase<DatabaseCollections>({
        name: 'biotech_terminal',
        storage,
        password: this.encryptionPassword,
        multiInstance: true,
        ignoreDuplicate: true,
      });

      logger.info('[RxDB] Database created');

      // Add collections
      await this.db.addCollections({
        companies: {
          schema: companySchema,
        },
        pipelines: {
          schema: pipelineSchema,
        },
        news: {
          schema: newsSchema,
        },
        portfolio: {
          schema: portfolioSchema,
        },
        notes: {
          schema: notesSchema,
        },
      });

      logger.info('[RxDB] Collections created');

      // Start replication if feature flag is enabled
      const isReplicationEnabled = featureFlagService.isEnabled('storage.rxdb');
      if (isReplicationEnabled) {
        await this.startReplication();
      }

      this.isInitialized = true;
      logger.info('[RxDB] Database initialized successfully');

      return this.db;
    } catch (error) {
      logger.error('[RxDB] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get the database instance
   */
  async getDatabase(): Promise<BiotechDatabase> {
    if (!this.db) {
      return this.initialize();
    }
    return this.db;
  }

  /**
   * Start replication for all collections
   */
  private async startReplication(): Promise<void> {
    if (!this.db) return;

    logger.info('[RxDB] Starting replication...');

    const collections = ['companies', 'pipelines', 'news', 'portfolio', 'notes'] as const;

    for (const collectionName of collections) {
      const collection = this.db[collectionName];
      
      // HTTP Pull/Push replication
      const replicationState = replicateRxCollection({
        collection,
        replicationIdentifier: `http-${collectionName}`,
        pull: {
          async handler(lastCheckpoint, batchSize) {
            const response = await fetch(
              `http://localhost:3001/api/rxdb/${collectionName}/pull?checkpoint=${lastCheckpoint || 0}&limit=${batchSize}`
            ).catch(() => ({ ok: false, json: async () => ({}) }));

            if (!response.ok) {
              return { documents: [], checkpoint: lastCheckpoint };
            }

            const data = await response.json();
            return {
              documents: data.documents || [],
              checkpoint: data.checkpoint,
            };
          },
          batchSize: 50,
          modifier: (doc) => doc,
        },
        push: {
          async handler(rows) {
            const documents = rows.map((row) => row.newDocumentState);
            
            const response = await fetch(`http://localhost:3001/api/rxdb/${collectionName}/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ documents }),
            }).catch(() => ({ ok: false }));

            if (!response.ok) {
              throw new Error(`Push failed for ${collectionName}`);
            }

            return rows.map(() => true);
          },
          batchSize: 50,
          modifier: (doc) => doc,
        },
      });

      // Handle replication errors with exponential backoff
      replicationState.error$.subscribe((error: any) => {
        logger.error(`[RxDB] Replication error in ${collectionName}:`, error);
        
        // Exponential backoff: retry after increasing delays
        const retryCount = error.retryCount || 0;
        setTimeout(() => {
          if (replicationState.isStopped()) {
            replicationState.reSync();
          }
        }, Math.min(60000, 1000 * Math.pow(2, retryCount)));
      });

      // Log successful replication
      replicationState.active$.subscribe((active) => {
        if (active) {
          logger.info(`[RxDB] Replication active for ${collectionName}`);
        }
      });
    }

    logger.info('[RxDB] Replication started for all collections');
  }

  /**
   * Destroy the database
   */
  async destroy(): Promise<void> {
    if (this.db) {
      await this.db.remove();
      this.db = null;
      this.isInitialized = false;
      logger.info('[RxDB] Database destroyed');
    }
  }

  /**
   * Check if database is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

export const rxdbService = new RxDBService();
