/**
 * Enhanced News Feed Example
 * Demonstrates the new biotech news intelligence features
 */

import React, { useState } from 'react';
import { EnhancedNewsFeed } from '../frontend-components/src/biotech/organisms/EnhancedNewsFeed';
import type { NewsItem } from '../src/types/biotech';

// Sample news data demonstrating the enhanced fields
const sampleNews: NewsItem[] = [
  {
    id: '1',
    title: 'Scholar Rock Announces Positive Phase 3 SAPPHIRE Trial Results in SMA',
    summary: 'Scholar Rock (NASDAQ: SRRK) today announced positive topline results from the pivotal Phase 3 SAPPHIRE trial evaluating apitegromab in combination with nusinersen in patients with later-onset spinal muscular atrophy (SMA). The trial met its primary endpoint, demonstrating statistically significant improvement in motor function.',
    date: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    
    // Enhanced metadata
    source: 'Fierce Biotech',
    category: 'Trial Results',
    importance: 'Critical',
    therapeuticAreas: ['SMA', 'Rare Disease'],
    companies: ['Scholar Rock'],
    tickers: ['SRRK'],
    marketCap: 1200, // $1.2B
    marketCapCategory: 'Small Cap',
    isTradable: true,
    isPortfolioRelevant: true,
    relevanceScore: 95,
    sourceCount: 3, // Reported by 3 sources
    keywords: ['phase iii', 'sma', 'trial results', 'motor function'],
    url: 'https://www.fiercebiotech.com/example',
    sentiment: {
      score: 0.85,
      label: 'Positive'
    }
  },
  {
    id: '2',
    title: 'Novo Nordisk Receives FDA Approval for Next-Gen GLP-1 Obesity Treatment',
    summary: 'The FDA has approved Novo Nordisk\'s novel GLP-1 receptor agonist for chronic weight management in adults, marking a significant advancement in the metabolic disease space. The approval was based on STEP program data showing superior weight loss vs. existing therapies.',
    date: new Date(Date.now() - 3600000).toISOString(),
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    scrapedAt: new Date().toISOString(),
    
    source: 'BioPharma Dive',
    category: 'FDA Approval',
    importance: 'High',
    therapeuticAreas: ['GLP-1', 'Metabolic'],
    companies: ['Novo Nordisk'],
    tickers: ['NVO'],
    marketCap: 450000, // $450B
    marketCapCategory: 'Mega Cap',
    isTradable: false, // Large cap, less volatile
    isPortfolioRelevant: false,
    relevanceScore: 75,
    sourceCount: 5,
    keywords: ['fda approval', 'glp-1', 'obesity', 'weight management'],
    url: 'https://www.biopharmadive.com/example',
    sentiment: {
      score: 0.70,
      label: 'Positive'
    }
  },
  {
    id: '3',
    title: 'Crinetics Presents Breakthrough Phase 2 Data in Rare Endocrine Disorder',
    summary: 'Crinetics Pharmaceuticals (NASDAQ: CRNX) announced compelling Phase 2 results for paltusotine in patients with acromegaly, demonstrating 85% biochemical control rate - significantly higher than current standard of care therapies.',
    date: new Date(Date.now() - 7200000).toISOString(),
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    scrapedAt: new Date().toISOString(),
    
    source: 'Endpoints News',
    category: 'Trial Results',
    importance: 'High',
    therapeuticAreas: ['Rare Disease'],
    companies: ['Crinetics Pharmaceuticals'],
    tickers: ['CRNX'],
    marketCap: 2800, // $2.8B
    marketCapCategory: 'Mid Cap',
    isTradable: true,
    isPortfolioRelevant: true,
    relevanceScore: 88,
    sourceCount: 2,
    keywords: ['phase ii', 'rare disease', 'acromegaly', 'breakthrough'],
    url: 'https://www.endpointsnews.com/example',
    sentiment: {
      score: 0.80,
      label: 'Positive'
    }
  },
  {
    id: '4',
    title: 'Biotech XYZ Reports Positive Oncology Data in Advanced NSCLC',
    summary: 'Emerging biotech company reports encouraging Phase 2 data for novel checkpoint inhibitor combination in non-small cell lung cancer, showing improved progression-free survival in heavily pretreated patients.',
    date: new Date(Date.now() - 10800000).toISOString(),
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    scrapedAt: new Date().toISOString(),
    
    source: 'STAT News',
    category: 'Trial Results',
    importance: 'Medium',
    therapeuticAreas: ['Oncology'],
    companies: ['Biotech XYZ'],
    tickers: ['BXYZ'],
    marketCap: 650, // $650M
    marketCapCategory: 'Small Cap',
    isTradable: true,
    isPortfolioRelevant: false,
    relevanceScore: 72,
    sourceCount: 2,
    keywords: ['phase ii', 'oncology', 'nsclc', 'checkpoint inhibitor'],
    url: 'https://www.statnews.com/example',
    sentiment: {
      score: 0.55,
      label: 'Positive'
    }
  },
  {
    id: '5',
    title: 'Ionis Announces Strategic Collaboration for Neurological ASO Program',
    summary: 'Ionis Pharmaceuticals (NASDAQ: IONS) entered into a global licensing agreement with major pharma partner for development and commercialization of antisense oligonucleotide targeting rare neurological disorder.',
    date: new Date(Date.now() - 14400000).toISOString(),
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    scrapedAt: new Date().toISOString(),
    
    source: 'Company PR',
    category: 'Partnership',
    importance: 'Medium',
    therapeuticAreas: ['Neurology', 'Rare Disease'],
    companies: ['Ionis Pharmaceuticals'],
    tickers: ['IONS'],
    marketCap: 5400, // $5.4B
    marketCapCategory: 'Mid Cap',
    isTradable: true,
    isPortfolioRelevant: true,
    relevanceScore: 82,
    sourceCount: 1,
    keywords: ['partnership', 'collaboration', 'neurology', 'rare disease'],
    url: 'https://ir.ionispharma.com/example',
    sentiment: {
      score: 0.45,
      label: 'Positive'
    }
  },
  {
    id: '6',
    title: 'Generic Pharma Files ANDA for Established Cardiovascular Drug',
    summary: 'Generic pharmaceutical company submits abbreviated new drug application to FDA for generic version of widely-used cardiovascular medication, expecting approval in 2026.',
    date: new Date(Date.now() - 18000000).toISOString(),
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    scrapedAt: new Date().toISOString(),
    
    source: 'GEN News',
    category: 'Regulatory',
    importance: 'Low',
    therapeuticAreas: ['Cardiovascular'],
    companies: ['Generic Co'],
    tickers: [],
    marketCap: 8000,
    marketCapCategory: 'Large Cap',
    isTradable: false,
    isPortfolioRelevant: false,
    relevanceScore: 30,
    sourceCount: 1,
    keywords: ['anda', 'generic', 'cardiovascular'],
    url: 'https://www.genengnews.com/example'
  }
];

