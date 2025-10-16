import React, { useState } from 'react';
import clsx from 'clsx';
import { Badge } from '../../../terminal/atoms/Badge';
import { Button } from '../../../terminal/atoms/Button';
import type { NewsItem } from '../../../types/biotech';
import styles from './NewsSummaryCard.module.css';

export interface NewsSummaryCardProps {
  news: NewsItem;
  defaultExpanded?: boolean;
  className?: string;
}

export const NewsSummaryCard: React.FC<NewsSummaryCardProps> = ({
  news,
  defaultExpanded = false,
  className,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getImpactVariant = (impact?: string): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' | 'idle' => {
    switch (impact) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getCategoryVariant = (category?: string): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' | 'idle' => {
    switch (category) {
      case 'Clinical':
        return 'info';
      case 'Regulatory':
        return 'warning';
      case 'Commercial':
        return 'success';
      case 'Corporate':
      case 'M&A':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className={clsx(styles.card, expanded && styles.expanded, className)}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{news.title}</h3>
          <button className={styles.expandButton} aria-label={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? '▼' : '▶'}
          </button>
        </div>
        <div className={styles.metadata}>
          <span className={styles.date}>{formatDate(news.date)}</span>
          {news.source && <span className={styles.source}>• {news.source}</span>}
          {news.category && (
            <Badge variant={getCategoryVariant(news.category)}>
              {news.category}
            </Badge>
          )}
          {news.impact && (
            <Badge variant={getImpactVariant(news.impact)}>
              {news.impact} IMPACT
            </Badge>
          )}
        </div>
      </div>

      {expanded && (
        <div className={styles.content}>
          <div className={styles.summary}>
            {news.summary}
          </div>
          {news.tags && news.tags.length > 0 && (
            <div className={styles.tags}>
              {news.tags.map((tag, index) => (
                <Badge key={index} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {news.url && (
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => window.open(news.url, '_blank', 'noopener,noreferrer')}
              >
                READ FULL ARTICLE →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
