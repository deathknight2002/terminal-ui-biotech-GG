import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

// Store for device tokens (in production, use a database)
const deviceTokens = new Map<string, {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
  subscriptions: {
    fdaAlerts?: string[];
    priceAlerts?: { symbols: string[]; threshold: number };
  };
  registeredAt: Date;
}>();

/**
 * Register device token for push notifications
 */
router.post('/register', async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body;

    if (!token || !platform || !deviceId) {
      return res.status(400).json({
        error: 'Missing required fields: token, platform, deviceId',
      });
    }

    // Store device token
    deviceTokens.set(deviceId, {
      token,
      platform,
      deviceId,
      subscriptions: {},
      registeredAt: new Date(),
    });

    logger.info(`[Notifications] Device registered: ${deviceId} (${platform})`);

    res.json({
      success: true,
      message: 'Device token registered successfully',
    });
  } catch (error) {
    logger.error('[Notifications] Registration error:', error);
    res.status(500).json({
      error: 'Failed to register device token',
    });
  }
});

/**
 * Subscribe to FDA alerts for specific symbols
 */
router.post('/subscribe/fda', async (req, res) => {
  try {
    const { token, symbols } = req.body;

    if (!token || !symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        error: 'Missing required fields: token, symbols (array)',
      });
    }

    // Find device by token
    const device = Array.from(deviceTokens.values()).find((d) => d.token === token);

    if (!device) {
      return res.status(404).json({
        error: 'Device token not found. Please register first.',
      });
    }

    // Update subscriptions
    device.subscriptions.fdaAlerts = symbols;

    logger.info(`[Notifications] FDA alerts subscribed: ${device.deviceId} -> ${symbols.join(', ')}`);

    res.json({
      success: true,
      message: `Subscribed to FDA alerts for ${symbols.length} symbols`,
      symbols,
    });
  } catch (error) {
    logger.error('[Notifications] FDA subscription error:', error);
    res.status(500).json({
      error: 'Failed to subscribe to FDA alerts',
    });
  }
});

/**
 * Subscribe to price change alerts for specific symbols
 */
router.post('/subscribe/price', async (req, res) => {
  try {
    const { token, symbols, threshold = 5 } = req.body;

    if (!token || !symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        error: 'Missing required fields: token, symbols (array)',
      });
    }

    // Find device by token
    const device = Array.from(deviceTokens.values()).find((d) => d.token === token);

    if (!device) {
      return res.status(404).json({
        error: 'Device token not found. Please register first.',
      });
    }

    // Update subscriptions
    device.subscriptions.priceAlerts = {
      symbols,
      threshold,
    };

    logger.info(`[Notifications] Price alerts subscribed: ${device.deviceId} -> ${symbols.join(', ')} (${threshold}%)`);

    res.json({
      success: true,
      message: `Subscribed to price alerts for ${symbols.length} symbols`,
      symbols,
      threshold,
    });
  } catch (error) {
    logger.error('[Notifications] Price subscription error:', error);
    res.status(500).json({
      error: 'Failed to subscribe to price alerts',
    });
  }
});

/**
 * Unsubscribe from notifications
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { token, type } = req.body;

    if (!token || !type) {
      return res.status(400).json({
        error: 'Missing required fields: token, type',
      });
    }

    // Find device by token
    const device = Array.from(deviceTokens.values()).find((d) => d.token === token);

    if (!device) {
      return res.status(404).json({
        error: 'Device token not found',
      });
    }

    // Remove specific subscription
    if (type === 'fda') {
      delete device.subscriptions.fdaAlerts;
    } else if (type === 'price') {
      delete device.subscriptions.priceAlerts;
    }

    logger.info(`[Notifications] Unsubscribed: ${device.deviceId} from ${type}`);

    res.json({
      success: true,
      message: `Unsubscribed from ${type} alerts`,
    });
  } catch (error) {
    logger.error('[Notifications] Unsubscribe error:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe',
    });
  }
});

/**
 * Get active subscriptions
 */
router.get('/subscriptions/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = deviceTokens.get(deviceId);

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
      });
    }

    res.json({
      deviceId,
      subscriptions: device.subscriptions,
    });
  } catch (error) {
    logger.error('[Notifications] Get subscriptions error:', error);
    res.status(500).json({
      error: 'Failed to get subscriptions',
    });
  }
});

/**
 * Send test notification
 */
router.post('/test', async (req, res) => {
  try {
    const { deviceId, message } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        error: 'Missing deviceId',
      });
    }

    const device = deviceTokens.get(deviceId);

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
      });
    }

    logger.info(`[Notifications] Test notification sent to: ${deviceId}`);

    // In production, this would send actual push notification via APNs/FCM
    res.json({
      success: true,
      message: 'Test notification sent',
      note: 'In production, this would send via APNs/FCM',
    });
  } catch (error) {
    logger.error('[Notifications] Test notification error:', error);
    res.status(500).json({
      error: 'Failed to send test notification',
    });
  }
});

export { router as notificationRouter };
