package com.biotech.kol.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Represents a single KOL signal/opinion
 */
public class KOLSignal {
    
    @JsonProperty("source_name")
    private String sourceName;
    
    @JsonProperty("kol_name")
    private String kolName;
    
    @JsonProperty("kol_username")
    private String kolUsername;
    
    @JsonProperty("signal_type")
    private SignalType signalType;
    
    @JsonProperty("signal_text")
    private String signalText;
    
    @JsonProperty("signal_sentiment")
    private Double signalSentiment; // -1.0 to 1.0
    
    @JsonProperty("company_ticker")
    private String companyTicker;
    
    @JsonProperty("drug_name")
    private String drugName;
    
    @JsonProperty("signal_date")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime signalDate;
    
    @JsonProperty("platform")
    private String platform;
    
    @JsonProperty("post_url")
    private String postUrl;
    
    @JsonProperty("quality_score")
    private Double qualityScore; // 0.0 to 1.0
    
    @JsonProperty("impact_score")
    private Double impactScore; // 0.0 to 1.0
    
    @JsonProperty("confidence_level")
    private Double confidenceLevel; // 0.0 to 1.0
    
    @JsonProperty("raw_data")
    private Map<String, Object> rawData;
    
    public enum SignalType {
        BULLISH,
        BEARISH,
        NEUTRAL,
        UPGRADE,
        DOWNGRADE,
        PRICE_TARGET,
        CATALYST_ALERT,
        REGULATORY_UPDATE,
        CLINICAL_DATA
    }
    
    // Constructors
    public KOLSignal() {}
    
    public KOLSignal(String sourceName, String kolName, SignalType signalType, String signalText) {
        this.sourceName = sourceName;
        this.kolName = kolName;
        this.signalType = signalType;
        this.signalText = signalText;
        this.signalDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    
    public String getKolName() { return kolName; }
    public void setKolName(String kolName) { this.kolName = kolName; }
    
    public String getKolUsername() { return kolUsername; }
    public void setKolUsername(String kolUsername) { this.kolUsername = kolUsername; }
    
    public SignalType getSignalType() { return signalType; }
    public void setSignalType(SignalType signalType) { this.signalType = signalType; }
    
    public String getSignalText() { return signalText; }
    public void setSignalText(String signalText) { this.signalText = signalText; }
    
    public Double getSignalSentiment() { return signalSentiment; }
    public void setSignalSentiment(Double signalSentiment) { this.signalSentiment = signalSentiment; }
    
    public String getCompanyTicker() { return companyTicker; }
    public void setCompanyTicker(String companyTicker) { this.companyTicker = companyTicker; }
    
    public String getDrugName() { return drugName; }
    public void setDrugName(String drugName) { this.drugName = drugName; }
    
    public LocalDateTime getSignalDate() { return signalDate; }
    public void setSignalDate(LocalDateTime signalDate) { this.signalDate = signalDate; }
    
    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }
    
    public String getPostUrl() { return postUrl; }
    public void setPostUrl(String postUrl) { this.postUrl = postUrl; }
    
    public Double getQualityScore() { return qualityScore; }
    public void setQualityScore(Double qualityScore) { this.qualityScore = qualityScore; }
    
    public Double getImpactScore() { return impactScore; }
    public void setImpactScore(Double impactScore) { this.impactScore = impactScore; }
    
    public Double getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(Double confidenceLevel) { this.confidenceLevel = confidenceLevel; }
    
    public Map<String, Object> getRawData() { return rawData; }
    public void setRawData(Map<String, Object> rawData) { this.rawData = rawData; }
    
    @Override
    public String toString() {
        return String.format("KOLSignal{source='%s', kol='%s', type=%s, ticker='%s', date=%s}",
                sourceName, kolName, signalType, companyTicker, signalDate);
    }
}
