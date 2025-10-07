from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Mapping, Sequence

import pandas as pd
import polars as pl
from pypfopt import EfficientFrontier, expected_returns, risk_models
import quantstats as qs

from .config import IngestionPaths
from .duckdb_manager import DuckDBManager, DataFrameLike

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class IngestionContext:
    """
    Runtime container for pipeline dependencies.
    """

    paths: IngestionPaths
    db: DuckDBManager

    @classmethod
    def bootstrap(cls, paths: IngestionPaths | None = None) -> "IngestionContext":
        paths = paths or IngestionPaths.from_settings()
        paths.ensure()
        manager = DuckDBManager(paths.duckdb_path, paths.parquet_dir)
        return cls(paths=paths, db=manager)


class BiotechIngestionPipeline:
    """
    Coordinates raw data ingestion and derived analytics generation.
    """

    schema_name = "biotech"

    def __init__(self, context: IngestionContext | None = None):
        self.context = context or IngestionContext.bootstrap()

    # ------------------------------------------------------------------
    # Initialisation helpers
    # ------------------------------------------------------------------
    def init_storage(self) -> None:
        """
        Create a dedicated schema for biotech assets inside DuckDB.
        """

        with self.context.db.session() as connection:
            connection.execute(f"CREATE SCHEMA IF NOT EXISTS {self.schema_name}")
            connection.execute(f"SET schema '{self.schema_name}'")

    # ------------------------------------------------------------------
    # Data ingestion routines
    # ------------------------------------------------------------------
    def ingest_market_snapshots(
        self,
        frame: DataFrameLike,
        *,
        partition_on: str = "as_of",
    ) -> Path:
        """
        Persist market price snapshots to DuckDB + Parquet.
        """

        logger.info("Ingesting %s market rows into DuckDB.", len(frame))
        return self.context.db.ingest_frame(
            f"{self.schema_name}_market_snapshots", frame, partition_on=partition_on
        )

    def ingest_pipeline_activity(self, frame: DataFrameLike) -> Path:
        """
        Persist biotech pipeline stage counts.
        """

        logger.info("Ingesting pipeline activity frame (%s rows).", len(frame))
        return self.context.db.ingest_frame(f"{self.schema_name}_pipeline_activity", frame)

    def ingest_regulatory_events(self, frame: DataFrameLike) -> Path:
        """
        Persist regulatory events (FDA, EMA, etc.).
        """

        logger.info("Ingesting regulatory events frame (%s rows).", len(frame))
        return self.context.db.ingest_frame(f"{self.schema_name}_regulatory_events", frame)

    # ------------------------------------------------------------------
    # Analytics helpers
    # ------------------------------------------------------------------
    def load_price_history(self, tickers: Sequence[str]) -> pd.DataFrame:
        """
        Pivot stored market snapshots into a wide price matrix.
        """

        if not tickers:
            return pd.DataFrame()

        placeholders = ", ".join(["?"] * len(tickers))
        query = (
            f"SELECT as_of, ticker, close "
            f"FROM {self.schema_name}_market_snapshots "
            f"WHERE ticker IN ({placeholders}) "
            f"ORDER BY as_of"
        )

        with self.context.db.session() as connection:
            price_frame = connection.execute(query, tickers).fetch_df()

        if price_frame.empty:
            return pd.DataFrame()

        return price_frame.pivot(index="as_of", columns="ticker", values="close").sort_index()

    def compute_portfolio_metrics(self, price_history: pd.DataFrame) -> Mapping[str, float]:
        """
        Run a lightweight Awesome Quant analytics bundle to derive portfolio metrics.
        """

        if price_history.empty or price_history.shape[0] < 10:
            logger.warning("Insufficient price history for analytics. Expecting >= 10 rows.")
            return {}

        logger.info("Calculating portfolio metrics for %s assets.", price_history.shape[1])
        returns = price_history.pct_change().dropna()

        mu = expected_returns.mean_historical_return(price_history)
        cov_matrix = risk_models.sample_cov(price_history)

        ef = EfficientFrontier(mu, cov_matrix)
        weights = ef.max_sharpe()
        cleaned_weights = ef.clean_weights()

        weight_series = pd.Series(cleaned_weights)
        portfolio_returns = returns.mul(weight_series, axis=1).sum(axis=1)

        metrics = {
            "sharpe": float(qs.stats.sharpe(portfolio_returns)),
            "sortino": float(qs.stats.sortino(portfolio_returns)),
            "cvar": float(qs.stats.cvar(portfolio_returns)),
            "max_drawdown": float(qs.stats.max_drawdown(portfolio_returns)),
        }

        return {
            "as_of": datetime.utcnow().isoformat(),
            "n_assets": float(price_history.shape[1]),
            **metrics,
            **{f"weight_{ticker}": float(weight) for ticker, weight in cleaned_weights.items()},
        }

    def store_metrics(self, metrics: Mapping[str, float]) -> Path:
        frame = pd.DataFrame([metrics])
        logger.info("Persisting portfolio analytics snapshot.")
        return self.context.db.ingest_frame(f"{self.schema_name}_portfolio_metrics", frame, mode="append")

    # ------------------------------------------------------------------
    # Convenience utilities
    # ------------------------------------------------------------------
    def example_market_frame(self) -> pl.DataFrame:
        """
        Generate a placeholder Polars frame mirroring the watchlist feed.
        """

        data = {
            "ticker": ["SRPT", "BEAM", "NTLA", "REGN"],
            "as_of": [datetime.utcnow().date()] * 4,
            "open": [158.2, 40.8, 51.7, 890.0],
            "high": [164.2, 42.0, 53.8, 905.1],
            "low": [157.8, 40.1, 51.0, 887.2],
            "close": [162.4, 41.22, 52.78, 898.12],
            "volume": [1_200_000, 840_000, 610_000, 320_000],
        }
        return pl.DataFrame(data)

    def example_pipeline_activity(self) -> pd.DataFrame:
        """
        Produce a pandas frame aligned with the home stage heatmap.
        """

        return pd.DataFrame(
            [
                {"stage": "Discovery", "programs": 18, "change_pct": 5.0},
                {"stage": "Preclinical", "programs": 22, "change_pct": 3.0},
                {"stage": "Phase I", "programs": 16, "change_pct": -2.0},
                {"stage": "Phase II", "programs": 14, "change_pct": 1.0},
                {"stage": "Phase III", "programs": 11, "change_pct": -1.0},
                {"stage": "Commercial", "programs": 8, "change_pct": 2.0},
            ]
        )

    def run_example(self) -> None:
        """
        End-to-end execution using placeholder data.
        """

        self.init_storage()
        market_path = self.ingest_market_snapshots(self.example_market_frame())
        pipeline_path = self.ingest_pipeline_activity(self.example_pipeline_activity())

        logger.info("Example market data written to %s", market_path)
        logger.info("Example pipeline data written to %s", pipeline_path)

        prices = self.load_price_history(["SRPT", "BEAM", "NTLA", "REGN"])
        metrics = self.compute_portfolio_metrics(prices)
        if metrics:
            metrics_path = self.store_metrics(metrics)
            logger.info("Portfolio metrics stored at %s", metrics_path)
        else:
            logger.warning("Skipping metrics storage; no analytics were produced.")
