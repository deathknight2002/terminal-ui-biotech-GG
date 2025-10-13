/**
 * XBI Companies Browser Page
 * 
 * Browse and search all XBI (SPDR S&P Biotech ETF) constituents.
 * Features: search, filter by sector/type, sort by market cap.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import './XBICompaniesPage.css';

interface XBIConstituent {
  ticker: string;
  name: string;
  company_type: string;
  market_cap: number;
  headquarters: string;
  is_xbi_constituent: boolean;
  therapeutic_areas: string[];
  is_current?: boolean;
  added_date?: string;
}

interface SyncStatus {
  xbi_constituents_count: number;
  last_updated: string | null;
}

export const XBICompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState<XBIConstituent[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<XBIConstituent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'market_cap' | 'name' | 'ticker'>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    loadCompanies();
    loadSyncStatus();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [companies, searchQuery, selectedType, selectedSector, sortBy, sortOrder]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/companies/xbi/constituents?active_only=true`);
      if (!response.ok) {
        throw new Error('Failed to load XBI constituents');
      }

      const data = await response.json();
      setCompanies(data.constituents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/companies/xbi/sync-status`);
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data);
      }
    } catch (err) {
      console.error('Error loading sync status:', err);
    }
  };

  const triggerSync = async (forceRefresh: boolean = false) => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/companies/xbi/sync?force_refresh=${forceRefresh}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      console.log('Sync completed:', result.statistics);

      // Reload companies after sync
      await loadCompanies();
      await loadSyncStatus();

      alert(`Sync completed!\n\nTotal: ${result.statistics.total_constituents}\nNew: ${result.statistics.new_companies}\nUpdated: ${result.statistics.updated_companies}\nFailed: ${result.statistics.failed_companies}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      console.error('Error syncing:', err);
    } finally {
      setSyncing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...companies];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.ticker.toLowerCase().includes(query) ||
          c.headquarters.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((c) => c.company_type === selectedType);
    }

    // Sector filter
    if (selectedSector !== 'all') {
      filtered = filtered.filter((c) =>
        c.therapeutic_areas.some((ta) => ta.includes(selectedSector))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'market_cap':
          comparison = (a.market_cap || 0) - (b.market_cap || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'ticker':
          comparison = a.ticker.localeCompare(b.ticker);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCompanies(filtered);
  };

  const formatMarketCap = (marketCap: number): string => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    }
    if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const uniqueTypes = [...new Set(companies.map((c) => c.company_type))].sort();
  const uniqueSectors = [
    ...new Set(companies.flatMap((c) => c.therapeutic_areas)),
  ].sort();

  if (loading) {
    return (
      <div className="xbi-companies-page">
        <Panel title="XBI COMPANIES BROWSER" cornerBrackets>
          <div className="loading-state">Loading XBI constituents...</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="xbi-companies-page">
      <Panel title="XBI COMPANIES BROWSER" cornerBrackets>
        {error && <div className="error-banner">{error}</div>}

        {/* Sync Status and Controls */}
        <div className="sync-controls">
          <div className="sync-status">
            {syncStatus && (
              <>
                <span className="status-label">XBI Constituents:</span>
                <span className="status-value">{syncStatus.xbi_constituents_count}</span>
                {syncStatus.last_updated && (
                  <>
                    <span className="status-label">Last Updated:</span>
                    <span className="status-value">
                      {formatDate(syncStatus.last_updated)}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="sync-buttons">
            <button
              className="sync-button"
              onClick={() => triggerSync(false)}
              disabled={syncing}
            >
              {syncing ? 'SYNCING...' : 'SYNC NOW'}
            </button>
            <button
              className="sync-button force-refresh"
              onClick={() => triggerSync(true)}
              disabled={syncing}
              title="Force refresh bypasses cache"
            >
              {syncing ? 'SYNCING...' : 'FORCE REFRESH'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-row">
            <div className="filter-group">
              <label>SEARCH</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Search name, ticker, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>COMPANY TYPE</label>
              <select
                className="filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>SECTOR</label>
              <select
                className="filter-select"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="all">All Sectors</option>
                {uniqueSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>SORT BY</label>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="market_cap">Market Cap</option>
                <option value="name">Name</option>
                <option value="ticker">Ticker</option>
              </select>
            </div>

            <div className="filter-group">
              <label>ORDER</label>
              <select
                className="filter-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="results-summary">
            Showing {filteredCompanies.length} of {companies.length} companies
          </div>
        </div>

        {/* Companies Grid */}
        <div className="companies-grid">
          {filteredCompanies.map((company) => (
            <div
              key={company.ticker}
              className="company-card"
              onClick={() => navigate(`/companies/${company.ticker}/profile`)}
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
                    {formatMarketCap(company.market_cap)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{company.headquarters}</span>
                </div>
                {company.therapeutic_areas.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Sectors:</span>
                    <span className="detail-value therapeutic-areas">
                      {company.therapeutic_areas.slice(0, 2).join(', ')}
                      {company.therapeutic_areas.length > 2 && ' +'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="no-results">
            No companies match your filters. Try adjusting your search criteria.
          </div>
        )}
      </Panel>
    </div>
  );
};
