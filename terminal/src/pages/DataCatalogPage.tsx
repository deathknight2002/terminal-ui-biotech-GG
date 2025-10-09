import React, { useState, useEffect } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import './DataCatalogPage.css';

interface DataSource {
  name: string;
  category: 'news' | 'trials' | 'catalysts' | 'companies' | 'diseases' | 'epidemiology';
  description: string;
  fields: Array<{
    name: string;
    type: string;
    unit?: string;
    description: string;
  }>;
  freshness: {
    last_updated: string;
    status: 'fresh' | 'stale' | 'error';
    update_frequency: string;
  };
  license: string;
  provider: string;
  coverage: {
    records: number;
    date_range?: {
      start: string;
      end: string;
    };
  };
}

export function DataCatalogPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDataCatalog();
  }, []);

  const fetchDataCatalog = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockData: DataSource[] = [
        {
          name: 'News Articles',
          category: 'news',
          description: 'Biotech and pharmaceutical news from multiple sources',
          fields: [
            { name: 'title', type: 'string', description: 'Article headline' },
            { name: 'url', type: 'url', description: 'Source link (verified)' },
            { name: 'summary', type: 'text', description: 'Article summary/excerpt' },
            { name: 'source', type: 'string', description: 'News source name' },
            { name: 'published_at', type: 'timestamp', description: 'Publication date/time' },
            { name: 'sentiment_regulatory', type: 'float', unit: 'score', description: 'Regulatory sentiment (-1 to 1)' },
            { name: 'sentiment_clinical', type: 'float', unit: 'score', description: 'Clinical sentiment (-1 to 1)' },
            { name: 'sentiment_mna', type: 'float', unit: 'score', description: 'M&A sentiment (-1 to 1)' },
          ],
          freshness: {
            last_updated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'fresh',
            update_frequency: 'Manual refresh'
          },
          license: 'Public domain / Fair use',
          provider: 'Multiple news sources',
          coverage: {
            records: 1247,
            date_range: {
              start: '2024-01-01',
              end: new Date().toISOString().split('T')[0]
            }
          }
        },
        {
          name: 'Clinical Trials',
          category: 'trials',
          description: 'Clinical trials data from ClinicalTrials.gov',
          fields: [
            { name: 'nct_id', type: 'string', description: 'NCT identifier' },
            { name: 'title', type: 'string', description: 'Trial title' },
            { name: 'phase', type: 'enum', description: 'Phase I/II/III/IV' },
            { name: 'status', type: 'enum', description: 'Trial status' },
            { name: 'enrollment', type: 'integer', unit: 'participants', description: 'Target enrollment' },
            { name: 'sponsor', type: 'string', description: 'Lead sponsor organization' },
            { name: 'indication', type: 'string', description: 'Target disease/condition' },
            { name: 'start_date', type: 'date', description: 'Trial start date' },
          ],
          freshness: {
            last_updated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            status: 'fresh',
            update_frequency: 'Manual refresh'
          },
          license: 'Public domain (ClinicalTrials.gov)',
          provider: 'ClinicalTrials.gov',
          coverage: {
            records: 892,
            date_range: {
              start: '2020-01-01',
              end: new Date().toISOString().split('T')[0]
            }
          }
        },
        {
          name: 'Catalyst Calendar',
          category: 'catalysts',
          description: 'Market catalysts and key events',
          fields: [
            { name: 'name', type: 'string', description: 'Event name' },
            { name: 'company', type: 'string', description: 'Company name' },
            { name: 'drug', type: 'string', description: 'Drug/asset name' },
            { name: 'kind', type: 'enum', description: 'Event type' },
            { name: 'date', type: 'date', description: 'Event date' },
            { name: 'probability', type: 'float', unit: 'percentage', description: 'Success probability (0-1)' },
            { name: 'impact', type: 'enum', description: 'Impact level (High/Medium/Low)' },
          ],
          freshness: {
            last_updated: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            status: 'fresh',
            update_frequency: 'Manual refresh'
          },
          license: 'Proprietary compilation',
          provider: 'Multiple sources',
          coverage: {
            records: 342
          }
        },
        {
          name: 'Company Profiles',
          category: 'companies',
          description: 'Biotech and pharmaceutical company data',
          fields: [
            { name: 'name', type: 'string', description: 'Company name' },
            { name: 'ticker', type: 'string', description: 'Stock ticker symbol' },
            { name: 'company_type', type: 'enum', description: 'Big Pharma / Biotech / SMid' },
            { name: 'market_cap', type: 'float', unit: 'USD', description: 'Market capitalization' },
            { name: 'pipeline_count', type: 'integer', description: 'Number of pipeline assets' },
          ],
          freshness: {
            last_updated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            status: 'stale',
            update_frequency: 'Weekly'
          },
          license: 'Public domain',
          provider: 'SEC filings / Company websites',
          coverage: {
            records: 156
          }
        },
        {
          name: 'Disease Catalog',
          category: 'diseases',
          description: 'Disease epidemiology and burden data',
          fields: [
            { name: 'name', type: 'string', description: 'Disease name' },
            { name: 'icd10_code', type: 'string', description: 'ICD-10 code' },
            { name: 'prevalence', type: 'float', unit: 'per 100k', description: 'Prevalence rate' },
            { name: 'incidence', type: 'float', unit: 'per 100k', description: 'Incidence rate' },
            { name: 'mortality', type: 'float', unit: 'per 100k', description: 'Mortality rate' },
            { name: 'dalys', type: 'float', unit: 'years', description: 'Disability-adjusted life years' },
          ],
          freshness: {
            last_updated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            status: 'fresh',
            update_frequency: 'Quarterly'
          },
          license: 'Public domain (WHO GHE)',
          provider: 'WHO Global Health Estimates',
          coverage: {
            records: 287
          }
        },
      ];
      setSources(mockData);
    } catch (err) {
      console.error('Failed to fetch data catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSources = sources.filter((source) => {
    const matchesCategory = selectedCategory === 'all' || source.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFreshnessColor = (status: string) => {
    switch (status) {
      case 'fresh': return '#00ff00';
      case 'stale': return '#ffaa00';
      case 'error': return '#ff6666';
      default: return '#888888';
    }
  };

  const getTimeSince = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="data-catalog-page">
      <Panel
        title="DATA CATALOG"
        cornerBrackets
        variant="glass"
        headerAction={
          <div className="catalog-controls">
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="catalog-search"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="catalog-filter"
            >
              <option value="all">ALL CATEGORIES</option>
              <option value="news">NEWS</option>
              <option value="trials">TRIALS</option>
              <option value="catalysts">CATALYSTS</option>
              <option value="companies">COMPANIES</option>
              <option value="diseases">DISEASES</option>
            </select>
          </div>
        }
      >
        {loading && <div className="loading-state">Loading data catalog...</div>}

        {!loading && filteredSources.length === 0 && (
          <div className="empty-state">No datasets match your criteria</div>
        )}

        {!loading && filteredSources.length > 0 && (
          <div className="catalog-grid">
            {filteredSources.map((source) => (
              <div key={source.name} className="catalog-item">
                <div className="catalog-header">
                  <div className="catalog-title-row">
                    <h3 className="catalog-title">{source.name}</h3>
                    <span className={`category-badge category-${source.category}`}>
                      {source.category}
                    </span>
                  </div>
                  <p className="catalog-description">{source.description}</p>
                </div>

                <div className="catalog-section">
                  <h4 className="section-title">FRESHNESS</h4>
                  <div className="freshness-info">
                    <div className="freshness-status">
                      <span
                        className="status-indicator"
                        style={{ backgroundColor: getFreshnessColor(source.freshness.status) }}
                      />
                      <span className="status-text">{source.freshness.status.toUpperCase()}</span>
                    </div>
                    <div className="freshness-meta">
                      <span>Updated: {getTimeSince(source.freshness.last_updated)}</span>
                      <span>Frequency: {source.freshness.update_frequency}</span>
                    </div>
                  </div>
                </div>

                <div className="catalog-section">
                  <h4 className="section-title">COVERAGE</h4>
                  <div className="coverage-info">
                    <div className="coverage-stat">
                      <span className="stat-value">{source.coverage.records.toLocaleString()}</span>
                      <span className="stat-label">RECORDS</span>
                    </div>
                    {source.coverage.date_range && (
                      <div className="date-range">
                        {new Date(source.coverage.date_range.start).getFullYear()} - 
                        {new Date(source.coverage.date_range.end).getFullYear()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="catalog-section">
                  <h4 className="section-title">SCHEMA ({source.fields.length} fields)</h4>
                  <div className="fields-list">
                    {source.fields.slice(0, 5).map((field) => (
                      <div key={field.name} className="field-item">
                        <span className="field-name">{field.name}</span>
                        <span className="field-type">{field.type}</span>
                        {field.unit && <span className="field-unit">({field.unit})</span>}
                      </div>
                    ))}
                    {source.fields.length > 5 && (
                      <div className="field-item field-more">
                        +{source.fields.length - 5} more fields
                      </div>
                    )}
                  </div>
                </div>

                <div className="catalog-footer">
                  <div className="footer-meta">
                    <span className="meta-item">📋 {source.license}</span>
                    <span className="meta-item">🔗 {source.provider}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
