import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import { API_ENDPOINTS, apiFetch } from '../config/api';
import './CompanyProfilePage.css';

interface CompanyProfile {
  ticker: string;
  name: string;
  company_type: string;
  description: string;
  website: string;
  investor_relations_url: string;
  headquarters: string;
  founded_year: number;
  employees: number;
  financials: {
    market_cap: number;
    enterprise_value: number | null;
    cash_position: number | null;
    latest_price: number | null;
    price_change: number | null;
    volume: number | null;
  };
  xbi_membership: {
    is_constituent: boolean;
    added_date: string | null;
    removed_date: string | null;
  };
  pipeline: {
    program_count: number;
    therapeutic_areas: string[];
  };
  catalysts: {
    upcoming_count: number;
  };
  updated_at: string | null;
}

interface CompanySource {
  id: number;
  type: string;
  title: string;
  url: string;
  published_date: string | null;
  description: string;
  filing_type: string | null;
  accession_number: string | null;
}

interface CompanyArticle {
  id: number;
  title: string;
  source: string;
  url: string;
  published_date: string;
  summary: string;
  relevance_score: number;
  sentiment_score: number;
}

interface OwnershipRecord {
  institution_name: string;
  shares_held: number;
  percent_owned: number;
  value_usd: number;
  shares_change: number;
  percent_change: number;
  form_type: string;
}

interface PipelineProgram {
  id: number;
  name: string;
  generic_name: string;
  indication: string;
  phase: string;
  mechanism: string;
  target: string;
  status: string;
}

interface PipelineByTA {
  therapeutic_area: string;
  programs: PipelineProgram[];
  count: number;
}

interface Catalyst {
  id: number;
  title: string;
  event_type: string;
  date: string;
  drug: string;
  description: string;
  probability: number;
  impact: string;
  source_url: string;
}


