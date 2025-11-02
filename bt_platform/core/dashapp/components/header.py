"""
Header Component

Top navigation bar with:
- App title and subtitle
- Series and ticker dropdowns with search
- Auto-refresh toggle and controls
- Last updated timestamp and latency indicator
"""

from dash import dcc, html


def render_header():
    """
    Render header bar with controls.
    
    Returns:
        Dash HTML component
    """
    return html.Div(
        [
            # Left section - App branding
            html.Div(
                [
                    html.H1(
                        "EVIDENCE GRAPH",
                        style={
                            "margin": 0,
                            "fontSize": "1.5rem",
                            "color": "#00ff9f",
                            "letterSpacing": "2px",
                        },
                    ),
                    html.Div(
                        "Live PoS & IV",
                        style={
                            "fontSize": "0.75rem",
                            "color": "#94a3b8",
                            "marginTop": "4px",
                            "textTransform": "uppercase",
                            "letterSpacing": "1px",
                        },
                    ),
                ],
                style={"flex": "0 0 200px"},
            ),

            # Center section - Controls
            html.Div(
                [
                    # Series dropdown
                    html.Div(
                        [
                            html.Label("SERIES", style={"marginBottom": "4px"}),
                            dcc.Dropdown(
                                id="series-dropdown",
                                options=[
                                    {"label": "SRRK — SMA program", "value": "SRRK_SMA"},
                                    {"label": "IONIS — ATTR", "value": "IONIS_ATTR"},
                                    {"label": "KRYS — CF", "value": "KRYS_CF"},
                                ],
                                value="SRRK_SMA",
                                clearable=False,
                                searchable=True,
                                style={"minWidth": "200px"},
                            ),
                        ],
                        style={"marginRight": "16px"},
                    ),

                    # Ticker dropdown
                    html.Div(
                        [
                            html.Label("TICKER", style={"marginBottom": "4px"}),
                            dcc.Dropdown(
                                id="ticker-dropdown",
                                options=[
                                    {"label": "SRRK", "value": "SRRK"},
                                    {"label": "IONIS", "value": "IONIS"},
                                    {"label": "KRYS", "value": "KRYS"},
                                ],
                                value="SRRK",
                                clearable=False,
                                searchable=True,
                                style={"minWidth": "150px"},
                            ),
                        ],
                    ),
                ],
                style={
                    "flex": "1",
                    "display": "flex",
                    "justifyContent": "center",
                    "alignItems": "flex-end",
                    "gap": "16px",
                },
            ),

            # Right section - Status and refresh
            html.Div(
                [
                    # Auto-refresh toggle
                    html.Div(
                        [
                            html.Label("REFRESH", style={"marginBottom": "4px"}),
                            dcc.Dropdown(
                                id="refresh-interval-dropdown",
                                options=[
                                    {"label": "15s", "value": 15000},
                                    {"label": "30s", "value": 30000},
                                    {"label": "60s", "value": 60000},
                                    {"label": "Off", "value": 0},
                                ],
                                value=30000,
                                clearable=False,
                                style={"minWidth": "100px"},
                            ),
                        ],
                        style={"marginRight": "16px"},
                    ),

                    # Status indicators
                    html.Div(
                        [
                            html.Div(
                                id="last-updated",
                                children="—",
                                style={
                                    "fontSize": "0.75rem",
                                    "color": "#94a3b8",
                                    "marginBottom": "4px",
                                },
                            ),
                            html.Div(
                                id="latency-pill",
                                className="status-pill info",
                                children="Ready",
                                style={
                                    "fontSize": "0.7rem",
                                    "padding": "2px 8px",
                                },
                            ),
                        ],
                    ),
                ],
                style={
                    "flex": "0 0 200px",
                    "display": "flex",
                    "justifyContent": "flex-end",
                    "alignItems": "flex-end",
                },
            ),

            # Interval component for auto-refresh
            dcc.Interval(
                id="refresh-interval",
                interval=30000,  # 30 seconds default
                n_intervals=0,
            ),
        ],
        style={
            "display": "flex",
            "alignItems": "flex-end",
            "justifyContent": "space-between",
            "padding": "24px",
            "backgroundColor": "rgba(11, 16, 36, 0.6)",
            "borderBottom": "1px solid #334155",
            "backdropFilter": "blur(10px)",
        },
    )
