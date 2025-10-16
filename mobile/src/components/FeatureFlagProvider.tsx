/**
 * Feature Flag Provider
 * 
 * React context provider for feature flags.
 * Initializes the feature flag service and provides flags to the app.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { featureFlagService } from '../services/featureFlagService';
import { logger } from '../services/logger';

interface FeatureFlagContextValue {
  isInitialized: boolean;
  error: Error | null;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  isInitialized: false,
  error: null,
});

export interface FeatureFlagProviderProps {
  children: React.ReactNode;
  url?: string;
  clientKey?: string;
  appName?: string;
  environment?: string;
}

/**
 * Feature Flag Provider Component
 * 
 * Initializes the feature flag service and provides flags to the app.
 * 
 * @example
 * ```tsx
 * <FeatureFlagProvider
 *   url="http://localhost:3001/api/feature-flags/client"
 *   clientKey="dev-key"
 *   appName="biotech-terminal-mobile"
 * >
 *   <App />
 * </FeatureFlagProvider>
 * ```
 */
export function FeatureFlagProvider({
  children,
  url = 'http://localhost:3001/api/feature-flags/client',
  clientKey = 'dev-key',
  appName = 'biotech-terminal-mobile',
  environment = 'development',
}: FeatureFlagProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeFlags = async () => {
      try {
        await featureFlagService.initialize({
          url,
          clientKey,
          appName,
          environment,
        });

        setIsInitialized(true);
        logger.info('[FeatureFlagProvider] Initialized successfully');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize feature flags');
        setError(error);
        logger.error('[FeatureFlagProvider] Initialization failed:', error);
        
        // Still mark as initialized to allow fallback to defaults
        setIsInitialized(true);
      }
    };

    initializeFlags();

    return () => {
      featureFlagService.stop();
    };
  }, [url, clientKey, appName, environment]);

  return (
    <FeatureFlagContext.Provider value={{ isInitialized, error }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flag context
 */
export function useFeatureFlagContext(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within a FeatureFlagProvider');
  }
  return context;
}
