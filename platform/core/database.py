"""
Database Configuration and Models

SQLAlchemy-based database setup with biotech-specific models.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
import logging

from .config import settings

logger = logging.getLogger(__name__)

# Database engine
engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class Drug(Base):
    """Drug information model"""
    __tablename__ = "drugs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    generic_name = Column(String)
    company = Column(String, index=True)
    therapeutic_area = Column(String, index=True)
    indication = Column(Text)
    phase = Column(String, index=True)
    mechanism = Column(String)
    target = Column(String)
    status = Column(String, default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ClinicalTrial(Base):
    """Clinical trial model"""
    __tablename__ = "clinical_trials"
    
    id = Column(Integer, primary_key=True, index=True)
    nct_id = Column(String, unique=True, index=True)
    title = Column(Text)
    phase = Column(String, index=True)
    status = Column(String, index=True)
    condition = Column(String, index=True)
    intervention = Column(String)
    sponsor = Column(String, index=True)
    start_date = Column(DateTime)
    completion_date = Column(DateTime)
    enrollment = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Company(Base):
    """Biotech/pharma company model"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    ticker = Column(String, unique=True, index=True)
    company_type = Column(String, index=True)  # Big Pharma, Biotech, etc.
    market_cap = Column(Float)
    headquarters = Column(String)
    founded = Column(Integer)
    employees = Column(Integer)
    pipeline_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Catalyst(Base):
    """Market catalyst model"""
    __tablename__ = "catalysts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    drug = Column(String, index=True)
    event_type = Column(String, index=True)  # FDA Approval, Data Readout, etc.
    event_date = Column(DateTime, index=True)
    probability = Column(Float)  # 0.0 - 1.0
    impact = Column(String)  # High, Medium, Low
    description = Column(Text)
    status = Column(String, default="Upcoming")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MarketData(Base):
    """Market data model for biotech stocks"""
    __tablename__ = "market_data"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    volume = Column(Integer)
    market_cap = Column(Float)


# Database initialization
async def init_db():
    """Initialize database tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
        # Seed with sample data if empty
        from .seed_data import seed_database
        await seed_database()
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


# Database dependency
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()