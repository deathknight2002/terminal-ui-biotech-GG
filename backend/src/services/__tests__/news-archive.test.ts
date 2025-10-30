/**
 * Test for News Archive and Intelligence Services
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NewsArchiveService } from '../news-archive';
import type { NewsCategory, NewsImportance, TherapeuticArea } from '../../../../src/types/biotech';

describe('NewsArchiveService', () => {
  let archive: NewsArchiveService;

  beforeEach(() => {
    archive = new NewsArchiveService();
  });

  it('should archive an event', () => {
    const event = archive.archiveEvent({
      title: 'Test Clinical Trial Success',
      summary: 'Phase III results show positive outcomes',
      source: 'Test Source',
      category: 'Trial Results' as NewsCategory,
      importance: 'High' as NewsImportance,
      therapeuticAreas: ['Oncology' as TherapeuticArea],
      companies: ['Test Company'],
      tickers: ['TEST'],
      keywords: ['phase iii', 'positive'],
      relevanceScore: 85,
    });

    expect(event.id).toBeDefined();
    expect(event.title).toBe('Test Clinical Trial Success');
    expect(event.category).toBe('Trial Results');
  });

  it('should retrieve events by category', () => {
    // Archive multiple events
    archive.archiveEvent({
      title: 'FDA Approval News',
      category: 'FDA Approval' as NewsCategory,
      importance: 'Critical' as NewsImportance,
      therapeuticAreas: ['Oncology' as TherapeuticArea],
      companies: ['Company A'],
      tickers: ['CMPA'],
      publishedAt: '2025-10-20T10:00:00Z',
    });

    archive.archiveEvent({
      title: 'Trial Results',
      category: 'Trial Results' as NewsCategory,
      importance: 'High' as NewsImportance,
      therapeuticAreas: ['Cardiovascular' as TherapeuticArea],
      companies: ['Company B'],
      tickers: ['CMPB'],
      publishedAt: '2025-10-21T10:00:00Z',
    });

    const startDate = new Date('2025-10-15');
    const endDate = new Date('2025-10-25');
    
    const fdaEvents = archive.getEventsByCategory('FDA Approval' as NewsCategory, startDate, endDate);
    const trialEvents = archive.getEventsByCategory('Trial Results' as NewsCategory, startDate, endDate);

    expect(fdaEvents.length).toBe(1);
    expect(trialEvents.length).toBe(1);
    expect(fdaEvents[0].title).toBe('FDA Approval News');
  });

  it('should retrieve events by therapeutic area', () => {
    archive.archiveEvent({
      title: 'Oncology Drug Approved',
      category: 'FDA Approval' as NewsCategory,
      importance: 'Critical' as NewsImportance,
      therapeuticAreas: ['Oncology' as TherapeuticArea],
      companies: ['Oncology Co'],
      tickers: ['ONCO'],
      publishedAt: '2025-10-22T10:00:00Z',
    });

    archive.archiveEvent({
      title: 'Cardio Trial Success',
      category: 'Trial Results' as NewsCategory,
      importance: 'High' as NewsImportance,
      therapeuticAreas: ['Cardiovascular' as TherapeuticArea],
      companies: ['Cardio Co'],
      tickers: ['CARD'],
      publishedAt: '2025-10-23T10:00:00Z',
    });

    const startDate = new Date('2025-10-15');
    const endDate = new Date('2025-10-25');
    
    const oncoEvents = archive.getEventsByTherapeuticArea('Oncology' as TherapeuticArea, startDate, endDate);
    const cardioEvents = archive.getEventsByTherapeuticArea('Cardiovascular' as TherapeuticArea, startDate, endDate);

    expect(oncoEvents.length).toBe(1);
    expect(cardioEvents.length).toBe(1);
  });

  it('should retrieve events by company', () => {
    archive.archiveEvent({
      title: 'Tectonic Therapeutic News',
      category: 'Trial Results' as NewsCategory,
      importance: 'High' as NewsImportance,
      therapeuticAreas: ['Cardiovascular' as TherapeuticArea],
      companies: ['Tectonic Therapeutic Inc'],
      tickers: ['TECX'],
      publishedAt: '2025-10-29T16:00:00Z',
    });

    const startDate = new Date('2025-10-25');
    const endDate = new Date('2025-10-30');
    
    const tectonicEvents = archive.getEventsByCompany('Tectonic', startDate, endDate);
    const tecxEvents = archive.getEventsByCompany('TECX', startDate, endDate);

    expect(tectonicEvents.length).toBe(1);
    expect(tecxEvents.length).toBe(1);
    expect(tectonicEvents[0].title).toBe('Tectonic Therapeutic News');
  });

  it('should analyze trends', () => {
    // Add multiple events for trend analysis
    for (let i = 0; i < 5; i++) {
      archive.archiveEvent({
        title: `Trial Result ${i}`,
        category: 'Trial Results' as NewsCategory,
        importance: 'High' as NewsImportance,
        therapeuticAreas: ['Oncology' as TherapeuticArea],
        companies: [`Company ${i}`],
        tickers: [`CMP${i}`],
        publishedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(), // Weekly events
      });
    }

    const trend = archive.analyzeTrend('Trial Results' as NewsCategory, 'Oncology' as TherapeuticArea, 'month');

    expect(trend.category).toBe('Trial Results');
    expect(trend.therapeuticArea).toBe('Oncology');
    expect(trend.eventCount).toBe(5);
    expect(trend.momentum).toBeDefined();
  });

  it('should predict upcoming events', () => {
    // Add events with patterns
    for (let i = 0; i < 10; i++) {
      archive.archiveEvent({
        title: `FDA Approval ${i}`,
        category: 'FDA Approval' as NewsCategory,
        importance: 'Critical' as NewsImportance,
        therapeuticAreas: ['Oncology' as TherapeuticArea],
        companies: [`Pharma ${i}`],
        tickers: [`PHA${i}`],
        publishedAt: new Date(Date.now() - i * 10 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    const predictions = archive.predictUpcomingEvents(90, '30 days');

    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].predicted_event_type).toBeDefined();
    expect(predictions[0].probability).toBeGreaterThan(0);
    expect(predictions[0].reasoning.length).toBeGreaterThan(0);
  });

  it('should handle clinical trial data', () => {
    const event = archive.archiveEvent({
      title: 'Phase 1b Results',
      category: 'Trial Results' as NewsCategory,
      importance: 'High' as NewsImportance,
      therapeuticAreas: ['Cardiovascular' as TherapeuticArea],
      companies: ['Test Pharma'],
      tickers: ['TPMA'],
      clinicalData: {
        phase: 'Phase 1b',
        indication: 'Pulmonary Hypertension',
        endpoints: [
          { name: 'PCWP', percentChange: -29.2, unit: 'mmHg' },
          { name: 'CO', percentChange: 17.3, unit: 'L/min' },
        ],
        patientCount: 14,
        safetyData: {
          adverseEvents: [],
          seriousAdverseEvents: [],
          discontinuations: 0,
        },
      },
    });

    expect(event.clinicalData).toBeDefined();
    expect(event.clinicalData?.endpoints?.length).toBe(2);
    expect(event.clinicalData?.endpoints?.[0].percentChange).toBe(-29.2);
  });

  it('should handle M&A deal data', () => {
    const event = archive.archiveEvent({
      title: 'Major Acquisition',
      category: 'M&A' as NewsCategory,
      importance: 'Critical' as NewsImportance,
      therapeuticAreas: ['Other' as TherapeuticArea],
      companies: ['Acquirer Corp', 'Target Corp'],
      tickers: ['ACQ'],
      dealData: {
        type: 'acquisition' as const,
        acquirer: 'Acquirer Corp',
        target: 'Target Corp',
        upfrontValue: 8880,
        totalValue: 9400,
        earnoutValue: 400,
        synergies: 175,
        closingDate: '2026-06',
      },
    });

    expect(event.dealData).toBeDefined();
    expect(event.dealData?.type).toBe('acquisition');
    expect(event.dealData?.totalValue).toBe(9400);
  });

  it('should get archive statistics', () => {
    // Add various events
    archive.archiveEvent({
      title: 'Event 1',
      category: 'FDA Approval' as NewsCategory,
      importance: 'Critical' as NewsImportance,
      therapeuticAreas: ['Oncology' as TherapeuticArea],
      companies: ['Company 1'],
      tickers: ['CMP1'],
    });

    archive.archiveEvent({
      title: 'Event 2',
      category: 'Trial Results' as NewsCategory,
      importance: 'High' as NewsImportance,
      therapeuticAreas: ['Cardiovascular' as TherapeuticArea],
      companies: ['Company 2'],
      tickers: ['CMP2'],
    });

    const stats = archive.getStats();

    expect(stats.totalEvents).toBe(2);
    expect(stats.eventsByCategory['FDA Approval']).toBe(1);
    expect(stats.eventsByCategory['Trial Results']).toBe(1);
    expect(stats.eventsByImportance['Critical']).toBe(1);
    expect(stats.eventsByImportance['High']).toBe(1);
  });
});
