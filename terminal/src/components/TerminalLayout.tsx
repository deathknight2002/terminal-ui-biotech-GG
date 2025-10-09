import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AuroraTopBar } from '../../../frontend-components/src/terminal/organisms/AuroraTopBar/AuroraTopBar';
import { CommandPalette } from '../../../frontend-components/src/terminal/organisms/CommandPalette/CommandPalette';
import { AppLibrary } from '../../../frontend-components/src/terminal/organisms/AppLibrary/AppLibrary';
import { useToast } from '../../../frontend-components/src/terminal/molecules/Toast';
import { useCommandPalette } from '../hooks/useCommandPalette';
import { useAppLibrary } from '../hooks/useAppLibrary';
import { menuStructure } from '../config/menuStructure';
import '../styles/glass-theme.css';

interface TerminalLayoutProps {
  children: React.ReactNode;
}

export function TerminalLayout({ children }: TerminalLayoutProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const commandPalette = useCommandPalette();
  const appLibrary = useAppLibrary();
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toISOString());

  // Store initial load time
  useEffect(() => {
    setLastRefreshed(new Date().toISOString());
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleRefresh = async (source: string): Promise<{ success: boolean; message: string }> => {
    try {
      // For 'all', invalidate all queries
      if (source === 'all') {
        await queryClient.invalidateQueries();
        setLastRefreshed(new Date().toISOString());
        showToast({
          title: 'Refresh Complete',
          description: 'All data refreshed successfully',
          variant: 'success',
        });
        return { success: true, message: 'Refreshed all data' };
      }

      // For specific sources, try backend endpoint first
      const response = await fetch('http://localhost:8000/api/v1/admin/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source }),
      });

      const result = await response.json();

      if (response.ok) {
        // Invalidate relevant queries after backend refresh
        await queryClient.invalidateQueries();
        setLastRefreshed(new Date().toISOString());
        showToast({
          title: 'Refresh Complete',
          description: `Successfully refreshed ${source}. ${result.records_inserted} records inserted.`,
          variant: 'success',
        });
        return { success: true, message: `Refreshed ${source}` };
      } else {
        // If backend fails, still invalidate queries to refetch with cached data
        await queryClient.invalidateQueries();
        setLastRefreshed(new Date().toISOString());
        showToast({
          title: 'Service Busy',
          description: 'Showing cached data. Backend may be updating.',
          variant: 'warning',
        });
        return { success: false, message: 'Showing cached data' };
      }
    } catch (error) {
      // On network error, still invalidate to show cached data
      await queryClient.invalidateQueries();
      setLastRefreshed(new Date().toISOString());
      showToast({
        title: 'Refresh Complete',
        description: 'Refreshed from cache - backend unavailable',
        variant: 'warning',
      });
      return { success: false, message: 'Using cached data' };
    }
  };

  return (
    <div className="terminal-layout">
      <AuroraTopBar
        menuItems={menuStructure}
        onNavigate={handleNavigate}
        onRefresh={handleRefresh}
        onOpenCommandPalette={commandPalette.open}
        onOpenAppLibrary={appLibrary.open}
        cornerBrackets={true}
      />

      <main className="terminal-main">
        {children}
      </main>

      <footer className="terminal-footer">
        <div className="glass-container">
          <div className="footer-content">
            <span>🧬 BIOTECH TERMINAL</span>
            <span>STATUS: <span className="status-operational">OPERATIONAL</span></span>
            <span>API: <span className="status-connected">CONNECTED</span></span>
            <span>LAST REFRESHED: {new Date(lastRefreshed).toLocaleString()}</span>
          </div>
        </div>
      </footer>

      {/* Command Palette - Bloomberg-style function codes */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        functionCodes={commandPalette.functionCodes}
        recentCommands={commandPalette.recentCommands}
        onExecute={commandPalette.execute}
      />

      {/* App Library - Launchable modules */}
      <AppLibrary
        isOpen={appLibrary.isOpen}
        onClose={appLibrary.close}
        apps={appLibrary.apps}
        onLaunchApp={appLibrary.launchApp}
        onToggleFavorite={appLibrary.toggleFavorite}
      />
    </div>
  );
}