import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import './AuroraTopBar.css';

export interface MenuItem {
  label: string;
  path?: string;
  items?: SubMenuItem[];
}

export interface SubMenuItem {
  label: string;
  path: string;
  description?: string;
}

export interface AuroraTopBarProps {
  menuItems: MenuItem[];
  onNavigate?: (path: string) => void;
  onRefresh?: (source: string) => Promise<{ success: boolean; message: string }>;
  cornerBrackets?: boolean;
  className?: string;
}

export const AuroraTopBar: React.FC<AuroraTopBarProps> = ({
  menuItems,
  onNavigate,
  onRefresh,
  cornerBrackets = true,
  className = ''
}) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshMenuRef = useRef<HTMLDivElement>(null);

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu !== null) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  // Close refresh menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showRefreshMenu && refreshMenuRef.current && !refreshMenuRef.current.contains(event.target as Node)) {
        setShowRefreshMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRefreshMenu]);

  const handleMenuHover = (index: number) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }

    menuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(index);
      setHoveredItem(null);
    }, 150);
  };

  const handleMenuLeave = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }

    menuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
      setHoveredItem(null);
    }, 300);
  };

  const handleSubItemClick = (path: string) => {
    setActiveMenu(null);
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const handleRefreshClick = async (source: string) => {
    if (refreshing || !onRefresh) return;

    setRefreshing(true);
    setShowRefreshMenu(false);

    try {
      const result = await onRefresh(source);
      // Toast notification handled by parent
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <div className={`aurora-top-bar ${cornerBrackets ? 'corner-brackets' : ''} ${className}`}>
      <div className="aurora-bar-inner">
        <div className="aurora-bar-brand">
          <span className="brand-icon">✦</span>
          <span className="brand-text">AURORA TERMINAL</span>
        </div>

        <nav className="aurora-bar-menu" role="navigation" aria-label="Main navigation">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="menu-item-wrapper"
              onMouseEnter={() => handleMenuHover(index)}
              onMouseLeave={handleMenuLeave}
            >
              <button
                className={`menu-item ${activeMenu === index ? 'active' : ''}`}
                aria-expanded={activeMenu === index}
                aria-haspopup={item.items ? 'menu' : undefined}
                onClick={() => {
                  if (item.path && onNavigate) {
                    onNavigate(item.path);
                  }
                }}
              >
                {item.label}
              </button>

              <AnimatePresence>
                {activeMenu === index && item.items && (
                  <motion.div
                    className="mega-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    role="menu"
                    aria-label={`${item.label} submenu`}
                  >
                    <div className="mega-menu-content">
                      {item.items.map((subItem, subIndex) => (
                        <button
                          key={subIndex}
                          className={`mega-menu-item ${hoveredItem === subIndex ? 'hovered' : ''}`}
                          onClick={() => handleSubItemClick(subItem.path)}
                          onMouseEnter={() => setHoveredItem(subIndex)}
                          onKeyDown={(e) => handleKeyDown(e, () => handleSubItemClick(subItem.path))}
                          role="menuitem"
                        >
                          <span className="mega-menu-label">{subItem.label}</span>
                          {subItem.description && (
                            <span className="mega-menu-description">{subItem.description}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        <div className="aurora-bar-actions">
          <div className="refresh-wrapper" ref={refreshMenuRef}>
            <button
              className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
              onClick={() => setShowRefreshMenu(!showRefreshMenu)}
              disabled={refreshing}
              aria-label="Refresh data"
              title="Refresh data"
            >
              <RefreshCw size={18} className="refresh-icon" />
            </button>

            <AnimatePresence>
              {showRefreshMenu && (
                <motion.div
                  className="refresh-menu"
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="refresh-menu-header">REFRESH DATA</div>
                  <button
                    className="refresh-menu-item"
                    onClick={() => handleRefreshClick('news')}
                    disabled={refreshing}
                  >
                    News Articles
                  </button>
                  <button
                    className="refresh-menu-item"
                    onClick={() => handleRefreshClick('trials')}
                    disabled={refreshing}
                  >
                    Clinical Trials
                  </button>
                  <button
                    className="refresh-menu-item"
                    onClick={() => handleRefreshClick('catalysts')}
                    disabled={refreshing}
                  >
                    Market Catalysts
                  </button>
                  <div className="refresh-menu-divider" />
                  <button
                    className="refresh-menu-item refresh-all"
                    onClick={() => handleRefreshClick('all')}
                    disabled={refreshing}
                  >
                    Refresh All
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuroraTopBar;
