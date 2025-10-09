import React, { useState, useEffect } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import './NewsPage.css';

interface Article {
  id: number;
  title: string;
  url: string;
  summary: string;
  source: string;
  published_at: string;
  sentiments?: {
    regulatory?: { score: number; rationale: string };
    clinical?: { score: number; rationale: string };
    mna?: { score: number; rationale: string };
  };
}

interface NewsDiff {
  since: string;
  changes: {
    added: number;
    updated: number;
    deleted: number;
  };
  highlights: Array<{
    type: 'new' | 'updated' | 'deleted';
    entity: string;
    summary: string;
    timestamp: string;
    article_id?: number;
    url?: string;
  }>;
  last_check: string;
}

export function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<NewsDiff | null>(null);
  const [showDiffRibbon, setShowDiffRibbon] = useState(true);

  useEffect(() => {
    fetchNews();
    fetchDiff();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/news/latest?limit=20');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiff = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/news/diff?since=1h');
      const data = await response.json();
      setDiff(data);
    } catch (err) {
      console.error('Failed to fetch diff:', err);
    }
  };

  const getSentimentBadge = (score: number) => {
    if (score > 0.3) return { label: 'POSITIVE', class: 'positive' };
    if (score < -0.3) return { label: 'NEGATIVE', class: 'negative' };
    return { label: 'NEUTRAL', class: 'neutral' };
  };

  const renderDiffRibbon = () => {
    if (!diff || !showDiffRibbon) return null;

    const hasChanges = diff.changes.added > 0 || diff.changes.updated > 0 || diff.changes.deleted > 0;

    if (!hasChanges) return null;

    return (
      <div className="diff-ribbon">
        <div className="diff-header">
          <div className="diff-title">
            📊 SINCE LAST REFRESH
            <span className="diff-time">
              {new Date(diff.since).toLocaleTimeString()}
            </span>
          </div>
          <button
            className="diff-close"
            onClick={() => setShowDiffRibbon(false)}
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="diff-stats">
          {diff.changes.added > 0 && (
            <div className="diff-stat added">
              <span className="stat-value">{diff.changes.added}</span>
              <span className="stat-label">NEW</span>
            </div>
          )}
          {diff.changes.updated > 0 && (
            <div className="diff-stat updated">
              <span className="stat-value">{diff.changes.updated}</span>
              <span className="stat-label">UPDATED</span>
            </div>
          )}
          {diff.changes.deleted > 0 && (
            <div className="diff-stat deleted">
              <span className="stat-value">{diff.changes.deleted}</span>
              <span className="stat-label">DELETED</span>
            </div>
          )}
        </div>
        {diff.highlights.length > 0 && (
          <div className="diff-highlights">
            {diff.highlights.slice(0, 3).map((highlight, idx) => (
              <div key={idx} className={`diff-highlight diff-${highlight.type}`}>
                <span className="highlight-icon">
                  {highlight.type === 'new' ? '🆕' : highlight.type === 'updated' ? '🔄' : '🗑️'}
                </span>
                <span className="highlight-text">{highlight.summary}</span>
                {highlight.url && (
                  <a
                    href={highlight.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="highlight-link"
                  >
                    →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="news-page">
      <Panel
        title="NEWS STREAM"
        cornerBrackets
        variant="glass"
      >
        {renderDiffRibbon()}
        
        {loading && <div className="loading-state">Loading news articles...</div>}
        {error && <div className="error-state">{error}</div>}
        
        {!loading && !error && articles.length === 0 && (
          <div className="empty-state">
            No articles available. Use the Refresh button to fetch news.
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="news-list">
            {articles.map((article) => (
              <div key={article.id} className="news-article">
                <div className="article-header">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="article-title"
                  >
                    {article.title}
                    <span className="external-link-icon">🔗</span>
                  </a>
                  <span className="article-source">{article.source}</span>
                </div>
                
                {article.summary && (
                  <div className="article-summary">{article.summary}</div>
                )}
                
                <div className="article-meta">
                  <span className="article-date">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString()
                      : 'No date'}
                  </span>
                  
                  {article.sentiments && (
                    <div className="sentiment-badges">
                      {article.sentiments.regulatory && (
                        <span className={`sentiment-badge ${getSentimentBadge(article.sentiments.regulatory.score).class}`}>
                          REG: {getSentimentBadge(article.sentiments.regulatory.score).label}
                        </span>
                      )}
                      {article.sentiments.clinical && (
                        <span className={`sentiment-badge ${getSentimentBadge(article.sentiments.clinical.score).class}`}>
                          CLIN: {getSentimentBadge(article.sentiments.clinical.score).label}
                        </span>
                      )}
                      {article.sentiments.mna && (
                        <span className={`sentiment-badge ${getSentimentBadge(article.sentiments.mna.score).class}`}>
                          M&A: {getSentimentBadge(article.sentiments.mna.score).label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
