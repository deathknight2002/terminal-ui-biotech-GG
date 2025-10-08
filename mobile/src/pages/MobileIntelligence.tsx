
import { FC } from 'react';
import './MobileIntelligence.css';

const MARKET_NEWS = [
  { title: 'FDA Grants Priority Review', company: 'BioTech Inc', time: '1h ago', type: 'regulatory' },
  { title: 'Q4 Earnings Beat Expectations', company: 'PharmaCo', time: '3h ago', type: 'financial' },
  { title: 'Strategic Partnership Announced', company: 'GeneTech', time: '5h ago', type: 'deal' },
  { title: 'Phase III Results Published', company: 'MedBio Corp', time: '8h ago', type: 'clinical' },
];

const COMPETITORS = [
  { name: 'Company A', marketCap: '$45B', change: '+3.2%', positive: true },
  { name: 'Company B', marketCap: '$32B', change: '-1.5%', positive: false },
  { name: 'Company C', marketCap: '$28B', change: '+2.8%', positive: true },
];

export const MobileIntelligence: FC = () => {
  return (
    <div className="mobile-intelligence">
      <div className="mobile-page-title">Intelligence</div>

      {/* Market News */}
      <div className="mobile-glass-panel">
        <div className="mobile-panel-header">
          <h2 className="mobile-panel-title">Market News</h2>
          <button className="ios-button">All News</button>
        </div>
        <div className="mobile-news-list">
          {MARKET_NEWS.map((news, index) => (
            <div key={index} className="mobile-news-item">
              <div className="mobile-news-type-icon">
                {news.type === 'regulatory' && '📋'}
                {news.type === 'financial' && '💰'}
                {news.type === 'deal' && '🤝'}
                {news.type === 'clinical' && '🔬'}
              </div>
              <div className="mobile-news-content">
                <div className="mobile-news-title">{news.title}</div>
                <div className="mobile-news-meta">
                  {news.company} • {news.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Landscape */}
      <div className="mobile-glass-panel">
        <h2 className="mobile-panel-title">Competitive Landscape</h2>
        <div className="mobile-competitors-list">
          {COMPETITORS.map((competitor, index) => (
            <div key={index} className="mobile-competitor-item">
              <div className="mobile-competitor-info">
                <div className="mobile-competitor-name">{competitor.name}</div>
                <div className="mobile-competitor-cap">{competitor.marketCap}</div>
              </div>
              <div className={`mobile-competitor-change ${competitor.positive ? 'positive' : 'negative'}`}>
                {competitor.positive ? '↑' : '↓'} {competitor.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="mobile-glass-panel mobile-ai-panel">
        <div className="mobile-ai-header">
          <h2 className="mobile-panel-title">🧠 AI Insights</h2>
        </div>
        <div className="mobile-ai-insight">
          <div className="mobile-ai-insight-title">Market Opportunity</div>
          <div className="mobile-ai-insight-text">
            Current pipeline shows strong potential in oncology segment with estimated TAM of $45B by 2028.
          </div>
        </div>
        <div className="mobile-ai-insight">
          <div className="mobile-ai-insight-title">Risk Assessment</div>
          <div className="mobile-ai-insight-text">
            Patent expiration risks in 2026 offset by promising Phase III candidates entering late-stage development.
          </div>
        </div>
      </div>
    </div>
  );
};
