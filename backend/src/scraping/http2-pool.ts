/**
 * HTTP/2 Connection Pool
 * Persistent HTTP/2 connections with reduced handshake overhead
 */

import http2, { ClientHttp2Session, ClientHttp2Stream } from 'http2';
import { URL } from 'url';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

export interface ConnectionPoolConfig {
  maxConnections?: number;
  maxConnectionsPerOrigin?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  requestTimeout?: number;
  retryOnTimeout?: boolean;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Buffer;
  timeout?: number;
}

export interface PoolConnection {
  session: ClientHttp2Session;
  origin: string;
  created: number;
  lastUsed: number;
  activeRequests: number;
}

/**
 * HTTP/2 Connection Pool Manager
 */
export class HTTP2ConnectionPool extends EventEmitter {
  private connections: Map<string, PoolConnection[]> = new Map();
  private readonly maxConnections: number;
  private readonly maxConnectionsPerOrigin: number;
  private readonly connectionTimeout: number;
  private readonly idleTimeout: number;
  private readonly requestTimeout: number;
  private readonly retryOnTimeout: boolean;
  
  private cleanupInterval?: NodeJS.Timeout;
  private totalConnections: number = 0;
  private totalRequests: number = 0;
  private failedRequests: number = 0;

  constructor(config: ConnectionPoolConfig = {}) {
    super();
    
    this.maxConnections = config.maxConnections || 100;
    this.maxConnectionsPerOrigin = config.maxConnectionsPerOrigin || 10;
    this.connectionTimeout = config.connectionTimeout || 30000;
    this.idleTimeout = config.idleTimeout || 60000;
    this.requestTimeout = config.requestTimeout || 30000;
    this.retryOnTimeout = config.retryOnTimeout ?? true;

    this.startCleanup();
    
    logger.info('🔗 HTTP/2 Connection Pool initialized');
  }

