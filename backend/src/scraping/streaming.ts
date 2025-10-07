/**
 * Data Streaming Pipeline
 * Node.js streams for handling large biotech datasets without memory overflow
 */

import { Transform, Writable, Readable, pipeline } from 'stream';
import { promisify } from 'util';
import { createWriteStream, createReadStream } from 'fs';
import { createGzip, createGunzip, createBrotliCompress, createBrotliDecompress } from 'zlib';
import { logger } from '../utils/logger.js';

const pipelineAsync = promisify(pipeline);

export interface StreamPipelineConfig {
  compression?: 'gzip' | 'brotli' | 'none';
  batchSize?: number;
  highWaterMark?: number;
  encoding?: BufferEncoding;
}

/**
 * Batch transform stream - processes data in batches
 */
export class BatchTransformStream<T = any> extends Transform {
  private batch: T[] = [];
  private readonly batchSize: number;
  private readonly processor: (batch: T[]) => Promise<T[]>;

  constructor(batchSize: number, processor: (batch: T[]) => Promise<T[]>) {
    super({ objectMode: true });
    this.batchSize = batchSize;
    this.processor = processor;
  }

  async _transform(chunk: T, encoding: BufferEncoding, callback: Function) {
    try {
      this.batch.push(chunk);

      if (this.batch.length >= this.batchSize) {
        const processed = await this.processor(this.batch);
        this.batch = [];

        for (const item of processed) {
          this.push(item);
        }
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  async _flush(callback: Function) {
    try {
      if (this.batch.length > 0) {
        const processed = await this.processor(this.batch);
        for (const item of processed) {
          this.push(item);
        }
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

/**
 * Filter stream - filters data based on predicate
 */
export class FilterStream<T = any> extends Transform {
  private readonly predicate: (item: T) => boolean | Promise<boolean>;

  constructor(predicate: (item: T) => boolean | Promise<boolean>) {
    super({ objectMode: true });
    this.predicate = predicate;
  }

  async _transform(chunk: T, encoding: BufferEncoding, callback: Function) {
    try {
      const shouldInclude = await this.predicate(chunk);
      if (shouldInclude) {
        this.push(chunk);
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

/**
 * Map stream - transforms data
 */
export class MapStream<TInput = any, TOutput = any> extends Transform {
  private readonly mapper: (item: TInput) => TOutput | Promise<TOutput>;

  constructor(mapper: (item: TInput) => TOutput | Promise<TOutput>) {
    super({ objectMode: true });
    this.mapper = mapper;
  }

  async _transform(chunk: TInput, encoding: BufferEncoding, callback: Function) {
    try {
      const mapped = await this.mapper(chunk);
      this.push(mapped);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

/**
 * Aggregation stream - aggregates data
 */
export class AggregateStream<T = any> extends Writable {
  private items: T[] = [];
  private readonly onComplete: (items: T[]) => void | Promise<void>;

  constructor(onComplete: (items: T[]) => void | Promise<void>) {
    super({ objectMode: true });
    this.onComplete = onComplete;
  }

  _write(chunk: T, encoding: BufferEncoding, callback: Function) {
    this.items.push(chunk);
    callback();
  }

  async _final(callback: Function) {
    try {
      await this.onComplete(this.items);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

/**
 * JSON Lines parser stream
 */
export class JSONLinesParser extends Transform {
  private buffer: string = '';

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
    try {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const obj = JSON.parse(line);
            this.push(obj);
          } catch (parseError) {
            logger.warn('Failed to parse JSON line:', parseError);
          }
        }
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback: Function) {
    if (this.buffer.trim()) {
      try {
        const obj = JSON.parse(this.buffer);
        this.push(obj);
      } catch (parseError) {
        logger.warn('Failed to parse final JSON line:', parseError);
      }
    }
    callback();
  }
}

/**
 * JSON Lines serializer stream
 */
export class JSONLinesSerializer extends Transform {
  constructor() {
    super({ objectMode: true, writableObjectMode: true });
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: Function) {
    try {
      const line = JSON.stringify(chunk) + '\n';
      this.push(line);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

/**
 * CSV parser stream
 */
export class CSVParser extends Transform {
  private headers: string[] = [];
  private isFirstLine: boolean = true;
  private buffer: string = '';

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
    try {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        if (this.isFirstLine) {
          this.headers = line.split(',').map(h => h.trim());
          this.isFirstLine = false;
        } else {
          const values = line.split(',').map(v => v.trim());
          const obj: Record<string, string> = {};
          
          this.headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          
          this.push(obj);
        }
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback: Function) {
    if (this.buffer.trim() && !this.isFirstLine) {
      const values = this.buffer.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      
      this.headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      this.push(obj);
    }
    callback();
  }
}

/**
 * Rate limiting stream
 */
export class RateLimitStream extends Transform {
  private readonly ratePerSecond: number;
  private lastEmit: number = 0;
  private readonly delay: number;

  constructor(ratePerSecond: number) {
    super({ objectMode: true });
    this.ratePerSecond = ratePerSecond;
    this.delay = 1000 / ratePerSecond;
  }

  async _transform(chunk: any, encoding: BufferEncoding, callback: Function) {
    const now = Date.now();
    const timeSinceLastEmit = now - this.lastEmit;

    if (timeSinceLastEmit < this.delay) {
      await this.sleep(this.delay - timeSinceLastEmit);
    }

    this.lastEmit = Date.now();
    this.push(chunk);
    callback();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Stream pipeline builder
 */
export class StreamPipelineBuilder {
  private streams: NodeJS.ReadWriteStream[] = [];
  private source?: Readable;
  private destination?: Writable;

  from(source: Readable): this {
    this.source = source;
    return this;
  }

  filter<T>(predicate: (item: T) => boolean | Promise<boolean>): this {
    this.streams.push(new FilterStream(predicate));
    return this;
  }

  map<TInput, TOutput>(mapper: (item: TInput) => TOutput | Promise<TOutput>): this {
    this.streams.push(new MapStream(mapper));
    return this;
  }

  batch<T>(size: number, processor: (batch: T[]) => Promise<T[]>): this {
    this.streams.push(new BatchTransformStream(size, processor));
    return this;
  }

  rateLimit(ratePerSecond: number): this {
    this.streams.push(new RateLimitStream(ratePerSecond));
    return this;
  }

  compress(type: 'gzip' | 'brotli'): this {
    if (type === 'gzip') {
      this.streams.push(createGzip());
    } else {
      this.streams.push(createBrotliCompress());
    }
    return this;
  }

  decompress(type: 'gzip' | 'brotli'): this {
    if (type === 'gzip') {
      this.streams.push(createGunzip());
    } else {
      this.streams.push(createBrotliDecompress());
    }
    return this;
  }

  parseJSONLines(): this {
    this.streams.push(new JSONLinesParser());
    return this;
  }

  serializeJSONLines(): this {
    this.streams.push(new JSONLinesSerializer());
    return this;
  }

  parseCSV(): this {
    this.streams.push(new CSVParser());
    return this;
  }

  to(destination: Writable): this {
    this.destination = destination;
    return this;
  }

  toFile(path: string): this {
    this.destination = createWriteStream(path);
    return this;
  }

  async collect<T>(): Promise<T[]> {
    const items: T[] = [];
    this.destination = new AggregateStream<T>((collected) => {
      items.push(...collected);
    });

    await this.execute();
    return items;
  }

  async execute(): Promise<void> {
    if (!this.source) {
      throw new Error('Source stream not specified');
    }

    if (!this.destination) {
      throw new Error('Destination stream not specified');
    }

    const allStreams: NodeJS.ReadWriteStream[] = [this.source as any, ...this.streams, this.destination as any];

    try {
      await pipelineAsync(...(allStreams as [NodeJS.ReadableStream, ...NodeJS.ReadWriteStream[], NodeJS.WritableStream]));
      logger.debug('Stream pipeline completed successfully');
    } catch (error) {
      logger.error('Stream pipeline error:', error);
      throw error;
    }
  }
}

/**
 * Create a stream pipeline
 */
export function createStreamPipeline(): StreamPipelineBuilder {
  return new StreamPipelineBuilder();
}

/**
 * Stream utilities
 */
export const StreamUtils = {
  /**
   * Create a readable stream from an array
   */
  fromArray<T>(array: T[]): Readable {
    let index = 0;
    
    return new Readable({
      objectMode: true,
      read() {
        if (index < array.length) {
          this.push(array[index++]);
        } else {
          this.push(null);
        }
      },
    });
  },

  /**
   * Create a readable stream from an async iterator
   */
  fromAsyncIterator<T>(iterator: AsyncIterator<T>): Readable {
    return new Readable({
      objectMode: true,
      async read() {
        try {
          const { value, done } = await iterator.next();
          if (done) {
            this.push(null);
          } else {
            this.push(value);
          }
        } catch (error) {
          this.destroy(error as Error);
        }
      },
    });
  },

  /**
   * Convert a stream to an array
   */
  async toArray<T>(stream: Readable): Promise<T[]> {
    const items: T[] = [];
    
    for await (const chunk of stream) {
      items.push(chunk);
    }
    
    return items;
  },

  /**
   * Stream a file in chunks
   */
  streamFile(path: string, config?: StreamPipelineConfig): Readable {
    const stream = createReadStream(path, {
      highWaterMark: config?.highWaterMark || 64 * 1024,
      encoding: config?.encoding,
    });

    if (config?.compression === 'gzip') {
      return stream.pipe(createGunzip());
    } else if (config?.compression === 'brotli') {
      return stream.pipe(createBrotliDecompress());
    }

    return stream;
  },
};
