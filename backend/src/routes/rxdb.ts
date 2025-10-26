/**
 * RxDB Replication API Routes
 *
 * Provides HTTP replication endpoints for RxDB.
 * Supports pull (server -> client) and push (client -> server).
 */

import { Router } from 'express';
import { logger } from '../utils/logger.js';

export const rxdbRouter = Router();

// In-memory storage for demo purposes
// In production, use PostgreSQL, MongoDB, or similar
const replicationStore: Record<string, any[]> = {
  companies: [],
  pipelines: [],
  news: [],
  portfolio: [],
  notes: [],
};

let checkpointCounter = 0;

/**
 * POST /api/rxdb/:collection/pull
 * Pull documents from server
 */
rxdbRouter.get('/:collection/pull', (req, res) => {
  try {
    const { collection } = req.params;
    const { checkpoint = '0', limit = '50' } = req.query;

    if (!replicationStore[collection]) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const checkpointNum = parseInt(checkpoint as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Get documents after checkpoint
    const documents = replicationStore[collection]
      .filter((doc) => doc._checkpoint > checkpointNum)
      .slice(0, limitNum);

    // Calculate new checkpoint
    const newCheckpoint = documents.length > 0
      ? Math.max(...documents.map((d) => d._checkpoint))
      : checkpointNum;

    res.json({
      documents: documents.map((doc) => {
        const { _checkpoint, ...rest } = doc;
        return rest;
      }),
      checkpoint: newCheckpoint,
    });
  } catch (error) {
    logger.error('[RxDB] Pull error:', error);
    res.status(500).json({ error: 'Pull failed' });
  }
});

/**
 * POST /api/rxdb/:collection/push
 * Push documents to server
 */
rxdbRouter.post('/:collection/push', (req, res) => {
  try {
    const { collection } = req.params;
    const { documents } = req.body;

    if (!replicationStore[collection]) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documents must be an array' });
    }

    // Store documents with checkpoint
    documents.forEach((doc) => {
      checkpointCounter++;

      // Find existing document
      const existingIndex = replicationStore[collection].findIndex(
        (d) => d.id === doc.id
      );

      const docWithCheckpoint = {
        ...doc,
        _checkpoint: checkpointCounter,
      };

      if (existingIndex >= 0) {
        // Update existing
        replicationStore[collection][existingIndex] = docWithCheckpoint;
      } else {
        // Insert new
        replicationStore[collection].push(docWithCheckpoint);
      }
    });

    logger.info(`[RxDB] Pushed ${documents.length} documents to ${collection}`);
    res.json({ success: true, count: documents.length });
  } catch (error) {
    logger.error('[RxDB] Push error:', error);
    res.status(500).json({ error: 'Push failed' });
  }
});

/**
 * GET /api/rxdb/:collection
 * Get all documents (for debugging)
 */
rxdbRouter.get('/:collection', (req, res) => {
  try {
    const { collection } = req.params;

    if (!replicationStore[collection]) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({
      collection,
      count: replicationStore[collection].length,
      documents: replicationStore[collection].map((doc) => {
        const { _checkpoint, ...rest } = doc;
        return rest;
      }),
    });
  } catch (error) {
    logger.error('[RxDB] Get all error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * DELETE /api/rxdb/:collection
 * Clear collection (for debugging)
 */
rxdbRouter.delete('/:collection', (req, res) => {
  try {
    const { collection } = req.params;

    if (!replicationStore[collection]) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    replicationStore[collection] = [];
    logger.info(`[RxDB] Cleared ${collection}`);

    res.json({ success: true, collection });
  } catch (error) {
    logger.error('[RxDB] Clear error:', error);
    res.status(500).json({ error: 'Failed to clear collection' });
  }
});
