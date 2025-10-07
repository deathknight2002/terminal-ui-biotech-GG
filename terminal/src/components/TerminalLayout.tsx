import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Panel, Button } from '@biotech-terminal/frontend-components/terminal';

interface TerminalLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { path: '/', label: 'DASHBOARD', icon: '📊' },
  { path: '/pipeline', label: 'PIPELINE', icon: '🧬' },
  { path: '/financial', label: 'FINANCIAL', icon: '💰' },
  { path: '/intelligence', label: 'INTELLIGENCE', icon: '🔍' },
  { path: '/trials', label: 'TRIALS', icon: '📋' },
  { path: '/explorer', label: 'EXPLORER', icon: '🗃️' },
];

export function TerminalLayout({ children }: TerminalLayoutProps) {
  const location = useLocation();

  return (
    <div className="terminal-layout">
      <header className="terminal-header">
        <Panel title="BIOTECH TERMINAL PLATFORM v2.0" cornerBrackets>
          <nav className="terminal-nav">
            {navigation.map((item) => (
              <Link key={item.path} to={item.path} className="nav-link">
                <Button
                  variant={location.pathname === item.path ? 'primary' : 'ghost'}
                  size="sm"
                >
                  {item.icon} {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </Panel>
      </header>

      <main className="terminal-main">
        {children}
      </main>

      <footer className="terminal-footer">
        <Panel>
          <div className="footer-content">
            <span>🧬 BIOTECH TERMINAL</span>
            <span>STATUS: OPERATIONAL</span>
            <span>API: CONNECTED</span>
            <span>{new Date().toISOString()}</span>
          </div>
        </Panel>
      </footer>
    </div>
  );
}