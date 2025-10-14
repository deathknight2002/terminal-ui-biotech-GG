# Install Consola for Backend Logging

## Overview

Replace the current Winston-based logging system with Consola to provide better development experience, improved terminal output, and colored structured logs. This is a foundational task for Phase 1 that will improve developer productivity and debugging capabilities.

**Related**: [Phase Implementation Plan](../PHASE_IMPLEMENTATION_PLAN.md#11-install-consola-for-backend-logging)  
**Milestone**: Phase1-QuickWins  
**Priority**: P1 (High)  
**Effort**: 2-3 days

## Description

The current backend uses Winston for logging (`backend/src/utils/logger.ts`). While Winston is robust, Consola provides:
- Better terminal output with automatic formatting
- Colored logs for different levels
- Better TypeScript support
- Simpler API
- Smaller bundle size
- Built-in support for browser and Node.js

This task involves:
1. Adding Consola as a dependency
2. Refactoring the logger module
3. Ensuring backward compatibility with existing log consumers
4. Updating tests
5. Documenting the new logging system

## Acceptance Criteria

- [x] Consola npm package added to `backend/package.json`
- [x] Logger module (`backend/src/utils/logger.ts`) refactored to use Consola
- [x] All log levels working correctly:
  - `error` - Error messages with stack traces
  - `warn` - Warning messages
  - `info` - General information
  - `success` - Success messages (Consola-specific)
  - `debug` - Debug information
  - `trace` - Detailed trace logs
- [x] Colored output in development mode
- [x] JSON output in production mode (for log aggregation)
- [x] No breaking changes to existing code that uses logger
- [x] Performance equivalent or better than Winston
- [x] Tests updated and passing (minimum 80% coverage)
- [x] Log files still written to `./logs/` directory
- [x] Documentation updated in README

## Implementation Steps

### Step 1: Install Consola

```bash
cd backend
npm install consola --save
npm install @types/consola --save-dev  # If TypeScript types available
```

### Step 2: Create New Logger Module

Refactor `backend/src/utils/logger.ts`:

```typescript
import { createConsola } from 'consola';
import { config } from '../config/environment.js';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create base Consola instance
const baseLogger = createConsola({
  level: config.nodeEnv === 'production' ? 3 : 4, // info in prod, debug in dev
  fancy: config.nodeEnv !== 'production', // Colored output in dev
  formatOptions: {
    colors: config.nodeEnv !== 'production',
    date: true,
  },
});

// Add file transport for persistent logging
class FileReporter {
  constructor(private filename: string) {}

  log(logObj: any) {
    const logLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: logObj.level,
      tag: logObj.tag,
      message: logObj.args[0],
      ...logObj.args[1],
    }) + '\n';
    
    fs.appendFileSync(this.filename, logLine);
  }
}

// Add file reporters for different log levels
if (config.nodeEnv === 'production') {
  baseLogger.addReporter(new FileReporter(path.join(logsDir, 'app.log')));
  baseLogger.addReporter(new FileReporter(path.join(logsDir, 'error.log')));
}

// Export main logger
export const logger = baseLogger.withTag('biotech-api');

// Create specialized loggers for different components
export const log = {
  // API request logging
  request: (method: string, url: string, statusCode: number, duration: number, userId?: string) => {
    logger.info('API Request', {
      method,
      url,
      statusCode,
      duration,
      userId,
    });
  },

  // Performance monitoring
  performance: (operation: string, duration: number, metadata?: Record<string, any>) => {
    logger.debug('Performance', {
      operation,
      duration,
      ...metadata,
    });
  },

  // Database query logging
  query: (query: string, duration: number, database: string) => {
    if (config.nodeEnv === 'development') {
      logger.trace('DB Query', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration,
        database,
      });
    }
  },

  // Error logging with context
  error: (error: Error, context?: Record<string, any>) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  },

  // Market data logging
  marketData: (symbol: string, dataType: string, source: string, recordCount?: number) => {
    logger.info('Market Data', {
      symbol,
      dataType,
      source,
      recordCount,
    });
  },

  // User activity logging
  userActivity: (userId: string, action: string, metadata?: Record<string, any>) => {
    logger.info('User Activity', {
      userId,
      action,
      ...metadata,
    });
  },

  // Success messages (Consola-specific)
  success: (message: string, metadata?: Record<string, any>) => {
    logger.success(message, metadata);
  },
};
```

### Step 3: Update Existing Code

Search for all imports of the old logger and verify they still work:

```bash
# Find all logger imports
grep -r "from.*logger" backend/src --include="*.ts"

# Most imports should work as-is since we're exporting similar functions
# Test thoroughly!
```

### Step 4: Add Tests

Create or update `backend/src/utils/logger.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, log } from './logger';
import fs from 'fs';

describe('Logger', () => {
  beforeEach(() => {
    // Clear log files before each test
    if (fs.existsSync('./logs/test.log')) {
      fs.unlinkSync('./logs/test.log');
    }
  });

  it('should log info messages', () => {
    const spy = vi.spyOn(console, 'log');
    logger.info('Test message');
    expect(spy).toHaveBeenCalled();
  });

  it('should log errors with stack traces', () => {
    const error = new Error('Test error');
    const spy = vi.spyOn(console, 'error');
    log.error(error);
    expect(spy).toHaveBeenCalled();
  });

  it('should format request logs correctly', () => {
    const spy = vi.spyOn(logger, 'info');
    log.request('GET', '/api/test', 200, 45.3);
    expect(spy).toHaveBeenCalledWith('API Request', expect.objectContaining({
      method: 'GET',
      url: '/api/test',
      statusCode: 200,
      duration: 45.3,
    }));
  });

  it('should handle performance logging', () => {
    const spy = vi.spyOn(logger, 'debug');
    log.performance('database_query', 123.45, { rows: 100 });
    expect(spy).toHaveBeenCalled();
  });

  it('should support success messages', () => {
    const spy = vi.spyOn(logger, 'success');
    log.success('Operation completed', { items: 50 });
    expect(spy).toHaveBeenCalledWith('Operation completed', { items: 50 });
  });
});
```

Run tests:
```bash
npm run test -- logger.test.ts
```

### Step 5: Update Documentation

Update `backend/README.md` or create `docs/LOGGING.md`:

```markdown
## Logging

The backend uses Consola for structured logging with the following levels:

- `error` - Error messages (always logged)
- `warn` - Warning messages
- `info` - General information
- `success` - Success messages
- `debug` - Debug information (dev only)
- `trace` - Detailed trace logs (dev only)

### Usage

```typescript
import { logger, log } from './utils/logger';

// Simple logging
logger.info('Application started');
logger.error('Something went wrong');
logger.success('Database connected');

// Structured logging with helpers
log.request('GET', '/api/drugs', 200, 45.3, 'user123');
log.performance('fetch_trials', 234.5, { count: 50 });
log.error(new Error('Database error'), { query: 'SELECT *' });
```

### Configuration

Log level is controlled by `NODE_ENV`:
- Development: `debug` level with colored output
- Production: `info` level with JSON output to files

Log files are written to:
- `./logs/app.log` - All logs
- `./logs/error.log` - Errors only
```

### Step 6: Performance Testing

Compare Winston vs Consola performance:

```typescript
// Create performance test script
import { logger } from './utils/logger';

const iterations = 10000;

console.time('Log Performance');
for (let i = 0; i < iterations; i++) {
  logger.info(`Test log message ${i}`, { iteration: i });
}
console.timeEnd('Log Performance');

// Run: tsx backend/src/utils/logger-perf-test.ts
```

Expected: Consola should be similar or faster than Winston.

### Step 7: Migration Checklist

- [ ] Install Consola package
- [ ] Refactor logger.ts
- [ ] Update all imports (if needed)
- [ ] Write tests
- [ ] Run test suite (`npm run test`)
- [ ] Test in development mode (colored output)
- [ ] Test in production mode (JSON output)
- [ ] Verify log files are created
- [ ] Performance test
- [ ] Update documentation
- [ ] Code review
- [ ] Merge PR

## Testing Instructions

### Manual Testing

1. Start backend in development mode:
   ```bash
   cd backend
   npm run dev
   ```

2. Verify colored output appears in terminal

3. Make API requests and verify logs:
   ```bash
   curl http://localhost:3001/api/health
   ```

4. Check log levels work:
   ```typescript
   // In any route handler
   logger.info('Info message');
   logger.warn('Warning message');
   logger.error('Error message');
   logger.success('Success message');
   logger.debug('Debug message');
   logger.trace('Trace message');
   ```

5. Verify log files are created in `./logs/`

### Automated Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Should achieve >80% coverage for logger module
```

## Migration Guide for Developers

If you're using the logger in your code:

**Before (Winston):**
```typescript
import { logger } from './utils/logger';

logger.info('Message');
logger.error('Error', { context: 'data' });
```

**After (Consola):**
```typescript
import { logger } from './utils/logger';

// API is similar, but now you can also use:
logger.success('Successfully completed!'); // New in Consola
logger.box('Important message in a box'); // New in Consola
```

The structured logging helpers (`log.request`, `log.performance`, etc.) remain unchanged.

## Labels

- `backend`
- `enhancement`
- `p1`
- `phase1-quick-wins`

## Assignees

- **Owner**: @backend-team
- **Reviewers**: @tech-lead, @devops-team

## Related Issues

- Part of Phase 1 Quick Wins
- See: [Phase Implementation Plan](../PHASE_IMPLEMENTATION_PLAN.md)
- Related to terminal UI enhancement (logging for terminal commands)

## References

- [Consola Documentation](https://github.com/unjs/consola)
- [Winston Documentation](https://github.com/winstonjs/winston) (current implementation)
- [Backend Logger Module](../../backend/src/utils/logger.ts)

## Estimated Time

- **Setup**: 1 hour
- **Refactoring**: 3-4 hours
- **Testing**: 2-3 hours
- **Documentation**: 1 hour
- **Review & Merge**: 1-2 hours

**Total**: 2-3 days (including review and testing)

---

**Created**: 2025-10-14  
**Updated**: 2025-10-14  
**Status**: Ready for implementation
