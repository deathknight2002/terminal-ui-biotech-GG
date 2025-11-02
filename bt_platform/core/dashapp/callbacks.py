"""
Dashboard Callbacks

All interactive callbacks for the Aurora Lava dashboard.
"""

from datetime import datetime

from dash import Input, Output, State

from .components.catalyst_heatmap import render_catalyst_heatmap
from .components.iv_chart import render_iv_chart
from .components.loaders import render_error_state
from .components.pos_gauge import render_pos_gauge
from .components.tiles import render_kpi_tiles
from .services.api import api_service


def register_callbacks(app):
    """
    Register all dashboard callbacks.
    
    Args:
        app: Dash application instance
    """

    # Update refresh interval based on dropdown
    @app.callback(
        Output("refresh-interval", "interval"),
        Input("refresh-interval-dropdown", "value"),
    )
    def update_refresh_interval(interval_value):
        """Update auto-refresh interval"""
        return interval_value if interval_value > 0 else 999999999

    # Main data update callback
    @app.callback(
        [
            Output("pos-gauge", "figure"),
            Output("iv-chart", "figure"),
            Output("catalyst-heatmap", "figure"),
            Output("kpi-tiles-container", "children"),
            Output("last-updated", "children"),
            Output("latency-pill", "children"),
            Output("latency-pill", "className"),
        ],
        [
            Input("series-dropdown", "value"),
            Input("ticker-dropdown", "value"),
            Input("refresh-interval", "n_intervals"),
        ],
    )
    def update_dashboard(series, ticker, n_intervals):
        """
        Update all dashboard components with fresh data.
        
        Args:
            series: Selected series identifier
            ticker: Selected ticker symbol
            n_intervals: Number of refresh intervals elapsed
            
        Returns:
            Tuple of updated components
        """
        start_time = datetime.now()

        try:
            # Fetch data from API
            pos_data = api_service.get_pos_data(series)
            vol_data = api_service.get_vol_data(ticker)
            catalyst_data = api_service.get_catalyst_heatmap()
            kpi_data = api_service.get_kpi_data()

            # Calculate latency
            latency_ms = (datetime.now() - start_time).total_seconds() * 1000

            # Render components
            if pos_data and len(pos_data) >= 2:
                pos_latest = pos_data[-1]["pos"]
                pos_prev = pos_data[-2]["pos"]
                pos_fig = render_pos_gauge(pos_latest, pos_prev)
            else:
                pos_fig = render_pos_gauge(0.5)

            iv_fig = render_iv_chart(vol_data, vol_data)  # Using vol_data for both IV and HV
            heatmap_fig = render_catalyst_heatmap(catalyst_data)
            kpi_tiles = render_kpi_tiles(kpi_data)

            # Update status
            last_updated = datetime.now().strftime("%H:%M:%S")

            # Determine latency pill status
            if latency_ms < 100:
                latency_text = f"⚡ {latency_ms:.0f}ms"
                latency_class = "status-pill success"
            elif latency_ms < 500:
                latency_text = f"✓ {latency_ms:.0f}ms"
                latency_class = "status-pill info"
            else:
                latency_text = f"⚠ {latency_ms:.0f}ms"
                latency_class = "status-pill warning"

            return (
                pos_fig,
                iv_fig,
                heatmap_fig,
                kpi_tiles,
                f"Updated: {last_updated}",
                latency_text,
                latency_class,
            )

        except Exception as e:
            # Error handling - return error states
            print(f"Error updating dashboard: {e}")

            error_fig = render_error_state(f"Error: {str(e)}")

            return (
                render_pos_gauge(0),
                error_fig,
                error_fig,
                render_error_state("Failed to load KPI data"),
                "Error",
                "Error",
                "status-pill error",
            )

    # Sync ticker dropdown with series dropdown
    @app.callback(
        Output("ticker-dropdown", "value"),
        Input("series-dropdown", "value"),
        State("ticker-dropdown", "value"),
    )
    def sync_ticker_with_series(series, current_ticker):
        """
        Sync ticker dropdown when series changes.
        
        Args:
            series: Selected series
            current_ticker: Current ticker value
            
        Returns:
            New ticker value
        """
        # Extract ticker from series if possible
        if "_" in series:
            ticker = series.split("_")[0]
            return ticker
        return current_ticker
