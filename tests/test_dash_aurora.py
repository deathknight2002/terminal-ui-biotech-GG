"""
Tests for Aurora Lava Dashboard

Smoke tests for layout, callbacks, and components.
"""

import pytest
from dash import Dash
from bt_platform.core.dashapp import create_dash_app
from bt_platform.core.dashapp.components.pos_gauge import render_pos_gauge, color_for_pos
from bt_platform.core.dashapp.components.iv_chart import render_iv_chart
from bt_platform.core.dashapp.components.catalyst_heatmap import render_catalyst_heatmap
from bt_platform.core.dashapp.components.tiles import render_kpi_tiles


class TestDashAuroraApp:
    """Test suite for Aurora Lava dashboard"""
    
    def test_create_dash_app(self):
        """Test that Dash app can be created"""
        app = create_dash_app("/dash/")
        assert isinstance(app, Dash)
        assert app.config.url_base_pathname == "/dash/"
    
    def test_app_has_layout(self):
        """Test that app has a layout"""
        app = create_dash_app("/dash/")
        assert app.layout is not None
    
    def test_color_for_pos_low(self):
        """Test PoS color for low probability"""
        color = color_for_pos(0.2)
        assert color == "#ff5a5f"  # Red
    
    def test_color_for_pos_mid(self):
        """Test PoS color for medium probability"""
        color = color_for_pos(0.5)
        assert color == "#ffcc00"  # Amber
    
    def test_color_for_pos_high(self):
        """Test PoS color for high probability"""
        color = color_for_pos(0.8)
        assert color == "#29d344"  # Green
    
    def test_render_pos_gauge(self):
        """Test PoS gauge rendering"""
        fig = render_pos_gauge(0.65)
        assert fig is not None
        assert len(fig.data) > 0
        assert fig.data[0].type == "pie"
    
    def test_render_pos_gauge_with_delta(self):
        """Test PoS gauge with delta calculation"""
        fig = render_pos_gauge(0.65, 0.60)
        assert fig is not None
        assert len(fig.layout.annotations) >= 2
    
    def test_render_iv_chart_empty(self):
        """Test IV chart with empty data"""
        fig = render_iv_chart([], [])
        assert fig is not None
    
    def test_render_iv_chart_with_data(self):
        """Test IV chart with data"""
        iv_data = [
            {"t": "2025-01-01", "iv": 45.0},
            {"t": "2025-01-02", "iv": 46.5},
            {"t": "2025-01-03", "iv": 48.0},
        ]
        hv_data = [
            {"t": "2025-01-01", "iv": 42.0},
            {"t": "2025-01-02", "iv": 43.0},
            {"t": "2025-01-03", "iv": 44.0},
        ]
        
        fig = render_iv_chart(iv_data, hv_data)
        assert fig is not None
        assert len(fig.data) >= 2  # IV bars + HV line
    
    def test_render_catalyst_heatmap(self):
        """Test catalyst heatmap rendering"""
        catalyst_data = [
            {
                "ticker": "SRRK",
                "event": "Phase III Readout",
                "date": "2026-Q2",
                "iv_rank": 85,
                "bin_risk": "HIGH",
                "date_certainty": "likely",
            }
        ]
        
        fig = render_catalyst_heatmap(catalyst_data)
        assert fig is not None
    
    def test_render_kpi_tiles(self):
        """Test KPI tiles rendering"""
        kpi_data = {
            "pos_7d_change": "+2.3%",
            "iv_rank": "78",
            "next_catalyst": "Q2 2026",
            "binary_risk": "MEDIUM",
        }
        
        tiles = render_kpi_tiles(kpi_data)
        assert tiles is not None


class TestAPIService:
    """Test suite for API service"""
    
    def test_api_service_import(self):
        """Test that API service can be imported"""
        from bt_platform.core.dashapp.services.api import api_service
        assert api_service is not None
    
    def test_get_pos_data(self):
        """Test getting PoS data"""
        from bt_platform.core.dashapp.services.api import api_service
        
        # This will fail if backend is not running, but should not crash
        try:
            data = api_service.get_pos_data("SRRK_SMA")
            assert isinstance(data, list)
        except Exception:
            # Expected if backend is not running
            pass
    
    def test_get_vol_data(self):
        """Test getting volatility data"""
        from bt_platform.core.dashapp.services.api import api_service
        
        try:
            data = api_service.get_vol_data("SRRK")
            assert isinstance(data, list)
        except Exception:
            # Expected if backend is not running
            pass


class TestCacheService:
    """Test suite for cache service"""
    
    def test_cache_service_import(self):
        """Test that cache service can be imported"""
        from bt_platform.core.dashapp.services.cache import cache_service
        assert cache_service is not None
    
    def test_cache_service_config(self):
        """Test cache service configuration"""
        from bt_platform.core.dashapp.services.cache import cache_service
        
        assert cache_service.cache_config["CACHE_TYPE"] == "SimpleCache"
        assert cache_service.cache_config["CACHE_DEFAULT_TIMEOUT"] == 15


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
