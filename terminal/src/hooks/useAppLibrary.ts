import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppModule } from '../../../src/types/biotech';
import { APP_MODULES } from '../../../src/config/appModules';

/**
 * Hook for managing app library state
 */
export function useAppLibrary() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState<AppModule[]>(APP_MODULES);

  // Load app preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('appPreferences');
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        setApps((prevApps) =>
          prevApps.map((app) => ({
            ...app,
            favorited: prefs.favorites?.includes(app.id) || false,
            recentlyUsed: prefs.recent?.includes(app.id) || false,
            lastUsedAt: prefs.lastUsed?.[app.id],
          }))
        );
      } catch (e) {
        console.error('Failed to parse app preferences', e);
      }
    }
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const launchApp = useCallback(
    (app: AppModule) => {
      navigate(app.path);
      
      // Update recently used
      const prefs = JSON.parse(localStorage.getItem('appPreferences') || '{}');
      const recent = [app.id, ...(prefs.recent || []).filter((id: string) => id !== app.id)].slice(0, 10);
      const lastUsed = { ...(prefs.lastUsed || {}), [app.id]: new Date().toISOString() };
      
      localStorage.setItem(
        'appPreferences',
        JSON.stringify({ ...prefs, recent, lastUsed })
      );
      
      setApps((prevApps) =>
        prevApps.map((a) =>
          a.id === app.id
            ? { ...a, recentlyUsed: true, lastUsedAt: new Date().toISOString() }
            : a
        )
      );
      
      close();
    },
    [navigate, close]
  );

  const toggleFavorite = useCallback((appId: string) => {
    setApps((prevApps) => {
      const updated = prevApps.map((app) =>
        app.id === appId ? { ...app, favorited: !app.favorited } : app
      );
      
      // Save to localStorage
      const prefs = JSON.parse(localStorage.getItem('appPreferences') || '{}');
      const favorites = updated.filter((app) => app.favorited).map((app) => app.id);
      localStorage.setItem(
        'appPreferences',
        JSON.stringify({ ...prefs, favorites })
      );
      
      return updated;
    });
  }, []);

  return {
    isOpen,
    open,
    close,
    apps,
    launchApp,
    toggleFavorite,
  };
}