export const CompanyProfilePage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [sources, setSources] = useState<CompanySource[]>([]);
  const [articles, setArticles] = useState<CompanyArticle[]>([]);
  const [ownership, setOwnership] = useState<OwnershipRecord[]>([]);
  const [pipeline, setPipeline] = useState<PipelineByTA[]>([]);
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  // const [stockData, setStockData] = useState<StockDataPoint[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'catalysts' | 'sources' | 'ownership'>('overview');

  useEffect(() => {
    if (!ticker) {
      setError('No ticker provided');
      setLoading(false);
      return;
    }

    loadCompanyData();
  }, [ticker]);

  const loadCompanyData = async () => {
    if (!ticker) return;

    setLoading(true);
    setError(null);

    try {
      // Load all company data in parallel using centralized API endpoints
      const [
        profileData,
        sourcesData,
        articlesData,
        ownershipData,
        pipelineData,
        catalystsData,
        // stockDataRes, // TODO: Add when stock-chart endpoint is available
      ] = await Promise.all([
        apiFetch<CompanyProfile>(API_ENDPOINTS.COMPANIES.PROFILE(ticker)),
        apiFetch<{ sources: CompanySource[] }>(`${API_ENDPOINTS.COMPANIES.SOURCES(ticker)}?limit=20`),
        apiFetch<{ articles: CompanyArticle[] }>(`${API_ENDPOINTS.COMPANIES.ARTICLES(ticker)}?days=90&limit=20`),
        apiFetch<{ ownership: OwnershipRecord[] }>(`${API_ENDPOINTS.COMPANIES.OWNERSHIP(ticker)}?top_n=20`),
        apiFetch<{ pipeline: PipelineByTA[] }>(API_ENDPOINTS.COMPANIES.PIPELINE(ticker)),
        apiFetch<{ catalysts: Catalyst[] }>(`${API_ENDPOINTS.COMPANIES.CATALYSTS(ticker)}?upcoming_days=90`),
        // apiFetch<{ prices: StockDataPoint[] }>(`${API_ENDPOINTS.COMPANIES.FINANCIALS(ticker)}?days=90`),
      ]);

      setProfile(profileData);
      setSources(sourcesData.sources || []);
      setArticles(articlesData.articles || []);
      setOwnership(ownershipData.ownership || []);
      setPipeline(pipelineData.pipeline || []);
      setCatalysts(catalystsData.catalysts || []);
      // setStockData(stockDataRes.prices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'Approved': return 'var(--status-success)';
      case 'Filed': return 'var(--status-info)';
      case 'Phase III': return 'var(--accent-cyan)';
      case 'Phase II': return 'var(--accent-purple)';
      case 'Phase I': return 'var(--accent-amber)';
      case 'Preclinical': return 'var(--text-tertiary)';
      default: return 'var(--text-secondary)';
    }
  };

  if (loading) {
    return (
      <div className="company-profile-page">
        <Panel title="LOADING" cornerBrackets>
          <div className="loading-state">Loading company profile...</div>
        </Panel>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="company-profile-page">
        <Panel title="ERROR" cornerBrackets variant="error">
          <div className="error-state">
            <p>{error || 'Company not found'}</p>
            <button onClick={() => navigate('/')} className="btn-back">
              ← BACK TO DASHBOARD
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="company-profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-top">
          <button onClick={() => navigate(-1)} className="btn-back-small">
            ← BACK
          </button>
          <div className="profile-title-section">
            <h1 className="profile-ticker">{profile.ticker}</h1>
            <h2 className="profile-name">{profile.name}</h2>
            {profile.xbi_membership.is_constituent && (
              <span className="xbi-badge">XBI CONSTITUENT</span>
            )}
          </div>
        </div>

        <div className="profile-quick-stats">
          <div className="quick-stat">
            <div className="quick-stat-label">PRICE</div>
            <div className="quick-stat-value">
              {formatCurrency(profile.financials.latest_price)}
            </div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-label">MARKET CAP</div>
            <div className="quick-stat-value">
              {formatCurrency(profile.financials.market_cap)}
            </div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-label">PIPELINE</div>
            <div className="quick-stat-value">
              {profile.pipeline.program_count} PROGRAMS
            </div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-label">CATALYSTS</div>
            <div className="quick-stat-value">
              {profile.catalysts.upcoming_count} UPCOMING
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          OVERVIEW
        </button>
        <button
          className={`profile-tab ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          PIPELINE ({profile.pipeline.program_count})
        </button>
        <button
          className={`profile-tab ${activeTab === 'catalysts' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalysts')}
        >
          CATALYSTS ({catalysts.length})
        </button>
        <button
          className={`profile-tab ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          SOURCES ({sources.length})
        </button>
        <button
          className={`profile-tab ${activeTab === 'ownership' ? 'active' : ''}`}
          onClick={() => setActiveTab('ownership')}
        >
          OWNERSHIP ({ownership.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Company Info */}
              <Panel title="COMPANY INFO" cornerBrackets>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">TYPE:</span>
                    <span className="info-value">{profile.company_type || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">HQ:</span>
                    <span className="info-value">{profile.headquarters || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">FOUNDED:</span>
                    <span className="info-value">{profile.founded_year || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">EMPLOYEES:</span>
                    <span className="info-value">{formatNumber(profile.employees)}</span>
                  </div>
                  {profile.website && (
                    <div className="info-row">
                      <span className="info-label">WEBSITE:</span>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="info-link">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile.investor_relations_url && (
                    <div className="info-row">
                      <span className="info-label">IR:</span>
                      <a href={profile.investor_relations_url} target="_blank" rel="noopener noreferrer" className="info-link">
                        Investor Relations
                      </a>
                    </div>
                  )}
                </div>
                {profile.description && (
                  <div className="company-description">
                    <p>{profile.description}</p>
                  </div>
                )}
              </Panel>

              {/* Recent Articles */}
              <Panel title="RECENT ARTICLES" cornerBrackets>
                <div className="articles-list">
                  {articles.length === 0 ? (
                    <div className="empty-state">No recent articles</div>
                  ) : (
                    articles.slice(0, 5).map(article => (
                      <div key={article.id} className="article-item">
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-title">
                          {article.title}
                        </a>
                        <div className="article-meta">
                          <span className="article-source">{article.source}</span>
                          <span className="article-date">{formatDate(article.published_date)}</span>
                        </div>
                        {article.summary && <p className="article-summary">{article.summary}</p>}
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>

            {/* Therapeutic Areas */}
            {profile.pipeline.therapeutic_areas.length > 0 && (
              <Panel title="THERAPEUTIC AREAS" cornerBrackets>
                <div className="therapeutic-areas-list">
                  {profile.pipeline.therapeutic_areas.map(ta => (
                    <span key={ta} className="therapeutic-area-badge">{ta}</span>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="pipeline-tab">
            {pipeline.length === 0 ? (
              <Panel title="NO PIPELINE DATA" cornerBrackets>
                <div className="empty-state">No pipeline programs available</div>
              </Panel>
            ) : (
              pipeline.map(ta => (
                <Panel key={ta.therapeutic_area} title={`${ta.therapeutic_area.toUpperCase()} (${ta.count})`} cornerBrackets>
                  <div className="pipeline-programs">
                    {ta.programs.map(program => (
                      <div key={program.id} className="program-card">
                        <div className="program-header">
                          <h3 className="program-name">{program.name}</h3>
                          <span 
                            className="program-phase" 
                            style={{ color: getPhaseColor(program.phase) }}
                          >
                            {program.phase}
                          </span>
                        </div>
                        {program.generic_name && (
                          <div className="program-generic">{program.generic_name}</div>
                        )}
                        <div className="program-indication">{program.indication || 'N/A'}</div>
                        {program.mechanism && (
                          <div className="program-detail">
                            <span className="detail-label">MOA:</span> {program.mechanism}
                          </div>
                        )}
                        {program.target && (
                          <div className="program-detail">
                            <span className="detail-label">TARGET:</span> {program.target}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>
              ))
            )}
          </div>
        )}

        {activeTab === 'catalysts' && (
          <div className="catalysts-tab">
            <Panel title="UPCOMING CATALYSTS (90 DAYS)" cornerBrackets>
              {catalysts.length === 0 ? (
                <div className="empty-state">No upcoming catalysts</div>
              ) : (
                <div className="catalysts-list">
                  {catalysts.map(catalyst => (
                    <div key={catalyst.id} className="catalyst-card">
                      <div className="catalyst-header">
                        <h3 className="catalyst-title">{catalyst.title}</h3>
                        <span className="catalyst-date">{formatDate(catalyst.date)}</span>
                      </div>
                      <div className="catalyst-type">{catalyst.event_type}</div>
                      {catalyst.drug && (
                        <div className="catalyst-drug">DRUG: {catalyst.drug}</div>
                      )}
                      {catalyst.description && (
                        <p className="catalyst-description">{catalyst.description}</p>
                      )}
                      <div className="catalyst-metrics">
                        {catalyst.probability && (
                          <span className="catalyst-metric">
                            PROBABILITY: {(catalyst.probability * 100).toFixed(0)}%
                          </span>
                        )}
                        {catalyst.impact && (
                          <span className="catalyst-metric">
                            IMPACT: {catalyst.impact.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="sources-tab">
            <Panel title="COMPANY SOURCES" cornerBrackets>
              {sources.length === 0 ? (
                <div className="empty-state">No sources available</div>
              ) : (
                <div className="sources-list">
                  {sources.map(source => (
                    <div key={source.id} className="source-card">
                      <div className="source-header">
                        <span className="source-type">{source.type}</span>
                        <span className="source-date">{formatDate(source.published_date)}</span>
                      </div>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="source-title">
                        {source.title}
                      </a>
                      {source.description && (
                        <p className="source-description">{source.description}</p>
                      )}
                      {source.filing_type && (
                        <div className="source-filing-info">
                          Filing Type: {source.filing_type}
                          {source.accession_number && ` | ${source.accession_number}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {activeTab === 'ownership' && (
          <div className="ownership-tab">
            <Panel title="INSTITUTIONAL OWNERSHIP" cornerBrackets>
              {ownership.length === 0 ? (
                <div className="empty-state">No ownership data available</div>
              ) : (
                <div className="ownership-table">
                  <div className="ownership-header">
                    <div className="ownership-col">INSTITUTION</div>
                    <div className="ownership-col">SHARES</div>
                    <div className="ownership-col">% OWNED</div>
                    <div className="ownership-col">VALUE</div>
                    <div className="ownership-col">CHANGE</div>
                  </div>
                  {ownership.map((record, idx) => (
                    <div key={idx} className="ownership-row">
                      <div className="ownership-col">{record.institution_name}</div>
                      <div className="ownership-col">{formatNumber(record.shares_held)}</div>
                      <div className="ownership-col">{record.percent_owned?.toFixed(2)}%</div>
                      <div className="ownership-col">{formatCurrency(record.value_usd)}</div>
                      <div className={`ownership-col ${record.percent_change > 0 ? 'positive' : record.percent_change < 0 ? 'negative' : ''}`}>
                        {record.percent_change > 0 ? '+' : ''}{record.percent_change?.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
};
