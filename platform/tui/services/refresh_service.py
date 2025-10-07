"""
Refresh Service

Manages data refresh operations with status updates.
"""

import asyncio
from typing import Callable, Optional
from enum import Enum


class RefreshStatus(Enum):
    """Status of refresh operation."""

    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"


class RefreshService:
    """
    Manages data refresh operations.

    Provides status updates and error handling for data refresh workflows.
    """

    def __init__(self) -> None:
        """Initialize refresh service."""
        self._status = RefreshStatus.IDLE
        self._error_message: Optional[str] = None
        self._on_status_change: Optional[Callable[[RefreshStatus], None]] = None

    @property
    def status(self) -> RefreshStatus:
        """Get current refresh status."""
        return self._status

    @property
    def error_message(self) -> Optional[str]:
        """Get error message if status is ERROR."""
        return self._error_message

    def set_status_callback(
        self, callback: Callable[[RefreshStatus], None]
    ) -> None:
        """
        Set callback to be called when status changes.

        Args:
            callback: Function to call with new status
        """
        self._on_status_change = callback

    def _update_status(self, status: RefreshStatus) -> None:
        """Update status and call callback if set."""
        self._status = status
        if self._on_status_change:
            self._on_status_change(status)

    async def refresh(self) -> bool:
        """
        Perform data refresh operation.

        Returns:
            True if refresh succeeded, False otherwise
        """
        if self._status == RefreshStatus.RUNNING:
            return False  # Already running

        self._error_message = None
        self._update_status(RefreshStatus.RUNNING)

        try:
            # Simulate data refresh operation
            # In a real implementation, this would call backend APIs
            await asyncio.sleep(2)  # Simulate network delay

            # For now, always succeed
            # In production, this would handle real data fetching
            self._update_status(RefreshStatus.SUCCESS)
            return True

        except Exception as e:
            self._error_message = str(e)
            self._update_status(RefreshStatus.ERROR)
            return False

    def reset(self) -> None:
        """Reset refresh service to idle state."""
        self._status = RefreshStatus.IDLE
        self._error_message = None
