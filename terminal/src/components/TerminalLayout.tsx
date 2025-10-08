import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuroraTopBar } from '../../../frontend-components/src/terminal/organisms/AuroraTopBar/AuroraTopBar';
import { useToast } from '../../../frontend-components/src/terminal/molecules/Toast';
import { menuStructure } from '../config/menuStructure';
import '../styles/glass-theme.css';

interface TerminalLayoutProps {
  children: React.ReactNode;
}

export function TerminalLayout({ children }: TerminalLayoutProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

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
    </div>
  );
}