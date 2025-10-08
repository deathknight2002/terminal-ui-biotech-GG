import { FC, useState, useEffect } from 'react';
import './MobileNews.css';

interface Article {
  id: number;
  title: string;
  url: string;
  summary: string;
  source: string;
  published_at: string;
  sentiments?: {
    regulatory?: { score: number };
    clinical?: { score: number };
    mna?: { score: number };
  };
}

export const MobileNews: FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/news/latest?limit=20');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return '#00ff88';
    if (score < -0.3) return '#ff4466';
    return '#ffaa00';
  };

  return (
    <div className="mobile-news-page">
      <div className="mobile-page-header">
        <h1>NEWS STREAM</h1>
        <p className="page-subtitle">Latest biotech intelligence</p>
      </div>

      {loading && (
        <div className="mobile-loading">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="mobile-empty">
          <p>No articles available</p>
          <p className="empty-hint">Use the refresh button to fetch news</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="mobile-news-list">
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-news-card"
            >
              <div className="news-card-header">
                <h3 className="news-card-title">{article.title}</h3>
                <span className="news-card-source">{article.source}</span>
              </div>
              
              {article.summary && (
                <p className="news-card-summary">{article.summary}</p>
              )}
              
              <div className="news-card-meta">
                <span className="news-card-date">
                  {article.published_at
                    ? new Date(article.published_at).toLocaleDateString()
                    : 'No date'}
                </span>
                
                {article.sentiments && (
                  <div className="news-card-sentiments">
                    {article.sentiments.regulatory && (
                      <span
                        className="sentiment-dot"
                        style={{ backgroundColor: getSentimentColor(article.sentiments.regulatory.score) }}
                        title="Regulatory sentiment"
                      />
                    )}
                    {article.sentiments.clinical && (
                      <span
                        className="sentiment-dot"
                        style={{ backgroundColor: getSentimentColor(article.sentiments.clinical.score) }}
                        title="Clinical sentiment"
                      />
                    )}
                    {article.sentiments.mna && (
                      <span
                        className="sentiment-dot"
                        style={{ backgroundColor: getSentimentColor(article.sentiments.mna.score) }}
                        title="M&A sentiment"
                      />
                    )}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
