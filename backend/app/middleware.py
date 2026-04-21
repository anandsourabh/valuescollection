import json
import logging
from datetime import datetime
from typing import Callable
from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp
from pydantic import ValidationError as PydanticValidationError
from app.exceptions import AppException

logger = logging.getLogger(__name__)


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware to handle exceptions and return consistent error responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> JSONResponse:
        try:
            response = await call_next(request)
            return response
        except AppException as e:
            return JSONResponse(
                status_code=e.status_code,
                content=e.detail,
            )
        except PydanticValidationError as e:
            errors = []
            for error in e.errors():
                field = ".".join(str(x) for x in error["loc"])
                errors.append({
                    "field": field,
                    "message": error["msg"],
                    "type": error["type"],
                })

            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "errors": errors,
                },
            )
        except Exception as e:
            logger.exception(f"Unhandled exception: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                },
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log HTTP requests and responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> JSONResponse:
        # Skip logging for health checks
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        start_time = datetime.utcnow()
        request_body = None

        try:
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
                try:
                    request_body = json.loads(body)
                except json.JSONDecodeError:
                    request_body = body.decode("utf-8")

                async def receive():
                    return {"type": "http.request", "body": body}

                request._receive = receive
        except Exception as e:
            logger.warning(f"Failed to log request body: {str(e)}")

        response = await call_next(request)
        duration = (datetime.utcnow() - start_time).total_seconds()

        log_data = {
            "method": request.method,
            "path": request.url.path,
            "query": dict(request.query_params),
            "status_code": response.status_code,
            "duration_seconds": round(duration, 3),
            "client_ip": request.client.host if request.client else "unknown",
        }

        if request_body:
            log_data["request_body"] = request_body

        log_level = "info" if response.status_code < 400 else "warning"
        getattr(logger, log_level)(json.dumps(log_data))

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> JSONResponse:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for basic rate limiting using in-memory store."""

    def __init__(self, app: ASGIApp, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.clients = {}

    async def dispatch(self, request: Request, call_next: Callable) -> JSONResponse:
        client_ip = request.client.host if request.client else "unknown"

        # Skip rate limiting for health checks
        if request.url.path == "/health":
            return await call_next(request)

        current_time = datetime.utcnow()

        if client_ip not in self.clients:
            self.clients[client_ip] = []

        # Clean up old requests (older than 1 minute)
        self.clients[client_ip] = [
            req_time for req_time in self.clients[client_ip]
            if (current_time - req_time).total_seconds() < 60
        ]

        if len(self.clients[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests",
                },
            )

        self.clients[client_ip].append(current_time)
        return await call_next(request)
