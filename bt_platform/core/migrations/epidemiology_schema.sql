-- Epidemiology Intelligence Platform Schema Migration
-- This migration adds comprehensive epidemiology tables with multi-source integration

-- ============================================================================
-- MAIN EPIDEMIOLOGY DISEASE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS epidemiology_diseases (
    id SERIAL PRIMARY KEY,
    disease_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- Disease Classification
    icd10_code VARCHAR(20),
    icd11_code VARCHAR(20),
    snomed_ct_code VARCHAR(50),
    category VARCHAR(100),
    
    -- Basic Information
    description TEXT,
    alternate_names JSONB,
    
    -- Epidemiological Metrics
    prevalence FLOAT,
    incidence FLOAT,
    mortality_rate FLOAT,
    case_fatality_rate FLOAT,
    
    -- Population Metrics
    target_population BIGINT,
    average_age FLOAT,
    gender_ratio FLOAT,
    
    -- GBD Metrics
    dalys FLOAT,
    ylls FLOAT,
    ylds FLOAT,
    
    -- Geographic & Demographic
    geographic_distribution JSONB,
    age_distribution JSONB,
    demographic_data JSONB,
    
    -- Risk Factors & Comorbidities
    risk_factors JSONB,
    comorbidities JSONB,
    
    -- Outcomes & Prognosis
    survival_rate_1yr FLOAT,
    survival_rate_5yr FLOAT,
    survival_rate_10yr FLOAT,
    median_survival_months FLOAT,
    remission_rate FLOAT,
    
    -- Data Provenance & Quality
    data_sources JSONB,
    last_sync TIMESTAMP WITH TIME ZONE,
    source_hash VARCHAR(64),
    reliability_score FLOAT,
    completeness_score FLOAT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for epidemiology_diseases
CREATE INDEX idx_disease_category_active ON epidemiology_diseases(category, is_active);
CREATE INDEX idx_disease_icd10_icd11 ON epidemiology_diseases(icd10_code, icd11_code);
CREATE INDEX idx_disease_name_search ON epidemiology_diseases(name);
CREATE INDEX idx_disease_last_sync ON epidemiology_diseases(last_sync);

-- ============================================================================
-- DATA SOURCE TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS disease_data_sources (
    id SERIAL PRIMARY KEY,
    disease_id INTEGER NOT NULL REFERENCES epidemiology_diseases(id) ON DELETE CASCADE,
    
    -- Source Information
    source_name VARCHAR(50) NOT NULL,
    source_type VARCHAR(50),
    source_url TEXT,
    source_citation TEXT,
    
    -- Data Quality
    collection_date TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE,
    data_version VARCHAR(50),
    reliability_indicator VARCHAR(20),
    completeness_percentage FLOAT,
    
    -- Specific Source Data
    seer_data JSONB,
    who_data JSONB,
    cdc_data JSONB,
    gbd_data JSONB,
    
    -- Provenance
    source_hash VARCHAR(64),
    sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_source_disease_name ON disease_data_sources(disease_id, source_name);
CREATE INDEX idx_source_sync ON disease_data_sources(sync_timestamp);

-- ============================================================================
-- TIME SERIES DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS disease_time_series (
    id SERIAL PRIMARY KEY,
    disease_id INTEGER NOT NULL REFERENCES epidemiology_diseases(id) ON DELETE CASCADE,
    
    -- Temporal Dimension
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    date TIMESTAMP WITH TIME ZONE,
    
    -- Metrics over time
    incidence FLOAT,
    prevalence FLOAT,
    mortality FLOAT,
    cases INTEGER,
    deaths INTEGER,
    
    -- Geographic context
    geography_type VARCHAR(50),
    geography_code VARCHAR(20),
    geography_name VARCHAR(255),
    
    -- Source
    data_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_timeseries_disease_year ON disease_time_series(disease_id, year);
CREATE INDEX idx_timeseries_geo ON disease_time_series(geography_type, geography_code);
CREATE INDEX idx_timeseries_date ON disease_time_series(date);

-- ============================================================================
-- GEOSPATIAL DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS disease_geospatial (
    id SERIAL PRIMARY KEY,
    disease_id INTEGER NOT NULL REFERENCES epidemiology_diseases(id) ON DELETE CASCADE,
    
    -- Geographic Information
    country_code VARCHAR(3),
    country_name VARCHAR(255),
    region VARCHAR(100),
    state_province VARCHAR(255),
    
    -- Metrics
    prevalence FLOAT,
    incidence FLOAT,
    mortality_rate FLOAT,
    population BIGINT,
    cases INTEGER,
    
    -- Year for temporal context
    year INTEGER,
    
    -- Source
    data_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_geo_disease_country ON disease_geospatial(disease_id, country_code);
CREATE INDEX idx_geo_region_year ON disease_geospatial(region, year);

-- ============================================================================
-- DISEASE ONTOLOGY AND RELATIONSHIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS disease_ontology (
    id SERIAL PRIMARY KEY,
    disease_id INTEGER NOT NULL REFERENCES epidemiology_diseases(id) ON DELETE CASCADE,
    related_disease_id INTEGER REFERENCES epidemiology_diseases(id) ON DELETE SET NULL,
    
    -- Relationship Type
    relationship_type VARCHAR(50),
    relationship_strength FLOAT,
    
    -- Hierarchy
    parent_category VARCHAR(100),
    hierarchy_level INTEGER,
    
    -- Additional metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ontology_disease_related ON disease_ontology(disease_id, related_disease_id);
CREATE INDEX idx_ontology_type ON disease_ontology(relationship_type);

-- ============================================================================
-- ICD MAPPING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS icd_mapping (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(20) NOT NULL,
    icd10_description TEXT,
    icd11_code VARCHAR(20),
    icd11_description TEXT,
    mapping_type VARCHAR(20),
    mapping_confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_icd_10_11 ON icd_mapping(icd10_code, icd11_code);

-- ============================================================================
-- DATA INGESTION LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_ingestion_logs (
    id SERIAL PRIMARY KEY,
    
    -- Pipeline Info
    pipeline_name VARCHAR(100),
    data_source VARCHAR(50),
    
    -- Execution
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20),
    
    -- Results
    records_processed INTEGER,
    records_inserted INTEGER,
    records_updated INTEGER,
    records_failed INTEGER,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    execution_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ingestion_pipeline_time ON data_ingestion_logs(pipeline_name, start_time);
CREATE INDEX idx_ingestion_status ON data_ingestion_logs(status);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Complete disease view with latest source data
CREATE OR REPLACE VIEW v_diseases_complete AS
SELECT 
    d.*,
    ds.source_name,
    ds.last_updated as source_last_updated,
    ds.reliability_indicator,
    ds.completeness_percentage
FROM epidemiology_diseases d
LEFT JOIN disease_data_sources ds ON d.id = ds.disease_id
WHERE d.is_active = TRUE;

-- Time series summary by disease
CREATE OR REPLACE VIEW v_disease_trends AS
SELECT 
    disease_id,
    year,
    AVG(incidence) as avg_incidence,
    AVG(prevalence) as avg_prevalence,
    AVG(mortality) as avg_mortality,
    SUM(cases) as total_cases,
    SUM(deaths) as total_deaths
FROM disease_time_series
GROUP BY disease_id, year
ORDER BY disease_id, year;

-- Geographic summary
CREATE OR REPLACE VIEW v_disease_geography AS
SELECT 
    disease_id,
    country_code,
    country_name,
    region,
    year,
    SUM(cases) as total_cases,
    AVG(prevalence) as avg_prevalence,
    AVG(incidence) as avg_incidence
FROM disease_geospatial
GROUP BY disease_id, country_code, country_name, region, year
ORDER BY disease_id, year DESC;

-- Data quality metrics
CREATE OR REPLACE VIEW v_data_quality AS
SELECT 
    d.disease_id,
    d.name,
    d.category,
    d.reliability_score,
    d.completeness_score,
    COUNT(DISTINCT ds.source_name) as source_count,
    MAX(ds.last_updated) as latest_update,
    d.last_sync
FROM epidemiology_diseases d
LEFT JOIN disease_data_sources ds ON d.id = ds.disease_id
GROUP BY d.id, d.disease_id, d.name, d.category, d.reliability_score, d.completeness_score, d.last_sync;
