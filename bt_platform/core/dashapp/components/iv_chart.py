"""
IV Chart Component

Combined chart showing:
- IV (Implied Volatility) as bars
- HV (Historical Volatility) as sparkline on secondary axis
- Smooth animations on data update
"""

from typing import Dict, List

import plotly.graph_objs as go


def render_iv_chart(
    iv_points: List[Dict],
    hv_points: List[Dict],
    title: str = "IMPLIED VOLATILITY"
) -> go.Figure:
    """
    Render IV combo chart with bars and sparkline.
    
    Args:
        iv_points: List of dicts with 't' (timestamp) and 'iv' (value) keys
        hv_points: List of dicts with 't' (timestamp) and 'iv' (HV value) keys
        title: Chart title
        
    Returns:
        Plotly Figure object
    """
    # Extract data points
    x_iv = [p["t"] for p in iv_points] if iv_points else []
    y_iv = [p["iv"] for p in iv_points] if iv_points else []

    x_hv = [p["t"] for p in hv_points] if hv_points else []
    y_hv = [p["iv"] for p in hv_points] if hv_points else []

    # Create figure
    fig = go.Figure()

    # Add IV bars
    fig.add_trace(
        go.Bar(
            x=x_iv,
            y=y_iv,
            name="IV",
            marker=dict(
                color="#00d9ff",
                opacity=0.7,
                line=dict(width=0),
            ),
            hovertemplate="<b>IV</b>: %{y:.1f}%<br>Date: %{x}<extra></extra>",
        )
    )

    # Add HV sparkline on secondary y-axis
    if x_hv and y_hv:
        fig.add_trace(
            go.Scatter(
                x=x_hv,
                y=y_hv,
                name="HV (20d)",
                mode="lines",
                line=dict(
                    color="#9a4dff",
                    width=2,
                ),
                yaxis="y2",
                hovertemplate="<b>HV</b>: %{y:.1f}%<br>Date: %{x}<extra></extra>",
            )
        )

    # Add IV Rank threshold band (optional)
    if y_iv:
        avg_iv = sum(y_iv) / len(y_iv)
        fig.add_hline(
            y=avg_iv,
            line_dash="dash",
            line_color="#ffcc00",
            opacity=0.3,
            annotation_text="Avg IV",
            annotation_position="right",
            annotation_font_size=10,
            annotation_font_color="#ffcc00",
        )

    # Update layout with dual y-axes
    fig.update_layout(
        title=dict(
            text=title,
            font=dict(size=14, color="#94a3b8", family="JetBrains Mono, monospace"),
            x=0,
            xanchor="left",
        ),
        xaxis=dict(
            title="",
            gridcolor="#1e293b",
            color="#94a3b8",
            showgrid=True,
            zeroline=False,
        ),
        yaxis=dict(
            title="IV (%)",
            rangemode="tozero",
            gridcolor="#1e293b",
            color="#00d9ff",
            showgrid=True,
            zeroline=False,
        ),
        yaxis2=dict(
            title="HV (%)",
            overlaying="y",
            side="right",
            rangemode="tozero",
            gridcolor="rgba(0,0,0,0)",
            color="#9a4dff",
            showgrid=False,
            zeroline=False,
        ),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e6f1ff", family="JetBrains Mono, monospace", size=11),
        margin=dict(l=50, r=50, t=40, b=40),
        height=350,
        hovermode="x unified",
        legend=dict(
            bgcolor="rgba(11, 16, 36, 0.8)",
            bordercolor="#00ff9f",
            borderwidth=1,
            font=dict(size=10),
            orientation="h",
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01,
        ),
        # Smooth animation
        transition={
            "duration": 300,
            "easing": "cubic-in-out",
        },
    )

    return fig


def render_iv_chart_skeleton():
    """
    Render skeleton loader for IV chart while data is loading.
    
    Returns:
        HTML div with skeleton animation
    """
    from dash import html

    return html.Div(
        [
            html.Div(
                className="skeleton-loader",
                style={
                    "height": "40px",
                    "marginBottom": "10px",
                    "borderRadius": "4px",
                },
            ),
            html.Div(
                className="skeleton-loader",
                style={
                    "height": "250px",
                    "borderRadius": "4px",
                },
            ),
        ],
        style={"height": "350px", "padding": "20px"},
    )
