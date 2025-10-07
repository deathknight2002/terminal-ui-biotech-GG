"""
Biotech Terminal TUI Application

Main terminal user interface application using Textual.
"""

from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import Header, Footer, Input, Static
from textual.reactive import reactive

from .services import WatchlistManager, RecentAssetsTracker, RefreshService
from .services.refresh_service import RefreshStatus
from .widgets import (
    OnboardingWidget,
    WatchlistSidebar,
    RecentAssetsWidget,
    AssetDetailWidget,
)


class BiotechTerminalApp(App):
    """Biotech Portfolio Analysis Terminal Application."""

    CSS = """
    Screen {
        layout: vertical;
    }

    #main-container {
        layout: horizontal;
        height: 1fr;
    }

    #sidebar {
        width: 30;
        background: $panel;
        border-right: tall $primary;
        padding: 1;
    }

    #content {
        width: 1fr;
        padding: 1;
    }

    #command-area {
        height: auto;
        background: $panel;
        border-top: solid $primary;
        padding: 1;
    }

    .onboarding-header {
        color: $accent;
        text-align: center;
    }

    .onboarding-content {
        padding: 1;
    }

    .recent-assets {
        padding: 1;
    }

    .watchlist-container {
        height: 100%;
    }

    .watchlist-header {
        text-align: center;
        margin-bottom: 1;
    }

    .status-bar {
        background: $boost;
        padding: 0 1;
        color: $text;
    }

    Input {
        margin: 1 0;
    }

    .output-box {
        height: 100%;
        overflow-y: scroll;
        border: solid $primary;
        padding: 1;
    }
    """

    BINDINGS = [
        Binding("f1", "toggle_onboarding", "Help", show=True),
        Binding("ctrl+r", "refresh_data", "Refresh", show=True),
        Binding("ctrl+c", "quit", "Quit", show=True),
    ]

    TITLE = "Biotech Portfolio Analysis Terminal"

    show_onboarding = reactive(True)
    status_message = reactive("")

    def __init__(self, **kwargs) -> None:
        """Initialize the application."""
        super().__init__(**kwargs)
        self.watchlist_manager = WatchlistManager()
        self.recent_tracker = RecentAssetsTracker()
        self.refresh_service = RefreshService()
        self.refresh_service.set_status_callback(self._on_refresh_status_change)

        # Track widgets for updates
        self.watchlist_widget = None
        self.recent_widget = None
        self.output_static = None

    def compose(self) -> ComposeResult:
        """Compose the application layout."""
        yield Header()

        with Container(id="main-container"):
            # Sidebar with watchlist
            with Vertical(id="sidebar"):
                self.watchlist_widget = WatchlistSidebar(
                    self.watchlist_manager.get_all()
                )
                yield self.watchlist_widget

                self.recent_widget = RecentAssetsWidget(
                    self.recent_tracker.get_all()
                )
                yield self.recent_widget

            # Main content area
            with Vertical(id="content"):
                if self.show_onboarding:
                    yield OnboardingWidget(
                        self.recent_tracker.get_all(), id="onboarding"
                    )
                self.output_static = Static("", classes="output-box", id="output")
                yield self.output_static

        # Command input area
        with Container(id="command-area"):
            yield Static(
                "[bold cyan]Command:[/bold cyan]",
                classes="status-bar",
                id="status",
            )
            yield Input(
                placeholder="Enter command (e.g., 'view BCRX-001', 'help', 'quit')",
                id="command-input",
            )

        yield Footer()

    def on_mount(self) -> None:
        """Handle app mount event."""
        self.query_one("#command-input", Input).focus()
        self._update_status("Ready. Type 'help' for available commands.")

    def on_input_submitted(self, event: Input.Submitted) -> None:
        """Handle command input submission."""
        command = event.value.strip()
        if not command:
            return

        # Clear input
        event.input.value = ""

        # Process command
        self._process_command(command)

    def _process_command(self, command: str) -> None:
        """
        Process a user command.

        Args:
            command: Command string to process
        """
        parts = command.split(maxsplit=1)
        cmd = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""

        if cmd in ("quit", "exit"):
            self.exit()
        elif cmd == "help":
            self._show_help()
        elif cmd == "view" and args:
            self._view_asset(args)
        elif cmd == "watch" and args:
            self._watch_asset(args)
        elif cmd == "unwatch" and args:
            self._unwatch_asset(args)
        elif cmd == "watchlist":
            self._show_watchlist()
        elif cmd == "refresh":
            self._refresh_data()
        else:
            self._show_output(
                f"[red]Unknown command: {cmd}[/red]\n"
                "Type 'help' for available commands."
            )

    def _view_asset(self, asset_id: str) -> None:
        """View asset details."""
        # Add to recent assets
        self.recent_tracker.add(asset_id)
        self._update_recent_widgets()

        # Show asset details
        detail_widget = AssetDetailWidget(asset_id)
        if self.output_static:
            self.output_static.remove()

        self.output_static = detail_widget
        self.query_one("#content").mount(detail_widget)

        self._update_status(f"Viewing asset: {asset_id}")

    def _watch_asset(self, asset_id: str) -> None:
        """Add asset to watchlist."""
        if self.watchlist_manager.add(asset_id):
            self._show_output(f"[green]✓[/green] Added {asset_id} to watchlist")
            self._update_watchlist_widget()
        else:
            self._show_output(
                f"[yellow]![/yellow] {asset_id} is already in watchlist"
            )

    def _unwatch_asset(self, asset_id: str) -> None:
        """Remove asset from watchlist."""
        if self.watchlist_manager.remove(asset_id):
            self._show_output(f"[green]✓[/green] Removed {asset_id} from watchlist")
            self._update_watchlist_widget()
        else:
            self._show_output(
                f"[yellow]![/yellow] {asset_id} is not in watchlist"
            )

    def _show_watchlist(self) -> None:
        """Show watchlist contents."""
        items = self.watchlist_manager.get_all()
        if items:
            output = "[bold cyan]Current Watchlist:[/bold cyan]\n\n"
            for i, asset_id in enumerate(items, 1):
                output += f"  {i}. {asset_id}\n"
            output += f"\n[dim]Total: {len(items)} asset(s)[/dim]"
        else:
            output = "[yellow]Watchlist is empty.[/yellow]\n\nUse 'watch <asset_id>' to add assets."
        self._show_output(output)

    def _refresh_data(self) -> None:
        """Refresh data from sources."""
        self._update_status("[yellow]Refreshing data...[/yellow]")
        self.run_worker(self._do_refresh())

    async def _do_refresh(self) -> None:
        """Async refresh operation."""
        success = await self.refresh_service.refresh()
        # Status update handled by callback

    def _on_refresh_status_change(self, status: RefreshStatus) -> None:
        """Handle refresh status changes."""
        if status == RefreshStatus.RUNNING:
            self._update_status("[yellow]⟳ Refreshing data...[/yellow]")
        elif status == RefreshStatus.SUCCESS:
            self._update_status("[green]✓ Data refreshed successfully[/green]")
            self._show_output("[green]✓ Data refresh completed successfully![/green]")
        elif status == RefreshStatus.ERROR:
            error = self.refresh_service.error_message or "Unknown error"
            self._update_status(f"[red]✗ Refresh failed[/red]")
            self._show_output(
                f"[red]✗ Data refresh failed:[/red]\n{error}\n\n"
                "Please check your connection and try again."
            )

    def _show_help(self) -> None:
        """Show help information."""
        # Toggle onboarding to show help
        self.action_toggle_onboarding()

    def _show_output(self, message: str) -> None:
        """Show message in output area."""
        if self.output_static and self.output_static.id == "output":
            self.output_static.update(message)
        else:
            # Recreate output static if it was replaced
            if self.output_static and self.output_static.id != "output":
                self.output_static.remove()
            self.output_static = Static(message, classes="output-box", id="output")
            self.query_one("#content").mount(self.output_static)

    def _update_status(self, message: str) -> None:
        """Update status bar message."""
        status_widget = self.query_one("#status", Static)
        status_widget.update(f"[bold cyan]Status:[/bold cyan] {message}")

    def _update_watchlist_widget(self) -> None:
        """Update watchlist widget display."""
        if self.watchlist_widget:
            self.watchlist_widget.update_watchlist(
                self.watchlist_manager.get_all()
            )

    def _update_recent_widgets(self) -> None:
        """Update all widgets showing recent assets."""
        recent = self.recent_tracker.get_all()
        if self.recent_widget:
            self.recent_widget.update_recent(recent)

        # Update onboarding if visible
        onboarding = self.query("#onboarding")
        if onboarding:
            for widget in onboarding:
                if isinstance(widget, OnboardingWidget):
                    widget.update_recent_assets(recent)

    def action_toggle_onboarding(self) -> None:
        """Toggle onboarding panel visibility."""
        onboarding = self.query("#onboarding")
        if onboarding:
            # Remove onboarding
            for widget in onboarding:
                widget.remove()
            self._update_status("Onboarding hidden")
        else:
            # Show onboarding
            content = self.query_one("#content")
            onboarding_widget = OnboardingWidget(
                self.recent_tracker.get_all(), id="onboarding"
            )
            content.mount(onboarding_widget, before=0)
            self._update_status("Onboarding shown")

    def action_refresh_data(self) -> None:
        """Refresh data action."""
        self._refresh_data()


def run_app() -> None:
    """Run the Biotech Terminal TUI application."""
    app = BiotechTerminalApp()
    app.run()


if __name__ == "__main__":
    run_app()
