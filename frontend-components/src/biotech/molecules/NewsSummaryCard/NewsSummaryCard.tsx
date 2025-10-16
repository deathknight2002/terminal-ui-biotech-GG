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
      case 'Trial Results':
        return 'info';
      case 'Regulatory':
      case 'FDA Approval':
        return 'warning';
      case 'Commercial':
      case 'Pipeline Update':
        return 'success';
      case 'Corporate':
      case 'M&A':
      case 'Partnership':
        return 'info';
      case 'Financing':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getImportanceBadge = (importance?: string) => {
    switch (importance) {
      case 'Critical':
        return { text: '🚨 CRITICAL', variant: 'error' as const };
      case 'High':
        return { text: '⚠️ HIGH', variant: 'warning' as const };
      case 'Medium':
        return { text: 'MEDIUM', variant: 'info' as const };
      default:
        return null;
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
          {news.importance && getImportanceBadge(news.importance) && (
            <Badge variant={getImportanceBadge(news.importance)!.variant}>
              {getImportanceBadge(news.importance)!.text}
            </Badge>
          )}
          {news.impact && (
            <Badge variant={getImpactVariant(news.impact)}>
              {news.impact} IMPACT
            </Badge>
          )}
          {news.isTradable && (
            <Badge variant="success">
              📊 TRADABLE
            </Badge>
          )}
          {news.isPortfolioRelevant && (
            <Badge variant="primary">
              ⭐ PORTFOLIO
            </Badge>
          )}
          {news.marketCapCategory && ['Small Cap', 'Micro Cap', 'Mid Cap'].includes(news.marketCapCategory) && (
            <Badge variant="info">
              {news.marketCapCategory}
            </Badge>
          )}
        </div>
      </div>

      {expanded && (
        <div className={styles.content}>
          <div className={styles.summary}>
            {news.summary}
          </div>
          
          {/* Display therapeutic areas */}
          {news.therapeuticAreas && news.therapeuticAreas.length > 0 && (
            <div className={styles.tags}>
              <strong>Therapeutic Areas:</strong>{' '}
              {news.therapeuticAreas.map((area, index) => (
                <Badge key={index} variant="info">
                  {area}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Display companies/tickers */}
          {news.companies && news.companies.length > 0 && (
            <div className={styles.tags}>
              <strong>Companies:</strong>{' '}
              {news.companies.map((company, index) => (
                <Badge key={index} variant="default">
                  {company}
                  {news.tickers && news.tickers[index] && ` (${news.tickers[index]})`}
                </Badge>
              ))}
            </div>
          )}
          
          {news.tags && news.tags.length > 0 && (
            <div className={styles.tags}>
              {news.tags.map((tag, index) => (
                <Badge key={index} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Display sentiment if available */}
          {news.sentiment && (
            <div className={styles.sentiment}>
              <strong>Sentiment:</strong>{' '}
              <Badge variant={
                news.sentiment.label === 'Positive' ? 'success' : 
                news.sentiment.label === 'Negative' ? 'error' : 'default'
              }>
                {news.sentiment.label}
              </Badge>
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