export function EnhancedNewsFeedExample() {
  const [news, setNews] = useState<NewsItem[]>(sampleNews);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate API call
    setTimeout(() => {
      // In real app, would fetch from /api/news/aggregate
      console.log('Refreshing news...');
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ 
        fontFamily: 'var(--font-mono, "Courier New", monospace)',
        color: 'var(--accent-primary, #00ff00)',
        marginBottom: '2rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Enhanced News Feed Example
      </h1>

      <EnhancedNewsFeed
        news={news}
        title="REDMILE BIOTECH NEWS INTELLIGENCE"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        cornerBrackets={true}
        showCategoryTabs={true}
        portfolioWatchlist={[
          'SRRK', // Scholar Rock - in news
          'CRNX', // Crinetics - in news
          'IONS', // Ionis - in news
          'VRTX', // Vertex
          'BIIB', // Biogen
        ]}
      />

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(0, 255, 0, 0.05)',
        border: '1px solid rgba(0, 255, 0, 0.2)',
        borderRadius: '8px',
        fontFamily: 'var(--font-mono, "Courier New", monospace)',
        fontSize: '0.85rem',
        lineHeight: '1.6',
      }}>
        <h3 style={{ color: 'var(--accent-primary, #00ff00)', marginBottom: '1rem' }}>
          Features Demonstrated:
        </h3>
        <ul style={{ color: 'var(--text-secondary, #ccc)' }}>
          <li>✅ <strong>Category Tabs</strong>: Filter by SMA, GLP-1, Oncology, Rare Disease, etc.</li>
          <li>✅ <strong>Importance Ranking</strong>: Critical news (Scholar Rock) appears first</li>
          <li>✅ <strong>Portfolio Highlighting</strong>: SRRK, CRNX, IONS marked with ⭐</li>
          <li>✅ <strong>Tradable Filter</strong>: Click "📊 TRADABLE ONLY" to see SMID-cap events</li>
          <li>✅ <strong>Search</strong>: Try searching for "FDA" or "phase iii"</li>
          <li>✅ <strong>Top News Ribbon</strong>: Shows Critical/High importance items</li>
          <li>✅ <strong>Rich Metadata</strong>: Badges for source, category, market cap, etc.</li>
          <li>✅ <strong>Expandable Details</strong>: Click articles to see full summary</li>
        </ul>

        <h3 style={{ color: 'var(--accent-primary, #00ff00)', marginTop: '1.5rem', marginBottom: '1rem' }}>
          Try These Interactions:
        </h3>
        <ol style={{ color: 'var(--text-secondary, #ccc)' }}>
          <li>Click "SMA" tab to see Scholar Rock news</li>
          <li>Click "GLP-1 / METABOLIC" to see Novo Nordisk</li>
          <li>Click "📊 TRADABLE ONLY" to filter SMID-cap (removes Novo)</li>
          <li>Click "⭐ PORTFOLIO ONLY" to see only SRRK, CRNX, IONS</li>
          <li>Search for "Phase 2" or "rare disease"</li>
          <li>Expand an article to see therapeutic areas and sentiment</li>
        </ol>
      </div>
    </div>
  );
}

export default EnhancedNewsFeedExample;
