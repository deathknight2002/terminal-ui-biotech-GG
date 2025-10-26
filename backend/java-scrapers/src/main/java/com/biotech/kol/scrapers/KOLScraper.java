package com.biotech.kol.scrapers;

import com.biotech.kol.models.KOLSignal;
import java.util.List;
import java.util.Map;

/**
 * Base interface for all KOL scrapers
 */
public interface KOLScraper {

    /**
     * Get the name of this scraper
     * @return Scraper name
     */
    String getName();

    /**
     * Get the source type (social_media, news, academic, etc.)
     * @return Source type
     */
    String getSourceType();

    /**
     * Scrape KOL signals from the source
     * @param config Configuration parameters
     * @return List of KOL signals
     * @throws Exception if scraping fails
     */
    List<KOLSignal> scrape(Map<String, Object> config) throws Exception;

    /**
     * Test connection to the data source
     * @return true if connection successful
     */
    boolean testConnection();

    /**
     * Get scraper health status
     * @return Health status information
     */
    Map<String, Object> getHealthStatus();

    /**
     * Get recommended scraping frequency
     * @return Frequency in minutes
     */
    int getRecommendedFrequencyMinutes();
}
