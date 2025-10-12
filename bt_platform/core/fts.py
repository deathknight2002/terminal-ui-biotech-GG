"""
Full-Text Search (FTS) Implementation

SQLite FTS5 virtual tables for efficient full-text search.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class FTSIndex:
    """
    Full-Text Search index using SQLite FTS5.
    
    Creates virtual tables for efficient text search across entities.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_indexes(self) -> None:
        """Create FTS5 virtual tables for all searchable entities."""
        
        # Companies FTS index
        self.db.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS companies_fts USING fts5(
                id UNINDEXED,
                ticker,
                name,
                description,
                therapeutic_areas,
                content='companies',
                content_rowid='id'
            );
        """))
        
        # Trials FTS index
        self.db.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS trials_fts USING fts5(
                id UNINDEXED,
                nct_id,
                title,
                condition,
                sponsor,
                intervention,
                content='clinical_trials',
                content_rowid='id'
            );
        """))
        
        # Articles FTS index
        self.db.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
                id UNINDEXED,
                title,
                summary,
                source,
                content='articles',
                content_rowid='id'
            );
        """))
        
        # Diseases FTS index
        self.db.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS diseases_fts USING fts5(
                id UNINDEXED,
                name,
                description,
                icd10_code,
                synonyms,
                content='epidemiology_diseases',
                content_rowid='id'
            );
        """))
        
        # Catalysts FTS index
        self.db.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS catalysts_fts USING fts5(
                id UNINDEXED,
                title,
                description,
                company,
                event_type,
                content='catalysts',
                content_rowid='id'
            );
        """))
        
        # Therapeutics FTS index
        self.db.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS therapeutics_fts USING fts5(
                id UNINDEXED,
                name,
                indication,
                target,
                mechanism,
                modality,
                content='therapeutics',
                content_rowid='id'
            );
        """))
        
        self.db.commit()
        logger.info("Created FTS5 indexes")
    
    def create_triggers(self) -> None:
        """Create triggers to keep FTS indexes in sync with source tables."""
        
        # Companies triggers
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS companies_ai AFTER INSERT ON companies BEGIN
                INSERT INTO companies_fts(id, ticker, name, description, therapeutic_areas)
                VALUES (new.id, new.ticker, new.name, new.description, new.therapeutic_areas);
            END;
        """))
        
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS companies_ad AFTER DELETE ON companies BEGIN
                DELETE FROM companies_fts WHERE id = old.id;
            END;
        """))
        
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS companies_au AFTER UPDATE ON companies BEGIN
                UPDATE companies_fts SET 
                    ticker = new.ticker,
                    name = new.name,
                    description = new.description,
                    therapeutic_areas = new.therapeutic_areas
                WHERE id = old.id;
            END;
        """))
        
        # Trials triggers
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS trials_ai AFTER INSERT ON clinical_trials BEGIN
                INSERT INTO trials_fts(id, nct_id, title, condition, sponsor, intervention)
                VALUES (new.id, new.nct_id, new.title, new.condition, new.sponsor, new.intervention);
            END;
        """))
        
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS trials_ad AFTER DELETE ON clinical_trials BEGIN
                DELETE FROM trials_fts WHERE id = old.id;
            END;
        """))
        
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS trials_au AFTER UPDATE ON clinical_trials BEGIN
                UPDATE trials_fts SET 
                    nct_id = new.nct_id,
                    title = new.title,
                    condition = new.condition,
                    sponsor = new.sponsor,
                    intervention = new.intervention
                WHERE id = old.id;
            END;
        """))
        
        # Articles triggers
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
                INSERT INTO articles_fts(id, title, summary, source)
                VALUES (new.id, new.title, new.summary, new.source);
            END;
        """))
        
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
                DELETE FROM articles_fts WHERE id = old.id;
            END;
        """))
        
        self.db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
                UPDATE articles_fts SET 
                    title = new.title,
                    summary = new.summary,
                    source = new.source
                WHERE id = old.id;
            END;
        """))
        
        self.db.commit()
        logger.info("Created FTS5 triggers")
    
    def rebuild_index(self, table_name: str) -> None:
        """
        Rebuild FTS index for a specific table.
        
        Args:
            table_name: Name of the FTS table (e.g., 'companies_fts')
        """
        self.db.execute(text(f"INSERT INTO {table_name}({table_name}) VALUES('rebuild');"))
        self.db.commit()
        logger.info(f"Rebuilt FTS index: {table_name}")
    
    def rebuild_all_indexes(self) -> None:
        """Rebuild all FTS indexes."""
        fts_tables = [
            'companies_fts',
            'trials_fts',
            'articles_fts',
            'diseases_fts',
            'catalysts_fts',
            'therapeutics_fts'
        ]
        
        for table in fts_tables:
            try:
                self.rebuild_index(table)
            except Exception as e:
                logger.warning(f"Could not rebuild {table}: {e}")
    
    def optimize_indexes(self) -> None:
        """Optimize all FTS indexes."""
        fts_tables = [
            'companies_fts',
            'trials_fts',
            'articles_fts',
            'diseases_fts',
            'catalysts_fts',
            'therapeutics_fts'
        ]
        
        for table in fts_tables:
            try:
                self.db.execute(text(f"INSERT INTO {table}({table}) VALUES('optimize');"))
            except Exception as e:
                logger.warning(f"Could not optimize {table}: {e}")
        
        self.db.commit()
        logger.info("Optimized FTS indexes")


def search_fts(
    db: Session,
    query: str,
    entity_type: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Perform full-text search using FTS5.
    
    Args:
        db: Database session
        query: Search query
        entity_type: Optional entity type filter
        limit: Max results
    
    Returns:
        List of search results with scores
    """
    results = []
    
    # Sanitize query for FTS5
    fts_query = query.replace('"', '""')
    
    # Search companies
    if not entity_type or entity_type == 'companies':
        try:
            company_results = db.execute(text("""
                SELECT 
                    c.id,
                    c.ticker,
                    c.name,
                    c.company_type,
                    c.market_cap,
                    fts.rank as score,
                    'company' as type
                FROM companies_fts fts
                JOIN companies c ON c.id = fts.id
                WHERE companies_fts MATCH :query
                ORDER BY rank
                LIMIT :limit
            """), {"query": fts_query, "limit": limit}).fetchall()
            
            for row in company_results:
                results.append({
                    "type": "company",
                    "id": row.ticker,
                    "title": row.name,
                    "ticker": row.ticker,
                    "company_type": row.company_type,
                    "market_cap": row.market_cap,
                    "score": abs(row.score)
                })
        except Exception as e:
            logger.error(f"Error searching companies: {e}")
    
    # Search trials
    if not entity_type or entity_type == 'trials':
        try:
            trial_results = db.execute(text("""
                SELECT 
                    t.id,
                    t.nct_id,
                    t.title,
                    t.phase,
                    t.status,
                    t.condition,
                    fts.rank as score,
                    'trial' as type
                FROM trials_fts fts
                JOIN clinical_trials t ON t.id = fts.id
                WHERE trials_fts MATCH :query
                ORDER BY rank
                LIMIT :limit
            """), {"query": fts_query, "limit": limit}).fetchall()
            
            for row in trial_results:
                results.append({
                    "type": "trial",
                    "id": row.nct_id,
                    "title": row.title,
                    "nct_id": row.nct_id,
                    "phase": row.phase,
                    "status": row.status,
                    "condition": row.condition,
                    "score": abs(row.score)
                })
        except Exception as e:
            logger.error(f"Error searching trials: {e}")
    
    # Search articles
    if not entity_type or entity_type == 'articles':
        try:
            article_results = db.execute(text("""
                SELECT 
                    a.id,
                    a.title,
                    a.summary,
                    a.source,
                    a.url,
                    a.published_at,
                    fts.rank as score,
                    'article' as type
                FROM articles_fts fts
                JOIN articles a ON a.id = fts.id
                WHERE articles_fts MATCH :query
                AND a.link_valid = 1
                ORDER BY rank
                LIMIT :limit
            """), {"query": fts_query, "limit": limit}).fetchall()
            
            for row in article_results:
                results.append({
                    "type": "article",
                    "id": row.id,
                    "title": row.title,
                    "snippet": row.summary[:200] if row.summary else "",
                    "source": row.source,
                    "url": row.url,
                    "published_at": row.published_at.isoformat() if row.published_at else None,
                    "score": abs(row.score)
                })
        except Exception as e:
            logger.error(f"Error searching articles: {e}")
    
    # Search diseases
    if not entity_type or entity_type == 'diseases':
        try:
            disease_results = db.execute(text("""
                SELECT 
                    d.id,
                    d.name,
                    d.description,
                    d.icd10_code,
                    d.category,
                    d.prevalence,
                    fts.rank as score,
                    'disease' as type
                FROM diseases_fts fts
                JOIN epidemiology_diseases d ON d.id = fts.id
                WHERE diseases_fts MATCH :query
                AND d.is_active = 1
                ORDER BY rank
                LIMIT :limit
            """), {"query": fts_query, "limit": limit}).fetchall()
            
            for row in disease_results:
                results.append({
                    "type": "disease",
                    "id": row.id,
                    "title": row.name,
                    "icd10_code": row.icd10_code,
                    "category": row.category,
                    "prevalence": row.prevalence,
                    "snippet": row.description[:200] if row.description else "",
                    "score": abs(row.score)
                })
        except Exception as e:
            logger.error(f"Error searching diseases: {e}")
    
    # Sort by score
    results.sort(key=lambda x: x["score"], reverse=False)  # Lower rank is better in FTS5
    
    return results[:limit]


def initialize_fts(db: Session) -> None:
    """
    Initialize FTS indexes and triggers.
    
    Args:
        db: Database session
    """
    fts = FTSIndex(db)
    fts.create_indexes()
    fts.create_triggers()
    fts.rebuild_all_indexes()
    fts.optimize_indexes()
    logger.info("FTS initialization complete")
