"""
CSV Drop Zone for Price Data

Allows importing price data from CSV files (end-of-day quotes, snapshots).
No API dependencies - pure file-based import.
"""

import csv
import io
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Set
from pathlib import Path
from dateutil import parser as date_parser


@dataclass
class PriceRecord:
    """Single price record"""
    ticker: str
    date: datetime
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None
    adj_close: Optional[float] = None
    source: str = 'csv_import'


class CSVDropZone:
    """
    CSV drop zone for price data import.

    Supports multiple CSV formats:
    - Yahoo Finance format
    - Google Finance format
    - Bloomberg CSV export
    - Generic OHLCV format
    """

    # Standard column mappings
    COLUMN_MAPPINGS = {
        'ticker': ['ticker', 'symbol', 'stock', 'name'],
        'date': ['date', 'timestamp', 'time', 'datetime'],
        'open': ['open', 'opening', 'o'],
        'high': ['high', 'h'],
        'low': ['low', 'l'],
        'close': ['close', 'closing', 'c', 'last'],
        'volume': ['volume', 'vol', 'v'],
        'adj_close': ['adj close', 'adjusted close', 'adj_close', 'adjusted_close'],
    }

    def __init__(self, storage_path: Optional[Path] = None):
        """
        Initialize drop zone.

        Args:
            storage_path: Path to store imported data (optional)
        """
        self.storage_path = storage_path or Path('/tmp/price_imports')
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Statistics
        self.stats = {
            'files_processed': 0,
            'records_imported': 0,
            'errors': 0,
        }

    def parse_csv(
        self,
        content: str,
        ticker: Optional[str] = None,
        delimiter: str = ',',
    ) -> List[PriceRecord]:
        """
        Parse CSV content into price records.

        Args:
            content: CSV content as string
            ticker: Override ticker (if not in CSV)
            delimiter: CSV delimiter

        Returns:
            List of PriceRecord objects
        """
        # Parse CSV
        reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)

        # Auto-detect column mappings
        if not reader.fieldnames:
            return []

        column_map = self._detect_columns(reader.fieldnames)

        records = []
        for row in reader:
            try:
                record = self._parse_row(row, column_map, ticker)
                if record:
                    records.append(record)
            except Exception:
                self.stats['errors'] += 1
                continue

        self.stats['records_imported'] += len(records)

        return records

    def parse_csv_file(
        self,
        file_path: Path,
        ticker: Optional[str] = None,
    ) -> List[PriceRecord]:
        """
        Parse CSV file into price records.

        Args:
            file_path: Path to CSV file
            ticker: Override ticker (if not in CSV)

        Returns:
            List of PriceRecord objects
        """
        with open(file_path, 'r') as f:
            content = f.read()

        self.stats['files_processed'] += 1

        return self.parse_csv(content, ticker)

    def _detect_columns(self, fieldnames: List[str]) -> Dict[str, str]:
        """
        Auto-detect column mappings.

        Args:
            fieldnames: CSV column names

        Returns:
            Dict mapping standard names to actual column names
        """
        column_map = {}

        # Normalize fieldnames
        normalized_fields = {
            name: name.lower().strip() for name in fieldnames
        }

        # Match each standard column
        for standard_name, variations in self.COLUMN_MAPPINGS.items():
            for variation in variations:
                for original_name, normalized_name in normalized_fields.items():
                    if normalized_name == variation:
                        column_map[standard_name] = original_name
                        break
                if standard_name in column_map:
                    break

        return column_map

    def _parse_row(
        self,
        row: Dict[str, str],
        column_map: Dict[str, str],
        ticker_override: Optional[str],
    ) -> Optional[PriceRecord]:
        """
        Parse a single CSV row.

        Args:
            row: CSV row dict
            column_map: Column mapping
            ticker_override: Override ticker

        Returns:
            PriceRecord or None if parsing failed
        """
        # Extract ticker
        ticker = ticker_override
        if not ticker and 'ticker' in column_map:
            ticker = row.get(column_map['ticker'], '').strip()

        if not ticker:
            return None

        # Extract date
        if 'date' not in column_map:
            return None

        date_str = row.get(column_map['date'], '').strip()
        try:
            date = date_parser.parse(date_str)
        except Exception:
            return None

        # Extract price fields
        def get_float(field_name: str) -> Optional[float]:
            if field_name not in column_map:
                return None
            value = row.get(column_map[field_name], '').strip()
            if not value:
                return None
            try:
                # Remove common formatting
                value = value.replace('$', '').replace(',', '')
                return float(value)
            except Exception:
                return None

        def get_int(field_name: str) -> Optional[int]:
            if field_name not in column_map:
                return None
            value = row.get(column_map[field_name], '').strip()
            if not value:
                return None
            try:
                # Remove common formatting
                value = value.replace(',', '')
                return int(float(value))
            except Exception:
                return None

        return PriceRecord(
            ticker=ticker,
            date=date,
            open=get_float('open'),
            high=get_float('high'),
            low=get_float('low'),
            close=get_float('close'),
            volume=get_int('volume'),
            adj_close=get_float('adj_close'),
        )

    def save_snapshot(
        self,
        records: List[PriceRecord],
        snapshot_name: Optional[str] = None,
    ) -> Path:
        """
        Save records as a snapshot.

        Args:
            records: Price records to save
            snapshot_name: Name for snapshot (auto-generated if None)

        Returns:
            Path to saved snapshot
        """
        if not snapshot_name:
            snapshot_name = f'snapshot_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'

        snapshot_path = self.storage_path / snapshot_name

        # Write CSV
        with open(snapshot_path, 'w', newline='') as f:
            writer = csv.writer(f)

            # Write header
            writer.writerow([
                'ticker', 'date', 'open', 'high', 'low', 'close', 'volume', 'adj_close'
            ])

            # Write records
            for record in records:
                writer.writerow([
                    record.ticker,
                    record.date.isoformat(),
                    record.open,
                    record.high,
                    record.low,
                    record.close,
                    record.volume,
                    record.adj_close,
                ])

        return snapshot_path

    def load_snapshot(self, snapshot_path: Path) -> List[PriceRecord]:
        """
        Load records from a snapshot.

        Args:
            snapshot_path: Path to snapshot file

        Returns:
            List of PriceRecord objects
        """
        return self.parse_csv_file(snapshot_path)

    def list_snapshots(self) -> List[Path]:
        """
        List all saved snapshots.

        Returns:
            List of snapshot paths
        """
        return list(self.storage_path.glob('*.csv'))

    def get_stats(self) -> Dict:
        """Get import statistics"""
        return {
            **self.stats,
            'snapshots': len(self.list_snapshots()),
        }


