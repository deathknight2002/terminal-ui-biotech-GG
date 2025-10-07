"""
Platform Configuration

Environment-based configuration for the biotech terminal platform.
"""

import os
from typing import List
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Application
    APP_NAME: str = "Biotech Terminal Platform"
    DEBUG: bool = False
    API_VERSION: str = "v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:5173",
        "http://localhost:8080"
    ]
    
    # Database
    DATABASE_URL: str = "sqlite:///./biotech_terminal.db"
    
    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379"
    
    # External APIs (all optional - platform works without them)
    FDA_API_KEY: str = ""
    CLINICALTRIALS_API_KEY: str = ""
    PUBMED_API_KEY: str = ""
    
    # Security
    SECRET_KEY: str = "biotech-terminal-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()