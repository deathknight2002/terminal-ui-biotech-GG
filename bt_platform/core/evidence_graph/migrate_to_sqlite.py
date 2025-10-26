"""
Migration Script: JSON to SQLite

Migrates evidence graph data from JSON file storage to SQLite database.
"""

import json
import sys
from pathlib import Path

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from bt_platform.core.evidence_graph.storage import EvidenceGraphStorage as JSONStorage
from bt_platform.core.evidence_graph.storage_sqlite import SQLiteEvidenceGraphStorage


def migrate_json_to_sqlite(
    json_data_dir: str = None,
    sqlite_db_url: str = "sqlite:///./data/evidence_graph.db"
):
    """
    Migrate data from JSON storage to SQLite.

    Args:
        json_data_dir: Directory containing JSON data files
        sqlite_db_url: SQLite database URL
    """
    print("🔄 Starting migration from JSON to SQLite...")

    # Initialize JSON storage
    json_storage = JSONStorage(data_dir=json_data_dir)
    print(f"✓ Loaded JSON storage from {json_storage.data_dir}")

    # Get data from JSON
    nodes = json_storage.get_nodes()
    edges = json_storage.get_edges()

    print(f"📊 Found {len(nodes)} nodes and {len(edges)} edges in JSON storage")

    # Initialize SQLite storage
    sqlite_storage = SQLiteEvidenceGraphStorage(database_url=sqlite_db_url)
    print(f"✓ Initialized SQLite storage at {sqlite_db_url}")

    # Prepare seed data
    seed_data = {
        "nodes": [node.model_dump(mode='json') for node in nodes],
        "edges": [edge.model_dump(mode='json', by_alias=True) for edge in edges]
    }

    # Migrate data
    result = sqlite_storage.reseed(seed_data)

    print(f"✓ Migrated {result['nodes']} nodes and {result['edges']} edges to SQLite")
    print("✅ Migration completed successfully!")

    return result


def verify_migration(
    json_data_dir: str = None,
    sqlite_db_url: str = "sqlite:///./data/evidence_graph.db"
):
    """
    Verify that migration was successful by comparing counts.

    Args:
        json_data_dir: Directory containing JSON data files
        sqlite_db_url: SQLite database URL
    """
    print("\n🔍 Verifying migration...")

    # Get JSON data
    json_storage = JSONStorage(data_dir=json_data_dir)
    json_nodes = json_storage.get_nodes()
    json_edges = json_storage.get_edges()

    # Get SQLite data
    sqlite_storage = SQLiteEvidenceGraphStorage(database_url=sqlite_db_url)
    sqlite_nodes = sqlite_storage.get_nodes()
    sqlite_edges = sqlite_storage.get_edges()

    # Compare counts
    nodes_match = len(json_nodes) == len(sqlite_nodes)
    edges_match = len(json_edges) == len(sqlite_edges)

    print(f"Nodes: JSON={len(json_nodes)}, SQLite={len(sqlite_nodes)} {'✓' if nodes_match else '✗'}")
    print(f"Edges: JSON={len(json_edges)}, SQLite={len(sqlite_edges)} {'✓' if edges_match else '✗'}")

    if nodes_match and edges_match:
        print("✅ Verification passed!")
        return True
    else:
        print("❌ Verification failed - counts don't match")
        return False


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Migrate evidence graph from JSON to SQLite")
    parser.add_argument(
        "--json-dir",
        help="Directory containing JSON data files (default: bt_platform/core/evidence_graph/data/)",
        default=None
    )
    parser.add_argument(
        "--sqlite-db",
        help="SQLite database URL (default: sqlite:///./data/evidence_graph.db)",
        default="sqlite:///./data/evidence_graph.db"
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify migration after completion"
    )

    args = parser.parse_args()

    try:
        # Create data directory if it doesn't exist
        Path("./data").mkdir(exist_ok=True)

        # Run migration
        migrate_json_to_sqlite(
            json_data_dir=args.json_dir,
            sqlite_db_url=args.sqlite_db
        )

        # Verify if requested
        if args.verify:
            verify_migration(
                json_data_dir=args.json_dir,
                sqlite_db_url=args.sqlite_db
            )

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
