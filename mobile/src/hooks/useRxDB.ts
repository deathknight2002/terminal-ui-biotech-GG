/**
 * useRxDB Hook
 *
 * React hook for accessing RxDB collections with automatic reactivity.
 */

import { useState, useEffect } from 'react';
import { rxdbService } from '../services/rxdb/database';
import { logger } from '../services/logger';
import { useFeatureFlag } from './useFeatureFlag';

export type CollectionName = 'companies' | 'pipelines' | 'news' | 'portfolio' | 'notes';

/**
 * Hook to query RxDB collection with automatic reactivity
 *
 * @param collectionName - Name of the collection to query
 * @param query - Optional query selector
 * @returns Array of documents from the collection
 *
 * @example
 * ```tsx
 * function CompanyList() {
 *   const companies = useRxDB('companies');
 *   return <div>{companies.map(c => <div key={c.id}>{c.name}</div>)}</div>;
 * }
 * ```
 */
export function useRxDB<T = any>(
  collectionName: CollectionName,
  query?: any
): T[] {
  const [documents, setDocuments] = useState<T[]>([]);
  const isRxDBEnabled = useFeatureFlag('storage.rxdb');

  useEffect(() => {
    if (!isRxDBEnabled) {
      return;
    }

    let subscription: any;

    const loadData = async () => {
      try {
        const db = await rxdbService.getDatabase();
        const collection = db[collectionName];

        // Build query
        let rxQuery = collection.find(query || {});

        // Subscribe to changes
        subscription = rxQuery.$.subscribe((docs: any[]) => {
          const plainDocs = docs.map((doc) => doc.toJSON());
          setDocuments(plainDocs);
        });
      } catch (error) {
        logger.error(`[useRxDB] Error loading ${collectionName}:`, error);
      }
    };

    loadData();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [collectionName, isRxDBEnabled, query]);

  return documents;
}

/**
 * Hook to insert a document into RxDB
 *
 * @param collectionName - Name of the collection
 * @returns Insert function
 */
export function useRxDBInsert(collectionName: CollectionName) {
  const isRxDBEnabled = useFeatureFlag('storage.rxdb');

  const insert = async (document: any): Promise<void> => {
    if (!isRxDBEnabled) {
      logger.warn('[useRxDBInsert] RxDB not enabled');
      return;
    }

    try {
      const db = await rxdbService.getDatabase();
      const collection = db[collectionName];
      await collection.insert(document);
      logger.info(`[useRxDBInsert] Document inserted into ${collectionName}`);
    } catch (error) {
      logger.error(`[useRxDBInsert] Error inserting into ${collectionName}:`, error);
      throw error;
    }
  };

  return insert;
}

/**
 * Hook to update a document in RxDB
 *
 * @param collectionName - Name of the collection
 * @returns Update function
 */
export function useRxDBUpdate(collectionName: CollectionName) {
  const isRxDBEnabled = useFeatureFlag('storage.rxdb');

  const update = async (id: string, updateData: any): Promise<void> => {
    if (!isRxDBEnabled) {
      logger.warn('[useRxDBUpdate] RxDB not enabled');
      return;
    }

    try {
      const db = await rxdbService.getDatabase();
      const collection = db[collectionName];
      const doc = await collection.findOne(id).exec();

      if (doc) {
        await doc.patch(updateData);
        logger.info(`[useRxDBUpdate] Document updated in ${collectionName}`);
      }
    } catch (error) {
      logger.error(`[useRxDBUpdate] Error updating in ${collectionName}:`, error);
      throw error;
    }
  };

  return update;
}

/**
 * Hook to delete a document from RxDB
 *
 * @param collectionName - Name of the collection
 * @returns Delete function
 */
export function useRxDBDelete(collectionName: CollectionName) {
  const isRxDBEnabled = useFeatureFlag('storage.rxdb');

  const remove = async (id: string): Promise<void> => {
    if (!isRxDBEnabled) {
      logger.warn('[useRxDBDelete] RxDB not enabled');
      return;
    }

    try {
      const db = await rxdbService.getDatabase();
      const collection = db[collectionName];
      const doc = await collection.findOne(id).exec();

      if (doc) {
        await doc.remove();
        logger.info(`[useRxDBDelete] Document deleted from ${collectionName}`);
      }
    } catch (error) {
      logger.error(`[useRxDBDelete] Error deleting from ${collectionName}:`, error);
      throw error;
    }
  };

  return remove;
}

/**
 * Hook to check RxDB initialization status
 */
export function useRxDBStatus() {
  const [isInitialized, setIsInitialized] = useState(false);
  const isRxDBEnabled = useFeatureFlag('storage.rxdb');

  useEffect(() => {
    if (!isRxDBEnabled) {
      setIsInitialized(false);
      return;
    }

    const checkStatus = async () => {
      try {
        await rxdbService.getDatabase();
        setIsInitialized(true);
      } catch (error) {
        logger.error('[useRxDBStatus] Error checking status:', error);
        setIsInitialized(false);
      }
    };

    checkStatus();
  }, [isRxDBEnabled]);

  return { isInitialized, isEnabled: isRxDBEnabled };
}
