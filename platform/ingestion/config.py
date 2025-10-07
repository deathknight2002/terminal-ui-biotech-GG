from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from platform.core.config import settings


@dataclass(slots=True)
class IngestionPaths:
    """
    File-system layout for the local data lake.
    """

    data_lake: Path
    parquet_dir: Path
    duckdb_path: Path

    @classmethod
    def from_settings(cls) -> "IngestionPaths":
        data_lake = Path(settings.DATA_LAKE_DIR)
        parquet_dir = Path(settings.PARQUET_DIR)
        duckdb_path = Path(settings.DUCKDB_PATH)
        return cls(data_lake=data_lake, parquet_dir=parquet_dir, duckdb_path=duckdb_path)

    def ensure(self) -> None:
        """
        Create the data lake directories if they do not exist.
        """

        self.data_lake.mkdir(parents=True, exist_ok=True)
        self.parquet_dir.mkdir(parents=True, exist_ok=True)
        self.duckdb_path.parent.mkdir(parents=True, exist_ok=True)
