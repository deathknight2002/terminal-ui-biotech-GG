"""TUI Widgets Module"""

from .asset_detail import AssetDetailWidget
from .onboarding import OnboardingWidget
from .recent_assets import RecentAssetsWidget
from .watchlist_sidebar import WatchlistSidebar

__all__ = [
    "OnboardingWidget",
    "WatchlistSidebar",
    "RecentAssetsWidget",
    "AssetDetailWidget",
]
