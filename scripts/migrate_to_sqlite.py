#!/usr/bin/env python3
"""
Migrate Evidence Graph from JSON to SQLite storage.

Usage:
    python scripts/migrate_to_sqlite.py [--dry-run] [--backup]

Options:
    --dry-run    Show what would be migrated without making changes
    --backup     Create a backup of JSON data before migration
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Tuple

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from bt_platform.core.config import settings
from bt_platform.core.evidence_graph.models import Edge, NodeBase
from bt_platform.core.evidence_graph.storage import (
    EvidenceGraphStorage as JSONStorage,
)
from bt_platform.core.evidence_graph.storage_sqlite import SQLiteEvidenceGraphStorage


def create_backup(backup_dir: Path) -> None:
    """Create backup of JSON data files"""
    print(f"\n📦 Creating backup in {backup_dir}...")

    # Create backup directory
    backup_dir.mkdir(parents=True, exist_ok=True)

    # Find JSON data files
    data_dir = Path("data/evidence_graph")
    if not data_dir.exists():
        print("   No data directory found, skipping backup")
        return

    # Copy JSON files
    json_files = list(data_dir.glob("*.json"))
    if not json_files:
        print("   No JSON files found, skipping backup")
        return

    for json_file in json_files:
        backup_file = backup_dir / json_file.name
        backup_file.write_text(json_file.read_text())
        print(f"   ✓ Backed up {json_file.name}")

    print(f"   ✅ Backed up {len(json_files)} files")


def export_json_data() -> Tuple[list, list]:
    """Export data from JSON storage"""
    print("\n📖 Reading from JSON storage...")

    try:
        json_storage = JSONStorage()
        nodes, _ = json_storage.get_nodes_with_etag()
        edges, _ = json_storage.get_edges_with_etag()

        print(f"   ✓ Found {len(nodes)} nodes and {len(edges)} edges")
        return nodes, edges

    except Exception as e:
        print(f"   ❌ Error reading JSON storage: {e}")
        raise


def import_to_sqlite(
    nodes: list, edges: list, database_url: str, dry_run: bool = False
) -> Tuple[int, int, int, int]:
    """Import data to SQLite storage"""
    if dry_run:
        print("\n🔍 DRY RUN - No data will be written")
        print("\n   Sample nodes:")
        for node in nodes[:5]:
            print(f"   - {node.id} ({node.type}): {node.company}")
        print("\n   Sample edges:")
        for edge in edges[:5]:
            print(
                f"   - {edge.from_id} -> {edge.to_id} ({edge.relation})"
            )
        return len(nodes), 0, len(edges), 0

    print(f"\n💾 Importing to SQLite: {database_url}")

    # Initialize SQLite storage
    sqlite_storage = SQLiteEvidenceGraphStorage(database_url=database_url)

    # Import nodes
    print("\n   Importing nodes...")
    nodes_imported = 0
    nodes_failed = 0

    for i, node in enumerate(nodes, 1):
        try:
            sqlite_storage.upsert_node(node)
            nodes_imported += 1
            if i % 10 == 0:
                print(f"      Progress: {i}/{len(nodes)} nodes...")
        except Exception as e:
            print(f"      ⚠️  Error importing node {node.id}: {e}")
            nodes_failed += 1

    print(f"   ✓ Imported {nodes_imported} nodes ({nodes_failed} failed)")

    # Import edges
    print("\n   Importing edges...")
    edges_imported = 0
    edges_failed = 0

    for i, edge in enumerate(edges, 1):
        try:
            sqlite_storage.create_edge(edge)
            edges_imported += 1
            if i % 10 == 0:
                print(f"      Progress: {i}/{len(edges)} edges...")
        except Exception as e:
            print(f"      ⚠️  Error importing edge: {e}")
            edges_failed += 1

    print(f"   ✓ Imported {edges_imported} edges ({edges_failed} failed)")

    return nodes_imported, nodes_failed, edges_imported, edges_failed


def verify_migration(database_url: str, expected_nodes: int, expected_edges: int):
    """Verify the migration was successful"""
    print("\n🔍 Verifying migration...")

    sqlite_storage = SQLiteEvidenceGraphStorage(database_url=database_url)
    nodes, _ = sqlite_storage.get_nodes_with_etag()
    edges, _ = sqlite_storage.get_edges_with_etag()

    print(f"   SQLite storage contains:")
    print(f"   - {len(nodes)} nodes (expected: {expected_nodes})")
    print(f"   - {len(edges)} edges (expected: {expected_edges})")

    if len(nodes) == expected_nodes and len(edges) == expected_edges:
        print("   ✅ Verification passed!")
        return True
    else:
        print("   ⚠️  Count mismatch - review migration logs")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Migrate Evidence Graph from JSON to SQLite"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be migrated without making changes",
    )
    parser.add_argument(
        "--backup", action="store_true", help="Create backup of JSON data"
    )
    parser.add_argument(
        "--database-url",
        default=None,
        help="SQLite database URL (default: from settings)",
    )

    args = parser.parse_args()

    print("╔═══════════════════════════════════════════════════════════╗")
    print("║   Evidence Graph Migration: JSON → SQLite                ║")
    print("╚═══════════════════════════════════════════════════════════╝")

    # Determine database URL
    database_url = args.database_url or settings.EVIDENCE_GRAPH_DB_URL
    print(f"\nConfiguration:")
    print(f"  Database URL: {database_url}")
    print(f"  Dry run: {args.dry_run}")
    print(f"  Create backup: {args.backup}")

    try:
        # Create backup if requested
        if args.backup and not args.dry_run:
            backup_dir = Path(f"data/backups/evidence_graph_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            create_backup(backup_dir)

        # Export from JSON
        nodes, edges = export_json_data()

        # Import to SQLite
        nodes_imported, nodes_failed, edges_imported, edges_failed = import_to_sqlite(
            nodes, edges, database_url, dry_run=args.dry_run
        )

        if args.dry_run:
            print("\n✅ Dry run complete - no changes made")
            return

        # Verify migration
        verify_migration(database_url, nodes_imported, edges_imported)

        # Summary
        print("\n" + "═" * 63)
        print("📊 Migration Summary")
        print("═" * 63)
        print(f"Nodes: {nodes_imported} imported, {nodes_failed} failed")
        print(f"Edges: {edges_imported} imported, {edges_failed} failed")

        if nodes_failed > 0 or edges_failed > 0:
            print("\n⚠️  Some items failed to migrate - review logs above")

        print("\n📝 Next Steps:")
        print("  1. Update .env: EVIDENCE_GRAPH_STORAGE=sqlite")
        print("  2. Restart the application: npm run dev:backend")
        print("  3. Test endpoints: curl http://localhost:8000/api/v1/evidence-graph/nodes")
        print("  4. Verify data integrity in the application")
        print("  5. Keep JSON backup until you've verified everything works")

        print("\n✅ Migration complete!")

    except KeyboardInterrupt:
        print("\n\n⚠️  Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Migration failed: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
