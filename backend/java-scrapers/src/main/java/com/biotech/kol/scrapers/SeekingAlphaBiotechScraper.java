package com.biotech.kol.scrapers;

import com.biotech.kol.models.KOLSignal;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Scraper for Seeking Alpha biotech contributors and articles
 * Note: This is a simplified scraper. In production, you'd need to handle:
 * - Authentication/API keys
 * - Rate limiting
 * - More sophisticated parsing
 */
public class SeekingAlphaBiotechScraper extends BaseKOLScraper {

    private static final String BASE_URL = "https://seekingalpha.com";
    private static final String BIOTECH_URL = BASE_URL + "/stock-ideas/healthcare/biotech";

    // List of known quality biotech analysts on Seeking Alpha
    private static final Set<String> TOP_ANALYSTS = new HashSet<>(Arrays.asList(
        "Bret Jensen",
        "Raghuram Selvaraju",
        "BioSci Capital Partners",
        "Growth Stock Picks",
        "The Life Sciences Report"
    ));

    @Override
    public String getName() {
        return "SeekingAlpha Biotech";
    }

    @Override
    public String getSourceType() {
        return "news";
    }

    @Override
    public int getRecommendedFrequencyMinutes() {
        return 120; // 2 hours
    }

    @Override
    protected List<KOLSignal> doScrape(Map<String, Object> config) throws Exception {
        List<KOLSignal> signals = new ArrayList<>();

        try {
            // Fetch the biotech articles page
            Document doc = Jsoup.connect(BIOTECH_URL)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(30000)
                    .get();

            // Parse article listings
            Elements articles = doc.select("article.list-article, div[data-test-id='post-list-item']");

            for (Element article : articles) {
                try {
                    KOLSignal signal = parseArticle(article);
                    if (signal != null) {
                        signals.add(signal);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to parse article: {}", e.getMessage());
                }
            }

        } catch (Exception e) {
            logger.error("Failed to scrape Seeking Alpha: {}", e.getMessage(), e);
            // Don't throw - return partial results
        }

        return signals;
    }

    private KOLSignal parseArticle(Element article) {
        try {
            Element titleEl = article.selectFirst("a[data-test-id='post-list-item-title']");
            if (titleEl == null) {
                return null;
            }

            String title = titleEl.text();
            String url = titleEl.attr("abs:href");

            Element authorEl = article.selectFirst("a[data-test-id='post-list-author']");
            String author = authorEl != null ? authorEl.text() : "Unknown";

            Element summaryEl = article.selectFirst("div[data-test-id='post-list-content']");
            String summary = summaryEl != null ? summaryEl.text() : title;

            KOLSignal signal = new KOLSignal();
            signal.setSourceName(getName());
            signal.setKolName(author);
            signal.setKolUsername(author);

            // Determine signal type from title
            signal.setSignalType(determineSignalType(title));
            signal.setSignalText(summary);
            signal.setSignalDate(LocalDateTime.now());
            signal.setPlatform("Seeking Alpha");
            signal.setPostUrl(url);

            // Extract tickers from title
            List<String> tickers = extractTickers(title + " " + summary);
            if (!tickers.isEmpty()) {
                signal.setCompanyTicker(tickers.get(0));
            }

            // Calculate scores
            signal.setSignalSentiment(calculateSentiment(title + " " + summary));
            signal.setQualityScore(calculateQualityScore(author));
            signal.setImpactScore(calculateImpactScore(author, title));
            signal.setConfidenceLevel(0.7); // Default confidence for articles

            // Store raw data
            Map<String, Object> rawData = new HashMap<>();
            rawData.put("title", title);
            rawData.put("author", author);
            rawData.put("url", url);
            signal.setRawData(rawData);

            return signal;

        } catch (Exception e) {
            logger.warn("Failed to parse article: {}", e.getMessage());
            return null;
        }
    }

    private KOLSignal.SignalType determineSignalType(String title) {
        String lowerTitle = title.toLowerCase();

        if (lowerTitle.contains("buy") || lowerTitle.contains("bullish")) {
            return KOLSignal.SignalType.BULLISH;
        } else if (lowerTitle.contains("sell") || lowerTitle.contains("bearish")) {
            return KOLSignal.SignalType.BEARISH;
        } else if (lowerTitle.contains("upgrade")) {
            return KOLSignal.SignalType.UPGRADE;
        } else if (lowerTitle.contains("downgrade")) {
            return KOLSignal.SignalType.DOWNGRADE;
        } else if (lowerTitle.contains("price target") || lowerTitle.contains("pt")) {
            return KOLSignal.SignalType.PRICE_TARGET;
        }

        return KOLSignal.SignalType.NEUTRAL;
    }

    private double calculateQualityScore(String author) {
        // Higher score for known quality analysts
        if (TOP_ANALYSTS.contains(author)) {
            return 0.9;
        }

        // Default quality for Seeking Alpha contributors
        return 0.7;
    }

    private double calculateImpactScore(String author, String title) {
        double baseScore = 0.6;

        // Boost for top analysts
        if (TOP_ANALYSTS.contains(author)) {
            baseScore += 0.2;
        }

        // Boost for high-impact keywords
        String lowerTitle = title.toLowerCase();
        if (lowerTitle.contains("fda") || lowerTitle.contains("approval") ||
            lowerTitle.contains("phase 3") || lowerTitle.contains("breakthrough")) {
            baseScore += 0.1;
        }

        return Math.min(baseScore, 1.0);
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
