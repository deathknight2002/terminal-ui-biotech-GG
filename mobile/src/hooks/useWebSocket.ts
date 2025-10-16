import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Hook for managing WebSocket connections to the backend
 * Connects to the Node.js backend (port 3001) for real-time data
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = 'http://localhost:3001',
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    socket: null,
    isConnected: false,
    error: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('[WebSocket] Connected to backend');
        setState({
          socket,
          isConnected: true,
          error: null,
        });
        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));
        onDisconnect?.();
      });

      socket.on('connect_error', (error: Error) => {
        console.error('[WebSocket] Connection error:', error);
        const err = new Error(`WebSocket connection failed: ${error.message}`);
        setState((prev) => ({
          ...prev,
          error: err,
        }));
        onError?.(err);
      });

      socketRef.current = socket;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create WebSocket connection');
      setState((prev) => ({
        ...prev,
        error: err,
      }));
      onError?.(err);
    }
  }, [url, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        socket: null,
        isConnected: false,
        error: null,
      });
    }
  }, []);

  const subscribe = useCallback((streams: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { streams });
    }
  }, []);

  const unsubscribe = useCallback((streams: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', { streams });
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    emit,
    on,
    off,
  };
}
