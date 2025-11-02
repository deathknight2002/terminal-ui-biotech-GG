"""
Loading Component

Skeleton loaders and loading states for various components.
"""

from dash import html


def render_skeleton_card(height: str = "300px") -> html.Div:
    """
    Render a generic skeleton card loader.
    
    Args:
        height: Card height
        
    Returns:
        Dash HTML div
    """
    return html.Div(
        [
            html.Div(
                className="skeleton-loader",
                style={
                    "height": "30px",
                    "width": "50%",
                    "marginBottom": "16px",
                    "borderRadius": "4px",
                },
            ),
            html.Div(
                className="skeleton-loader",
                style={
                    "height": f"calc({height} - 60px)",
                    "borderRadius": "4px",
                },
            ),
        ],
        style={
            "height": height,
            "padding": "20px",
            "background": "#0b1024",
            "border": "1px solid #334155",
            "borderRadius": "8px",
        },
    )


def render_loading_spinner() -> html.Div:
    """
    Render a loading spinner.
    
    Returns:
        Dash HTML div
    """
    return html.Div(
        [
            html.Div(
                className="pulse",
                style={
                    "width": "60px",
                    "height": "60px",
                    "border": "4px solid #334155",
                    "borderTop": "4px solid #00ff9f",
                    "borderRadius": "50%",
                    "animation": "spin 1s linear infinite",
                },
            ),
            html.Div(
                "Loading...",
                style={
                    "marginTop": "16px",
                    "color": "#94a3b8",
                    "fontSize": "0.875rem",
                    "textTransform": "uppercase",
                    "letterSpacing": "1px",
                },
            ),
        ],
        style={
            "display": "flex",
            "flexDirection": "column",
            "alignItems": "center",
            "justifyContent": "center",
            "height": "300px",
        },
    )


def render_error_state(message: str = "Failed to load data") -> html.Div:
    """
    Render an error state.
    
    Args:
        message: Error message to display
        
    Returns:
        Dash HTML div
    """
    return html.Div(
        [
            html.Div(
                "⚠",
                style={
                    "fontSize": "3rem",
                    "color": "#ff5a5f",
                    "marginBottom": "16px",
                },
            ),
            html.Div(
                message,
                style={
                    "color": "#94a3b8",
                    "fontSize": "0.875rem",
                    "textAlign": "center",
                    "maxWidth": "300px",
                },
            ),
        ],
        style={
            "display": "flex",
            "flexDirection": "column",
            "alignItems": "center",
            "justifyContent": "center",
            "height": "300px",
            "background": "#0b1024",
            "border": "1px solid #334155",
            "borderRadius": "8px",
        },
    )


def render_empty_state(message: str = "No data available") -> html.Div:
    """
    Render an empty state.
    
    Args:
        message: Message to display
        
    Returns:
        Dash HTML div
    """
    return html.Div(
        [
            html.Div(
                "📊",
                style={
                    "fontSize": "3rem",
                    "opacity": "0.3",
                    "marginBottom": "16px",
                },
            ),
            html.Div(
                message,
                style={
                    "color": "#94a3b8",
                    "fontSize": "0.875rem",
                    "textAlign": "center",
                },
            ),
        ],
        style={
            "display": "flex",
            "flexDirection": "column",
            "alignItems": "center",
            "justifyContent": "center",
            "height": "300px",
        },
    )
