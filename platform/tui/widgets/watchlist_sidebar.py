"""
Watchlist Sidebar Widget

Displays the current watchlist of assets.
"""

from textual.app import ComposeResult
from textual.containers import Container, Vertical
from textual.widgets import Static
from typing import List


class WatchlistSidebar(Container):
    """Sidebar widget showing watchlist items."""

    def __init__(self, watchlist_items: List[str], **kwargs) -> None:
        """
        Initialize watchlist sidebar.

        Args:
            watchlist_items: List of asset IDs in watchlist
            **kwargs: Additional container arguments
        """
        super().__init__(**kwargs)
        self.watchlist_items = watchlist_items

    def compose(self) -> ComposeResult:
        """Compose the widget."""
        with Vertical(classes="watchlist-container"):
            yield Static(
                "[bold cyan]═══ WATCHLIST ═══[/bold cyan]",
                classes="watchlist-header",
            )

            if self.watchlist_items:
                items_str = ""
                for i, asset_id in enumerate(self.watchlist_items, 1):
                    items_str += f"\n[yellow]▸[/yellow] {asset_id}"
                yield Static(items_str, classes="watchlist-items")
                yield Static(
                    f"\n[dim]Total: {len(self.watchlist_items)} asset(s)[/dim]",
                    classes="watchlist-footer",
                )
            else:
                yield Static(
                    "\n[dim]No assets in watchlist.\n\nUse 'watch <asset_id>'\nto add assets.[/dim]",
                    classes="watchlist-empty",
                )

    def update_watchlist(self, watchlist_items: List[str]) -> None:
        """
        Update the watchlist display.

        Args:
            watchlist_items: Updated list of asset IDs
        """
        self.watchlist_items = watchlist_items
        # Force re-render by removing and re-adding children
        self.remove_children()
        for widget in self.compose():
            self.mount(widget)
