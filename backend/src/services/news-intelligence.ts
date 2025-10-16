/**
 * News Intelligence Service
 * Aggregates, scores, and categorizes biotech news from multiple sources
 */

import type {
  NewsItem,
  NewsSource,
  NewsCategory,
  MarketCapCategory,
  NewsImportance,
  TherapeuticArea,
} from '../../../src/types/biotech.js';

// Catalyst keywords for automatic detection
const CATALYST_KEYWORDS = {
  'FDA Approval': ['fda approval', 'fda approves', 'approved by fda', 'regulatory approval'],
  'Trial Results': ['phase i', 'phase ii', 'phase iii', 'clinical trial', 'trial results', 'study results'],
  'Pipeline Update': ['pipeline', 'development program', 'drug candidate'],
  'M&A': ['merger', 'acquisition', 'buyout', 'takeover', 'acquired'],
  'Partnership': ['partnership', 'collaboration', 'licensing deal', 'agreement'],
  'Financing': ['raised', 'funding', 'investment', 'financing', 'offering'],
  'Regulatory': ['breakthrough designation', 'fast track', 'orphan drug', 'priority review', 'pdufa'],
  'Commercial': ['launch', 'market', 'sales', 'revenue'],
};

// High-impact keywords that indicate tradable events
const HIGH_IMPACT_KEYWORDS = [
  'fda approval',
  'phase iii',
  'breakthrough',
  'acquisition',
  'buyout',
  'pdufa',
  'advisory committee',
  'adcom',
  'clinical hold',
  'complete response letter',
  'crl',
  'patent',
  'settlement',
];

// Therapeutic area mapping (keywords -> area)
const THERAPEUTIC_AREA_KEYWORDS: Record<string, TherapeuticArea> = {
  'sma': 'SMA',
  'spinal muscular atrophy': 'SMA',
  'glp-1': 'GLP-1',
  'glucagon-like peptide': 'GLP-1',
  'obesity': 'GLP-1',
  'diabetes': 'Metabolic',
  'metabolic': 'Metabolic',
  'cancer': 'Oncology',
  'oncology': 'Oncology',
  'tumor': 'Oncology',
  'leukemia': 'Oncology',
  'lymphoma': 'Oncology',
  'myeloma': 'Oncology',
  'rare disease': 'Rare Disease',
  'orphan': 'Rare Disease',
  'immunology': 'Immunology',
  'autoimmune': 'Immunology',
  'neurology': 'Neurology',
  'neurological': 'Neurology',
  'alzheimer': 'Neurology',
  'parkinson': 'Neurology',
  'cardiovascular': 'Cardiovascular',
  'cardio': 'Cardiovascular',
  'heart': 'Cardiovascular',
  'ophthalmology': 'Ophthalmology',
  'retina': 'Ophthalmology',
  'eye': 'Ophthalmology',
};

// Market cap thresholds (in millions)
const MARKET_CAP_THRESHOLDS = {
  'Mega Cap': 200000, // $200B+
  'Large Cap': 10000, // $10B - $200B
  'Mid Cap': 2000, // $2B - $10B
  'Small Cap': 300, // $300M - $2B
  'Micro Cap': 0, // < $300M
};

export class NewsIntelligenceService {
  /**
   * Score news article for relevance and importance
   */
  scoreNews(article: Partial<NewsItem>): Partial<NewsItem> {
    const title = article.title?.toLowerCase() || '';
    const summary = article.summary?.toLowerCase() || '';
    const content = `${title} ${summary}`;

    let relevanceScore = 0;
    let importance: NewsImportance = 'Low';
    let category: NewsCategory = 'Corporate';
    const detectedKeywords: string[] = [];
    const therapeuticAreas: TherapeuticArea[] = [];

    // Detect category from keywords
    for (const [cat, keywords] of Object.entries(CATALYST_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          category = cat as NewsCategory;
          detectedKeywords.push(keyword);
          relevanceScore += 10;
          break;
        }
      }
    }

    // Detect high-impact keywords
    let highImpactCount = 0;
    for (const keyword of HIGH_IMPACT_KEYWORDS) {
      if (content.includes(keyword)) {
        highImpactCount++;
        relevanceScore += 15;
        detectedKeywords.push(keyword);
      }
    }

    // Determine importance based on keywords and context
    if (highImpactCount >= 2 || content.includes('fda approval')) {
      importance = 'Critical';
      relevanceScore += 20;
    } else if (highImpactCount === 1 || content.includes('phase iii') || content.includes('breakthrough')) {
      importance = 'High';
      relevanceScore += 10;
    } else if (category !== 'Corporate') {
      importance = 'Medium';
      relevanceScore += 5;
    }

    // Detect therapeutic areas
    for (const [keyword, area] of Object.entries(THERAPEUTIC_AREA_KEYWORDS)) {
      if (content.includes(keyword)) {
        if (!therapeuticAreas.includes(area)) {
          therapeuticAreas.push(area);
        }
        relevanceScore += 5;
      }
    }

