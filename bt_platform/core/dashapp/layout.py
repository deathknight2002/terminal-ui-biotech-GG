"""
Dashboard Layout

Main layout composition for Aurora Lava dashboard.
"""

import dash_mantine_components as dmc
from dash import dcc, html

from .components.header import render_header
from .components.loaders import render_skeleton_card


def create_layout():
    """
    Create main dashboard layout.
    
    Returns:
        Dash HTML layout
    """
    return dmc.MantineProvider(
        theme={
            "colorScheme": "dark",
            "fontFamily": "JetBrains Mono, Monaco, Courier New, monospace",
            "primaryColor": "teal",
        },
        children=html.Div(
            [
                # Header with controls
                render_header(),

                # Main content area
                html.Div(
                    [
                        # KPI Tiles Row
                        html.Div(
                            id="kpi-tiles-container",
                            children=render_skeleton_card(height="120px"),
                        ),

                        # Hero Row - PoS Gauge and IV Chart
                        html.Div(
                            [
                                # PoS Gauge Card
                                html.Div(
                                    [
                                        html.Div(
                                            "PROBABILITY OF SUCCESS",
                                            style={
                                                "fontSize": "0.75rem",
                                                "color": "#94a3b8",
                                                "textTransform": "uppercase",
                                                "letterSpacing": "1px",
                                                "marginBottom": "16px",
                                            },
                                        ),
                                        dcc.Graph(
                                            id="pos-gauge",
                                            config={"displayModeBar": False},
                                            style={"height": "300px"},
                                        ),
                                    ],
                                    className="dashboard-panel panel-with-brackets",
                                    style={
                                        "flex": "0 0 350px",
                                        "padding": "20px",
                                    },
                                ),

                                # IV Chart Card
                                html.Div(
                                    [
                                        dcc.Graph(
                                            id="iv-chart",
                                            config={
                                                "displayModeBar": True,
                                                "displaylogo": False,
                                            },
                                            style={"height": "350px"},
                                        ),
                                    ],
                                    className="dashboard-panel panel-with-brackets",
                                    style={
                                        "flex": "1",
                                        "padding": "20px",
                                        "marginLeft": "24px",
                                    },
                                ),
                            ],
                            style={
                                "display": "flex",
                                "marginBottom": "24px",
                            },
                        ),

                        # Catalyst Heatmap Row
                        html.Div(
                            [
                                dcc.Graph(
                                    id="catalyst-heatmap",
                                    config={
                                        "displayModeBar": False,
                                    },
                                    style={"height": "300px"},
                                ),
                            ],
                            className="dashboard-panel panel-with-brackets",
                            style={
                                "padding": "20px",
                            },
                        ),

                        # Toast notifications container
                        html.Div(id="toast-container"),

                        # Hidden div for storing state
                        html.Div(id="data-store", style={"display": "none"}),
                    ],
                    style={
                        "padding": "24px",
                        "maxWidth": "1400px",
                        "margin": "0 auto",
                    },
                ),
            ],
            style={
                "minHeight": "100vh",
                "backgroundColor": "#070b1a",
                "color": "#e6f1ff",
                "fontFamily": "JetBrains Mono, monospace",
            },
        ),
    )