class PriceDataValidator:
    """
    Validate imported price data for quality issues.
    """

    @staticmethod
    def validate_records(records: List[PriceRecord]) -> Dict[str, any]:
        """
        Validate price records.

        Args:
            records: Price records to validate

        Returns:
            Validation report dict
        """
        issues = {
            'missing_ohlc': 0,
            'invalid_prices': 0,
            'duplicate_dates': 0,
            'gaps': 0,
            'outliers': 0,
        }

        # Check for missing OHLC data
        for record in records:
            if not all([record.open, record.high, record.low, record.close]):
                issues['missing_ohlc'] += 1

            # Check for invalid price relationships
            if record.high and record.low and record.high < record.low:
                issues['invalid_prices'] += 1
            if record.open and record.high and record.open > record.high:
                issues['invalid_prices'] += 1
            if record.close and record.high and record.close > record.high:
                issues['invalid_prices'] += 1

        # Check for duplicate dates (per ticker)
        by_ticker = {}
        for record in records:
            if record.ticker not in by_ticker:
                by_ticker[record.ticker] = set()

            date_str = record.date.date().isoformat()
            if date_str in by_ticker[record.ticker]:
                issues['duplicate_dates'] += 1
            else:
                by_ticker[record.ticker].add(date_str)

        return {
            'total_records': len(records),
            'issues': issues,
            'valid': sum(issues.values()) == 0,
        }
