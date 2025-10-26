#!/usr/bin/env python3
"""
Point-in-Time News Archive - Integration Example

This script demonstrates the end-to-end functionality of the news archive system:
1. Create sample entities (companies, drugs, diseases)
2. Create sample articles
3. Extract entities from articles
4. Calculate price reactions
5. Get exposures and read-through analysis
"""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bt_platform.core.database import (
    Base, Article, Entity, ArticleEntity, ArticleReaction,
    CompanySnapshot, ETFConstituent
)
from bt_platform.core.services import (
    NewsRefreshService,
    EntityExtractionService,
    PriceReactionService
)


def setup_database():
    """Create in-memory database for demonstration"""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def create_sample_entities(db):
    """Create sample companies, drugs, and diseases"""
    print("\n📦 Creating sample entities...")

    # Companies
    companies = [
        Entity(kind="company", name="Scholar Rock Holding Corporation", ticker="SRRK"),
        Entity(kind="company", name="Ionis Pharmaceuticals", ticker="IONS"),
        Entity(kind="company", name="Biogen Inc.", ticker="BIIB"),
    ]

    # Drugs
    drugs = [
        Entity(kind="drug", name="apitegromab", synonyms=["apitegromab", "SRK-015"]),
        Entity(kind="drug", name="nusinersen", synonyms=["nusinersen", "Spinraza"]),
    ]

    # Diseases
    diseases = [
        Entity(kind="disease", name="Spinal Muscular Atrophy", synonyms=["SMA", "spinal muscular atrophy"]),
        Entity(kind="disease", name="Type 2 Diabetes", synonyms=["T2D", "type 2 diabetes"]),
    ]

    # ETF
    xbi = Entity(kind="etf", name="SPDR S&P Biotech ETF", ticker="XBI")

    for entity in companies + drugs + diseases + [xbi]:
        db.add(entity)

    db.commit()

    print(f"  ✅ Created {len(companies)} companies")
    print(f"  ✅ Created {len(drugs)} drugs")
    print(f"  ✅ Created {len(diseases)} diseases")
    print(f"  ✅ Created 1 ETF (XBI)")

    return companies, drugs, diseases, xbi


def create_sample_articles(db):
    """Create sample news articles"""
    print("\n📰 Creating sample articles...")

    articles = [
        {
            "title": "Scholar Rock ($SRRK) Announces Positive Phase 3 Results for SMA Treatment",
            "url": "https://fiercebiotech.com/article1",
            "source": "FierceBiotech",
            "summary": "Scholar Rock announced positive topline results from Phase 3 trial of apitegromab in spinal muscular atrophy patients.",
            "published_at": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "title": "Ionis (NASDAQ:IONS) Expands SMA Pipeline with New Drug Candidate",
            "url": "https://biospace.com/article2",
            "source": "BioSpace",
            "summary": "Ionis Pharmaceuticals expands its SMA portfolio with a next-generation antisense oligonucleotide.",
            "published_at": datetime.utcnow() - timedelta(hours=5)
        },
        {
            "title": "FDA Approves Breakthrough Therapy Designation for GLP-1 Obesity Drug",
            "url": "https://pharmanewswire.com/article3",
            "source": "PharmaNewsWire",
            "summary": "FDA grants breakthrough therapy designation for novel GLP-1 receptor agonist targeting obesity.",
            "published_at": datetime.utcnow() - timedelta(days=1)
        }
    ]

    refresh_service = NewsRefreshService(db)

    created_articles = []
    for article_data in articles:
        # Generate canonical key
        canonical_key = refresh_service.canonical_key(article_data["title"], article_data["url"])

        # Detect TAs and importance
        combined_text = f"{article_data['title']} {article_data['summary']}"
        ta_tags = refresh_service.detect_therapeutic_areas(combined_text)
        importance = refresh_service.score_importance(combined_text)

        article = Article(
            title=article_data["title"],
            url=article_data["url"],
            source=article_data["source"],
            summary=article_data["summary"],
            published_at=article_data["published_at"],
            fetched_at=datetime.utcnow(),
            canonical_key=canonical_key,
            ta_tags=ta_tags,
            importance=importance,
            relevance_score=80,
            cross_source_count=1
        )
        db.add(article)
        db.flush()
        created_articles.append(article)

        print(f"  ✅ Created: {article.title[:60]}...")
        print(f"     TAs: {ta_tags}, Importance: {importance}")

    db.commit()
    return created_articles


