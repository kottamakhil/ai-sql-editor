"""Structured JSON logging with Datadog integration.

Emits JSON logs to stdout and optionally ships them to Datadog via the
HTTP Logs API. Set DD_API_KEY to enable Datadog shipping.

The request_id is read from a ContextVar set by the middleware, so all
existing log calls get it for free.
"""

from __future__ import annotations

import json
import logging
import os
from contextvars import ContextVar
from datetime import datetime, timezone
from datadog_api_client import Configuration, ApiClient
from datadog_api_client.v2.api.logs_api import LogsApi
from datadog_api_client.v2.model.http_log import HTTPLog
from datadog_api_client.v2.model.http_log_item import HTTPLogItem


request_id_var: ContextVar[str] = ContextVar("request_id", default="")

DD_API_KEY = os.getenv("DD_API_KEY", "")
DD_SITE = os.getenv("DD_SITE", "datadoghq.com")
DD_SERVICE = os.getenv("DD_SERVICE", "vc-plan-editor-poc")
DD_SOURCE = "python"


class JSONFormatter(logging.Formatter):
    """Format log records as JSON with automatic request_id injection."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get(),
        }
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


class DatadogLogHandler(logging.Handler):
    """Ships each log line to Datadog via the HTTP Logs API. Fails silently."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            entry = {
                "message": record.getMessage(),
                "ddsource": DD_SOURCE,
                "ddtags": f"env:{os.getenv('DD_ENV', 'dev')}",
                "hostname": os.getenv("HOSTNAME", "local"),
                "service": DD_SERVICE,
                "status": record.levelname.lower(),
                "logger": {"name": record.name},
                "request_id": request_id_var.get(),
            }
            if record.exc_info and record.exc_info[1]:
                entry["error"] = {
                    "kind": type(record.exc_info[1]).__name__,
                    "message": str(record.exc_info[1]),
                }

            config = Configuration()
            config.api_key["apiKeyAuth"] = DD_API_KEY
            config.server_variables["site"] = DD_SITE

            body = HTTPLog([HTTPLogItem(message=json.dumps(entry))])
            with ApiClient(config) as client:
                LogsApi(client).submit_log(body=body)
        except Exception:
            pass


def setup_logging(level: int = logging.INFO) -> None:
    """Configure root logger with JSON stdout + optional Datadog shipping."""

    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(level)

    stdout_handler = logging.StreamHandler()
    stdout_handler.setFormatter(JSONFormatter())
    root.addHandler(stdout_handler)

    if DD_API_KEY:
        dd_handler = DatadogLogHandler()
        dd_handler.setLevel(level)
        root.addHandler(dd_handler)
        logging.getLogger(__name__).info("Datadog log shipping enabled (site=%s)", DD_SITE)
