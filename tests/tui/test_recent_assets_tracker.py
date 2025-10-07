"""
Tests for RecentAssetsTracker Service
"""

from platform.tui.services.recent_assets_tracker import RecentAssetsTracker


class TestRecentAssetsTracker:
    """Test cases for RecentAssetsTracker."""

    def test_initialization(self):
        """Test that tracker initializes empty."""
        tracker = RecentAssetsTracker()
        assert tracker.count() == 0
        assert tracker.get_all() == []

    def test_add_asset(self):
        """Test adding assets to recent list."""
        tracker = RecentAssetsTracker()

        tracker.add("BCRX-001")
        assert tracker.count() == 1
        assert tracker.get_all() == ["BCRX-001"]

        tracker.add("SRPT-001")
        assert tracker.count() == 2
        assert tracker.get_all() == ["SRPT-001", "BCRX-001"]

    def test_max_three_assets(self):
        """Test that only 3 most recent assets are kept."""
        tracker = RecentAssetsTracker()

        tracker.add("ASSET-1")
        tracker.add("ASSET-2")
        tracker.add("ASSET-3")
        tracker.add("ASSET-4")

        assert tracker.count() == 3
        assert tracker.get_all() == ["ASSET-4", "ASSET-3", "ASSET-2"]
        assert "ASSET-1" not in tracker.get_all()

    def test_duplicate_moves_to_front(self):
        """Test that adding duplicate moves it to front."""
        tracker = RecentAssetsTracker()

        tracker.add("ASSET-1")
        tracker.add("ASSET-2")
        tracker.add("ASSET-3")
        assert tracker.get_all() == ["ASSET-3", "ASSET-2", "ASSET-1"]

        # Add ASSET-1 again - should move to front
        tracker.add("ASSET-1")
        assert tracker.get_all() == ["ASSET-1", "ASSET-3", "ASSET-2"]
        assert tracker.count() == 3

    def test_clear(self):
        """Test clearing all recent assets."""
        tracker = RecentAssetsTracker()
        tracker.add("ASSET-1")
        tracker.add("ASSET-2")

        tracker.clear()
        assert tracker.count() == 0
        assert tracker.get_all() == []

    def test_get_all_returns_copy(self):
        """Test that get_all returns a copy, not reference."""
        tracker = RecentAssetsTracker()
        tracker.add("ASSET-1")

        assets = tracker.get_all()
        assets.append("ASSET-2")

        # Original should be unchanged
        assert tracker.get_all() == ["ASSET-1"]
        assert tracker.count() == 1

    def test_ordering(self):
        """Test that assets are in most-recent-first order."""
        tracker = RecentAssetsTracker()

        tracker.add("FIRST")
        tracker.add("SECOND")
        tracker.add("THIRD")

        recent = tracker.get_all()
        assert recent[0] == "THIRD"  # Most recent first
        assert recent[1] == "SECOND"
        assert recent[2] == "FIRST"  # Least recent last
