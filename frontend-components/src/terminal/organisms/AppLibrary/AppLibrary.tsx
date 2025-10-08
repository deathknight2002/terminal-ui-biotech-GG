import React, { useState, useMemo } from 'react';
import { Grid, List, Search, Star, Clock, X } from 'lucide-react';
import type { AppModule } from '../../../../../src/types/biotech';
import './AppLibrary.css';

export interface AppLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppModule[];
  onLaunchApp: (app: AppModule) => void;
  onToggleFavorite?: (appId: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type FilterCategory = 'all' | 'news' | 'science' | 'catalysts' | 'trials' | 'companies' | 'analytics' | 'data' | 'tools';

export const AppLibrary: React.FC<AppLibraryProps> = ({
  isOpen,
  onClose,
  apps,
  onLaunchApp,
  onToggleFavorite,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Filter and search apps
  const filteredApps = useMemo(() => {
    let result = apps;

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter((app) => app.favorited);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter((app) => app.category === filterCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.description.toLowerCase().includes(query) ||
          app.functionCode?.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first, then recently used, then alphabetically
    return result.sort((a, b) => {
      if (a.favorited && !b.favorited) return -1;
      if (!a.favorited && b.favorited) return 1;
      if (a.recentlyUsed && !b.recentlyUsed) return -1;
      if (!a.recentlyUsed && b.recentlyUsed) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [apps, searchQuery, filterCategory, showFavoritesOnly]);

  const categories = [
    { value: 'all', label: 'All Apps' },
    { value: 'news', label: 'News' },
    { value: 'science', label: 'Science' },
    { value: 'catalysts', label: 'Catalysts' },
    { value: 'trials', label: 'Trials' },
    { value: 'companies', label: 'Companies' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'data', label: 'Data' },
    { value: 'tools', label: 'Tools' },
  ];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLaunchApp = (app: AppModule) => {
    onLaunchApp(app);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`app-library-overlay ${className}`} onClick={handleBackdropClick}>
      <div className="app-library" role="dialog" aria-modal="true" aria-labelledby="app-library-title">
        {/* Header */}
        <div className="app-library-header">
          <h2 id="app-library-title" className="app-library-title">
            APP LIBRARY
          </h2>
          <button className="app-library-close" onClick={onClose} aria-label="Close app library">
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="app-library-toolbar">
          <div className="app-library-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search apps"
            />
          </div>

          <div className="app-library-filters">
            <button
              className={`filter-btn ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              aria-label="Show favorites only"
              title="Show favorites only"
            >
              <Star size={18} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
            </button>
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="app-library-categories">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`category-btn ${filterCategory === cat.value ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat.value as FilterCategory)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Apps Grid/List */}
        <div className={`app-library-content ${viewMode}`}>
          {filteredApps.length === 0 ? (
            <div className="app-library-empty">
              <Search size={48} className="empty-icon" />
              <p>No apps found</p>
              <p className="empty-hint">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`app-${viewMode}`}>
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  className="app-item"
                  onClick={() => handleLaunchApp(app)}
                  aria-label={`Launch ${app.name}`}
                >
                  <div className="app-item-header">
                    <div className="app-icon">{app.icon}</div>
                    {onToggleFavorite && (
                      <button
                        className="app-favorite-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(app.id);
                        }}
                        aria-label={app.favorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={16} fill={app.favorited ? 'currentColor' : 'none'} />
                      </button>
                    )}
                  </div>
                  <div className="app-item-content">
                    <div className="app-item-name">{app.name}</div>
                    <div className="app-item-description">{app.description}</div>
                  </div>
                  {app.functionCode && (
                    <div className="app-item-footer">
                      <kbd className="function-code">{app.functionCode}</kbd>
                    </div>
                  )}
                  {app.recentlyUsed && (
                    <div className="app-recent-badge">
                      <Clock size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="app-library-footer">
          <span className="app-count">
            {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
          </span>
          <div className="app-library-tips">
            <span>Click to launch • Star to favorite • Type function code in Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
