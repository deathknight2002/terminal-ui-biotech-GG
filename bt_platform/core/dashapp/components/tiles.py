"""
KPI Tiles Component

Display key metrics in tile format:
- PoS 7-day change
- IV Rank
- Next catalyst date
- Binary risk flag
"""

from typing import Dict, Optional

from dash import html


def render_kpi_tile(
    label: str,
    value: str,
    delta: Optional[str] = None,
    delta_positive: bool = True,
    icon: Optional[str] = None,
) -> html.Div:
    """
    Render a single KPI tile.
    
    Args:
        label: KPI label text
        value: Main value to display
        delta: Optional delta/change indicator
        delta_positive: Whether delta is positive (green) or negative (red)
        icon: Optional icon name
        
    Returns:
        Dash HTML div
    """
    delta_class = "positive" if delta_positive else "negative"

    children = []

    # Add value
    children.append(
        html.Div(
            value,
            className="kpi-value",
            style={
                "fontSize": "2rem",
                "fontWeight": "700",
                "color": "#00ff9f",
                "fontFamily": "JetBrains Mono, monospace",
            },
        )
    )

    # Add label
    children.append(
        html.Div(
            label,
            className="kpi-label",
            style={
                "fontSize": "0.75rem",
                "textTransform": "uppercase",
                "letterSpacing": "0.5px",
                "color": "#94a3b8",
                "marginTop": "8px",
            },
        )
    )

    # Add delta if provided
    if delta:
        delta_color = "#29d344" if delta_positive else "#ff5a5f"
        children.append(
            html.Div(
                delta,
                className=f"kpi-delta {delta_class}",
                style={
                    "fontSize": "0.875rem",
                    "marginTop": "8px",
                    "color": delta_color,
                },
            )
        )

    return html.Div(
        children,
        className="kpi-tile",
        style={
            "background": "#0b1024",
            "border": "1px solid #334155",
            "borderRadius": "8px",
            "padding": "20px",
            "transition": "all 0.25s ease-in-out",
            "cursor": "pointer",
        },
    )


def render_kpi_tiles(kpi_data: Dict) -> html.Div:
    """
    Render all KPI tiles in a grid.
    
    Args:
        kpi_data: Dictionary containing KPI values
        
    Returns:
        Dash HTML div with grid of tiles
    """
    # Extract KPI values with defaults
    pos_7d_change = kpi_data.get("pos_7d_change", "+2.3%")
    iv_rank = kpi_data.get("iv_rank", "78")
    next_catalyst = kpi_data.get("next_catalyst", "Q2 2026")
    binary_risk = kpi_data.get("binary_risk", "MEDIUM")

    # Determine if pos_7d_change is positive
    pos_positive = pos_7d_change.startswith("+")

    # Determine binary risk color
    risk_colors = {
        "LOW": "#29d344",
        "MEDIUM": "#ffcc00",
        "HIGH": "#ff5a5f",
    }
    risk_color = risk_colors.get(binary_risk, "#94a3b8")

    tiles = [
        # PoS 7d Change
        render_kpi_tile(
            label="PoS 7D CHANGE",
            value=pos_7d_change,
            delta="vs prev week",
            delta_positive=pos_positive,
        ),

        # IV Rank
        render_kpi_tile(
            label="IV RANK",
            value=iv_rank,
            delta="Percentile",
            delta_positive=int(iv_rank) > 50,
        ),

        # Next Catalyst
        render_kpi_tile(
            label="NEXT CATALYST",
            value=next_catalyst,
            delta="Expected",
            delta_positive=True,
        ),

        # Binary Risk
        html.Div(
            [
                html.Div(
                    binary_risk,
                    style={
                        "fontSize": "1.5rem",
                        "fontWeight": "700",
                        "color": risk_color,
                        "fontFamily": "JetBrains Mono, monospace",
                    },
                ),
                html.Div(
                    "BINARY RISK",
                    style={
                        "fontSize": "0.75rem",
                        "textTransform": "uppercase",
                        "letterSpacing": "0.5px",
                        "color": "#94a3b8",
                        "marginTop": "8px",
                    },
                ),
                html.Div(
                    [
                        html.Span(
                            "●",
                            style={
                                "color": risk_color,
                                "fontSize": "1.5rem",
                                "marginRight": "8px",
                            },
                        ),
                        html.Span("Event Outcome", style={"fontSize": "0.875rem"}),
                    ],
                    style={
                        "marginTop": "8px",
                        "color": "#94a3b8",
                    },
                ),
            ],
            className="kpi-tile",
            style={
                "background": "#0b1024",
                "border": "1px solid #334155",
                "borderRadius": "8px",
                "padding": "20px",
                "transition": "all 0.25s ease-in-out",
            },
        ),
    ]

    return html.Div(
        tiles,
        style={
            "display": "grid",
            "gridTemplateColumns": "repeat(auto-fit, minmax(200px, 1fr))",
            "gap": "16px",
            "marginBottom": "24px",
        },
    )


def render_kpi_tiles_skeleton():
    """
    Render skeleton loaders for KPI tiles.
    
    Returns:
        Dash HTML div with skeleton tiles
    """
    skeleton_tiles = []

    for _ in range(4):
        skeleton_tiles.append(
            html.Div(
                [
                    html.Div(
                        className="skeleton-loader",
                        style={
                            "height": "40px",
                            "width": "80%",
                            "marginBottom": "12px",
                            "borderRadius": "4px",
                        },
                    ),
                    html.Div(
                        className="skeleton-loader",
                        style={
                            "height": "16px",
                            "width": "100%",
                            "marginBottom": "8px",
                            "borderRadius": "4px",
                        },
                    ),
                    html.Div(
                        className="skeleton-loader",
                        style={
                            "height": "14px",
                            "width": "60%",
                            "borderRadius": "4px",
                        },
                    ),
                ],
                style={
                    "background": "#0b1024",
                    "border": "1px solid #334155",
                    "borderRadius": "8px",
                    "padding": "20px",
                    "minHeight": "120px",
                },
            )
        )

    return html.Div(
        skeleton_tiles,
        style={
            "display": "grid",
            "gridTemplateColumns": "repeat(auto-fit, minmax(200px, 1fr))",
            "gap": "16px",
            "marginBottom": "24px",
        },
    )
