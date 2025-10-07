/**
 * React Hook for Live Monitoring
 * Connects to monitoring WebSocket and provides real-time updates
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface MonitoringAlert {
  id: string;
  company?: string;
  symbol?: string;
  title: string;
  description: string;
  url: string;
  timestamp: Date;
  severity: 'high' | 'medium' | 'low';
  type: 'fda' | 'clinical-trial' | 'press-release' | 'news' | 'change';
}

export interface MonitoringStats {
  changeDetection?: {
    totalMonitored: number;
    activeMonitors: number;
    totalChecks: number;
    totalChanges: number;
  };
  portfolio?: {
    totalCompanies: number;
    monitoredCompanies: number;
    totalAlerts: number;
    highSeverityAlerts: number;
  };
  news?: {
    totalAlerts: number;
    alertsBySource: Record<string, number>;
    lastAlert?: Date;
  };
}

export interface UseMonitoringOptions {
  url?: string;
  autoConnect?: boolean;
  channels?: string[];
}

export interface UseMonitoringReturn {
  alerts: MonitoringAlert[];
  stats: MonitoringStats | null;
  isConnected: boolean;
  error: Error | null;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  clearAlerts: () => void;
  refreshStats: () => void;
}

/**
 * Hook for live monitoring with WebSocket connection
 */
export function useMonitoring(options: UseMonitoringOptions = {}): UseMonitoringReturn {
  const {
    url = 'http://localhost:3001',
    autoConnect = true,
    channels = ['changes', 'alerts', 'news', 'portfolio'],
  } = options;

  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!autoConnect) return;

    try {
      const socket = io(url, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      // Connection handlers
      socket.on('connect', () => {
        console.log('📡 Connected to monitoring service');
        setIsConnected(true);
        setError(null);
        
        // Subscribe to channels on connect
        socket.emit('monitoring:subscribe', { channels });
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from monitoring service');
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Connection error:', err);
        setError(err);
        setIsConnected(false);
      });

      // Monitoring event handlers
      socket.on('alert:created', (event: any) => {
        const alert: MonitoringAlert = {
          id: event.data.id,
          company: event.data.company,
          symbol: event.data.symbol,
          title: event.data.title,
          description: event.data.description,
          url: event.data.url,
          timestamp: new Date(event.data.timestamp),
          severity: event.data.severity,
          type: event.data.type,
        };
        
        setAlerts(prev => [alert, ...prev].slice(0, 100)); // Keep last 100
      });

      socket.on('news:alert', (event: any) => {
        const alert: MonitoringAlert = {
          id: event.data.id,
          title: event.data.article.title,
          description: event.data.article.summary,
          url: event.data.article.url,
          timestamp: new Date(event.data.timestamp),
          severity: event.data.article.importance,
          type: 'news',
        };
        
        setAlerts(prev => [alert, ...prev].slice(0, 100));
      });

      socket.on('change:detected', (event: any) => {
        const alert: MonitoringAlert = {
          id: event.data.id,
          title: `Change detected: ${event.data.name}`,
          description: `Content changed at ${event.data.url}`,
          url: event.data.url,
          timestamp: new Date(event.data.timestamp),
          severity: 'medium',
          type: 'change',
        };
        
        setAlerts(prev => [alert, ...prev].slice(0, 100));
      });

      socket.on('monitoring:stats', (event: any) => {
        setStats(event.data);
      });

      socket.on('monitoring:subscribed', (event: any) => {
        console.log('✅ Subscribed to channels:', event.channels);
      });

      socket.on('monitoring:error', (event: any) => {
        console.error('❌ Monitoring error:', event.message);
        setError(new Error(event.message));
      });

      // Request initial stats
      socket.emit('monitoring:get-stats');

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.error('Failed to initialize monitoring:', err);
      setError(err as Error);
    }
  }, [url, autoConnect]);

  // Subscribe to channels
  const subscribe = useCallback((newChannels: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('monitoring:subscribe', { channels: newChannels });
    }
  }, []);

  // Unsubscribe from channels
  const unsubscribe = useCallback((oldChannels: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('monitoring:unsubscribe', { channels: oldChannels });
    }
  }, []);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Refresh stats
  const refreshStats = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('monitoring:get-stats');
    }
  }, []);

  return {
    alerts,
    stats,
    isConnected,
    error,
    subscribe,
    unsubscribe,
    clearAlerts,
    refreshStats,
  };
}

/**
 * Hook for fetching monitoring data via REST API (without WebSocket)
 */
export function useMonitoringRest(apiUrl: string = 'http://localhost:3001/api/monitoring') {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async (limit: number = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const [portfolioRes, newsRes] = await Promise.all([
        fetch(`${apiUrl}/portfolio/alerts?limit=${limit}`),
        fetch(`${apiUrl}/news/alerts?limit=${limit}`),
      ]);

      const portfolioData = await portfolioRes.json();
      const newsData = await newsRes.json();

      const combined: MonitoringAlert[] = [
        ...(portfolioData.alerts || []).map((a: any) => ({
          id: a.id,
          company: a.company,
          symbol: a.symbol,
          title: a.title,
          description: a.description,
          url: a.url,
          timestamp: new Date(a.timestamp),
          severity: a.severity,
          type: a.type,
        })),
        ...(newsData.alerts || []).map((a: any) => ({
          id: a.id,
          title: a.article.title,
          description: a.article.summary,
          url: a.article.url,
          timestamp: new Date(a.timestamp),
          severity: a.article.importance,
          type: 'news' as const,
        })),
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setAlerts(combined);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${apiUrl}/stats`);
      const data = await res.json();
      
      if (data.success) {
        setStats({
          changeDetection: data.stats,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAlerts();
    fetchStats();
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchAlerts();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAlerts, fetchStats]);

  return {
    alerts,
    stats,
    loading,
    error,
    refetch: () => {
      fetchAlerts();
      fetchStats();
    },
  };
}
