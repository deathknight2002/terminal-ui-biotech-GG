import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger.js';

interface DriftAlert {
  type: 'prediction_drift' | 'feature_drift' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric_name: string;
  current_value: number;
  threshold: number;
  timestamp: number;
  model_name?: string;
  details?: Record<string, any>;
}

interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  avg_confidence: number;
  prediction_count: number;
  timestamp: number;
}

/**
 * Setup WebSocket handlers for ML drift alerts
 */
export function setupDriftAlertsWebSocket(io: SocketServer): void {
  logger.info('🔔 Setting up Drift Alerts WebSocket handlers');

  io.on('connection', (socket) => {
    // Subscribe to drift alerts
    socket.on('subscribe:drift_alerts', (data: { model_names?: string[] }) => {
      const { model_names } = data;

      if (model_names && model_names.length > 0) {
        model_names.forEach(model => {
          const room = `drift:${model}`;
          socket.join(room);
          logger.info(`Client ${socket.id} subscribed to drift alerts for model: ${model}`);
        });
      } else {
        // Subscribe to all drift alerts
        socket.join('drift:all');
        logger.info(`Client ${socket.id} subscribed to all drift alerts`);
      }

      socket.emit('drift_subscription_confirmed', {
        success: true,
        model_names: model_names || ['all']
      });
    });

    // Unsubscribe from drift alerts
    socket.on('unsubscribe:drift_alerts', (data: { model_names?: string[] }) => {
      const { model_names } = data;

      if (model_names && model_names.length > 0) {
        model_names.forEach(model => {
          const room = `drift:${model}`;
          socket.leave(room);
          logger.info(`Client ${socket.id} unsubscribed from drift alerts for model: ${model}`);
        });
      } else {
        socket.leave('drift:all');
        logger.info(`Client ${socket.id} unsubscribed from all drift alerts`);
      }

      socket.emit('drift_unsubscription_confirmed', {
        success: true,
        model_names: model_names || ['all']
      });
    });

    // Subscribe to model metrics
    socket.on('subscribe:model_metrics', (data: { model_names: string[] }) => {
      const { model_names } = data;

      model_names.forEach(model => {
        const room = `metrics:${model}`;
        socket.join(room);
        logger.info(`Client ${socket.id} subscribed to metrics for model: ${model}`);
      });

      socket.emit('metrics_subscription_confirmed', {
        success: true,
        model_names
      });
    });

    // Request current drift status
    socket.on('get_drift_status', (data: { model_name: string }, callback) => {
      // This would typically fetch from a cache or database
      // For now, return a placeholder response
      const status = {
        model_name: data.model_name,
        drift_detected: false,
        last_check: Date.now(),
        status: 'healthy'
      };

      if (callback) {
        callback(status);
      } else {
        socket.emit('drift_status_response', status);
      }
    });
  });

  logger.info('✅ Drift Alerts WebSocket handlers configured');
}

/**
 * Broadcast a drift alert to subscribed clients
 */
export function broadcastDriftAlert(
  io: SocketServer,
  alert: DriftAlert
): void {
  const { model_name, severity, type } = alert;

  // Broadcast to specific model subscribers
  if (model_name) {
    const room = `drift:${model_name}`;
    io.to(room).emit('drift_alert', alert);
    logger.info(`📢 Drift alert broadcast to ${room}: ${type} (${severity})`);
  }

  // Broadcast to all subscribers
  io.to('drift:all').emit('drift_alert', alert);

  // Also send as system alert if critical
  if (severity === 'critical') {
    io.emit('system_alert', {
      alert: {
        type: 'ml_drift',
        message: alert.message,
        severity: 'critical',
        model_name: alert.model_name
      },
      timestamp: Date.now()
    });
  }
}

/**
 * Broadcast model performance metrics
 */
export function broadcastModelMetrics(
  io: SocketServer,
  metrics: ModelMetrics
): void {
  const { model_name } = metrics;
  const room = `metrics:${model_name}`;

  io.to(room).emit('model_metrics', metrics);
  logger.debug(`📊 Model metrics broadcast for ${model_name}`);
}

/**
 * Broadcast batch of drift alerts
 */
export function broadcastDriftAlertsBatch(
  io: SocketServer,
  alerts: DriftAlert[]
): void {
  if (alerts.length === 0) return;

  // Group alerts by model
  const alertsByModel = new Map<string, DriftAlert[]>();

  alerts.forEach(alert => {
    if (alert.model_name) {
      const existing = alertsByModel.get(alert.model_name) || [];
      existing.push(alert);
      alertsByModel.set(alert.model_name, existing);
    }
  });

  // Broadcast to specific models
  for (const [model_name, modelAlerts] of alertsByModel.entries()) {
    const room = `drift:${model_name}`;
    io.to(room).emit('drift_alerts_batch', {
      model_name,
      alerts: modelAlerts,
      count: modelAlerts.length,
      timestamp: Date.now()
    });
  }

  // Broadcast all to general subscribers
  io.to('drift:all').emit('drift_alerts_batch', {
    alerts,
    count: alerts.length,
    timestamp: Date.now()
  });

  logger.info(`📢 Broadcast batch of ${alerts.length} drift alerts`);
}

/**
 * Notify about model retraining completion
 */
export function broadcastRetrainingComplete(
  io: SocketServer,
  data: {
    model_name: string;
    old_version: string;
    new_version: string;
    metrics: {
      old_accuracy: number;
      new_accuracy: number;
      improvement: number;
    };
    deployed: boolean;
  }
): void {
  const { model_name } = data;
  const room = `drift:${model_name}`;

  io.to(room).emit('retraining_complete', {
    ...data,
    timestamp: Date.now()
  });

  io.to('drift:all').emit('retraining_complete', {
    ...data,
    timestamp: Date.now()
  });

  logger.info(
    `🔄 Retraining complete notification sent for ${model_name} ` +
    `(${data.metrics.improvement > 0 ? '+' : ''}${data.metrics.improvement}% accuracy)`
  );
}

/**
 * Get drift alert statistics
 */
export function getDriftAlertStats(io: SocketServer): {
  active_subscriptions: number;
  models_monitored: Set<string>;
} {
  const stats = {
    active_subscriptions: 0,
    models_monitored: new Set<string>()
  };

  // Count subscriptions
  const adapter = io.of('/').adapter;
  const rooms = adapter.rooms;

  for (const [room, sockets] of rooms.entries()) {
    if (room.startsWith('drift:')) {
      stats.active_subscriptions += sockets.size;

      const modelName = room.replace('drift:', '');
      if (modelName !== 'all') {
        stats.models_monitored.add(modelName);
      }
    }
  }

  return stats;
}

// Export types for use in other modules
export type { DriftAlert, ModelMetrics };
