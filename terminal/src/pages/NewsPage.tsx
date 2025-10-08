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

export function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
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

  const getSentimentBadge = (score: number) => {
    if (score > 0.3) return { label: 'POSITIVE', class: 'positive' };
    if (score < -0.3) return { label: 'NEGATIVE', class: 'negative' };
    return { label: 'NEUTRAL', class: 'neutral' };
  };

  return (
    <div className="news-page">
      <Panel
        title="NEWS STREAM"
        cornerBrackets
        variant="glass"
      >
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
