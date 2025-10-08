import { useState, useCallback } from 'react';
import type { CatalystAlert } from '../biotech/organisms/CatalystGlassAlert';

/**
 * useGlassAlerts - Hook for managing catalyst glass alerts
 * 
 * Provides methods to add, dismiss, and manage priority-based alerts
 * with automatic cleanup and queueing.
 * 
 * @example
 * ```tsx
 * const { alerts, addAlert, dismissAlert, clearAll } = useGlassAlerts();
 * 
 * addAlert({
 *   title: 'FDA Decision',
 *   message: 'PDUFA date approaching',
 *   priority: 'critical',
 *   type: 'fda',
 *   ticker: 'XYZ'
 * });
 * ```
 */
export function useGlassAlerts(maxAlerts: number = 5) {
  const [alerts, setAlerts] = useState<CatalystAlert[]>([]);

  /**
   * Add a new alert to the queue
   */
  const addAlert = useCallback((
    alert: Omit<CatalystAlert, 'id' | 'timestamp'>
  ) => {
    const newAlert: CatalystAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setAlerts((prev) => {
      // Remove oldest alert if at max capacity
      const updated = prev.length >= maxAlerts ? prev.slice(1) : prev;
      
      // Add new alert, prioritizing by urgency
      return [...updated, newAlert].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });

    return newAlert.id;
  }, [maxAlerts]);

  /**
   * Dismiss a specific alert by ID
   */
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  /**
   * Clear all alerts
   */
  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  /**
   * Get alerts by priority
   */
  const getAlertsByPriority = useCallback((priority: CatalystAlert['priority']) => {
    return alerts.filter((alert) => alert.priority === priority);
  }, [alerts]);

  /**
   * Get alerts by type
   */
  const getAlertsByType = useCallback((type: CatalystAlert['type']) => {
    return alerts.filter((alert) => alert.type === type);
  }, [alerts]);

  return {
    alerts,
    addAlert,
    dismissAlert,
    clearAll,
    getAlertsByPriority,
    getAlertsByType,
    totalAlerts: alerts.length,
  };
}

export type UseGlassAlertsReturn = ReturnType<typeof useGlassAlerts>;
