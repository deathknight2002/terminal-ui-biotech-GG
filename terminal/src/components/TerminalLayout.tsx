import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/glass-theme.css';

interface TerminalLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { path: '/', label: 'DASHBOARD', icon: '📊' },
  { path: '/pipeline', label: 'PIPELINE', icon: '🧬' },
  { path: '/financial', label: 'FINANCIAL', icon: '💰' },
  { path: '/intelligence', label: 'INTELLIGENCE', icon: '🔍' },
  { path: '/epidemiology', label: 'EPIDEMIOLOGY', icon: '🏥' },
  { path: '/trials', label: 'TRIALS', icon: '📋' },
  { path: '/explorer', label: 'EXPLORER', icon: '🗃️' },
];

export function TerminalLayout({ children }: TerminalLayoutProps) {
  const location = useLocation();

  return (
    <div className="terminal-layout">
      <header className="terminal-header">
        <div className="glass-container">
          <div className="terminal-headline">
            <div className="eyebrow">BIOTECH INTELLIGENCE PLATFORM</div>
            <h1>AURORA TERMINAL</h1>
            <div className="subtitle">Real-time pharmaceutical intelligence & market analysis</div>
          </div>
          <nav className="terminal-nav">
            {navigation.map((item) => (
              <Link key={item.path} to={item.path} className="nav-link">
                <button
                  className={`glass-button ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.icon} {item.label}
                </button>
              </Link>
            ))}
          </nav>
        </div>
      </header>

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