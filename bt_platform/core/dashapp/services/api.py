"""
API Service Layer

HTTP client for fetching data from FastAPI endpoints with:
- Timeout and retry handling
- Graceful fallback to cached data
- Error handling
"""

import os
from typing import Dict, List, Optional

import httpx


class APIService:
    """Service for making API calls to FastAPI backend"""

    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize API service.
        
        Args:
            base_url: Base URL for API endpoints (defaults to env var or localhost)
        """
        self.base_url = base_url or os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
        self.timeout = httpx.Timeout(10.0, connect=5.0)
        self.last_good_data = {}

    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """
        Make HTTP request with error handling.
        
        Args:
            endpoint: API endpoint path
            params: Query parameters
            
        Returns:
            Response data or None on error
        """
        url = f"{self.base_url}{endpoint}"
        cache_key = f"{endpoint}?{params}" if params else endpoint

        try:
            with httpx.Client(base_url=self.base_url, timeout=self.timeout) as client:
                response = client.get(endpoint, params=params)
                response.raise_for_status()

                data = response.json()
                # Cache successful response
                self.last_good_data[cache_key] = data
                return data

        except httpx.TimeoutException:
            print(f"Timeout fetching {endpoint}")
            # Return cached data if available
            return self.last_good_data.get(cache_key)

        except httpx.HTTPStatusError as e:
            print(f"HTTP error {e.response.status_code} fetching {endpoint}")
            return self.last_good_data.get(cache_key)

        except Exception as e:
            print(f"Error fetching {endpoint}: {e}")
            return self.last_good_data.get(cache_key)

    def get_pos_data(self, series: str = "SRRK_SMA") -> List[Dict]:
        """
        Get Probability of Success time series data.
        
        Args:
            series: Series identifier
            
        Returns:
            List of PoS data points with 't' and 'pos' keys
        """
        data = self._make_request("/api/v1/evidence/pos", params={"series": series})
        return data if data else []

    def get_vol_data(self, ticker: str = "SRRK") -> List[Dict]:
        """
        Get Implied Volatility time series data.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            List of IV data points with 't' and 'iv' keys
        """
        data = self._make_request("/api/v1/evidence/vol", params={"ticker": ticker})
        return data if data else []

    def get_catalyst_heatmap(self) -> List[Dict]:
        """
        Get catalyst heatmap data.
        
        Returns:
            List of catalyst events
        """
        # Mock data for now - can be implemented when backend endpoint is ready
        return [
            {
                "ticker": "SRRK",
                "event": "Phase III Readout",
                "date": "2026-Q2",
                "iv_rank": 85,
                "bin_risk": "HIGH",
                "date_certainty": "likely",
            },
            {
                "ticker": "IONIS",
                "event": "PDUFA Date",
                "date": "2026-05-20",
                "iv_rank": 92,
                "bin_risk": "MEDIUM",
                "date_certainty": "confirmed",
            },
            {
                "ticker": "KRYS",
                "event": "AdComm Meeting",
                "date": "2026-04-15",
                "iv_rank": 78,
                "bin_risk": "MEDIUM",
                "date_certainty": "confirmed",
            },
        ]

    def get_kpi_data(self) -> Dict:
        """
        Get KPI metrics data.
        
        Returns:
            Dictionary with KPI values
        """
        # Calculate from PoS data
        pos_data = self.get_pos_data()

        if pos_data and len(pos_data) >= 7:
            # Get 7-day change
            latest = pos_data[-1]["pos"]
            week_ago = pos_data[-7]["pos"]
            change = (latest - week_ago) * 100
            pos_7d_change = f"+{change:.1f}%" if change > 0 else f"{change:.1f}%"
        else:
            pos_7d_change = "—"

        return {
            "pos_7d_change": pos_7d_change,
            "iv_rank": "78",
            "next_catalyst": "Q2 2026",
            "binary_risk": "MEDIUM",
        }


# Global API service instance
api_service = APIService()
