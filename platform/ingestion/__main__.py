from __future__ import annotations

import argparse
import logging

from .pipeline import BiotechIngestionPipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


def main() -> None:
    parser = argparse.ArgumentParser(description="Biotech data ingestion runner.")
    parser.add_argument(
        "--example",
        action="store_true",
        help="Load placeholder data into DuckDB for local UI previews.",
    )
    args = parser.parse_args()

    pipeline = BiotechIngestionPipeline()

    if args.example:
        pipeline.run_example()
    else:
        parser.print_help()


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    main()
