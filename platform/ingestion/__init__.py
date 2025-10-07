"""
Ingestion toolkit for the Biotech Terminal data lake.

This package provides a thin orchestration layer for loading raw data
into DuckDB/Parquet storage and generating derived analytics with the
Awesome Quant stack (pandas, Polars, PyPortfolioOpt, quantstats).
"""

from .config import IngestionPaths
from .duckdb_manager import DuckDBManager
from .pipeline import BiotechIngestionPipeline, IngestionContext

__all__ = [
    "IngestionPaths",
    "DuckDBManager",
    "IngestionContext",
    "BiotechIngestionPipeline",
]
