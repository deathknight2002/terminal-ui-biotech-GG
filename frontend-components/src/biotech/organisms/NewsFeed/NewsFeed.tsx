import React from 'react';
import clsx from 'clsx';
import { Panel } from '../../../terminal/organisms/Panel';
import { Button } from '../../../terminal/atoms/Button';
import { NewsSummaryCard } from '../../molecules/NewsSummaryCard';
import type { NewsItem } from '../../../types/biotech';
import styles from './NewsFeed.module.css';

export interface NewsFeedProps {
  news: NewsItem[];
  title?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
  cornerBrackets?: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  news,
  title = 'BIOTECH NEWS BRIEFING',
  onRefresh,
  isRefreshing = false,
  className,
  cornerBrackets = true,
}) => {
  return (
    <Panel
      title={title}
      cornerBrackets={cornerBrackets}
      className={clsx(styles.newsFeed, className)}
      actions={
        onRefresh && (
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'REFRESHING...' : '↻ REFRESH'}
          </Button>
        )
      }
    >
      <div className={styles.feedContainer}>
        {news.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No news items available.</p>
            {onRefresh && (
              <Button variant="primary" onClick={onRefresh}>
                Load News
              </Button>
            )}
          </div>
        ) : (
          news.map((item) => (
            <NewsSummaryCard key={item.id} news={item} />
          ))
        )}
      </div>
    </Panel>
  );
};
