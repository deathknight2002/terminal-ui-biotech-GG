"""
Catalyst Heatmap Component

Calendar-like or matrix visualization showing:
- Catalysts by ticker and time
- Color-coded by IV Rank
- Icon badges for event types (binary, date-certain, manufacturing)
"""

from typing import Dict, List

import plotly.graph_objs as go
from dash import html


def render_catalyst_heatmap(catalyst_data: List[Dict]) -> go.Figure:
    """
    Render catalyst heatmap using Plotly.
    
    Args:
        catalyst_data: List of catalyst events with fields:
            - ticker: Stock ticker
            - event: Event description
            - date: Event date
            - iv_rank: IV rank (0-100)
            - bin_risk: Binary risk level
            - date_certainty: Date certainty (confirmed/likely/speculative)
            
    Returns:
        Plotly Figure object
    """
    if not catalyst_data:
        # Return empty state
        return create_empty_heatmap()

    # Organize data by ticker and week
    tickers = sorted(list(set(d["ticker"] for d in catalyst_data)))

    # Create matrix data
    z_data = []
    hover_text = []

    for ticker in tickers:
        ticker_events = [d for d in catalyst_data if d["ticker"] == ticker]
        row_values = []
        row_hover = []

        # Group by week (simplified - using first 4 events)
        for i, event in enumerate(ticker_events[:4]):
            iv_rank = event.get("iv_rank", 50)
            row_values.append(iv_rank)

            # Build hover text
            hover = f"<b>{ticker}</b><br>"
            hover += f"Event: {event.get('event', 'N/A')}<br>"
            hover += f"Date: {event.get('date', 'TBD')}<br>"
            hover += f"IV Rank: {iv_rank}<br>"
            hover += f"Risk: {event.get('bin_risk', 'N/A')}<br>"
            hover += f"Certainty: {event.get('date_certainty', 'N/A')}"
            row_hover.append(hover)

        # Pad to 4 weeks if needed
        while len(row_values) < 4:
            row_values.append(None)
            row_hover.append("")

        z_data.append(row_values)
        hover_text.append(row_hover)

    # Create heatmap
    fig = go.Figure(
        data=go.Heatmap(
            z=z_data,
            x=["Week 1", "Week 2", "Week 3", "Week 4"],
            y=tickers,
            colorscale=[
                [0, "#ff5a5f"],      # Low IV rank - red
                [0.5, "#ffcc00"],    # Medium - amber
                [1, "#29d344"],      # High - green
            ],
            hovertemplate="%{text}<extra></extra>",
            text=hover_text,
            colorbar=dict(
                title="IV Rank",
                titleside="right",
                tickmode="linear",
                tick0=0,
                dtick=25,
                thickness=15,
                len=0.7,
                bgcolor="rgba(11, 16, 36, 0.8)",
                bordercolor="#00ff9f",
                borderwidth=1,
            ),
        )
    )

    # Update layout
    fig.update_layout(
        title=dict(
            text="CATALYST HEATMAP",
            font=dict(size=14, color="#94a3b8", family="JetBrains Mono, monospace"),
            x=0,
            xanchor="left",
        ),
        xaxis=dict(
            title="",
            side="top",
            gridcolor="rgba(0,0,0,0)",
            color="#94a3b8",
        ),
        yaxis=dict(
            title="",
            gridcolor="rgba(0,0,0,0)",
            color="#94a3b8",
        ),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e6f1ff", family="JetBrains Mono, monospace", size=11),
        margin=dict(l=80, r=20, t=60, b=40),
        height=300,
    )

    return fig


def create_empty_heatmap() -> go.Figure:
    """
    Create empty heatmap placeholder.
    
    Returns:
        Plotly Figure object
    """
    fig = go.Figure()

    fig.add_annotation(
        text="No catalyst data available",
        xref="paper",
        yref="paper",
        x=0.5,
        y=0.5,
        showarrow=False,
        font=dict(size=14, color="#94a3b8"),
    )

    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        height=300,
        margin=dict(l=20, r=20, t=20, b=20),
    )

    return fig


def render_catalyst_heatmap_skeleton():
    """
    Render skeleton loader for catalyst heatmap.
    
    Returns:
        HTML div with skeleton animation
    """
    return html.Div(
        [
            html.Div(
                className="skeleton-loader",
                style={
                    "height": "40px",
                    "marginBottom": "16px",
                    "borderRadius": "4px",
                    "width": "200px",
                },
            ),
            html.Div(
                className="skeleton-loader",
                style={
                    "height": "240px",
                    "borderRadius": "4px",
                },
            ),
        ],
        style={"height": "300px", "padding": "20px"},
    )