def extract_and_link_entities(db, articles):
    """Extract entities from articles and create links"""
    print("\n🔗 Extracting and linking entities...")

    entity_service = EntityExtractionService(db)

    for article in articles:
        text = f"{article.title} {article.summary}"
        entities = entity_service.extract_all_entities(text)

        print(f"\n  Article: {article.title[:60]}...")

        # Link companies
        for company in entities["companies"]:
            link = ArticleEntity(
                article_id=article.id,
                entity_id=company["entity_id"],
                role="primary",
                confidence=company["confidence"],
                weight=1.0
            )
            db.add(link)
            print(f"    ✅ Company: {company['name']} ({company['ticker']}) - confidence: {company['confidence']}")

        # Link drugs
        for drug in entities["drugs"]:
            link = ArticleEntity(
                article_id=article.id,
                entity_id=drug["entity_id"],
                role="mentioned",
                confidence=drug["confidence"],
                weight=0.8
            )
            db.add(link)
            print(f"    ✅ Drug: {drug['name']} - confidence: {drug['confidence']}")

        # Link diseases
        for disease in entities["diseases"]:
            link = ArticleEntity(
                article_id=article.id,
                entity_id=disease["entity_id"],
                role="mentioned",
                confidence=disease["confidence"],
                weight=0.7
            )
            db.add(link)
            print(f"    ✅ Disease: {disease['name']} - confidence: {disease['confidence']}")

    db.commit()


def calculate_price_reactions(db, articles):
    """Calculate price reactions for articles"""
    print("\n📈 Calculating price reactions...")

    reaction_service = PriceReactionService(db)

    for article in articles:
        # Get linked entities
        links = db.query(ArticleEntity).filter(
            ArticleEntity.article_id == article.id,
            ArticleEntity.role == "primary"
        ).all()

        for link in links:
            entity = db.query(Entity).filter(Entity.id == link.entity_id).first()
            if entity and entity.ticker:
                # Calculate reactions for multiple windows
                windows = ["[-1d,+1d]", "[0,+60m]"]

                print(f"\n  Article: {article.title[:60]}...")
                print(f"  Ticker: {entity.ticker}")

                for window in windows:
                    reaction = reaction_service.calculate_reaction(
                        article.id,
                        entity.id,
                        article.published_at,
                        window,
                        "XBI"
                    )

                    if reaction:
                        print(f"    ✅ Window {window}:")
                        print(f"       Raw return: {reaction['raw_return']:.2%}")
                        print(f"       Abnormal return: {reaction['abnormal_return']:.2%}")
                        print(f"       P-value: {reaction['p_value']:.3f}")


def demonstrate_exposures(db, articles):
    """Demonstrate exposure analysis"""
    print("\n💼 Demonstrating exposure analysis...")

    entity_service = EntityExtractionService(db)

    for article in articles[:1]:  # Just first article for demo
        print(f"\n  Article: {article.title[:60]}...")

        # Get all entity links
        links = db.query(ArticleEntity).filter(
            ArticleEntity.article_id == article.id
        ).all()

        exposures = {"direct": [], "competitor": [], "etf": []}

        for link in links:
            entity = db.query(Entity).filter(Entity.id == link.entity_id).first()
            if not entity:
                continue

            exposure_data = {
                "name": entity.name,
                "ticker": entity.ticker,
                "role": link.role,
                "weight": link.weight,
                "confidence": link.confidence
            }

            if link.role == "primary":
                exposures["direct"].append(exposure_data)
            elif link.role == "etf":
                exposures["etf"].append(exposure_data)
            elif link.role == "competitor":
                exposures["competitor"].append(exposure_data)

        print(f"\n  📊 Direct Exposures: {len(exposures['direct'])}")
        for exp in exposures["direct"]:
            print(f"     • {exp['name']} ({exp['ticker']}) - weight: {exp['weight']:.2f}")

        print(f"\n  🔄 Competitor Exposures: {len(exposures['competitor'])}")
        for exp in exposures["competitor"]:
            print(f"     • {exp['name']} ({exp.get('ticker', 'N/A')}) - weight: {exp['weight']:.2f}")


def main():
    """Main demonstration function"""
    print("=" * 80)
    print("Point-in-Time News Archive System - Integration Demo")
    print("=" * 80)

    # Setup
    db = setup_database()

    # Create sample data
    companies, drugs, diseases, xbi = create_sample_entities(db)
    articles = create_sample_articles(db)

    # Extract and link entities
    extract_and_link_entities(db, articles)

    # Calculate price reactions
    calculate_price_reactions(db, articles)

    # Demonstrate exposures
    demonstrate_exposures(db, articles)

    # Summary
    print("\n" + "=" * 80)
    print("✅ Demo Complete!")
    print("=" * 80)
    print(f"\nCreated:")
    print(f"  • {len(companies)} companies")
    print(f"  • {len(drugs)} drugs")
    print(f"  • {len(diseases)} diseases")
    print(f"  • {len(articles)} articles")

    total_reactions = db.query(ArticleReaction).count()
    total_links = db.query(ArticleEntity).count()

    print(f"\nGenerated:")
    print(f"  • {total_links} article-entity links")
    print(f"  • {total_reactions} price reactions")

    print("\n📚 See NEWS_ARCHIVE_README.md for API documentation")
    print("🧪 Run 'poetry run pytest tests/test_news_archive.py -v' to run tests")

    db.close()


if __name__ == "__main__":
    main()
