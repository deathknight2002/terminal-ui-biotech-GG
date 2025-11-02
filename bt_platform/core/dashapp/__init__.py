"""
Aurora Lava Dashboard Application

Modular Dash application for Evidence Graph visualization with:
- Animated aurora/lava WebGL background
- Real-time PoS (Probability of Success) gauge
- IV (Implied Volatility) chart with sparklines
- Catalyst heatmap
- KPI tiles and metrics
"""

from dash import Dash

from .callbacks import register_callbacks
from .layout import create_layout

__all__ = ["create_dash_app"]


def create_dash_app(url_base_pathname: str = "/dash/") -> Dash:
    """
    Create and configure the Aurora Lava Dash application.
    
    Args:
        url_base_pathname: Base URL path for the Dash app
        
    Returns:
        Configured Dash application instance
    """
    import os

    # Get assets folder path
    assets_folder = os.path.join(os.path.dirname(__file__), "..", "assets")

    # Create Dash app with external stylesheets
    app = Dash(
        __name__,
        url_base_pathname=url_base_pathname,
        suppress_callback_exceptions=True,
        assets_folder=assets_folder if os.path.exists(assets_folder) else None,
        # External scripts for Vanta.js (Three.js dependency + Vanta NET)
        external_scripts=[
            "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js",
            "https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js",
        ],
        meta_tags=[
            {"name": "viewport", "content": "width=device-width, initial-scale=1"},
            {"name": "theme-color", "content": "#070b1a"},
        ],
    )

    # Set app layout
    app.layout = create_layout()

    # Register callbacks
    register_callbacks(app)

    # Add index string to inject lava-bg.js script
    app.index_string = """
    <!DOCTYPE html>
    <html>
        <head>
            {%metas%}
            <title>Evidence Graph - Aurora Dashboard</title>
            {%favicon%}
            {%css%}
        </head>
        <body>
            {%app_entry%}
            <footer>
                {%config%}
                {%scripts%}
                {%renderer%}
            </footer>
            <script src="/assets/lava-bg.js"></script>
        </body>
    </html>
    """

    return app
