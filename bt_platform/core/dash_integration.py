"""
Plotly Dash Integration for Evidence Graph

Mounts a Dash app inside FastAPI for interactive visualization of:
- Probability of Success (PoS) curves
- Delta timelines
- Implied Volatility overlays
"""

import os
from typing import Any, Dict

import httpx
import plotly.graph_objs as go
from dash import Dash, Input, Output, dcc, html

# Dash app configuration
DASH_ROUTE = "/dash"

# Get assets folder path
ASSETS_FOLDER = os.path.join(os.path.dirname(__file__), "assets")


def create_dash_app(url_base_pathname: str = "/dash/") -> Dash:
    """
    Create and configure Dash application.

    Args:
        url_base_pathname: Base path for Dash routes

    Returns:
        Configured Dash app instance
    """
    dash_app = Dash(
        __name__,
        url_base_pathname=url_base_pathname,
        suppress_callback_exceptions=True,
        assets_folder=ASSETS_FOLDER if os.path.exists(ASSETS_FOLDER) else None,
    )

    # Layout definition
    dash_app.layout = html.Div(
        [
            html.H2(
                "Evidence Graph: PoS & Volatility Overlay",
                style={
                    "textAlign": "center",
                    "color": "#00ff9f",
                    "fontFamily": "monospace",
                },
            ),
            html.Div(
                [
                    html.Div(
                        [
                            html.Label(
                                "Series:",
                                style={"color": "#fff", "fontFamily": "monospace"},
                            ),
                            dcc.Dropdown(
                                id="series",
                                options=[
                                    {
                                        "label": "SRRK — SMA program",
                                        "value": "SRRK_SMA",
                                    },
                                    {"label": "IONIS — ATTR", "value": "IONIS_ATTR"},
                                    {"label": "KRYS — CF", "value": "KRYS_CF"},
                                ],
                                value="SRRK_SMA",
                                clearable=False,
                                style={"marginBottom": "10px"},
                            ),
                        ],
                        style={
                            "width": "48%",
                            "display": "inline-block",
                            "marginRight": "2%",
                        },
                    ),
                    html.Div(
                        [
                            html.Label(
                                "Ticker:",
                                style={"color": "#fff", "fontFamily": "monospace"},
                            ),
                            dcc.Input(
                                id="ticker",
                                value="SRRK",
                                type="text",
                                debounce=True,
                                style={"width": "100%", "marginBottom": "10px"},
                            ),
                        ],
                        style={"width": "48%", "display": "inline-block"},
                    ),
                ],
                style={"marginBottom": "20px"},
            ),
            dcc.Graph(id="evidence_chart", style={"height": "600px"}),
            dcc.Interval(
                id="refresh",
                interval=30_000,  # 30 seconds
                n_intervals=0,
            ),
        ],
        style={
            "maxWidth": "1200px",
            "margin": "0 auto",
            "padding": "24px",
            "backgroundColor": "#0a0e27",
            "minHeight": "100vh",
            "fontFamily": "monospace",
        },
    )

    # Callback for updating chart
    @dash_app.callback(
        Output("evidence_chart", "figure"),
        Input("series", "value"),
        Input("ticker", "value"),
        Input("refresh", "n_intervals"),
    )
    def update_chart(series: str, ticker: str, _n: int) -> Dict[str, Any]:
        """
        Update evidence chart with latest PoS and volatility data.

        Args:
            series: Selected series identifier
            ticker: Stock ticker symbol
            _n: Interval counter (not used directly)

        Returns:
            Plotly figure dictionary
        """
        # Pull live data from FastAPI endpoints
        try:
            with httpx.Client(base_url="http://127.0.0.1:8000", timeout=10) as cx:
                pos_response = cx.get("/api/v1/evidence/pos", params={"series": series})
                vol_response = cx.get("/api/v1/evidence/vol", params={"ticker": ticker})

                pos = pos_response.json()
                vol = vol_response.json()
        except Exception as e:
            # Return empty figure with error message on failure
            return {
                "data": [],
                "layout": {
                    "title": f"Error loading data: {str(e)}",
                    "plot_bgcolor": "#0a0e27",
                    "paper_bgcolor": "#0a0e27",
                    "font": {"color": "#fff"},
                },
            }

        t_pos = [p["t"] for p in pos]
        y_pos = [p["pos"] for p in pos]
        t_vol = [v["t"] for v in vol]
        y_vol = [v["iv"] for v in vol]

        # Create figure with dual y-axes
        fig = go.Figure()

        # Add PoS line trace
        fig.add_trace(
            go.Scatter(
                x=t_pos,
                y=y_pos,
                name="PoS",
                mode="lines+markers",
                line=dict(color="#00ff9f", width=2),
                marker=dict(size=6, color="#00ff9f"),
            )
        )

        # Add IV bar trace on secondary y-axis
        fig.add_trace(
            go.Bar(
                x=t_vol,
                y=y_vol,
                name="Implied Vol",
                opacity=0.35,
                marker=dict(color="#3b82f6"),
                yaxis="y2",
            )
        )

        # Update layout with Aurora Eclipse theme
        fig.update_layout(
            title=dict(
                text=f"{series} vs {ticker} IV",
                font=dict(color="#00ff9f", size=20, family="monospace"),
            ),
            xaxis=dict(
                title="Date",
                gridcolor="#1e293b",
                color="#fff",
                showgrid=True,
            ),
            yaxis=dict(
                title="PoS",
                rangemode="tozero",
                gridcolor="#1e293b",
                color="#00ff9f",
                showgrid=True,
            ),
            yaxis2=dict(
                title="IV",
                overlaying="y",
                side="right",
                rangemode="tozero",
                gridcolor="#1e293b",
                color="#3b82f6",
                showgrid=False,
            ),
            plot_bgcolor="#0a0e27",
            paper_bgcolor="#0a0e27",
            font=dict(color="#fff", family="monospace"),
            margin=dict(l=60, r=60, t=60, b=60),
            hovermode="x unified",
            legend=dict(
                bgcolor="rgba(10, 14, 39, 0.8)",
                bordercolor="#00ff9f",
                borderwidth=1,
            ),
        )

        return fig

    return dash_app
