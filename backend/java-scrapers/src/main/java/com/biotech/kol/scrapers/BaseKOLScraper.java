package com.biotech.kol.scrapers;

import com.biotech.kol.models.KOLSignal;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Base abstract class for KOL scrapers with common functionality
 */
public abstract class BaseKOLScraper implements KOLScraper {

    protected final Logger logger = LoggerFactory.getLogger(getClass());
    protected final OkHttpClient httpClient;

    protected int successCount = 0;
    protected int failureCount = 0;
    protected Date lastSuccessfulScrape;
    protected Date lastFailedScrape;

    public BaseKOLScraper() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    @Override
    public List<KOLSignal> scrape(Map<String, Object> config) throws Exception {
        try {
            logger.info("Starting scrape for {}", getName());
            List<KOLSignal> signals = doScrape(config);
            successCount++;
            lastSuccessfulScrape = new Date();
            logger.info("Successfully scraped {} signals from {}", signals.size(), getName());
            return signals;
        } catch (Exception e) {
            failureCount++;
            lastFailedScrape = new Date();
            logger.error("Failed to scrape {}: {}", getName(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Actual scraping implementation - to be overridden by subclasses
     */
    protected abstract List<KOLSignal> doScrape(Map<String, Object> config) throws Exception;

    @Override
    public boolean testConnection() {
        try {
            return doTestConnection();
        } catch (Exception e) {
            logger.warn("Connection test failed for {}: {}", getName(), e.getMessage());
            return false;
        }
    }

    protected abstract boolean doTestConnection() throws Exception;

    @Override
    public Map<String, Object> getHealthStatus() {
        Map<String, Object> health = new HashMap<>();
        health.put("scraper_name", getName());
        health.put("success_count", successCount);
        health.put("failure_count", failureCount);
        health.put("last_successful_scrape", lastSuccessfulScrape);
        health.put("last_failed_scrape", lastFailedScrape);
        health.put("connection_ok", testConnection());

        // Calculate success rate
        int total = successCount + failureCount;
        double successRate = total > 0 ? (double) successCount / total : 0.0;
        health.put("success_rate", successRate);

        return health;
    }

    /**
     * Make HTTP GET request with retry logic
     */
    protected String makeRequest(String url, Map<String, String> headers) throws Exception {
        Request.Builder requestBuilder = new Request.Builder().url(url);

        // Add headers
        if (headers != null) {
            headers.forEach(requestBuilder::addHeader);
        }

        Request request = requestBuilder.build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new Exception("HTTP request failed: " + response.code() + " " + response.message());
            }
            return response.body().string();
        }
    }

    /**
     * Extract ticker symbols from text using common patterns
     */
    protected List<String> extractTickers(String text) {
        List<String> tickers = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            return tickers;
        }

        // Pattern: $TICKER or (TICKER) format
        String[] words = text.split("\\s+");
        for (String word : words) {
            if (word.startsWith("$") && word.length() > 1 && word.length() <= 6) {
                String ticker = word.substring(1).replaceAll("[^A-Z]", "");
                if (!ticker.isEmpty()) {
                    tickers.add(ticker);
                }
            }
        }

        return tickers;
    }

    /**
     * Calculate sentiment score from text (simple keyword-based)
     */
    protected double calculateSentiment(String text) {
        if (text == null || text.isEmpty()) {
            return 0.0;
        }

        String lowerText = text.toLowerCase();

        // Bullish keywords
        String[] bullishKeywords = {"bullish", "buy", "upside", "positive", "breakthrough",
                "approval", "success", "promising", "strong", "outperform", "upgrade"};

        // Bearish keywords
        String[] bearishKeywords = {"bearish", "sell", "downside", "negative", "failure",
                "rejection", "weak", "concern", "risk", "downgrade", "disappointing"};

        int bullishCount = 0;
        int bearishCount = 0;

        for (String keyword : bullishKeywords) {
            if (lowerText.contains(keyword)) {
                bullishCount++;
            }
        }

        for (String keyword : bearishKeywords) {
            if (lowerText.contains(keyword)) {
                bearishCount++;
            }
        }

        // Calculate sentiment: -1.0 (very bearish) to +1.0 (very bullish)
        int total = bullishCount + bearishCount;
        if (total == 0) {
            return 0.0;
        }

        return (double) (bullishCount - bearishCount) / total;
    }
}
