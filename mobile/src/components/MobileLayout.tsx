import { FC, ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, RefreshCw } from 'lucide-react';
import { MobileTabBar } from './MobileTabBar';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: ReactNode;
}

export const MobileLayout: FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: 'all' }),
      });
      
      if (response.ok) {
        // Success feedback
        console.log('Refresh successful');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mobile-app">
      {/* Aurora background effect */}
      <div className="mobile-aurora-bg" />
      
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setShowMenu(!showMenu)}>
          <Menu size={24} />
        </button>
        <div className="mobile-brand">
          <span className="brand-icon">✦</span>
          <span>AURORA</span>
        </div>
        <button 
          className={`mobile-refresh-btn ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {showMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>NAVIGATION</h3>
              <button onClick={() => setShowMenu(false)}>✕</button>
            </div>
            <nav className="mobile-menu-nav">
              <button onClick={() => { navigate('/news'); setShowMenu(false); }}>NEWS</button>
              <button onClick={() => { navigate('/trials'); setShowMenu(false); }}>TRIALS</button>
              <button onClick={() => { navigate('/epidemiology'); setShowMenu(false); }}>EPIDEMIOLOGY</button>
              <button onClick={() => { navigate('/pipeline'); setShowMenu(false); }}>PIPELINE</button>
              <button onClick={() => { navigate('/financial'); setShowMenu(false); }}>FINANCIAL</button>
            </nav>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <main className="mobile-content">
        {children}
      </main>
      
      {/* Bottom navigation tab bar */}
      <MobileTabBar currentPath={location.pathname} />
    </div>
  );
};