    // If no specific area detected, mark as Other
    if (therapeuticAreas.length === 0) {
      therapeuticAreas.push('Other');
    }

    // Determine if tradable (SMID-cap focus)
    const isTradable = this.isTradableNews(article, category, importance);

    // Cap relevance score at 100
    relevanceScore = Math.min(relevanceScore, 100);

    return {
      ...article,
      category,
      importance,
      relevanceScore,
      therapeuticAreas,
      keywords: detectedKeywords,
      isTradable,
    };
  }

  /**
   * Determine if news is tradable (focused on SMID-cap catalyst events)
   */
  private isTradableNews(
    article: Partial<NewsItem>,
    category: NewsCategory,
    importance: NewsImportance
  ): boolean {
    // Tradable if:
    // 1. High/Critical importance
    // 2. Catalyst categories (FDA Approval, Trial Results, M&A, etc.)
    // 3. SMID-cap companies (if market cap provided)

    if (importance === 'Critical' || importance === 'High') {
      return true;
    }

    const tradableCategories: NewsCategory[] = [
      'FDA Approval',
      'Trial Results',
      'M&A',
      'Partnership',
      'Regulatory',
    ];

    if (tradableCategories.includes(category)) {
      return true;
    }

    // If market cap is available, prioritize SMID-cap
    if (article.marketCapCategory) {
      const smidCapCategories: MarketCapCategory[] = ['Small Cap', 'Micro Cap', 'Mid Cap'];
      return smidCapCategories.includes(article.marketCapCategory);
    }

    return false;
  }

  /**
   * Categorize company by market cap
   */
  categorizeMarketCap(marketCap: number): MarketCapCategory {
    if (marketCap >= MARKET_CAP_THRESHOLDS['Mega Cap']) return 'Mega Cap';
    if (marketCap >= MARKET_CAP_THRESHOLDS['Large Cap']) return 'Large Cap';
    if (marketCap >= MARKET_CAP_THRESHOLDS['Mid Cap']) return 'Mid Cap';
    if (marketCap >= MARKET_CAP_THRESHOLDS['Small Cap']) return 'Small Cap';
    return 'Micro Cap';
  }

  /**
   * Check if article is portfolio-relevant
   */
  checkPortfolioRelevance(article: Partial<NewsItem>, watchlist: string[]): boolean {
    if (!watchlist || watchlist.length === 0) return false;

    // Check tickers
    if (article.tickers) {
      for (const ticker of article.tickers) {
        if (watchlist.some((w) => w.toUpperCase() === ticker.toUpperCase())) {
          return true;
        }
      }
    }

    // Check company names
    if (article.companies) {
      for (const company of article.companies) {
        if (watchlist.some((w) => company.toLowerCase().includes(w.toLowerCase()))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Detect source credibility and cross-validation
   */
  analyzeSourceCredibility(articles: NewsItem[]): NewsItem[] {
    // Group articles by similar content (title similarity)
    const groups = this.groupSimilarArticles(articles);

    // Update source count for cross-validation
    return articles.map((article) => {
      const group = groups.find((g) => g.includes(article.id));
      const sourceCount = group ? group.length : 1;

      // Boost relevance score for cross-validated news
      let relevanceScore = article.relevanceScore || 0;
      if (sourceCount >= 3) {
        relevanceScore += 15; // Multiple sources = more credible
      } else if (sourceCount === 2) {
        relevanceScore += 8;
      }

      return {
        ...article,
        sourceCount,
        relevanceScore: Math.min(relevanceScore, 100),
      };
    });
  }

  /**
   * Group similar articles (simple title-based similarity)
   */
  private groupSimilarArticles(articles: NewsItem[]): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    for (const article of articles) {
      if (processed.has(article.id)) continue;

      const group = [article.id];
      processed.add(article.id);

      // Find similar articles
      for (const other of articles) {
        if (other.id === article.id || processed.has(other.id)) continue;

        if (this.areSimilarTitles(article.title, other.title)) {
          group.push(other.id);
          processed.add(other.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Check if two titles are similar (simple word overlap)
   */
  private areSimilarTitles(title1: string, title2: string): boolean {
    const words1 = new Set(
      title1
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
    const words2 = new Set(
      title2
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    // Calculate overlap
    const overlap = [...words1].filter((w) => words2.has(w)).length;
    const minSize = Math.min(words1.size, words2.size);

    // Consider similar if >50% overlap
    return overlap / minSize > 0.5;
  }

  /**
   * Process a batch of news articles
   */
  processBatch(articles: Partial<NewsItem>[], watchlist: string[] = []): NewsItem[] {
    // Score each article
    let processed = articles.map((article) => this.scoreNews(article)) as NewsItem[];

    // Check portfolio relevance
    processed = processed.map((article) => ({
      ...article,
      isPortfolioRelevant: this.checkPortfolioRelevance(article, watchlist),
    }));

    // Analyze source credibility
    processed = this.analyzeSourceCredibility(processed);

    // Sort by relevance score
    processed.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return processed;
  }
}

// Singleton instance
export const newsIntelligenceService = new NewsIntelligenceService();
