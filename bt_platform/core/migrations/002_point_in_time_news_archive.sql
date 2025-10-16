-- ============================================================================
-- Point-in-Time News Archive Schema Migration
-- ============================================================================
-- This migration adds the point-in-time news archive system with:
-- - Entity management (companies, drugs, diseases, targets, ETFs)
-- - Article-entity linking with roles and weights
-- - Point-in-time snapshots for reproducibility
-- - Price reaction tracking vs benchmarks
--
-- Run this after setting up the base schema
-- ============================================================================

-- ============================================================================
-- Entities Table (companies, drugs, diseases, targets, ETFs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind VARCHAR(50) NOT NULL,  -- 'company', 'drug', 'disease', 'target', 'etf'
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(10),  -- for companies/ETFs
    exchange VARCHAR(50),
    synonyms JSON,  -- List of synonyms
    attributes JSON,  -- Optional: moa, mechanism, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_entity_kind_name ON entities(kind, name);
CREATE INDEX idx_entity_ticker ON entities(ticker);


-- ============================================================================
-- Article-Entity Linking Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL,  -- 'primary', 'mentioned', 'competitor', 'etf'
    confidence FLOAT,  -- 0-1 confidence score
    weight FLOAT,  -- exposure weight
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_article_entity_role ON article_entities(article_id, entity_id, role);


-- ============================================================================
-- Company Snapshots (point-in-time market caps)
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    asof_date TIMESTAMP NOT NULL,
    market_cap FLOAT,
    cap_bucket VARCHAR(20),  -- 'Micro', 'Small', 'Mid', 'Large', 'Mega'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_company_snapshot_date ON company_snapshots(entity_id, asof_date);


-- ============================================================================
-- ETF Constituents (point-in-time holdings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS etf_constituents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etf_entity_id INTEGER NOT NULL,
    asof_date TIMESTAMP NOT NULL,
    member_entity_id INTEGER NOT NULL,
    weight FLOAT,  -- 0-1 weight in ETF
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etf_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (member_entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_etf_constituent ON etf_constituents(etf_entity_id, asof_date, member_entity_id);


-- ============================================================================
-- Article Price Reactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,  -- ticker
    event_time TIMESTAMP NOT NULL,
    window VARCHAR(50) NOT NULL,  -- e.g., '[-1d,+1d]', '[0,+60m]'
    raw_return FLOAT,  -- % return
    benchmark_entity_id INTEGER,  -- XBI or custom basket
    abnormal_return FLOAT,  -- vs benchmark
    p_value FLOAT,  -- optional significance test
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (benchmark_entity_id) REFERENCES entities(id)
);

CREATE INDEX idx_article_reaction ON article_reactions(article_id, entity_id, window);


-- ============================================================================
-- Enhance Articles Table
-- ============================================================================
-- Add new columns to existing articles table
ALTER TABLE articles ADD COLUMN fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE articles ADD COLUMN canonical_key VARCHAR(500);
ALTER TABLE articles ADD COLUMN fulltext TEXT;
ALTER TABLE articles ADD COLUMN ta_tags JSON;  -- ["SMA","GLP-1","Oncology",...]
ALTER TABLE articles ADD COLUMN importance VARCHAR(20);  -- Critical, High, Medium, Low
ALTER TABLE articles ADD COLUMN relevance_score INTEGER;
ALTER TABLE articles ADD COLUMN cross_source_count INTEGER DEFAULT 1;

CREATE INDEX idx_article_canonical_key ON articles(canonical_key);
CREATE INDEX idx_article_importance ON articles(importance);


-- ============================================================================
-- Seed Sample Data
-- ============================================================================

-- Create XBI ETF entity
INSERT INTO entities (kind, name, ticker) VALUES ('etf', 'SPDR S&P Biotech ETF', 'XBI');

-- Create sample biotech companies
INSERT INTO entities (kind, name, ticker, synonyms) VALUES 
    ('company', 'Scholar Rock Holding Corporation', 'SRRK', '["Scholar Rock"]'),
    ('company', 'Ionis Pharmaceuticals', 'IONS', '["Ionis"]'),
    ('company', 'Biogen Inc.', 'BIIB', '["Biogen"]'),
    ('company', 'Vertex Pharmaceuticals', 'VRTX', '["Vertex"]');

-- Create sample drugs
INSERT INTO entities (kind, name, synonyms) VALUES
    ('drug', 'apitegromab', '["apitegromab", "SRK-015"]'),
    ('drug', 'nusinersen', '["nusinersen", "Spinraza"]'),
    ('drug', 'risdiplam', '["risdiplam", "Evrysdi"]');

-- Create sample diseases
INSERT INTO entities (kind, name, synonyms) VALUES
    ('disease', 'Spinal Muscular Atrophy', '["SMA", "spinal muscular atrophy"]'),
    ('disease', 'Type 2 Diabetes', '["T2D", "type 2 diabetes", "diabetes mellitus type 2"]'),
    ('disease', 'Obesity', '["obesity", "overweight"]');


-- ============================================================================
-- Data Migration Notes
-- ============================================================================
/*
After running this migration:

1. Existing articles will have NULL values for new fields (fetched_at, canonical_key, etc.)
2. Run the refresh pipeline to populate new fields for existing articles
3. Use POST /api/v1/news/refresh-now to trigger manual refresh
4. Price reactions must be calculated explicitly via API
5. ETF constituents must be loaded from external data sources

To populate historical data:
- Use the entity extraction service to backfill article_entities
- Calculate canonical keys for existing articles
- Compute price reactions for past events (if market data available)
- Load ETF constituent snapshots from data providers

Point-in-time integrity:
- All snapshots are dated (asof_date) for reproducibility
- Market caps and ETF holdings are versioned
- Price reactions preserve the exact event time
- Articles preserve both published_at and fetched_at
*/
