"""
PoS Gauge Component

Animated donut/gauge chart showing Probability of Success with:
- Color gradient based on value (red -> amber -> green)
- Smooth animation on value change
- Inner numeric display with percentage
- Delta indicator vs previous value
"""

from typing import Optional

import plotly.graph_objs as go


def color_for_pos(value: float) -> str:
    """
    Get color for PoS value based on thresholds.
    
    Args:
        value: PoS value between 0 and 1
        
    Returns:
        CSS color string
    """
    if value <= 0.33:
        return "#ff5a5f"  # Red (heat-lo)
    elif value <= 0.66:
        return "#ffcc00"  # Amber (heat-mid)
    else:
        return "#29d344"  # Green (heat-hi)


def render_pos_gauge(
    pos_latest: float,
    pos_prev: Optional[float] = None,
    title: str = "PROBABILITY OF SUCCESS"
) -> go.Figure:
    """
    Render animated PoS gauge as donut chart.
    
    Args:
        pos_latest: Current PoS value (0-1)
        pos_prev: Previous PoS value for delta calculation
        title: Chart title
        
    Returns:
        Plotly Figure object
    """
    # Clamp value to valid range
    value = max(0.0, min(1.0, pos_latest))
    remainder = 1.0 - value

    # Get color based on value
    fill_color = color_for_pos(value)

    # Create donut chart
    fig = go.Figure(
        data=[
            go.Pie(
                values=[value, remainder],
                hole=0.7,
                sort=False,
                direction="clockwise",
                textinfo="none",
                marker=dict(
                    colors=[fill_color, "rgba(255,255,255,0.06)"],
                    line=dict(width=0),
                ),
                hovertemplate="PoS: %{value:.1%}<extra></extra>",
            )
        ]
    )

    # Calculate delta if previous value provided
    delta_text = ""
    if pos_prev is not None:
        delta = value - pos_prev
        delta_pct = delta * 100
        if delta > 0:
            delta_text = f"+{delta_pct:.1f}%"
            delta_color = "#29d344"
        elif delta < 0:
            delta_text = f"{delta_pct:.1f}%"
            delta_color = "#ff5a5f"
        else:
            delta_text = "—"
            delta_color = "#94a3b8"

    # Add annotations for center text
    annotations = [
        # Main value
        dict(
            text=f"{value:.1%}",
            x=0.5,
            y=0.55,
            font=dict(size=48, color=fill_color, family="JetBrains Mono, monospace"),
            showarrow=False,
        ),
        # Title
        dict(
            text=title,
            x=0.5,
            y=0.35,
            font=dict(size=10, color="#94a3b8", family="JetBrains Mono, monospace"),
            showarrow=False,
        ),
    ]

    # Add delta annotation if available
    if delta_text and pos_prev is not None:
        annotations.append(
            dict(
                text=delta_text,
                x=0.5,
                y=0.25,
                font=dict(size=12, color=delta_color, family="JetBrains Mono, monospace"),
                showarrow=False,
            )
        )

    # Update layout
    fig.update_layout(
        annotations=annotations,
        margin=dict(t=10, b=10, l=10, r=10),
        showlegend=False,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        height=300,
        # Smooth animation
        transition={
            "duration": 350,
            "easing": "cubic-in-out",
        },
    )

    return fig


def render_pos_gauge_skeleton():
    """
    Render skeleton loader for PoS gauge while data is loading.
    
    Returns:
        HTML div with skeleton animation
    """
    from dash import html

    return html.Div(
        [
            html.Div(
                className="skeleton-loader",
                style={
                    "width": "200px",
                    "height": "200px",
                    "borderRadius": "50%",
                    "margin": "50px auto",
                },
            )
        ],
        style={"height": "300px", "display": "flex", "alignItems": "center"},
    )
