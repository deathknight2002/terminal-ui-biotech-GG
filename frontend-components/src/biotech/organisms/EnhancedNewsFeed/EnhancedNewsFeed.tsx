import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { Panel } from '../../../terminal/organisms/Panel';
import { Button } from '../../../terminal/atoms/Button';
import { Badge } from '../../../terminal/atoms/Badge';
import { Input } from '../../../terminal/atoms/Input';
import { NewsSummaryCard } from '../../molecules/NewsSummaryCard';
import type { NewsItem, TherapeuticArea } from '../../../types/biotech';
import styles from './EnhancedNewsFeed.module.css';

export interface EnhancedNewsFeedProps {
  news: NewsItem[];
  title?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
  cornerBrackets?: boolean;
  showCategoryTabs?: boolean;
  defaultCategory?: 'all' | TherapeuticArea;
  portfolioWatchlist?: string[]; // Company tickers to highlight
}

export const EnhancedNewsFeed: React.FC<EnhancedNewsFeedProps> = ({
  news,
  title = 'BIOTECH NEWS INTELLIGENCE',
  onRefresh,
  isRefreshing = false,
  className,
  cornerBrackets = true,
  showCategoryTabs = true,
  defaultCategory = 'all',
  portfolioWatchlist = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | TherapeuticArea>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyTradable, setShowOnlyTradable] = useState(false);
  const [showOnlyPortfolio, setShowOnlyPortfolio] = useState(false);

  // Define therapeutic area categories
  const categories: Array<{ id: 'all' | TherapeuticArea; label: string; icon: string }> = [
    { id: 'all', label: 'ALL NEWS', icon: '📰' },
    { id: 'SMA', label: 'SMA', icon: '🧬' },
    { id: 'GLP-1', label: 'GLP-1 / METABOLIC', icon: '💊' },
    { id: 'Oncology', label: 'ONCOLOGY', icon: '🎗️' },
    { id: 'Rare Disease', label: 'RARE DISEASE', icon: '🔬' },
    { id: 'Immunology', label: 'IMMUNOLOGY', icon: '🛡️' },
    { id: 'Neurology', label: 'NEUROLOGY', icon: '🧠' },
    { id: 'Cardiovascular', label: 'CARDIO', icon: '❤️' },
    { id: 'Other', label: 'OTHER', icon: '📋' },
  ];

  // Filter and rank news
  const filteredNews = useMemo(() => {
    let filtered = [...news];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (item) =>
          item.therapeuticAreas &&
          item.therapeuticAreas.includes(selectedCategory as TherapeuticArea)
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.companies?.some((c) => c.toLowerCase().includes(query)) ||
          item.tickers?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Filter by tradable (SMID-cap)
    if (showOnlyTradable) {
      filtered = filtered.filter((item) => item.isTradable);
    }

    // Filter by portfolio relevance (using watchlist)
    if (showOnlyPortfolio) {
      filtered = filtered.filter((item) => {
        if (item.isPortfolioRelevant) return true;

        // Also check against watchlist manually
        if (item.tickers) {
          return item.tickers.some((ticker) =>
            portfolioWatchlist.some((w) => w.toUpperCase() === ticker.toUpperCase())
          );
        }
        return false;
      });
    }

    // Sort by importance and relevance score
    filtered.sort((a, b) => {
      // Critical news first
      const importanceOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const aImportance = importanceOrder[a.importance || 'Low'] || 0;
      const bImportance = importanceOrder[b.importance || 'Low'] || 0;

      if (aImportance !== bImportance) {
        return bImportance - aImportance;
      }

      // Portfolio relevance
      if (a.isPortfolioRelevant !== b.isPortfolioRelevant) {
        return a.isPortfolioRelevant ? -1 : 1;
      }

      // Relevance score
      const aScore = a.relevanceScore || 0;
      const bScore = b.relevanceScore || 0;
      if (aScore !== bScore) {
        return bScore - aScore;
      }

      // Date (newest first)
      return new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime();
    });

    return filtered;
  }, [news, selectedCategory, searchQuery, showOnlyTradable, showOnlyPortfolio, portfolioWatchlist]);

  // Get news count by category
  const getCategoryCount = (categoryId: 'all' | TherapeuticArea) => {
    if (categoryId === 'all') return news.length;
    return news.filter(
      (item) =>
        item.therapeuticAreas &&
        item.therapeuticAreas.includes(categoryId as TherapeuticArea)
    ).length;
  };

  // Get top news (Critical/High importance)
  const topNews = useMemo(() => {
    return filteredNews.filter(
      (item) => item.importance === 'Critical' || item.importance === 'High'
    ).slice(0, 5);
  }, [filteredNews]);

  return (
    <Panel
      title={title}
      cornerBrackets={cornerBrackets}
      className={clsx(styles.enhancedNewsFeed, className)}
      actions={
        <div className={styles.headerActions}>
          {onRefresh && (
            <Button
              variant="secondary"
              onClick={onRefresh}
              disabled={isRefreshing}
              size="sm"
            >
              {isRefreshing ? '⟳ REFRESHING...' : '↻ REFRESH'}
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        {/* Search and Filters */}
        <div className={styles.controls}>
          <div className={styles.searchRow}>
            <Input
              type="text"
              placeholder="Search by title, company, ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterRow}>
            <Button
              variant={showOnlyTradable ? 'primary' : 'ghost'}
              onClick={() => setShowOnlyTradable(!showOnlyTradable)}
              size="sm"
            >
              📊 TRADABLE ONLY
            </Button>
            <Button
              variant={showOnlyPortfolio ? 'primary' : 'ghost'}
              onClick={() => setShowOnlyPortfolio(!showOnlyPortfolio)}
              size="sm"
            >
              ⭐ PORTFOLIO ONLY
            </Button>
            <Badge variant="info">
              {filteredNews.length} ARTICLES
            </Badge>
          </div>
        </div>

        {/* Category Tabs */}
        {showCategoryTabs && (
          <div className={styles.categoryTabs}>
            {categories.map((cat) => {
              const count = getCategoryCount(cat.id);
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  className={clsx(
                    styles.categoryTab,
                    isActive && styles.active,
                    count === 0 && styles.disabled
                  )}
                  onClick={() => setSelectedCategory(cat.id)}
                  disabled={count === 0}
                >
                  <span className={styles.tabIcon}>{cat.icon}</span>
                  <span className={styles.tabLabel}>{cat.label}</span>
                  <Badge variant={isActive ? 'primary' : 'default'}>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}

        {/* Top News Ribbon (Critical/High only) */}
        {selectedCategory === 'all' && topNews.length > 0 && !searchQuery && (
          <div className={styles.topNewsRibbon}>
            <div className={styles.ribbonHeader}>
              <span className={styles.ribbonTitle}>🚨 TOP NEWS TODAY</span>
            </div>
            <div className={styles.topNewsList}>
              {topNews.map((item) => (
                <div key={item.id} className={styles.topNewsItem}>
                  <Badge variant={item.importance === 'Critical' ? 'error' : 'warning'}>
                    {item.importance}
                  </Badge>
                  <span className={styles.topNewsTitle}>{item.title}</span>
                  {item.companies && item.companies.length > 0 && (
                    <Badge variant="info">
                      {item.companies[0]}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News Feed */}
        <div className={styles.feedContainer}>
          {filteredNews.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No news items match your filters.</p>
              {(searchQuery || showOnlyTradable || showOnlyPortfolio) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setShowOnlyTradable(false);
                    setShowOnlyPortfolio(false);
                  }}
                >
                  CLEAR FILTERS
                </Button>
              )}
            </div>
          ) : (
            filteredNews.map((item) => (
              <NewsSummaryCard key={item.id} news={item} />
            ))
          )}
        </div>
      </div>
    </Panel>
  );
};
