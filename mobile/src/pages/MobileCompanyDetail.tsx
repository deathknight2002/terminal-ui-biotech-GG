import { FC, useState, useEffect } from 'react';
import { InteractiveStockChart } from '../components/InteractiveStockChart';
import './MobileCompanyDetail.css';

// Generate sample stock data
const generateStockData = (days: number) => {
  const data = [];
  const now = new Date();
  let basePrice = 145.67;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * 5;
    basePrice = Math.max(basePrice + change, 50);

    data.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(basePrice.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000) + 1000000,
    });
  }

  return data;
};

interface CompanyMetric {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

const COMPANY_INFO = {
  symbol: 'VRTX',
  name: 'Vertex Pharmaceuticals',
  sector: 'Biotechnology',
  marketCap: '$89.2B',
  currentPrice: 156.34,
  change: 2.87,
  changePercent: 1.87,
};

const KEY_METRICS: CompanyMetric[] = [
  { label: 'Market Cap', value: '$89.2B', change: '+5.2%', positive: true },
  { label: 'P/E Ratio', value: '27.8', change: '-0.3', positive: false },
  { label: '52W High', value: '$162.45', change: '+12.4%', positive: true },
  { label: '52W Low', value: '$112.30', change: '-8.1%', positive: false },
  { label: 'Avg Volume', value: '2.4M', change: '+15%', positive: true },
  { label: 'Dividend Yield', value: 'N/A', change: undefined, positive: undefined },
];

const PIPELINE_DRUGS = [
  {
    name: 'VX-548',
    indication: 'Acute Pain',
    phase: 'Phase III',
    progress: 75,
    status: 'success' as const,
  },
  {
    name: 'VX-264',
    indication: 'APOL1-mediated Kidney Disease',
    phase: 'Phase II',
    progress: 45,
    status: 'warning' as const,
  },
  {
    name: 'VX-147',
    indication: 'AATD Lung Disease',
    phase: 'Phase II',
    progress: 60,
    status: 'info' as const,
  },
];

const RECENT_NEWS = [
  {
    title: 'Vertex Reports Strong Q3 Earnings',
    time: '2 hours ago',
    source: 'Bloomberg',
  },
  {
    title: 'VX-548 Shows Promising Phase III Results',
    time: '5 hours ago',
    source: 'BioPharma Dive',
  },
  {
    title: 'FDA Grants Fast Track Designation',
    time: '1 day ago',
    source: 'FDA News',
  },
];

export const MobileCompanyDetail: FC = () => {
  const [stockData, setStockData] = useState(() => generateStockData(365));
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setStockData(generateStockData(365));
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    // Simulate real-time price updates every 5 seconds
    const interval = setInterval(() => {
      setStockData((prevData) => {
        const lastPoint = prevData[prevData.length - 1];
        const newPrice = lastPoint.value + (Math.random() - 0.5) * 2;
        const newPoint = {
          date: new Date().toISOString().split('T')[0],
          value: parseFloat(Math.max(newPrice, 50).toFixed(2)),
          volume: Math.floor(Math.random() * 5000000) + 1000000,
        };
        return [...prevData.slice(1), newPoint];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mobile-company-detail">
      {/* Header */}
      <div className="company-detail-header">
        <button className="back-button" onClick={() => window.history.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="company-header-info">
          <h1 className="company-symbol">{COMPANY_INFO.symbol}</h1>
          <p className="company-name">{COMPANY_INFO.name}</p>
        </div>
        <button className="refresh-button" onClick={handleRefresh}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={refreshing ? 'spinning' : ''}
          >
            <path
              d="M17 10C17 13.866 13.866 17 10 17C6.134 17 3 13.866 3 10C3 6.134 6.134 3 10 3C12.7 3 15 4.75 16.25 7.25"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M13 7L17 7L17 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="company-detail-content">
        {/* Stock Chart */}
        <div className="section">
          <InteractiveStockChart
            data={stockData}
            symbol={COMPANY_INFO.symbol}
            title={COMPANY_INFO.name}
            currentPrice={COMPANY_INFO.currentPrice}
            change={COMPANY_INFO.change}
            changePercent={COMPANY_INFO.changePercent}
          />
        </div>

        {/* Key Metrics */}
        <div className="section">
          <h2 className="section-title">Key Metrics</h2>
          <div className="metrics-grid">
            {KEY_METRICS.map((metric, index) => (
              <div key={index} className="metric-item">
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">{metric.value}</div>
                {metric.change && (
                  <div
                    className={`metric-change ${metric.positive ? 'positive' : 'negative'}`}
                  >
                    {metric.positive ? '↑' : '↓'} {metric.change}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline */}
        <div className="section">
          <h2 className="section-title">Drug Pipeline</h2>
          <div className="pipeline-list">
            {PIPELINE_DRUGS.map((drug, index) => (
              <div key={index} className="pipeline-item">
                <div className="pipeline-header">
                  <div className="pipeline-info">
                    <div className="drug-name">{drug.name}</div>
                    <div className="drug-indication">{drug.indication}</div>
                  </div>
                  <span className={`phase-badge ${drug.status}`}>{drug.phase}</span>
                </div>
                <div className="pipeline-progress">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${drug.status}`}
                      style={{ width: `${drug.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{drug.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent News */}
        <div className="section">
          <h2 className="section-title">Recent News</h2>
          <div className="news-list">
            {RECENT_NEWS.map((news, index) => (
              <div key={index} className="news-item">
                <div className="news-content">
                  <div className="news-title">{news.title}</div>
                  <div className="news-meta">
                    <span className="news-source">{news.source}</span>
                    <span className="news-time">{news.time}</span>
                  </div>
                </div>
                <button className="news-arrow">›</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
