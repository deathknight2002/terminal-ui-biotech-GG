"""
Sentry Integration for Error Tracking

Provides Sentry error tracking and performance monitoring.
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
import logging

logger = logging.getLogger(__name__)


def init_sentry(
    dsn: str = None,
    environment: str = "development",
    traces_sample_rate: float = 0.1,
    enable: bool = True
):
    """
    Initialize Sentry error tracking.

    Args:
        dsn: Sentry DSN (if None, Sentry is disabled)
        environment: Environment name (development, staging, production)
        traces_sample_rate: Percentage of transactions to trace (0.0 to 1.0)
        enable: Whether to enable Sentry
    """
    if not enable or not dsn:
        logger.info("Sentry is disabled (no DSN provided)")
        return

    try:
        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            traces_sample_rate=traces_sample_rate,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            # Send default PII (personally identifiable information)
            send_default_pii=False,
            # Attach stack traces to messages
            attach_stacktrace=True,
            # Maximum breadcrumbs
            max_breadcrumbs=50,
        )
        logger.info(f"Sentry initialized for environment: {environment}")
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")


def capture_exception(error: Exception, **kwargs):
    """
    Capture an exception in Sentry with additional context.

    Args:
        error: The exception to capture
        **kwargs: Additional context to attach
    """
    if sentry_sdk.Hub.current.client:
        with sentry_sdk.push_scope() as scope:
            for key, value in kwargs.items():
                scope.set_context(key, value)
            sentry_sdk.capture_exception(error)


def capture_message(message: str, level: str = "info", **kwargs):
    """
    Capture a message in Sentry.

    Args:
        message: The message to capture
        level: Severity level (debug, info, warning, error, fatal)
        **kwargs: Additional context to attach
    """
    if sentry_sdk.Hub.current.client:
        with sentry_sdk.push_scope() as scope:
            for key, value in kwargs.items():
                scope.set_context(key, value)
            sentry_sdk.capture_message(message, level=level)


def set_user(user_id: str = None, email: str = None, username: str = None, **kwargs):
    """
    Set user context for Sentry events.

    Args:
        user_id: User ID
        email: User email
        username: Username
        **kwargs: Additional user attributes
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.set_user({
            "id": user_id,
            "email": email,
            "username": username,
            **kwargs
        })


def set_tag(key: str, value: str):
    """
    Set a tag for Sentry events.

    Args:
        key: Tag key
        value: Tag value
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.set_tag(key, value)


def set_context(key: str, value: dict):
    """
    Set context for Sentry events.

    Args:
        key: Context key
        value: Context value (dict)
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.set_context(key, value)
