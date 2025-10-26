/**
 * Migration Service
 *
 * Migrates data from offlineStorage (IndexedDB) to RxDB.
 * Guarded by the storage.rxdb feature flag.
 */

import { rxdbService } from './database';
import { offlineStorage, STORES } from '../offlineStorage';
import { logger } from '../logger';
import { featureFlagService } from '../featureFlagService';

const MIGRATION_FLAG_KEY = 'rxdb_migration_completed';

class MigrationService {
  private isMigrating = false;

  /**
   * Check if migration is needed
   */
  async needsMigration(): Promise<boolean> {
    // Check if feature flag is enabled
    const isRxDBEnabled = featureFlagService.isEnabled('storage.rxdb');
    if (!isRxDBEnabled) {
      return false;
    }

    // Check if migration was already completed
    const migrationCompleted = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (migrationCompleted === 'true') {
      return false;
    }

    return true;
  }

  /**
   * Migrate data from offlineStorage to RxDB
   */
  async migrate(): Promise<void> {
    if (this.isMigrating) {
      logger.warn('[Migration] Migration already in progress');
      return;
    }

    const shouldMigrate = await this.needsMigration();
    if (!shouldMigrate) {
      logger.info('[Migration] Migration not needed');
      return;
    }

    this.isMigrating = true;
    logger.info('[Migration] Starting migration from offlineStorage to RxDB...');

    try {
      // Initialize RxDB
      const db = await rxdbService.initialize();

      // Migrate companies
      await this.migrateCollection(
        STORES.COMPANIES,
        db.companies,
        (data: any) => {
          if (!Array.isArray(data)) return [];
          return data.map((company: any, index: number) => ({
            id: company.id || `company-${index}`,
            symbol: company.symbol || '',
            name: company.name || '',
            sector: company.sector || 'Unknown',
            marketCap: company.marketCap,
            description: company.description,
            updatedAt: Date.now(),
          }));
        }
      );

      // Migrate pipeline
      await this.migrateCollection(
        STORES.PIPELINE,
        db.pipelines,
        (data: any) => {
          if (!Array.isArray(data)) return [];
          return data.map((item: any, index: number) => ({
            id: item.id || `pipeline-${index}`,
            companyId: item.companyId || item.company_id || '',
            drugName: item.drugName || item.drug_name || '',
            phase: item.phase || 'Unknown',
            indication: item.indication || '',
            updatedAt: Date.now(),
          }));
        }
      );

      // Migrate news
      await this.migrateCollection(
        STORES.NEWS,
        db.news,
        (data: any) => {
          if (!Array.isArray(data)) return [];
          return data.map((item: any, index: number) => ({
            id: item.id || `news-${index}`,
            title: item.title || '',
            source: item.source || 'Unknown',
            url: item.url || '',
            publishedAt: item.publishedAt || item.published_at || Date.now(),
            summary: item.summary,
            tags: item.tags || [],
            updatedAt: Date.now(),
          }));
        }
      );

      // Migrate portfolio
      await this.migrateCollection(
        STORES.PORTFOLIO,
        db.portfolio,
        (data: any) => {
          if (!data || typeof data !== 'object') return [];

          // Portfolio might be stored as a single object or array
          const items = Array.isArray(data) ? data : [data];

          return items.map((item: any, index: number) => ({
            id: item.id || `portfolio-${index}`,
            userId: item.userId || item.user_id || 'default-user',
            symbol: item.symbol || '',
            quantity: item.quantity || 0,
            avgPrice: item.avgPrice || item.avg_price || 0,
            notes: item.notes,
            updatedAt: Date.now(),
          }));
        }
      );

      // Mark migration as completed
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

      logger.info('[Migration] Migration completed successfully');
    } catch (error) {
      logger.error('[Migration] Migration failed:', error);
      throw error;
    } finally {
      this.isMigrating = false;
    }
  }

  /**
   * Migrate a single collection
   */
  private async migrateCollection(
    storeName: string,
    collection: any,
    transformer: (data: any) => any[]
  ): Promise<void> {
    try {
      logger.info(`[Migration] Migrating ${storeName}...`);

      // Get data from old storage
      const oldData = await offlineStorage.get(storeName, 'all');

      if (!oldData) {
        logger.info(`[Migration] No data found in ${storeName}`);
        return;
      }

      // Transform data to match RxDB schema
      const documents = transformer(oldData);

      if (documents.length === 0) {
        logger.info(`[Migration] No documents to migrate in ${storeName}`);
        return;
      }

      // Bulk insert into RxDB
      await collection.bulkInsert(documents);

      logger.info(`[Migration] Migrated ${documents.length} documents from ${storeName}`);
    } catch (error) {
      // Log error but don't fail the entire migration
      logger.error(`[Migration] Error migrating ${storeName}:`, error);
    }
  }

  /**
   * Reset migration status (for testing/debugging)
   */
  resetMigration(): void {
    localStorage.removeItem(MIGRATION_FLAG_KEY);
    logger.info('[Migration] Migration status reset');
  }
}

export const migrationService = new MigrationService();
