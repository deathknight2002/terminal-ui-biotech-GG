import { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MobileTabBar } from './MobileTabBar';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: ReactNode;
}

export const MobileLayout: FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="mobile-app">
      {/* Aurora background effect */}
      <div className="mobile-aurora-bg" />
      
      {/* Main content area */}
      <main className="mobile-content">
        {children}
      </main>
      
      {/* Bottom navigation tab bar */}
      <MobileTabBar currentPath={location.pathname} />
    </div>
  );
};
