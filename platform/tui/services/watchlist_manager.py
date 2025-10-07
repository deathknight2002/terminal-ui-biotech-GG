"""
Watchlist Manager Service

Manages a session-based watchlist of biotech assets.
"""



class WatchlistManager:
    """Manages watchlist of biotech assets in memory for current session."""

    def __init__(self) -> None:
        """Initialize watchlist manager with empty watchlist."""
        self._watchlist: set[str] = set()

    def add(self, asset_id: str) -> bool:
        """
        Add an asset to the watchlist.

        Args:
            asset_id: Unique identifier for the asset

        Returns:
            True if asset was added, False if it was already in watchlist
        """
        if asset_id in self._watchlist:
            return False
        self._watchlist.add(asset_id)
        return True

    def remove(self, asset_id: str) -> bool:
        """
        Remove an asset from the watchlist.

        Args:
            asset_id: Unique identifier for the asset

        Returns:
            True if asset was removed, False if it wasn't in watchlist
        """
        if asset_id not in self._watchlist:
            return False
        self._watchlist.discard(asset_id)
        return True

    def contains(self, asset_id: str) -> bool:
        """
        Check if an asset is in the watchlist.

        Args:
            asset_id: Unique identifier for the asset

        Returns:
            True if asset is in watchlist
        """
        return asset_id in self._watchlist

    def get_all(self) -> list[str]:
        """
        Get all assets in the watchlist.

        Returns:
            List of asset IDs in watchlist (sorted for consistency)
        """
        return sorted(self._watchlist)

    def clear(self) -> None:
        """Clear all assets from the watchlist."""
        self._watchlist.clear()

    def count(self) -> int:
        """
        Get the number of assets in the watchlist.

        Returns:
            Number of assets in watchlist
        """
        return len(self._watchlist)
