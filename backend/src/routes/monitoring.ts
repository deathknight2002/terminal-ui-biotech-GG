/**
 * Change Detection & Portfolio Monitoring Routes
 * API endpoints for live monitoring
 */

import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { getChangeDetectionService } from '../services/change-detection-service.js';
import { getPortfolioMonitor } from '../services/portfolio-monitor.js';

const router = Router();
const changeDetection = getChangeDetectionService();
const portfolioMonitor = getPortfolioMonitor();

// ========== Change Detection Routes ==========

/**
 * Get all monitored URLs
 */
router.get('/monitors', (req, res) => {
  try {
    const monitors = changeDetection.getMonitors();
    res.json({
      success: true,
      count: monitors.length,
      monitors,
    });
  } catch (error) {
    logger.error('Error fetching monitors:', error);
    res.status(500).json({ error: 'Failed to fetch monitors' });
  }
});

/**
 * Get monitor by ID
 */
router.get('/monitors/:id', (req, res) => {
  try {
    const monitor = changeDetection.getMonitor(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    return res.json({ success: true, monitor });
  } catch (error) {
    logger.error('Error fetching monitor:', error);
    return res.status(500).json({ error: 'Failed to fetch monitor' });
  }
});

/**
 * Add a new monitor
 */
router.post('/monitors', (req, res) => {
  try {
    const { url, name, category, checkInterval, selector, metadata } = req.body;

    if (!url || !name || !category) {
      return res.status(400).json({ error: 'Missing required fields: url, name, category' });
    }

    const id = changeDetection.addMonitor({
      url,
      name,
      category,
      checkInterval: checkInterval || 300000, // Default 5 minutes
      selector,
      metadata,
    });

    return res.status(201).json({
      success: true,
      message: 'Monitor added successfully',
      id,
    });
  } catch (error) {
    logger.error('Error adding monitor:', error);
    return res.status(500).json({ error: 'Failed to add monitor' });
  }
});

/**
 * Update a monitor
 */
router.patch('/monitors/:id', (req, res) => {
  try {
    const success = changeDetection.updateMonitor(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    return res.json({ success: true, message: 'Monitor updated successfully' });
  } catch (error) {
    logger.error('Error updating monitor:', error);
    return res.status(500).json({ error: 'Failed to update monitor' });
  }
});

/**
 * Delete a monitor
 */
router.delete('/monitors/:id', (req, res) => {
  try {
    const success = changeDetection.removeMonitor(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    return res.json({ success: true, message: 'Monitor removed successfully' });
  } catch (error) {
    logger.error('Error removing monitor:', error);
    return res.status(500).json({ error: 'Failed to remove monitor' });
  }
});

/**
 * Enable/disable a monitor
 */
router.post('/monitors/:id/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const success = changeDetection.setMonitorEnabled(req.params.id, enabled);
    if (!success) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    return res.json({ success: true, message: `Monitor ${enabled ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    logger.error('Error toggling monitor:', error);
    return res.status(500).json({ error: 'Failed to toggle monitor' });
  }
});

/**
 * Force check a monitor immediately
 */
router.post('/monitors/:id/check', async (req, res) => {
  try {
    await changeDetection.forceCheck(req.params.id);
    res.json({ success: true, message: 'Check initiated successfully' });
  } catch (error) {
    logger.error('Error forcing check:', error);
    res.status(500).json({ error: 'Failed to force check' });
  }
});

/**
 * Get recent changes
 */
router.get('/changes', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const changes = changeDetection.getRecentChanges(limit);
    res.json({
      success: true,
      count: changes.length,
      changes,
    });
  } catch (error) {
    logger.error('Error fetching changes:', error);
    res.status(500).json({ error: 'Failed to fetch changes' });
  }
});

/**
 * Get changes for a specific URL
 */
router.get('/changes/:urlId', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const changes = changeDetection.getChangesForUrl(req.params.urlId, limit);
    res.json({
      success: true,
      count: changes.length,
      changes,
    });
  } catch (error) {
    logger.error('Error fetching changes for URL:', error);
    res.status(500).json({ error: 'Failed to fetch changes' });
  }
});

/**
 * Get monitoring statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = changeDetection.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * Clear change history
 */
router.delete('/changes', (req, res) => {
  try {
    changeDetection.clearHistory();
    res.json({ success: true, message: 'Change history cleared' });
  } catch (error) {
    logger.error('Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

/**
 * Get health status
 */
router.get('/health', (req, res) => {
  try {
    const health = changeDetection.getHealth();
    res.json({ success: true, ...health });
  } catch (error) {
    logger.error('Error fetching health:', error);
    res.status(500).json({ error: 'Failed to fetch health' });
  }
});

// ========== Portfolio Monitoring Routes ==========

/**
 * Get all portfolio companies
 */
router.get('/portfolio/companies', (req, res) => {
  try {
    const companies = portfolioMonitor.getCompanies();
    res.json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    logger.error('Error fetching portfolio companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * Get company by symbol
 */
router.get('/portfolio/companies/:symbol', (req, res) => {
  try {
    const company = portfolioMonitor.getCompany(req.params.symbol);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    return res.json({ success: true, company });
  } catch (error) {
    logger.error('Error fetching company:', error);
    return res.status(500).json({ error: 'Failed to fetch company' });
  }
});

/**
 * Add company to portfolio
 */
router.post('/portfolio/companies', (req, res) => {
  try {
    const company = req.body;
    if (!company.symbol || !company.name) {
      return res.status(400).json({ error: 'Missing required fields: symbol, name' });
    }
    portfolioMonitor.addCompany(company);
    return res.status(201).json({
      success: true,
      message: 'Company added to portfolio',
    });
  } catch (error) {
    logger.error('Error adding company:', error);
    return res.status(500).json({ error: 'Failed to add company' });
  }
});

/**
 * Remove company from portfolio
 */
router.delete('/portfolio/companies/:symbol', (req, res) => {
  try {
    const success = portfolioMonitor.removeCompany(req.params.symbol);
    if (!success) {
      return res.status(404).json({ error: 'Company not found' });
    }
    return res.json({ success: true, message: 'Company removed from portfolio' });
  } catch (error) {
    logger.error('Error removing company:', error);
    return res.status(500).json({ error: 'Failed to remove company' });
  }
});

/**
 * Enable/disable company monitoring
 */
router.post('/portfolio/companies/:symbol/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const success = portfolioMonitor.setCompanyMonitoring(req.params.symbol, enabled);
    if (!success) {
      return res.status(404).json({ error: 'Company not found' });
    }
    return res.json({
      success: true,
      message: `Monitoring ${enabled ? 'enabled' : 'disabled'} for company`,
    });
  } catch (error) {
    logger.error('Error toggling company monitoring:', error);
    return res.status(500).json({ error: 'Failed to toggle monitoring' });
  }
});

/**
 * Get portfolio alerts
 */
router.get('/portfolio/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = portfolioMonitor.getRecentAlerts(limit);
    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * Get alerts for specific company
 */
router.get('/portfolio/alerts/:symbol', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const alerts = portfolioMonitor.getCompanyAlerts(req.params.symbol, limit);
    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    logger.error('Error fetching company alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * Get portfolio statistics
 */
router.get('/portfolio/stats', (req, res) => {
  try {
    const stats = portfolioMonitor.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Error fetching portfolio stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * Clear all alerts
 */
router.delete('/portfolio/alerts', (req, res) => {
  try {
    portfolioMonitor.clearAlerts();
    res.json({ success: true, message: 'Alerts cleared' });
  } catch (error) {
    logger.error('Error clearing alerts:', error);
    res.status(500).json({ error: 'Failed to clear alerts' });
  }
});

/**
 * Load default portfolio
 */
router.post('/portfolio/load-default', (req, res) => {
  try {
    portfolioMonitor.loadDefaultPortfolio();
    res.json({ success: true, message: 'Default portfolio loaded' });
  } catch (error) {
    logger.error('Error loading default portfolio:', error);
    res.status(500).json({ error: 'Failed to load default portfolio' });
  }
});

/**
 * Setup global biotech monitoring
 */
router.post('/portfolio/setup-global', (req, res) => {
  try {
    portfolioMonitor.setupGlobalMonitoring();
    res.json({ success: true, message: 'Global monitoring enabled' });
  } catch (error) {
    logger.error('Error setting up global monitoring:', error);
    res.status(500).json({ error: 'Failed to setup global monitoring' });
  }
});

export { router as monitoringRouter };
