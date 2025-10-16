/**
 * Feature Flags API Routes
 * 
 * Provides endpoints for feature flag management
 */

import { Router } from 'express';
import { featureFlagService } from '../services/feature-flag-service.js';
import { logger } from '../utils/logger.js';

export const featureFlagsRouter = Router();

/**
 * GET /api/feature-flags
 * Get all feature flags
 */
featureFlagsRouter.get('/', (req, res) => {
  try {
    const flags = featureFlagService.getAllFlags();
    const lastUpdate = featureFlagService.getLastUpdate();

    res.json({
      flags,
      lastUpdate: lastUpdate.toISOString(),
      count: flags.length,
    });
  } catch (error) {
    logger.error('[FeatureFlags] Error fetching flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

/**
 * GET /api/feature-flags/:name
 * Get a specific feature flag
 */
featureFlagsRouter.get('/:name', (req, res) => {
  try {
    const { name } = req.params;
    const flag = featureFlagService.getFlag(name as any);

    if (!flag) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }

    res.json(flag);
  } catch (error) {
    logger.error('[FeatureFlags] Error fetching flag:', error);
    res.status(500).json({ error: 'Failed to fetch feature flag' });
  }
});

/**
 * GET /api/feature-flags/:name/enabled
 * Check if a feature flag is enabled
 */
featureFlagsRouter.get('/:name/enabled', (req, res) => {
  try {
    const { name } = req.params;
    const enabled = featureFlagService.isEnabled(name as any);

    res.json({ name, enabled });
  } catch (error) {
    logger.error('[FeatureFlags] Error checking flag:', error);
    res.status(500).json({ error: 'Failed to check feature flag' });
  }
});

/**
 * PUT /api/feature-flags/:name
 * Update a feature flag
 * Note: In production, this should be protected with authentication
 */
featureFlagsRouter.put('/:name', (req, res) => {
  try {
    const { name } = req.params;
    const { enabled, variant } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    featureFlagService.updateFlag(name as any, enabled, variant);

    const flag = featureFlagService.getFlag(name as any);
    res.json(flag);
  } catch (error) {
    logger.error('[FeatureFlags] Error updating flag:', error);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
});

/**
 * POST /api/feature-flags/client
 * Unleash proxy-compatible endpoint for client SDKs
 */
featureFlagsRouter.post('/client', (req, res) => {
  try {
    const flags = featureFlagService.getAllFlags();
    
    // Convert to Unleash proxy format
    const toggles = flags.map((flag) => ({
      name: flag.name,
      enabled: flag.enabled,
      variant: flag.variant ? {
        name: flag.variant,
        enabled: true,
      } : {
        name: 'disabled',
        enabled: false,
      },
    }));

    res.json({ toggles });
  } catch (error) {
    logger.error('[FeatureFlags] Error in proxy endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});
