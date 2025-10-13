"""
Database Migration: Catalyst Intelligence System with Provenance
================================================================

This migration adds comprehensive provenance tracking and enhanced
catalyst event fields to support the biotech intelligence system.

Run this migration after setting up the database environment.
"""

-- ============================================================================
-- Add Source Provenance Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS source_provenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_url VARCHAR(1000) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    accessed_at TIMESTAMP NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    parser_version VARCHAR(50) NOT NULL,
    selector VARCHAR(500),
    verbatim_excerpt TEXT NOT NULL,
    source_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_source_prov_type_accessed ON source_provenance(source_type, accessed_at);
CREATE INDEX idx_source_prov_hash ON source_provenance(content_hash);


-- ============================================================================
-- Add Entity Source Link Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_source_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    source_provenance_id INTEGER NOT NULL,
    relevance_score FLOAT,
    is_primary BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_provenance_id) REFERENCES source_provenance(id)
);

CREATE INDEX idx_entity_source_link ON entity_source_links(entity_type, entity_id);
CREATE INDEX idx_entity_source_prov ON entity_source_links(source_provenance_id);


-- ============================================================================
-- Add Alias Map Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS alias_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    canonical VARCHAR(255) NOT NULL,
    alias VARCHAR(255) NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alias_entity_type ON alias_map(entity_type, canonical);
CREATE INDEX idx_alias_search ON alias_map(entity_type, alias);


-- ============================================================================
-- Add Analyst Note Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS analyst_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    author VARCHAR(100) NOT NULL,
    note TEXT NOT NULL,
    note_type VARCHAR(50),
    override_field VARCHAR(100),
    override_value VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_analyst_note_entity ON analyst_notes(entity_type, entity_id);
CREATE INDEX idx_analyst_note_author ON analyst_notes(author, created_at);


-- ============================================================================
-- Enhance Catalyst Events Table
-- ============================================================================

-- Add new columns to catalyst_events table
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN for multiple columns,
-- so we add them one at a time

ALTER TABLE catalyst_events ADD COLUMN trial_id INTEGER REFERENCES trials(id);
ALTER TABLE catalyst_events ADD COLUMN event_window_start DATE;
ALTER TABLE catalyst_events ADD COLUMN event_window_end DATE;
ALTER TABLE catalyst_events ADD COLUMN date_confidence VARCHAR(50);
ALTER TABLE catalyst_events ADD COLUMN primary_endpoint_type VARCHAR(100);
ALTER TABLE catalyst_events ADD COLUMN control_type VARCHAR(100);
ALTER TABLE catalyst_events ADD COLUMN trial_phase VARCHAR(50);
ALTER TABLE catalyst_events ADD COLUMN trial_design VARCHAR(100);
ALTER TABLE catalyst_events ADD COLUMN target_gene VARCHAR(100);
ALTER TABLE catalyst_events ADD COLUMN n INTEGER;
ALTER TABLE catalyst_events ADD COLUMN orphan BOOLEAN DEFAULT 0;
ALTER TABLE catalyst_events ADD COLUMN fast_track BOOLEAN DEFAULT 0;
ALTER TABLE catalyst_events ADD COLUMN breakthrough BOOLEAN DEFAULT 0;
ALTER TABLE catalyst_events ADD COLUMN endpoint_rigor FLOAT;
ALTER TABLE catalyst_events ADD COLUMN phase_weight FLOAT;
ALTER TABLE catalyst_events ADD COLUMN unmet_need FLOAT;
ALTER TABLE catalyst_events ADD COLUMN complexity_penalty FLOAT;
ALTER TABLE catalyst_events ADD COLUMN quality_score FLOAT;
ALTER TABLE catalyst_events ADD COLUMN prob_of_success FLOAT;
ALTER TABLE catalyst_events ADD COLUMN pos_overridden BOOLEAN DEFAULT 0;
ALTER TABLE catalyst_events ADD COLUMN expected_impact VARCHAR(50);
ALTER TABLE catalyst_events ADD COLUMN last_reviewed_at TIMESTAMP;

-- Create new indexes for catalyst_events
CREATE INDEX idx_catalyst_window ON catalyst_events(event_window_start, event_window_end);
CREATE INDEX idx_catalyst_confidence ON catalyst_events(date_confidence, status);
CREATE INDEX idx_catalyst_phase ON catalyst_events(trial_phase, event_type);


-- ============================================================================
-- Enhance Trials Table
-- ============================================================================

-- Add new columns to trials table
ALTER TABLE trials ADD COLUMN design VARCHAR(100);
ALTER TABLE trials ADD COLUMN control_type VARCHAR(100);
ALTER TABLE trials ADD COLUMN primary_endpoint_type VARCHAR(100);

CREATE INDEX idx_trial_completion ON trials(primary_completion_date);


-- ============================================================================
-- Data Migration Notes
-- ============================================================================

/*
After running this migration:

1. All existing catalyst_events will have NULL values for new fields
2. No provenance records exist yet - they must be created via API
3. Legacy catalyst events without provenance can continue to exist
4. New catalyst events MUST include at least one source_provenance record

To populate provenance for existing catalysts:
- Use the POST /api/v1/catalysts/{id}/provenance endpoint (future)
- Or update catalysts via PATCH with source_provenance array
- Or run a backfill script to extract from legacy sources JSON field

Quality scores will be computed automatically on:
- POST /api/v1/catalysts (new catalysts)
- PATCH /api/v1/catalysts/{id} (when scoring fields change)
*/
