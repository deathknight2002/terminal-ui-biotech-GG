"""
Asset Detail Widget

Displays detailed information about a biotech asset including risk metrics.
"""

from typing import Optional

from textual.app import ComposeResult
from textual.containers import Container, Vertical
from textual.widgets import Static

from ..helpers.risk_metrics import RiskMetrics, get_risk_metrics


class AssetDetailWidget(Container):
    """Widget showing detailed asset information with risk metrics."""

    def __init__(self, asset_id: str, **kwargs) -> None:
        """
        Initialize asset detail widget.

        Args:
            asset_id: Unique identifier for the asset
            **kwargs: Additional container arguments
        """
        super().__init__(**kwargs)
        self.asset_id = asset_id
        self.risk_metrics: Optional[RiskMetrics] = get_risk_metrics(asset_id)

    def compose(self) -> ComposeResult:
        """Compose the widget."""
        with Vertical(classes="asset-detail-container"):
            yield Static(
                f"╔════════════════════════════════════════════════════════════╗\n"
                f"║  ASSET DETAILS: {self.asset_id:^40s}  ║\n"
                f"╚════════════════════════════════════════════════════════════╝",
                classes="asset-detail-header",
            )

            if self.risk_metrics:
                # Format risk metrics display
                prob_pct = self.risk_metrics.success_probability * 100
                risk_color = self._get_risk_color(self.risk_metrics.risk_category)

                yield Static(
                    f"\n[bold cyan]RISK ASSESSMENT[/bold cyan]\n"
                    f"{'─' * 60}\n"
                    f"  [bold]Success Probability:[/bold]  {prob_pct:.1f}%\n"
                    f"  [bold]Monthly Burn Rate:[/bold]    ${self.risk_metrics.monthly_burn_rate:.1f}M\n"
                    f"  [bold]Runway:[/bold]                {self.risk_metrics.runway_months} months\n"
                    f"  [bold]Risk Category:[/bold]         [{risk_color}]{self.risk_metrics.risk_category}[/{risk_color}]\n",
                    classes="risk-metrics",
                )

                # Additional financial details placeholder
                yield Static(
                    f"\n[bold cyan]FINANCIAL OVERVIEW[/bold cyan]\n"
                    f"{'─' * 60}\n"
                    f"  [bold]Market Cap:[/bold]           $8.9B\n"
                    f"  [bold]Pipeline Stage:[/bold]       Phase III\n"
                    f"  [bold]Indication:[/bold]           Oncology\n",
                    classes="financial-overview",
                )

                # Action hints
                yield Static(
                    f"\n[dim]Use 'watch {self.asset_id}' to add to watchlist[/dim]",
                    classes="action-hint",
                )
            else:
                yield Static(
                    "\n[red]Risk metrics not available for this asset.[/red]",
                    classes="error-message",
                )

    def _get_risk_color(self, category: str) -> str:
        """
        Get color code for risk category.

        Args:
            category: Risk category string

        Returns:
            Color code for display
        """
        color_map = {
            "Low": "green",
            "Medium": "yellow",
            "High": "red",
        }
        return color_map.get(category, "white")
