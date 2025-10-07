/**
 * Worker Pool Architecture for High-Performance Scraping
 * Leverages hardware concurrency for optimal CPU utilization
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import os from 'os';

export interface WorkerTask<T = any> {
  id: string;
  url: string;
  priority: number;
  retries: number;
  maxRetries: number;
  timeout: number;
  metadata?: Record<string, any>;
  execute: () => Promise<T>;
}

export interface WorkerPoolConfig {
  maxWorkers?: number;
  taskTimeout?: number;
  maxRetries?: number;
  queueSize?: number;
}

export class WorkerPool extends EventEmitter {
  private maxWorkers: number;
  private taskTimeout: number;
  private maxRetries: number;
  private queueSize: number;
  private activeWorkers: number = 0;
  private taskQueue: WorkerTask[] = [];
  private completedTasks: number = 0;
  private failedTasks: number = 0;
  private readonly hardwareConcurrency: number;

  constructor(config: WorkerPoolConfig = {}) {
    super();
    
    this.hardwareConcurrency = os.cpus().length;
    this.maxWorkers = config.maxWorkers || Math.max(2, this.hardwareConcurrency - 1);
    this.taskTimeout = config.taskTimeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.queueSize = config.queueSize || 1000;

    logger.info(`🔧 Worker Pool initialized with ${this.maxWorkers} workers (Hardware: ${this.hardwareConcurrency} cores)`);
  }

  /**
   * Add a task to the worker pool queue
   */
  async addTask<T>(task: Omit<WorkerTask<T>, 'id' | 'retries' | 'maxRetries' | 'timeout'>): Promise<T> {
    if (this.taskQueue.length >= this.queueSize) {
      throw new Error('Task queue is full');
    }

    const fullTask: WorkerTask<T> = {
      id: this.generateTaskId(),
      retries: 0,
      maxRetries: this.maxRetries,
      timeout: this.taskTimeout,
      ...task,
    };

    return new Promise((resolve, reject) => {
      const wrappedExecute = fullTask.execute;
      fullTask.execute = async () => {
        try {
          const result = await this.executeWithTimeout(wrappedExecute(), fullTask.timeout);
          this.completedTasks++;
          this.emit('task:completed', { taskId: fullTask.id, metadata: fullTask.metadata });
          resolve(result);
          return result;
        } catch (error) {
          this.failedTasks++;
          this.emit('task:failed', { taskId: fullTask.id, error, metadata: fullTask.metadata });
          reject(error);
          throw error;
        }
      };

      this.taskQueue.push(fullTask);
      this.emit('task:queued', { taskId: fullTask.id, queueLength: this.taskQueue.length });
      
      this.processQueue();
    });
  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const task = this.getNextTask();
      if (!task) break;

      this.activeWorkers++;
      this.emit('worker:started', { taskId: task.id, activeWorkers: this.activeWorkers });

      this.executeTask(task).finally(() => {
        this.activeWorkers--;
        this.emit('worker:finished', { taskId: task.id, activeWorkers: this.activeWorkers });
        this.processQueue();
      });
    }
  }

  /**
   * Get the next task from the queue (priority-based)
   */
  private getNextTask(): WorkerTask | undefined {
    if (this.taskQueue.length === 0) return undefined;

    // Sort by priority (higher priority first)
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    return this.taskQueue.shift();
  }

  /**
   * Execute a task with retry logic
   */
  private async executeTask(task: WorkerTask): Promise<void> {
    try {
      await task.execute();
    } catch (error) {
      if (task.retries < task.maxRetries) {
        task.retries++;
        logger.warn(`⚠️ Task ${task.id} failed, retrying (${task.retries}/${task.maxRetries})`);
        
        // Add back to queue with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, task.retries), 10000);
        await this.delay(delay);
        
        this.taskQueue.push(task);
        this.emit('task:retry', { taskId: task.id, retries: task.retries });
      } else {
        logger.error(`❌ Task ${task.id} failed after ${task.maxRetries} retries:`, error);
        this.emit('task:exhausted', { taskId: task.id, error });
      }
    }
  }

  /**
   * Execute a function with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      ),
    ]);
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      activeWorkers: this.activeWorkers,
      queuedTasks: this.taskQueue.length,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      maxWorkers: this.maxWorkers,
      hardwareConcurrency: this.hardwareConcurrency,
      utilizationRate: (this.activeWorkers / this.maxWorkers) * 100,
    };
  }

  /**
   * Shutdown the worker pool
   */
  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down worker pool...');
    
    // Wait for active tasks to complete
    while (this.activeWorkers > 0) {
      await this.delay(100);
    }
    
    // Clear remaining queue
    this.taskQueue = [];
    
    logger.info('✅ Worker pool shut down complete');
  }
}
