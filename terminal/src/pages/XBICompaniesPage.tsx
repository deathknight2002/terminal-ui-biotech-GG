import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import { API_ENDPOINTS, apiFetch } from '../config/api';
import './XBICompaniesPage.css';

interface XBICompany {
  ticker: string;
  name: string;
  company_type: string;
  market_cap: number;
  headquarters: string;
  therapeutic_areas: string[];
  is_current: boolean;
}

interface XBIResponse {
  constituents: XBICompany[];
  count: number;
  total: number;
  limit: number;
  offset: number;
}

export const XBICompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState<XBICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('');
  const [minMarketCap, setMinMarketCap] = useState<string>('');
  const [maxMarketCap, setMaxMarketCap] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadCompanies();
  }, [searchTerm, companyTypeFilter, minMarketCap, maxMarketCap, currentPage]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        active_only: 'true',
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (companyTypeFilter) params.append('company_type', companyTypeFilter);
      if (minMarketCap) params.append('min_market_cap', minMarketCap);
      if (maxMarketCap) params.append('max_market_cap', maxMarketCap);

      const url = `${API_ENDPOINTS.COMPANIES.XBI_LIST}/constituents?${params}`;
      const data = await apiFetch<XBIResponse>(url);
      
      setCompanies(data.constituents);
      setTotalResults(data.total);
    } catch (err) {
      console.error('Error loading XBI companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1_000_000_000) {
      return `$${(marketCap / 1_000_000_000).toFixed(1)}B`;
    } else if (marketCap >= 1_000_000) {
      return `$${(marketCap / 1_000_000).toFixed(1)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  const handleCompanyClick = (ticker: string) => {
    navigate(`/company/${ticker}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCompanyTypeFilter('');
    setMinMarketCap('');
    setMaxMarketCap('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalResults / pageSize);

  const companyTypes = [
    'Big Pharma',
    'Large Cap Biotech',
    'Mid Cap Biotech',
    'Small Cap Biotech',
  ];

  return (
    <div className="xbi-companies-page">
      <div className="terminal-headline">
        <div className="eyebrow">SPDR S&P BIOTECH ETF (XBI) CONSTITUENTS</div>
        <h1>XBI COMPANY DIRECTORY</h1>
        <div className="subtitle">
          Comprehensive profiles for all XBI constituents • Market data • Pipeline intelligence
        </div>
      </div>

      {/* Filters Panel */}
      <Panel title="SEARCH & FILTERS" cornerBrackets className="filters-panel">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="search">SEARCH</label>
            <input
              id="search"
              type="text"
              placeholder="Company name or ticker..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="terminal-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="company-type">COMPANY TYPE</label>
            <select
              id="company-type"
              value={companyTypeFilter}
              onChange={(e) => {
                setCompanyTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="terminal-select"
            >
              <option value="">All Types</option>
              {companyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="min-cap">MIN MARKET CAP ($)</label>
            <input
              id="min-cap"
              type="number"
              placeholder="e.g., 1000000000"
              value={minMarketCap}
              onChange={(e) => {
                setMinMarketCap(e.target.value);
                setCurrentPage(1);
              }}
              className="terminal-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="max-cap">MAX MARKET CAP ($)</label>
            <input
              id="max-cap"
              type="number"
              placeholder="e.g., 100000000000"
              value={maxMarketCap}
              onChange={(e) => {
                setMaxMarketCap(e.target.value);
                setCurrentPage(1);
              }}
              className="terminal-input"
            />
          </div>

          <div className="filter-actions">
            <button onClick={handleClearFilters} className="clear-filters-btn">
              CLEAR FILTERS
            </button>
          </div>
        </div>

        <div className="results-summary">
          Showing {companies.length} of {totalResults} companies
          {(searchTerm || companyTypeFilter || minMarketCap || maxMarketCap) && (
            <span className="filters-active"> (filtered)</span>
          )}
        </div>
      </Panel>

      {/* Companies List */}
      {loading ? (
        <Panel title="LOADING..." cornerBrackets>
          <div className="loading-state">Fetching XBI company data...</div>
        </Panel>
      ) : error ? (
        <Panel title="ERROR" cornerBrackets>
          <div className="error-state">{error}</div>
        </Panel>
      ) : companies.length === 0 ? (
        <Panel title="NO RESULTS" cornerBrackets>
          <div className="empty-state">
            No companies found matching your criteria. Try adjusting your filters.
          </div>
        </Panel>
      ) : (
        <>
          <Panel title="XBI CONSTITUENTS" cornerBrackets className="companies-list-panel">
            <div className="companies-grid">
              {companies.map((company) => (
                <div
                  key={company.ticker}
                  className="company-card"
                  onClick={() => handleCompanyClick(company.ticker)}
                >
                  <div className="company-card-header">
                    <div className="company-ticker">{company.ticker}</div>
                    <div className="company-type">{company.company_type}</div>
                  </div>
                  
                  <div className="company-name">{company.name}</div>
                  
                  <div className="company-details">
                    <div className="detail-row">
                      <span className="detail-label">Market Cap:</span>
                      <span className="detail-value">
                        {company.market_cap ? formatMarketCap(company.market_cap) : 'N/A'}
                      </span>
                    </div>
                    
                    {company.headquarters && (
                      <div className="detail-row">
                        <span className="detail-label">HQ:</span>
                        <span className="detail-value">{company.headquarters}</span>
                      </div>
                    )}
                    
                    {company.therapeutic_areas.length > 0 && (
                      <div className="therapeutic-areas">
                        {company.therapeutic_areas.slice(0, 3).map((area, idx) => (
                          <span key={idx} className="ta-badge">
                            {area}
                          </span>
                        ))}
                        {company.therapeutic_areas.length > 3 && (
                          <span className="ta-badge more">
                            +{company.therapeutic_areas.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="company-card-footer">
                    <span className="view-profile">VIEW PROFILE →</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← PREVIOUS
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                NEXT →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
