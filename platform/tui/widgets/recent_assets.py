"""
Recent Assets Widget

Displays recently accessed assets.
"""

from textual.app import ComposeResult
from textual.containers import Container
from textual.widgets import Static
from typing import List


class RecentAssetsWidget(Container):
    """Widget showing recently accessed assets."""

    def __init__(self, recent_assets: List[str], **kwargs) -> None:
        """
        Initialize recent assets widget.

        Args:
            recent_assets: List of recently accessed asset IDs
            **kwargs: Additional container arguments
        """
        super().__init__(**kwargs)
        self.recent_assets = recent_assets

    def compose(self) -> ComposeResult:
        """Compose the widget."""
        yield Static(
            "[bold cyan]═══ RECENT ASSETS ═══[/bold cyan]",
            classes="recent-header",
        )

        if self.recent_assets:
            items_str = ""
            for i, asset_id in enumerate(self.recent_assets, 1):
                items_str += f"\n[yellow]{i}.[/yellow] [green]{asset_id}[/green]"
            yield Static(items_str, classes="recent-items")
        else:
            yield Static(
                "\n[dim]No recent assets.[/dim]",
                classes="recent-empty",
            )

    def update_recent(self, recent_assets: List[str]) -> None:
        """
        Update the recent assets display.

        Args:
            recent_assets: Updated list of recent asset IDs
        """
        self.recent_assets = recent_assets
        # Force re-render
        self.remove_children()
        for widget in self.compose():
            self.mount(widget)
