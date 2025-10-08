
import { FC } from 'react';
import { Link } from 'react-router-dom';
import './MobileTabBar.css';

interface TabBarItem {
  path: string;
  label: string;
  icon: string;
}

interface MobileTabBarProps {
  currentPath: string;
}

const TAB_ITEMS: TabBarItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: '📊',
  },
  {
    path: '/pipeline',
    label: 'Pipeline',
    icon: '💊',
  },
  {
    path: '/trials',
    label: 'Trials',
    icon: '🔬',
  },
  {
    path: '/financial',
    label: 'Financial',
    icon: '💰',
  },
  {
    path: '/intelligence',
    label: 'Intel',
    icon: '🧠',
  },
];

export const MobileTabBar: FC<MobileTabBarProps> = ({ currentPath }) => {
  const isActive = (path: string) => {
    return currentPath === path || (currentPath === '/' && path === '/dashboard');
  };

  return (
    <nav className="mobile-tab-bar ios-safe-bottom">
      <div className="mobile-tab-bar-content">
        {TAB_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-tab-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <div className="mobile-tab-icon">{item.icon}</div>
            <div className="mobile-tab-label">{item.label}</div>
          </Link>
        ))}
      </div>
    </nav>
  );
};
