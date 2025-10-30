/**
 * News Archive Service
 * Maintains historical memory of news events for trend analysis and prediction
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import type {
  NewsItem,
  NewsCategory,
  NewsImportance,
  TherapeuticArea,
} from '../../../src/types/biotech.js';

export interface ArchivedNewsEvent {
  id: string;
  title: string;
  summary: string;
  publishedDate: string;
  source: string;
  category: NewsCategory;
  importance: NewsImportance;
  therapeuticAreas: TherapeuticArea[];
  companies: string[];
  tickers: string[];
  keywords: string[];
  relevanceScore: number;
  
  // Clinical trial specific data
  clinicalData?: {
    phase?: string;
    indication?: string;
    endpoints?: {
      name: string;
      baseline?: number;
      result?: number;
      percentChange?: number;
      unit?: string;
    }[];
    safetyData?: {
      adverseEvents?: string[];
      seriousAdverseEvents?: string[];
      discontinuations?: number;
    };
    patientCount?: number;
  };
  
  // M&A specific data
  dealData?: {
    type: 'acquisition' | 'merger' | 'partnership' | 'licensing';
    acquirer?: string;
    target?: string;
    upfrontValue?: number;
    totalValue?: number;
    earnoutValue?: number;
    synergies?: number;
    closingDate?: string;
    strategic_rationale?: string;
  };
  
  // Market impact tracking
  marketImpact?: {
    priceChange?: number;
    volumeChange?: number;
    analystReactions?: string[];
    marketCapChange?: number;
  };
  
  // Metadata
  archived_at: string;
  embedding?: number[]; // For semantic search
}

// Extend NewsItem to include our additional fields
export interface ExtendedNewsItem extends Partial<NewsItem> {
  clinicalData?: {
    phase?: string;
    indication?: string;
    endpoints?: {
      name: string;
      baseline?: number;
      result?: number;
      percentChange?: number;
      unit?: string;
    }[];
    safetyData?: {
      adverseEvents?: string[];
      seriousAdverseEvents?: string[];
      discontinuations?: number;
    };
    patientCount?: number;
  };
  
  dealData?: {
    type: 'acquisition' | 'merger' | 'partnership' | 'licensing';
    acquirer?: string;
    target?: string;
    upfrontValue?: number;
    totalValue?: number;
    earnoutValue?: number;
    synergies?: number;
    closingDate?: string;
    strategic_rationale?: string;
  };
  
  marketImpact?: {
    priceChange?: number;
    volumeChange?: number;
    analystReactions?: string[];
    marketCapChange?: number;
  };
}

export interface TrendAnalysis {
  category: NewsCategory;
  therapeuticArea?: TherapeuticArea;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  eventCount: number;
  averageImportance: number;
  topCompanies: { name: string; count: number }[];
  momentum: 'increasing' | 'stable' | 'decreasing';
  predictedNext?: {
    category: NewsCategory;
    probability: number;
    timeframe: string;
    reasoning: string[];
  };
}

export interface EventPrediction {
  id: string;
  predicted_event_type: NewsCategory;
  predicted_company?: string;
  predicted_therapeutic_area?: TherapeuticArea;
  probability: number;
  confidence_interval: [number, number];
  expected_timeframe: string;
  reasoning: string[];
  similar_historical_events: string[]; // IDs of similar past events
  generated_at: string;
}

export class NewsArchiveService extends EventEmitter {
  private archive: Map<string, ArchivedNewsEvent> = new Map();
  private readonly maxArchiveSize = 10000;
  private trends: Map<string, TrendAnalysis> = new Map();
  
  constructor() {
    super();
    logger.info('📚 News Archive Service initialized');
  }
  
  /**
   * Archive a news event
   */
  archiveEvent(event: ExtendedNewsItem): ArchivedNewsEvent {
    const archived: ArchivedNewsEvent = {
      id: event.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title || '',
      summary: event.summary || '',
      publishedDate: event.publishedAt || event.date || new Date().toISOString(),
      source: (event.source as string) || 'Unknown',
      category: event.category || 'Corporate',
      importance: event.importance || 'Low',
      therapeuticAreas: event.therapeuticAreas || [],
      companies: event.companies || [],
      tickers: event.tickers || [],
      keywords: event.keywords || [],
      relevanceScore: event.relevanceScore || 0,
      clinicalData: event.clinicalData,
      dealData: event.dealData,
      marketImpact: event.marketImpact,
      archived_at: new Date().toISOString(),
    };
    
    this.archive.set(archived.id, archived);
    
    // Maintain size limit (FIFO)
    if (this.archive.size > this.maxArchiveSize) {
      const firstKey = this.archive.keys().next().value;
      this.archive.delete(firstKey);
    }
    
    this.emit('event:archived', archived);
    logger.debug(`📥 Archived event: ${archived.id}`);
    
    return archived;
  }
  
  /**
   * Get events by category and timeframe
   */
  getEventsByCategory(
    category: NewsCategory,
    startDate: Date,
    endDate: Date = new Date()
  ): ArchivedNewsEvent[] {
    return Array.from(this.archive.values())
      .filter(event => {
        const eventDate = new Date(event.publishedDate);
        return (
          event.category === category &&
          eventDate >= startDate &&
          eventDate <= endDate
        );
      })
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  }
  
  /**
   * Get events by therapeutic area
   */
  getEventsByTherapeuticArea(
    area: TherapeuticArea,
    startDate: Date,
    endDate: Date = new Date()
  ): ArchivedNewsEvent[] {
    return Array.from(this.archive.values())
      .filter(event => {
        const eventDate = new Date(event.publishedDate);
        return (
          event.therapeuticAreas.includes(area) &&
          eventDate >= startDate &&
          eventDate <= endDate
        );
      })
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  }
  
  /**
   * Get events by company
   */
  getEventsByCompany(
    company: string,
    startDate: Date,
    endDate: Date = new Date()
  ): ArchivedNewsEvent[] {
    const companyLower = company.toLowerCase();
    return Array.from(this.archive.values())
      .filter(event => {
        const eventDate = new Date(event.publishedDate);
        return (
          (event.companies.some(c => c.toLowerCase().includes(companyLower)) ||
           event.tickers.some(t => t.toLowerCase() === companyLower)) &&
          eventDate >= startDate &&
          eventDate <= endDate
        );
      })
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  }
  
  /**
   * Analyze trends in a specific category
   */
  analyzeTrend(
    category: NewsCategory,
    therapeuticArea?: TherapeuticArea,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): TrendAnalysis {
    const now = new Date();
    const startDate = this.getStartDateForTimeframe(now, timeframe);
    
    let events = this.getEventsByCategory(category, startDate, now);
    
    if (therapeuticArea) {
      events = events.filter(e => e.therapeuticAreas.includes(therapeuticArea));
    }
    
    // Calculate momentum by comparing recent vs earlier events
    const midpoint = new Date((startDate.getTime() + now.getTime()) / 2);
    const recentEvents = events.filter(e => new Date(e.publishedDate) >= midpoint);
    const earlierEvents = events.filter(e => new Date(e.publishedDate) < midpoint);
    
    let momentum: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentEvents.length > earlierEvents.length * 1.2) {
      momentum = 'increasing';
    } else if (recentEvents.length < earlierEvents.length * 0.8) {
      momentum = 'decreasing';
    }
    
    // Get top companies
    const companyCounts = new Map<string, number>();
    events.forEach(event => {
      event.companies.forEach(company => {
        companyCounts.set(company, (companyCounts.get(company) || 0) + 1);
      });
    });
    
    const topCompanies = Array.from(companyCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate average importance
    const importanceScores = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    const averageImportance = events.length > 0
      ? events.reduce((sum, e) => sum + (importanceScores[e.importance] || 1), 0) / events.length
      : 0;
    
    const trend: TrendAnalysis = {
      category,
      therapeuticArea,
      timeframe,
      eventCount: events.length,
      averageImportance,
      topCompanies,
      momentum,
    };
    
    // Cache the trend
    const trendKey = `${category}-${therapeuticArea || 'all'}-${timeframe}`;
    this.trends.set(trendKey, trend);
    
    return trend;
  }
  
  /**
   * Predict upcoming events based on historical patterns
   */
  predictUpcomingEvents(
    lookbackDays: number = 90
  ): EventPrediction[] {
    const now = new Date();
    const startDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    
    const recentEvents = Array.from(this.archive.values())
      .filter(event => new Date(event.publishedDate) >= startDate)
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    
    const predictions: EventPrediction[] = [];
    
    // Analyze patterns by category
    const categoryPatterns = this.analyzeCategoryPatterns(recentEvents);
    
    // Generate predictions for each active category
    const predictions: EventPrediction[] = [];
    for (const [category, pattern] of Array.from(categoryPatterns.entries())) {
      if (pattern.frequency > 0.1) { // Active category (>10% of events)
        const prediction = this.generatePrediction(category, pattern, recentEvents);
        predictions.push(prediction);
      }
    }
    
    // Sort by probability
    predictions.sort((a, b) => b.probability - a.probability);
    
    return predictions.slice(0, 10); // Top 10 predictions
  }
  
  /**
   * Analyze patterns for a specific category
   */
  private analyzeCategoryPatterns(events: ArchivedNewsEvent[]): Map<NewsCategory, any> {
    const patterns = new Map<NewsCategory, any>();
    
    const categories: NewsCategory[] = [
      'FDA Approval',
      'Trial Results',
      'M&A',
      'Partnership',
      'Regulatory',
      'Pipeline Update',
      'Financing',
      'Commercial',
    ];
    
    for (const category of categories) {
      const categoryEvents = events.filter(e => e.category === category);
      const frequency = categoryEvents.length / events.length;
      
      // Calculate average time between events
      const eventDates = categoryEvents
        .map(e => new Date(e.publishedDate).getTime())
        .sort((a, b) => b - a);
      
      let avgInterval = 0;
      if (eventDates.length > 1) {
        const intervals = [];
        for (let i = 0; i < eventDates.length - 1; i++) {
          intervals.push(eventDates[i] - eventDates[i + 1]);
        }
        avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      }
      
      // Get most common therapeutic areas
      const areaCount = new Map<TherapeuticArea, number>();
      categoryEvents.forEach(event => {
        event.therapeuticAreas.forEach(area => {
          areaCount.set(area, (areaCount.get(area) || 0) + 1);
        });
      });
      
      const topArea = Array.from(areaCount.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      
      patterns.set(category, {
        frequency,
        avgInterval,
        topTherapeuticArea: topArea,
        recentCount: categoryEvents.length,
        momentum: this.calculateMomentum(categoryEvents),
      });
    }
    
    return patterns;
  }
  
  /**
   * Calculate momentum for a set of events
   */
  private calculateMomentum(events: ArchivedNewsEvent[]): number {
    if (events.length < 2) return 0;
    
    const now = Date.now();
    const weights = events.map(event => {
      const age = (now - new Date(event.publishedDate).getTime()) / (1000 * 60 * 60 * 24); // days
      return Math.exp(-age / 30); // Exponential decay with 30-day half-life
    });
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    return totalWeight / events.length;
  }
  
  /**
   * Generate a prediction for a specific category
   */
  private generatePrediction(
    category: NewsCategory,
    pattern: any,
    recentEvents: ArchivedNewsEvent[]
  ): EventPrediction {
    const categoryEvents = recentEvents.filter(e => e.category === category);
    const lastEvent = categoryEvents[0];
    
    // Calculate probability based on frequency and momentum
    let probability = pattern.frequency * 100;
    probability *= (1 + pattern.momentum);
    probability = Math.min(probability, 95); // Cap at 95%
    
    // Generate reasoning
    const reasoning: string[] = [];
    
    if (pattern.momentum > 0.5) {
      reasoning.push(`Strong recent momentum in ${category} events (${pattern.recentCount} events in last 90 days)`);
    } else if (pattern.momentum > 0.2) {
      reasoning.push(`Moderate activity in ${category} category`);
    }
    
    if (pattern.avgInterval > 0) {
      const daysBetween = Math.round(pattern.avgInterval / (1000 * 60 * 60 * 24));
      reasoning.push(`Historical average of ${daysBetween} days between events`);
    }
    
    if (pattern.topTherapeuticArea) {
      reasoning.push(`Primary therapeutic area: ${pattern.topTherapeuticArea}`);
    }
    
    if (lastEvent) {
      const daysSinceLastEvent = Math.round(
        (Date.now() - new Date(lastEvent.publishedDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      reasoning.push(`Last ${category} event was ${daysSinceLastEvent} days ago`);
    }
    
    // Find similar historical events
    const similarEvents = categoryEvents
      .slice(0, 3)
      .map(e => e.id);
    
    // Calculate confidence interval
    const confidenceWidth = 20 * (1 - pattern.momentum); // Wider for lower momentum
    const confidenceInterval: [number, number] = [
      Math.max(probability - confidenceWidth, 5),
      Math.min(probability + confidenceWidth, 95),
    ];
    
    return {
      id: `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      predicted_event_type: category,
      predicted_therapeutic_area: pattern.topTherapeuticArea,
      probability,
      confidence_interval: confidenceInterval,
      expected_timeframe: '7-30 days',
      reasoning,
      similar_historical_events: similarEvents,
      generated_at: new Date().toISOString(),
    };
  }
  
  /**
   * Helper to get start date for timeframe
   */
  private getStartDateForTimeframe(endDate: Date, timeframe: 'week' | 'month' | 'quarter' | 'year'): Date {
    const start = new Date(endDate);
    
    switch (timeframe) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return start;
  }
  
  /**
   * Get all archived events
   */
  getAllEvents(limit?: number): ArchivedNewsEvent[] {
    const events = Array.from(this.archive.values())
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    
    return limit ? events.slice(0, limit) : events;
  }
  
  /**
   * Get statistics about the archive
   */
  getStats(): {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsByImportance: Record<string, number>;
    dateRange: { oldest: string; newest: string };
  } {
    const events = Array.from(this.archive.values());
    
    const eventsByCategory: Record<string, number> = {};
    const eventsByImportance: Record<string, number> = {};
    
    events.forEach(event => {
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
      eventsByImportance[event.importance] = (eventsByImportance[event.importance] || 0) + 1;
    });
    
    const dates = events.map(e => new Date(e.publishedDate).getTime()).sort((a, b) => a - b);
    
    return {
      totalEvents: events.length,
      eventsByCategory,
      eventsByImportance,
      dateRange: {
        oldest: dates.length > 0 ? new Date(dates[0]).toISOString() : '',
        newest: dates.length > 0 ? new Date(dates[dates.length - 1]).toISOString() : '',
      },
    };
  }
  
  /**
   * Clear the archive (for testing)
   */
  clearArchive(): void {
    this.archive.clear();
    this.trends.clear();
    logger.info('🗑️ News archive cleared');
  }
}

// Singleton instance
let instance: NewsArchiveService | null = null;

export function getNewsArchive(): NewsArchiveService {
  if (!instance) {
    instance = new NewsArchiveService();
  }
  return instance;
}
