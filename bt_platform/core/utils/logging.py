"""
Structured Logging Configuration

Provides JSON-formatted structured logging for better observability.
"""

import logging
import sys
from pythonjsonlogger import jsonlogger


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional context"""

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)

        # Add standard fields
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['timestamp'] = self.formatTime(record, self.datefmt)

        # Add source location
        log_record['file'] = record.pathname
        log_record['line'] = record.lineno
        log_record['function'] = record.funcName

        # Add process info
        log_record['process_id'] = record.process
        log_record['thread_id'] = record.thread


def setup_structured_logging(
    level: str = "INFO",
    json_format: bool = True
) -> logging.Logger:
    """
    Setup structured logging for the application.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Whether to use JSON formatting (True) or plain text (False)

    Returns:
        Configured logger instance
    """
    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    logger.handlers = []

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper()))

    # Set formatter
    if json_format:
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s',
            datefmt='%Y-%m-%dT%H:%M:%S'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


# Logging helper functions for common patterns
def log_request(logger: logging.Logger, method: str, path: str, **kwargs):
    """Log an HTTP request"""
    logger.info(
        "HTTP request",
        extra={
            "event_type": "http_request",
            "method": method,
            "path": path,
            **kwargs
        }
    )


def log_response(logger: logging.Logger, method: str, path: str, status_code: int, duration_ms: float, **kwargs):
    """Log an HTTP response"""
    logger.info(
        "HTTP response",
        extra={
            "event_type": "http_response",
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": duration_ms,
            **kwargs
        }
    )


def log_error(logger: logging.Logger, error: Exception, **kwargs):
    """Log an error with context"""
    logger.error(
        f"Error: {str(error)}",
        extra={
            "event_type": "error",
            "error_type": type(error).__name__,
            "error_message": str(error),
            **kwargs
        },
        exc_info=True
    )


def log_metric(logger: logging.Logger, metric_name: str, value: float, **kwargs):
    """Log a metric"""
    logger.info(
        f"Metric: {metric_name}",
        extra={
            "event_type": "metric",
            "metric_name": metric_name,
            "metric_value": value,
            **kwargs
        }
    )
