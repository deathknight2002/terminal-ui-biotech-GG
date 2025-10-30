/**
 * News Intelligence API Routes
 * Endpoints for news archive, trends, and predictions
 */

import { Router } from 'express';
import { getNewsArchive } from '../services/news-archive.js';
import { seedNewsArchive, getSeedStats } from '../services/news-seeder.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/news-intelligence/archive
 * Get archived news events
 */
router.get('/archive', (req, res) => {
  try {
    const { limit, category, company, therapeuticArea, startDate, endDate } = req.query;
    const archive = getNewsArchive();
    
    let events;
    
    if (company) {
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      events = archive.getEventsByCompany(company as string, start, end);
    } else if (category) {
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      events = archive.getEventsByCategory(category as any, start, end);
    } else if (therapeuticArea) {
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      events = archive.getEventsByTherapeuticArea(therapeuticArea as any, start, end);
    } else {
      events = archive.getAllEvents(limit ? parseInt(limit as string) : undefined);
    }
    
    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    logger.error('Error fetching archive:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news-intelligence/stats
 * Get archive statistics
 */
router.get('/stats', (req, res) => {
  try {
    const archive = getNewsArchive();
    const stats = archive.getStats();
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news-intelligence/trends/:category
 * Analyze trends for a specific category
 */
router.get('/trends/:category', (req, res) => {
  try {
    const { category } = req.params;
    const { therapeuticArea, timeframe = 'month' } = req.query;
    
    const archive = getNewsArchive();
    const trend = archive.analyzeTrend(
      category as any,
      therapeuticArea as any,
      timeframe as any
    );
    
    res.json({
      success: true,
      trend,
    });
  } catch (error) {
    logger.error('Error analyzing trend:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news-intelligence/predictions
 * Get predictions for upcoming events
 */
router.get('/predictions', (req, res) => {
  try {
    const { lookbackDays = '90', predictionHorizon = '30 days' } = req.query;
    
    const archive = getNewsArchive();
    const predictions = archive.predictUpcomingEvents(
      parseInt(lookbackDays as string),
      predictionHorizon as string
    );
    
    res.json({
      success: true,
      count: predictions.length,
      predictions,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/news-intelligence/archive
 * Archive a new event
 */
router.post('/archive', (req, res) => {
  try {
    const archive = getNewsArchive();
    const event = archive.archiveEvent(req.body);
    
    res.json({
      success: true,
      event,
    });
  } catch (error) {
    logger.error('Error archiving event:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/news-intelligence/seed
 * Seed the archive with initial data
 */
router.post('/seed', (req, res) => {
  try {
    seedNewsArchive();
    const stats = getSeedStats();
    
    res.json({
      success: true,
      message: 'Archive seeded successfully',
      stats,
    });
  } catch (error) {
    logger.error('Error seeding archive:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news-intelligence/company/:company
 * Get all events for a specific company
 */
router.get('/company/:company', (req, res) => {
  try {
    const { company } = req.params;
    const { startDate, endDate } = req.query;
    
    const archive = getNewsArchive();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const events = archive.getEventsByCompany(company, start, end);
    
    res.json({
      success: true,
      company,
      count: events.length,
      events,
    });
  } catch (error) {
    logger.error('Error fetching company events:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news-intelligence/event/:id
 * Get a specific event by ID
 */
router.get('/event/:id', (req, res) => {
  try {
    const { id } = req.params;
    const archive = getNewsArchive();
    const events = archive.getAllEvents();
    const event = events.find(e => e.id === id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }
    
    res.json({
      success: true,
      event,
    });
  } catch (error) {
    logger.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
