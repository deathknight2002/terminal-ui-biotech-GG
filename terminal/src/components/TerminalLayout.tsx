import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { showToast } = useToast();
  const commandPalette = useCommandPalette();
  const appLibrary = useAppLibrary();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleRefresh = async (source: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast({
          title: 'Refresh Complete',
          description: `Successfully refreshed ${source}. ${result.records_inserted} records inserted.`,
          variant: 'success',
        });
        return { success: true, message: `Refreshed ${source}` };
      } else {
        showToast({
          title: 'Refresh Failed',
          description: result.detail || 'Failed to refresh data',
          variant: 'error',
        });
        return { success: false, message: 'Refresh failed' };
      }
    } catch (error) {
      showToast({
        title: 'Refresh Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
      return { success: false, message: 'Refresh error' };
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
            <span>LIVE: {new Date().toLocaleTimeString()}</span>
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