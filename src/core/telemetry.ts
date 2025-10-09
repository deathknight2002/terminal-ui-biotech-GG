/**
 * Telemetry - Distributed tracing and observability
 * 
 * Provides OpenTelemetry-compatible tracing infrastructure
 * for end-to-end request tracking and performance monitoring
 */

export interface Span {
  id: string;
  traceId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes?: Record<string, any>;
  events?: SpanEvent[];
  status?: SpanStatus;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, any>;
}

export interface SpanStatus {
  code: 'OK' | 'ERROR' | 'UNSET';
  message?: string;
}

export interface Tracer {
  startSpan(name: string, attributes?: Record<string, any>): Span;
  endSpan(span: Span, status?: SpanStatus): void;
  recordEvent(span: Span, name: string, attributes?: Record<string, any>): void;
}

class TelemetryImpl implements Tracer {
  private spans: Map<string, Span> = new Map();
  private activeSpans: Map<string, Span> = new Map();

  startSpan(name: string, attributes?: Record<string, any>): Span {
    const traceId = this.generateTraceId();
    const span: Span = {
      id: this.generateSpanId(),
      traceId,
      name,
      startTime: Date.now(),
      attributes: attributes || {},
      events: [],
      status: { code: 'UNSET' },
    };

    this.spans.set(span.id, span);
    this.activeSpans.set(span.traceId, span);

    return span;
  }

  endSpan(span: Span, status?: SpanStatus): void {
    span.endTime = Date.now();
    span.status = status || { code: 'OK' };
    this.activeSpans.delete(span.traceId);
  }

  recordEvent(span: Span, name: string, attributes?: Record<string, any>): void {
    span.events = span.events || [];
    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  getAllSpans(): Span[] {
    return Array.from(this.spans.values());
  }

  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }

  clear(): void {
    this.spans.clear();
    this.activeSpans.clear();
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }
}

// Singleton instance
export const Telemetry = new TelemetryImpl();

/**
 * Decorator to trace function execution
 */
export function traced(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const span = Telemetry.startSpan(name, {
        method: propertyKey,
        class: target.constructor.name,
      });

      try {
        const result = await originalMethod.apply(this, args);
        Telemetry.endSpan(span, { code: 'OK' });
        return result;
      } catch (error) {
        Telemetry.endSpan(span, {
          code: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    };

    return descriptor;
  };
}
