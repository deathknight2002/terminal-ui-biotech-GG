/**
 * Offline Storage Service using IndexedDB
 * Provides local data caching for offline functionality
 */

const DB_NAME = 'biotech-mobile-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  CACHED_DATA: 'cached-data',
  OFFLINE_ACTIONS: 'offline-actions',
  COMPANIES: 'companies',
  PIPELINE: 'pipeline',
  NEWS: 'news',
  PORTFOLIO: 'portfolio',
};

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineStorage] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('[OfflineStorage] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('[OfflineStorage] Upgrading database...');

        // Create object stores
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            if (storeName === STORES.OFFLINE_ACTIONS) {
              db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            } else {
              db.createObjectStore(storeName, { keyPath: 'key' });
            }
            console.log('[OfflineStorage] Created store:', storeName);
          }
        });
      };
    });
  }

  /**
   * Get data from a store
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  }

  /**
   * Set data in a store
   */
  async set<T>(storeName: string, key: string, data: T): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all data from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map((item: any) => item.data);
        resolve(results);
      };
    });
  }

  /**
   * Delete data from a store
   */
  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Cache companies data
   */
  async cacheCompanies(companies: any[]): Promise<void> {
    await this.set(STORES.COMPANIES, 'all', companies);
  }

  /**
   * Get cached companies
   */
  async getCachedCompanies(): Promise<any[] | null> {
    return this.get(STORES.COMPANIES, 'all');
  }

  /**
   * Cache pipeline data
   */
  async cachePipeline(pipeline: any[]): Promise<void> {
    await this.set(STORES.PIPELINE, 'all', pipeline);
  }

  /**
   * Get cached pipeline
   */
  async getCachedPipeline(): Promise<any[] | null> {
    return this.get(STORES.PIPELINE, 'all');
  }

  /**
   * Cache news data
   */
  async cacheNews(news: any[]): Promise<void> {
    await this.set(STORES.NEWS, 'all', news);
  }

  /**
   * Get cached news
   */
  async getCachedNews(): Promise<any[] | null> {
    return this.get(STORES.NEWS, 'all');
  }

  /**
   * Cache portfolio data
   */
  async cachePortfolio(portfolio: any): Promise<void> {
    await this.set(STORES.PORTFOLIO, 'data', portfolio);
  }

  /**
   * Get cached portfolio
   */
  async getCachedPortfolio(): Promise<any | null> {
    return this.get(STORES.PORTFOLIO, 'data');
  }

  /**
   * Add an offline action to be synced later
   */
  async addOfflineAction(action: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.OFFLINE_ACTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const request = store.add({
        ...action,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[OfflineStorage] Added offline action');
        resolve();
      };
    });
  }

  /**
   * Check if data is stale (older than 5 minutes)
   */
  async isStale(storeName: string, key: string, maxAge: number = 5 * 60 * 1000): Promise<boolean> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(true); // No data means it's stale
          return;
        }

        const age = Date.now() - result.timestamp;
        resolve(age > maxAge);
      };
    });
  }
}

export const offlineStorage = new OfflineStorageService();
export { STORES };
