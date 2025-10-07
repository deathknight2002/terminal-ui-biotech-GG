from __future__ import annotations

import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, Mapping, Sequence

import duckdb
import pandas as pd
import polars as pl

logger = logging.getLogger(__name__)

DataFrameLike = pd.DataFrame | pl.DataFrame


def _to_pandas(frame: DataFrameLike) -> pd.DataFrame:
    """
    Convert either a pandas or Polars DataFrame into pandas for DuckDB registration.
    """

    if isinstance(frame, pd.DataFrame):
        return frame
    return frame.to_pandas(use_pyarrow_extension_array=True)


class DuckDBManager:
    """
    Helper around DuckDB connections and parquet exports.
    """

    def __init__(self, database_path: Path, parquet_dir: Path):
        self.database_path = Path(database_path)
        self.parquet_dir = Path(parquet_dir)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.parquet_dir.mkdir(parents=True, exist_ok=True)

    def connect(self) -> duckdb.DuckDBPyConnection:
        return duckdb.connect(str(self.database_path))

    @contextmanager
    def session(self) -> Iterator[duckdb.DuckDBPyConnection]:
        connection = self.connect()
        try:
            yield connection
        finally:
            connection.close()

    def execute(self, query: str, parameters: Sequence | Mapping | None = None) -> None:
        with self.session() as connection:
            if parameters:
                connection.execute(query, parameters)
            else:
                connection.execute(query)

    def ingest_frame(
        self,
        dataset: str,
        frame: DataFrameLike,
        *,
        mode: str = "replace",
        partition_on: str | Sequence[str] | None = None,
    ) -> Path:
        table_name = dataset.replace("-", "_")
        dataset_dir = self.parquet_dir / dataset
        dataset_dir.mkdir(parents=True, exist_ok=True)

        df = _to_pandas(frame)

        with self.session() as connection:
            connection.register("frame_df", df)

            if mode == "replace":
                connection.execute(f"DROP TABLE IF EXISTS {table_name}")
                connection.execute(f"CREATE TABLE {table_name} AS SELECT * FROM frame_df")
            elif mode == "append":
                connection.execute(f"CREATE TABLE IF NOT EXISTS {table_name} AS SELECT * FROM frame_df LIMIT 0")
                connection.execute(f"INSERT INTO {table_name} SELECT * FROM frame_df")
            else:
                msg = f"Unsupported ingest mode '{mode}'. Use 'replace' or 'append'."
                logger.error(msg)
                raise ValueError(msg)

            copy_target: Path
            options = ["FORMAT PARQUET", "COMPRESSION ZSTD"]

            if partition_on:
                if isinstance(partition_on, str):
                    partition_cols = [partition_on]
                else:
                    partition_cols = list(partition_on)
                options.append(f"PARTITION_BY ({', '.join(partition_cols)})")
                copy_target = dataset_dir
            else:
                copy_target = dataset_dir / "data.parquet"

            target_str = str(copy_target).replace("\\", "\\\\")
            connection.execute(
                f"COPY (SELECT * FROM {table_name}) TO '{target_str}' ({', '.join(options)})"
            )

        return copy_target

    def register_parquet_view(self, view_name: str, source: Path) -> None:
        source_path = str(source).replace("\\", "\\\\")
        self.execute(f"CREATE OR REPLACE VIEW {view_name} AS SELECT * FROM read_parquet('{source_path}')")
