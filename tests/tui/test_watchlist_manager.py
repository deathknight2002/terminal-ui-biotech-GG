"""
Tests for WatchlistManager Service
"""

from platform.tui.services.watchlist_manager import WatchlistManager


class TestWatchlistManager:
    """Test cases for WatchlistManager."""

    def test_initialization(self):
        """Test that watchlist initializes empty."""
        manager = WatchlistManager()
        assert manager.count() == 0
        assert manager.get_all() == []

    def test_add_asset(self):
        """Test adding assets to watchlist."""
        manager = WatchlistManager()

        # Add first asset
        result = manager.add("BCRX-001")
        assert result is True
        assert manager.count() == 1
        assert "BCRX-001" in manager.get_all()

        # Add second asset
        result = manager.add("SRPT-001")
        assert result is True
        assert manager.count() == 2

    def test_add_duplicate_asset(self):
        """Test that adding duplicate returns False."""
        manager = WatchlistManager()
        manager.add("BCRX-001")

        # Try to add same asset again
        result = manager.add("BCRX-001")
        assert result is False
        assert manager.count() == 1

    def test_remove_asset(self):
        """Test removing assets from watchlist."""
        manager = WatchlistManager()
        manager.add("BCRX-001")
        manager.add("SRPT-001")

        # Remove existing asset
        result = manager.remove("BCRX-001")
        assert result is True
        assert manager.count() == 1
        assert "BCRX-001" not in manager.get_all()

    def test_remove_nonexistent_asset(self):
        """Test that removing nonexistent asset returns False."""
        manager = WatchlistManager()

        result = manager.remove("NONEXISTENT")
        assert result is False
        assert manager.count() == 0

    def test_contains(self):
        """Test checking if asset is in watchlist."""
        manager = WatchlistManager()
        manager.add("BCRX-001")

        assert manager.contains("BCRX-001") is True
        assert manager.contains("SRPT-001") is False

    def test_get_all_sorted(self):
        """Test that get_all returns sorted list."""
        manager = WatchlistManager()
        manager.add("ZZZZ")
        manager.add("AAAA")
        manager.add("MMMM")

        assets = manager.get_all()
        assert assets == ["AAAA", "MMMM", "ZZZZ"]

    def test_clear(self):
        """Test clearing all assets."""
        manager = WatchlistManager()
        manager.add("BCRX-001")
        manager.add("SRPT-001")

        manager.clear()
        assert manager.count() == 0
        assert manager.get_all() == []

    def test_count(self):
        """Test counting assets in watchlist."""
        manager = WatchlistManager()
        assert manager.count() == 0

        manager.add("BCRX-001")
        assert manager.count() == 1

        manager.add("SRPT-001")
        assert manager.count() == 2

        manager.remove("BCRX-001")
        assert manager.count() == 1
