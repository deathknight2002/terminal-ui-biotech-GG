package com.biotech.kol.scrapers;

import com.biotech.kol.models.KOLSignal;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Scraper for BiopharmCatalyst.com - tracks upcoming biotech catalysts
 * This is a public website that aggregates biotech event calendars
 */
public class BioPharmCatalystScraper extends BaseKOLScraper {
    
    private static final String BASE_URL = "https://www.biopharmcatalyst.com";
    private static final String CALENDAR_URL = BASE_URL + "/calendars/fda-calendar";
    
    @Override
    public String getName() {
        return "BioPharmCatalyst";
    }
    
    @Override
    public String getSourceType() {
        return "news";
    }
    
    @Override
    public int getRecommendedFrequencyMinutes() {
        return 360; // 6 hours - calendar doesn't change that often
    }
    
    @Override
    protected List<KOLSignal> doScrape(Map<String, Object> config) throws Exception {
        List<KOLSignal> signals = new ArrayList<>();
        
        try {
            // Fetch the FDA calendar page
            Document doc = Jsoup.connect(CALENDAR_URL)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(30000)
                    .get();
            
            // Parse catalyst events from the calendar
            Elements eventRows = doc.select("table.calendar-table tbody tr");
            
            for (Element row : eventRows) {
                try {
                    KOLSignal signal = parseEventRow(row);
                    if (signal != null) {
                        signals.add(signal);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to parse event row: {}", e.getMessage());
                }
            }
            
        } catch (Exception e) {
            logger.error("Failed to scrape BioPharmCatalyst: {}", e.getMessage(), e);
            throw e;
        }
        
        return signals;
    }
    
    private KOLSignal parseEventRow(Element row) {
        try {
            Elements cells = row.select("td");
            if (cells.size() < 4) {
                return null;
            }
            
            String date = cells.get(0).text();
            String company = cells.get(1).text();
            String ticker = cells.get(2).text();
            String event = cells.get(3).text();
            
            KOLSignal signal = new KOLSignal();
            signal.setSourceName(getName());
            signal.setKolName("BiopharmCatalyst Calendar");
            signal.setSignalType(KOLSignal.SignalType.CATALYST_ALERT);
            signal.setSignalText(String.format("%s: %s", company, event));
            signal.setCompanyTicker(ticker.replace("$", ""));
            signal.setSignalDate(LocalDateTime.now());
            signal.setPlatform("BiopharmCatalyst");
            signal.setPostUrl(CALENDAR_URL);
            
            // Calculate scores
            signal.setQualityScore(0.8); // High quality source
            signal.setImpactScore(calculateImpactScore(event));
            signal.setConfidenceLevel(0.9); // Calendar events are typically confirmed
            signal.setSignalSentiment(calculateEventSentiment(event));
            
            // Store raw data
            Map<String, Object> rawData = new HashMap<>();
            rawData.put("date", date);
            rawData.put("company", company);
            rawData.put("event", event);
            signal.setRawData(rawData);
            
            return signal;
            
        } catch (Exception e) {
            logger.warn("Failed to parse event row: {}", e.getMessage());
            return null;
        }
    }
    
    private double calculateImpactScore(String event) {
        String lowerEvent = event.toLowerCase();
        
        // High impact events
        if (lowerEvent.contains("pdufa") || lowerEvent.contains("approval") || 
            lowerEvent.contains("phase 3") || lowerEvent.contains("fda decision")) {
            return 0.9;
        }
        
        // Medium impact events
        if (lowerEvent.contains("phase 2") || lowerEvent.contains("data readout") ||
            lowerEvent.contains("trial results")) {
            return 0.7;
        }
        
        // Lower impact events
        if (lowerEvent.contains("phase 1") || lowerEvent.contains("conference")) {
            return 0.5;
        }
        
        return 0.6; // Default
    }
    
    private double calculateEventSentiment(String event) {
        String lowerEvent = event.toLowerCase();
        
        // Positive catalysts
        if (lowerEvent.contains("approval") || lowerEvent.contains("positive") ||
            lowerEvent.contains("breakthrough") || lowerEvent.contains("accelerated")) {
            return 0.7;
        }
        
        // Negative catalysts
        if (lowerEvent.contains("rejection") || lowerEvent.contains("crl") ||
            lowerEvent.contains("complete response letter")) {
            return -0.7;
        }
        
        // Neutral - just data/decision pending
        return 0.0;
    }
    
    @Override
    protected boolean doTestConnection() throws Exception {
        Document doc = Jsoup.connect(BASE_URL)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .timeout(10000)
                .get();
        return doc != null;
    }
}
