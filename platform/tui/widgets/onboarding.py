"""
Onboarding Widget

Displays usage instructions and recent assets.
"""


from textual.app import ComposeResult
from textual.containers import Container
from textual.widgets import Static


class OnboardingWidget(Container):
    """Onboarding panel showing usage instructions and recent assets."""

    def __init__(
        self, recent_assets: list[str], show_header: bool = True, **kwargs
    ) -> None:
        """
        Initialize onboarding widget.

        Args:
            recent_assets: List of recently accessed asset IDs
            show_header: Whether to show the panel header
            **kwargs: Additional container arguments
        """
        super().__init__(**kwargs)
        self.recent_assets = recent_assets
        self.show_header = show_header

    def compose(self) -> ComposeResult:
        """Compose the widget."""
        if self.show_header:
            yield Static(
                "╔════════════════════════════════════════════════════════════╗\n"
                "║         BIOTECH PORTFOLIO ANALYSIS TERMINAL               ║\n"
                "╚════════════════════════════════════════════════════════════╝",
                classes="onboarding-header",
            )

        yield Static(
            "\n[bold cyan]WELCOME TO THE BIOTECH TERMINAL[/bold cyan]\n\n"
            "[bold]Available Commands:[/bold]\n"
            "  • [yellow]view <asset_id>[/yellow]       - View detailed asset information\n"
            "  • [yellow]watch <asset_id>[/yellow]      - Add asset to watchlist\n"
            "  • [yellow]unwatch <asset_id>[/yellow]    - Remove asset from watchlist\n"
            "  • [yellow]watchlist[/yellow]             - Show all watched assets\n"
            "  • [yellow]refresh[/yellow]               - Refresh all data from sources\n"
            "  • [yellow]help[/yellow]                  - Show this help message\n"
            "  • [yellow]quit[/yellow] or [yellow]exit[/yellow]          - Exit the terminal\n\n"
            "[bold]Keyboard Shortcuts:[/bold]\n"
            "  • [yellow]F1[/yellow]                    - Show/hide onboarding panel\n"
            "  • [yellow]Ctrl+C[/yellow]                - Exit application\n"
            "  • [yellow]Ctrl+R[/yellow]                - Refresh data\n",
            classes="onboarding-content",
        )

        if self.recent_assets:
            recent_str = "\n[bold]Recently Accessed Assets:[/bold]\n"
            for i, asset_id in enumerate(self.recent_assets[:3], 1):
                recent_str += f"  {i}. [green]{asset_id}[/green]\n"
            yield Static(recent_str, classes="recent-assets")
        else:
            yield Static(
                "\n[dim]No recent assets. Use 'view <asset_id>' to view an asset.[/dim]",
                classes="recent-assets",
            )

    def update_recent_assets(self, recent_assets: list[str]) -> None:
        """
        Update the recent assets display.

        Args:
            recent_assets: Updated list of recent asset IDs
        """
        self.recent_assets = recent_assets
        # Force re-render
        self.refresh()
