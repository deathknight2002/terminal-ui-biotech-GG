import React, { useState, useEffect } from 'react';
import { EnhancedNewsFeed } from '../../../frontend-components/src/biotech/organisms/EnhancedNewsFeed/EnhancedNewsFeed';
import type { NewsItem } from '../../../src/types/biotech';
import './NewsPage.css';

export function NewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use enhanced news aggregation endpoint
      const response = await fetch('http://localhost:3001/api/news/aggregate?maxResults=100');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.articles) {
        setArticles(data.articles);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to load news:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');

      // Load mock data as fallback
      setArticles(getMockNews());
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="news-page">
        <div className="loading-container">
          <div className="loading-spinner">⟳</div>
          <p>Loading biotech news intelligence...</p>
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="news-page">
        <div className="error-container">
          <h3>⚠️ Error Loading News</h3>
          <p>{error}</p>
          <button onClick={fetchNews} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">
      <EnhancedNewsFeed
        news={articles}
        title="REDMILE BIOTECH NEWS INTELLIGENCE"
        onRefresh={fetchNews}
        isRefreshing={loading}
        cornerBrackets={true}
        showCategoryTabs={true}
        portfolioWatchlist={[
          'SRRK', // Scholar Rock - SMA
          'CRNX', // Crinetics - Rare Disease
          'AVDX', // Avidity - Rare Disease
          'TRVI', // Travere - Rare Disease
          'IONS', // Ionis - Multiple areas
          'VRTX', // Vertex - Various
          'BIIB', // Biogen - Neurology
        ]}
      />
    </div>
  );
}

// Mock data generator for fallback
function getMockNews(): NewsItem[] {
  return [
    {
      id: '1',
      title: 'Scholar Rock Announces Positive Phase 3 Trial Results for SMA Treatment',
      summary: 'Scholar Rock (SRRK) reported positive topline results from its Phase 3 SAPPHIRE trial evaluating apitegromab in patients with later-onset spinal muscular atrophy (SMA). The primary endpoint of motor function improvement was met with statistical significance.',
      date: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      source: 'Fierce Biotech',
      category: 'Trial Results',
      importance: 'Critical',
      therapeuticAreas: ['SMA', 'Rare Disease'],
      companies: ['Scholar Rock'],
      tickers: ['SRRK'],
      marketCap: 1200,
      marketCapCategory: 'Small Cap',
      isTradable: true,
      isPortfolioRelevant: true,
      relevanceScore: 95,
      keywords: ['phase iii', 'sma', 'trial results'],
      url: '#',
    },
    {
      id: '2',
      title: 'Novo Nordisk Expands GLP-1 Portfolio with New Obesity Drug Approval',
      summary: 'FDA approves Novo Nordisk\'s next-generation GLP-1 receptor agonist for obesity treatment, offering improved efficacy and dosing convenience compared to existing therapies.',
      date: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      source: 'BioPharma Dive',
      category: 'FDA Approval',
      importance: 'High',
      therapeuticAreas: ['GLP-1', 'Metabolic'],
      companies: ['Novo Nordisk'],
      tickers: ['NVO'],
      marketCap: 450000,
      marketCapCategory: 'Mega Cap',
      isTradable: false,
      isPortfolioRelevant: false,
      relevanceScore: 75,
      keywords: ['fda approval', 'glp-1', 'obesity'],
      url: '#',
    },
    {
      id: '3',
      title: 'Crinetics Pharma Reports Breakthrough in Rare Endocrine Disorder Treatment',
      summary: 'Crinetics Pharmaceuticals (CRNX) announced promising Phase 2 data for paltusotine in acromegaly patients, showing superior biochemical control compared to current standard of care.',
      date: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      source: 'Endpoints News',
      category: 'Trial Results',
      importance: 'High',
      therapeuticAreas: ['Rare Disease'],
      companies: ['Crinetics Pharmaceuticals'],
      tickers: ['CRNX'],
      marketCap: 2800,
      marketCapCategory: 'Mid Cap',
      isTradable: true,
      isPortfolioRelevant: true,
      relevanceScore: 88,
      keywords: ['phase ii', 'rare disease', 'breakthrough'],
      url: '#',
    },
    {
      id: '4',
      title: 'Major Cancer Immunotherapy Shows Promise in Phase 3 NSCLC Trial',
      summary: 'New PD-L1 inhibitor combination demonstrates statistically significant improvement in progression-free survival for non-small cell lung cancer patients.',
      date: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      source: 'STAT News',
      category: 'Trial Results',
      importance: 'Medium',
      therapeuticAreas: ['Oncology'],
      companies: ['Undisclosed Biotech'],
      tickers: [],
      marketCap: 800,
      marketCapCategory: 'Small Cap',
      isTradable: true,
      isPortfolioRelevant: false,
      relevanceScore: 70,
      keywords: ['phase iii', 'oncology', 'immunotherapy'],
      url: '#',
    },
    {
      id: '5',
      title: 'Ionis Announces Strategic Partnership for Neurological Rare Disease Program',
      summary: 'Ionis Pharmaceuticals enters collaboration agreement with major pharma to advance antisense oligonucleotide therapy for inherited neurological disorder.',
      date: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      source: 'Company PR',
      category: 'Partnership',
      importance: 'Medium',
      therapeuticAreas: ['Neurology', 'Rare Disease'],
      companies: ['Ionis Pharmaceuticals'],
      tickers: ['IONS'],
      marketCap: 5400,
      marketCapCategory: 'Mid Cap',
      isTradable: true,
      isPortfolioRelevant: true,
      relevanceScore: 82,
      keywords: ['partnership', 'rare disease', 'neurology'],
      url: '#',
    },
  ];
}
