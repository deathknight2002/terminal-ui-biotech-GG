package com.biotech.kol;

import com.biotech.kol.models.KOLSignal;
import com.biotech.kol.scrapers.BaseKOLScraper;
import com.biotech.kol.scrapers.BioPharmCatalystScraper;
import com.biotech.kol.scrapers.KOLScraper;
import com.biotech.kol.scrapers.SeekingAlphaBiotechScraper;
import com.biotech.kol.scrapers.StockTwitsScraper;
import com.biotech.kol.scrapers.TwitterBiotechScraper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;

/**
 * Main orchestrator for KOL scrapers
 * Runs multiple scrapers in parallel and aggregates results
 */
public class Main {
    
    private static final Logger logger = LoggerFactory.getLogger(Main.class);
    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .enable(SerializationFeature.INDENT_OUTPUT);
    
    private final List<KOLScraper> scrapers;
    private final ExecutorService executorService;
    
    public Main() {
        // Initialize all scrapers
        this.scrapers = Arrays.asList(
            new BioPharmCatalystScraper(),
            new SeekingAlphaBiotechScraper(),
            new StockTwitsScraper(),
            new TwitterBiotechScraper()
            // Add more scrapers here:
            // new LinkedInBiotechScraper(),
            // new FDAAdvisoryCommitteeScraper(),
            // new PubMedKOLScraper(),
            // new ClinicalTrialsInvestigatorScraper(),
            // new ConferenceSpeakerScraper(),
            // etc.
        );
        
        // Thread pool for parallel scraping
        this.executorService = Executors.newFixedThreadPool(
            Math.min(scrapers.size(), Runtime.getRuntime().availableProcessors())
        );
    }
    
    /**
     * Run all scrapers and collect signals
     */
    public Map<String, Object> runAllScrapers() {
        logger.info("Starting KOL scraping run with {} scrapers", scrapers.size());
        
        List<Future<ScraperResult>> futures = new ArrayList<>();
        
        // Submit all scraper tasks
        for (KOLScraper scraper : scrapers) {
            futures.add(executorService.submit(() -> runSingleScraper(scraper)));
        }
        
        // Collect results
        List<KOLSignal> allSignals = new ArrayList<>();
        List<Map<String, Object>> scraperStats = new ArrayList<>();
        
        for (Future<ScraperResult> future : futures) {
            try {
                ScraperResult result = future.get(5, TimeUnit.MINUTES);
                allSignals.addAll(result.signals);
                scraperStats.add(result.stats);
            } catch (TimeoutException e) {
                logger.error("Scraper timed out", e);
            } catch (Exception e) {
                logger.error("Scraper failed", e);
            }
        }
        
        // Build output
        Map<String, Object> output = new HashMap<>();
        output.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        output.put("total_signals", allSignals.size());
        output.put("scrapers_run", scrapers.size());
        output.put("signals", allSignals);
        output.put("scraper_stats", scraperStats);
        
        logger.info("Scraping completed. Collected {} signals from {} scrapers", 
                allSignals.size(), scrapers.size());
        
        return output;
    }
    
    private ScraperResult runSingleScraper(KOLScraper scraper) {
        long startTime = System.currentTimeMillis();
        ScraperResult result = new ScraperResult();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("scraper_name", scraper.getName());
        stats.put("source_type", scraper.getSourceType());
        
        try {
            logger.info("Running scraper: {}", scraper.getName());
            
            // Test connection first
            boolean connected = scraper.testConnection();
            stats.put("connection_ok", connected);
            
            if (!connected) {
                logger.warn("Scraper {} failed connection test", scraper.getName());
                stats.put("status", "connection_failed");
                result.stats = stats;
                return result;
            }
            
            // Run scraper
            List<KOLSignal> signals = scraper.scrape(new HashMap<>());
            result.signals = signals;
            
            stats.put("signals_collected", signals.size());
            stats.put("status", "success");
            
        } catch (Exception e) {
            logger.error("Scraper {} failed: {}", scraper.getName(), e.getMessage(), e);
            stats.put("status", "failed");
            stats.put("error", e.getMessage());
        }
        
        long duration = System.currentTimeMillis() - startTime;
        stats.put("duration_ms", duration);
        result.stats = stats;
        
        return result;
    }
    
    /**
     * Save results to JSON file
     */
    public void saveResults(Map<String, Object> results, String outputPath) throws Exception {
        File outputFile = new File(outputPath);
        objectMapper.writeValue(outputFile, results);
        logger.info("Results saved to: {}", outputFile.getAbsolutePath());
    }
    
    /**
     * Shutdown executor service
     */
    public void shutdown() {
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * Main entry point
     */
    public static void main(String[] args) {
        Main main = new Main();
        
        try {
            // Run all scrapers
            Map<String, Object> results = main.runAllScrapers();
            
            // Determine output path
            String outputPath = args.length > 0 ? args[0] : "kol_signals_output.json";
            
            // Save results
            main.saveResults(results, outputPath);
            
            // Print summary
            System.out.println("\n=== KOL Scraping Summary ===");
            System.out.println("Total signals collected: " + results.get("total_signals"));
            System.out.println("Output saved to: " + outputPath);
            
        } catch (Exception e) {
            logger.error("Fatal error in main", e);
            System.exit(1);
        } finally {
            main.shutdown();
        }
    }
    
    /**
     * Internal class to hold scraper results
     */
    private static class ScraperResult {
        List<KOLSignal> signals = new ArrayList<>();
        Map<String, Object> stats = new HashMap<>();
    }
}
