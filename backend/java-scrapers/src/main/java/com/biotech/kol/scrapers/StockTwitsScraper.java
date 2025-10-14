package com.biotech.kol.scrapers;

import com.biotech.kol.models.KOLSignal;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.time.LocalDateTime;
import java.util.*;

/**
 * StockTwits Biotech Sentiment Scraper
 * Scrapes StockTwits for biotech ticker sentiment and trending discussions
 * 
 * StockTwits provides real-time sentiment (bullish/bearish) from retail traders
 * This is useful for gauging market sentiment and identifying trending biotech stocks
 */
public class StockTwitsScraper extends BaseKOLScraper {
    
    private static final String BASE_URL = "https://stocktwits.com";
    
    // Top biotech tickers to monitor on StockTwits
    private static final String[] BIOTECH_TICKERS = {
        "MRNA", "BNTX", "NVAX", "CRSP", "NTLA", "BEAM", "EDIT", "BLUE",
        "VRTX", "REGN", "BIIB", "GILD", "AMGN", "BMRN", "SGEN", "ALNY",
        "IONS", "SRPT", "RARE", "FOLD", "ARVN", "NUVL", "ARWR", "RGNX"
    };
    
    @Override
    public String getName() {
        return "StockTwits Biotech";
    }
    
    @Override
    public String getSourceType() {
        return "social_media";
    }
    
    @Override
    public int getRecommendedFrequencyMinutes() {
        return 30; // Check every 30 minutes for new sentiment
    }
    
    @Override
    protected List<KOLSignal> doScrape(Map<String, Object> config) throws Exception {
        List<KOLSignal> signals = new ArrayList<>();
        
        // Limit to top 10 tickers for speed in this demo
        String[] tickersToScrape = Arrays.copyOf(BIOTECH_TICKERS, Math.min(10, BIOTECH_TICKERS.length));
        
        for (String ticker : tickersToScrape) {
            try {
                List<KOLSignal> tickerSignals = scrapeTicker(ticker);
                signals.addAll(tickerSignals);
                
                // Rate limiting - be nice to StockTwits servers
                Thread.sleep(1000);
                
            } catch (Exception e) {
                logger.warn("Failed to scrape StockTwits for {}: {}", ticker, e.getMessage());
            }
        }
        
        return signals;
    }
    
    private List<KOLSignal> scrapeTicker(String ticker) throws Exception {
        List<KOLSignal> signals = new ArrayList<>();
        
        String url = BASE_URL + "/symbol/" + ticker;
        
        Document doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .timeout(30000)
                .get();
        
        // Get sentiment gauge if available
        Element sentimentGauge = doc.selectFirst("div.sentiment-gauge");
        if (sentimentGauge != null) {
            KOLSignal sentimentSignal = parseSentimentGauge(sentimentGauge, ticker);
            if (sentimentSignal != null) {
                signals.add(sentimentSignal);
            }
        }
        
        // Parse recent messages/posts
        Elements messages = doc.select("div.message, article.stream-message");
        
        for (Element message : messages.subList(0, Math.min(20, messages.size()))) {
            try {
                KOLSignal signal = parseMessage(message, ticker);
                if (signal != null) {
                    signals.add(signal);
                }
            } catch (Exception e) {
                logger.debug("Failed to parse message: {}", e.getMessage());
            }
        }
        
        return signals;
    }
    
    private KOLSignal parseSentimentGauge(Element sentimentGauge, String ticker) {
        try {
            // Extract bullish/bearish percentages
            String bullishText = sentimentGauge.select("span.bullish").text();
            String bearishText = sentimentGauge.select("span.bearish").text();
            
            int bullishPct = extractPercentage(bullishText);
            int bearishPct = extractPercentage(bearishText);
            
            // Calculate sentiment score: -1 (100% bearish) to +1 (100% bullish)
            double sentiment = (bullishPct - bearishPct) / 100.0;
            
            KOLSignal signal = new KOLSignal();
            signal.setSourceName(getName());
            signal.setKolName("StockTwits Community");
            signal.setSignalType(sentiment > 0 ? KOLSignal.SignalType.BULLISH : KOLSignal.SignalType.BEARISH);
            signal.setSignalText(String.format("Community sentiment: %d%% bullish, %d%% bearish", 
                    bullishPct, bearishPct));
            signal.setCompanyTicker(ticker);
            signal.setSignalDate(LocalDateTime.now());
            signal.setPlatform("StockTwits");
            signal.setPostUrl(BASE_URL + "/symbol/" + ticker);
            
            signal.setSignalSentiment(sentiment);
            signal.setQualityScore(0.6); // Community sentiment has moderate quality
            signal.setImpactScore(0.5); // Moderate impact
            signal.setConfidenceLevel(0.7); // Based on volume of posts
            
            Map<String, Object> rawData = new HashMap<>();
            rawData.put("bullish_pct", bullishPct);
            rawData.put("bearish_pct", bearishPct);
            signal.setRawData(rawData);
            
            return signal;
            
        } catch (Exception e) {
            logger.debug("Failed to parse sentiment gauge: {}", e.getMessage());
            return null;
        }
    }
    
    private KOLSignal parseMessage(Element message, String ticker) {
        try {
            Element bodyEl = message.selectFirst("div.body, div.message-body");
            if (bodyEl == null) {
                return null;
            }
            
            String messageText = bodyEl.text();
            if (messageText.length() < 20) {
                return null; // Skip very short messages
            }
            
            Element authorEl = message.selectFirst("a.username, span.username");
            String author = authorEl != null ? authorEl.text() : "Unknown";
            
            Element sentimentEl = message.selectFirst("span.sentiment");
            String sentimentLabel = sentimentEl != null ? sentimentEl.text().toLowerCase() : "";
            
            KOLSignal signal = new KOLSignal();
            signal.setSourceName(getName());
            signal.setKolName(author);
            signal.setKolUsername(author);
            signal.setCompanyTicker(ticker);
            signal.setSignalText(messageText);
            signal.setSignalDate(LocalDateTime.now());
            signal.setPlatform("StockTwits");
            
            // Determine signal type from sentiment label or message content
            if (sentimentLabel.contains("bullish")) {
                signal.setSignalType(KOLSignal.SignalType.BULLISH);
                signal.setSignalSentiment(0.6);
            } else if (sentimentLabel.contains("bearish")) {
                signal.setSignalType(KOLSignal.SignalType.BEARISH);
                signal.setSignalSentiment(-0.6);
            } else {
                signal.setSignalType(KOLSignal.SignalType.NEUTRAL);
                signal.setSignalSentiment(calculateSentiment(messageText));
            }
            
            signal.setQualityScore(0.5); // Individual posts have lower quality
            signal.setImpactScore(0.4);
            signal.setConfidenceLevel(0.5);
            
            return signal;
            
        } catch (Exception e) {
            logger.debug("Failed to parse message: {}", e.getMessage());
            return null;
        }
    }
    
    private int extractPercentage(String text) {
        try {
            String numStr = text.replaceAll("[^0-9]", "");
            return Integer.parseInt(numStr);
        } catch (Exception e) {
            return 0;
        }
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
