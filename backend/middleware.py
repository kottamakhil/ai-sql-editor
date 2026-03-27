"""Request ID middleware.

Generates a unique request_id for every incoming request, stores it in a
ContextVar (accessible from any code in the request), sets it as a response
header, and logs request start/finish with duration.
"""

from __future__ import annotations

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from logging_config import request_id_var

log = logging.getLogger(__name__)


def _generate_request_id() -> str:
    return uuid.uuid4().hex[:12]


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        rid = request.headers.get("X-Request-ID") or _generate_request_id()
        request_id_var.set(rid)

        start = time.monotonic()
        log.info("Request started: %s %s", request.method, request.url.path)

        response = await call_next(request)

        duration_ms = round((time.monotonic() - start) * 1000)
        log.info(
            "Request finished: %s %s status=%d duration_ms=%d",
            request.method, request.url.path, response.status_code, duration_ms,
        )

        response.headers["X-Request-ID"] = rid
        return response