  /**
   * Execute an HTTP/2 request
   */
  async request(url: string, options: RequestOptions = {}): Promise<{
    statusCode: number;
    headers: Record<string, string | string[]>;
    data: Buffer;
  }> {
    const urlObj = new URL(url);
    const origin = `${urlObj.protocol}//${urlObj.host}`;
    
    this.totalRequests++;

    try {
      const connection = await this.getConnection(origin);
      const result = await this.executeRequest(connection, url, options);
      
      this.releaseConnection(connection);
      
      return result;
    } catch (error) {
      this.failedRequests++;
      logger.error(`HTTP/2 request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get or create a connection for an origin
   */
  private async getConnection(origin: string): Promise<PoolConnection> {
    const existingConnections = this.connections.get(origin) || [];

    // Find an available connection
    for (const conn of existingConnections) {
      if (!conn.session.closed && conn.activeRequests < 100) { // HTTP/2 allows multiple concurrent streams
        conn.lastUsed = Date.now();
        conn.activeRequests++;
        return conn;
      }
    }

    // Check if we can create a new connection
    if (existingConnections.length >= this.maxConnectionsPerOrigin) {
      // Wait for an available connection
      await this.waitForConnection(origin);
      return this.getConnection(origin);
    }

    if (this.totalConnections >= this.maxConnections) {
      // Wait for any connection to become available
      await this.waitForConnection();
      return this.getConnection(origin);
    }

    // Create a new connection
    return this.createConnection(origin);
  }

  /**
   * Create a new HTTP/2 connection
   */
  private async createConnection(origin: string): Promise<PoolConnection> {
    return new Promise((resolve, reject) => {
      const session = http2.connect(origin, {
        timeout: this.connectionTimeout,
      });

      const timeoutId = setTimeout(() => {
        session.close();
        reject(new Error('Connection timeout'));
      }, this.connectionTimeout);

      session.on('connect', () => {
        clearTimeout(timeoutId);
        
        const connection: PoolConnection = {
          session,
          origin,
          created: Date.now(),
          lastUsed: Date.now(),
          activeRequests: 1,
        };

        const originConnections = this.connections.get(origin) || [];
        originConnections.push(connection);
        this.connections.set(origin, originConnections);
        
        this.totalConnections++;
        
        logger.debug(`HTTP/2 connection created for ${origin}`);
        this.emit('connection:created', { origin });
        
        resolve(connection);
      });

      session.on('error', (error) => {
        clearTimeout(timeoutId);
        logger.error(`HTTP/2 connection error for ${origin}:`, error);
        reject(error);
      });

      session.on('close', () => {
        this.removeConnection(origin, session);
      });
    });
  }

  /**
   * Execute a request on an HTTP/2 connection
   */
  private async executeRequest(
    connection: PoolConnection,
    url: string,
    options: RequestOptions
  ): Promise<{
    statusCode: number;
    headers: Record<string, string | string[]>;
    data: Buffer;
  }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;

      const headers: Record<string, string> = {
        ':method': options.method || 'GET',
        ':path': path,
        ':scheme': urlObj.protocol.replace(':', ''),
        ':authority': urlObj.host,
        ...options.headers,
      };

      const stream = connection.session.request(headers);
      const chunks: Buffer[] = [];

      const timeout = setTimeout(() => {
        stream.close();
        reject(new Error('Request timeout'));
      }, options.timeout || this.requestTimeout);

      stream.on('response', (headers) => {
        const statusCode = headers[':status'] 
          ? parseInt(String(headers[':status']), 10)
          : 500;
        
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          clearTimeout(timeout);
          
          resolve({
            statusCode,
            headers: headers as Record<string, string | string[]>,
            data: Buffer.concat(chunks),
          });
        });
      });

      stream.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Send request body if present
      if (options.body) {
        stream.write(options.body);
      }
      
      stream.end();
    });
  }

  /**
   * Release a connection back to the pool
   */
  private releaseConnection(connection: PoolConnection): void {
    connection.activeRequests = Math.max(0, connection.activeRequests - 1);
    connection.lastUsed = Date.now();
    
    this.emit('connection:released', { origin: connection.origin });
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(origin?: string): Promise<void> {
    return new Promise((resolve) => {
      const handler = (data: { origin: string }) => {
        if (!origin || data.origin === origin) {
          this.removeListener('connection:released', handler);
          resolve();
        }
      };

      this.on('connection:released', handler);

      // Timeout after 10 seconds
      setTimeout(() => {
        this.removeListener('connection:released', handler);
        resolve();
      }, 10000);
    });
  }

  /**
   * Remove a connection from the pool
   */
  private removeConnection(origin: string, session: ClientHttp2Session): void {
    const connections = this.connections.get(origin);
    if (!connections) return;

    const index = connections.findIndex(c => c.session === session);
    if (index !== -1) {
      connections.splice(index, 1);
      this.totalConnections--;
      
      if (connections.length === 0) {
        this.connections.delete(origin);
      } else {
        this.connections.set(origin, connections);
      }
      
      logger.debug(`HTTP/2 connection removed for ${origin}`);
      this.emit('connection:removed', { origin });
    }
  }

  /**
   * Start periodic cleanup of idle connections
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000); // Run every 30 seconds
  }

  /**
   * Clean up idle connections
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [origin, connections] of this.connections.entries()) {
      const activeConnections = connections.filter(conn => {
        const isIdle = now - conn.lastUsed > this.idleTimeout;
        const hasNoRequests = conn.activeRequests === 0;

        if (isIdle && hasNoRequests) {
          conn.session.close();
          this.totalConnections--;
          removedCount++;
          return false;
        }

        return true;
      });

      if (activeConnections.length === 0) {
        this.connections.delete(origin);
      } else {
        this.connections.set(origin, activeConnections);
      }
    }

    if (removedCount > 0) {
      logger.debug(`HTTP/2 cleanup: removed ${removedCount} idle connections`);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const connectionsByOrigin: Record<string, number> = {};
    let activeRequestCount = 0;

    for (const [origin, connections] of this.connections.entries()) {
      connectionsByOrigin[origin] = connections.length;
      activeRequestCount += connections.reduce((sum, conn) => sum + conn.activeRequests, 0);
    }

    return {
      totalConnections: this.totalConnections,
      totalOrigins: this.connections.size,
      connectionsByOrigin,
      activeRequests: activeRequestCount,
      totalRequests: this.totalRequests,
      failedRequests: this.failedRequests,
      successRate: this.totalRequests > 0 
        ? ((this.totalRequests - this.failedRequests) / this.totalRequests) * 100 
        : 0,
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    const closePromises: Promise<void>[] = [];

    for (const connections of this.connections.values()) {
      for (const conn of connections) {
        closePromises.push(
          new Promise((resolve) => {
            conn.session.close(() => resolve());
          })
        );
      }
    }

    await Promise.all(closePromises);
    
    this.connections.clear();
    this.totalConnections = 0;
    
    logger.info('🔗 HTTP/2 Connection Pool closed');
  }
}

/**
 * Create a global HTTP/2 connection pool
 */
let globalPool: HTTP2ConnectionPool | null = null;

export function getHTTP2Pool(config?: ConnectionPoolConfig): HTTP2ConnectionPool {
  if (!globalPool) {
    globalPool = new HTTP2ConnectionPool(config);
  }
  return globalPool;
}

/**
 * Close the global HTTP/2 connection pool
 */
export async function closeHTTP2Pool(): Promise<void> {
  if (globalPool) {
    await globalPool.close();
    globalPool = null;
  }
}
