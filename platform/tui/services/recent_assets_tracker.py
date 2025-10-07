"""
Recent Assets Tracker Service

Tracks the most recently accessed biotech assets (max 3).
"""



class RecentAssetsTracker:
    """Tracks the 3 most recently accessed biotech assets in session."""

    MAX_RECENT = 3

    def __init__(self) -> None:
        """Initialize tracker with empty list."""
        self._recent: list[str] = []

    def add(self, asset_id: str) -> None:
        """
        Add an asset to recent list.

        If asset is already in list, it's moved to the front.
        Only the 3 most recent assets are kept.

        Args:
            asset_id: Unique identifier for the asset
        """
        # Remove asset if it's already in the list
        if asset_id in self._recent:
            self._recent.remove(asset_id)

        # Add to front of list
        self._recent.insert(0, asset_id)

        # Keep only MAX_RECENT items
        if len(self._recent) > self.MAX_RECENT:
            self._recent = self._recent[: self.MAX_RECENT]

    def get_all(self) -> list[str]:
        """
        Get all recent assets.

        Returns:
            List of asset IDs in order from most to least recent
        """
        return self._recent.copy()

    def clear(self) -> None:
        """Clear all recent assets."""
        self._recent.clear()

    def count(self) -> int:
        """
        Get the number of recent assets.

        Returns:
            Number of recent assets (max 3)
        """
        return len(self._recent)
