from fastapi import HTTPException, status
from typing import Any, Dict, Optional
from enum import Enum


class ErrorCode(str, Enum):
    """Standard error codes for API responses."""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    CONFLICT = "CONFLICT"
    INVALID_STATE = "INVALID_STATE"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"


class AppException(HTTPException):
    """Base exception for application."""

    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.error_code = error_code
        self.message = message
        self.details = details or {}

        detail = {
            "error_code": error_code,
            "message": message,
            **self.details,
        }

        super().__init__(status_code=status_code, detail=detail)


class ValidationException(AppException):
    """Raised when input validation fails."""

    def __init__(self, message: str, field: Optional[str] = None):
        details = {}
        if field:
            details["field"] = field

        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code=ErrorCode.VALIDATION_ERROR,
            message=message,
            details=details,
        )


class NotFoundException(AppException):
    """Raised when a resource is not found."""

    def __init__(self, resource: str, resource_id: Optional[str] = None):
        message = f"{resource} not found"
        if resource_id:
            message += f" (ID: {resource_id})"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.NOT_FOUND,
            message=message,
            details={"resource": resource, "resource_id": resource_id},
        )


class UnauthorizedException(AppException):
    """Raised when user is not authenticated."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.UNAUTHORIZED,
            message=message,
        )


class ForbiddenException(AppException):
    """Raised when user lacks permissions."""

    def __init__(self, message: str = "Access denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.FORBIDDEN,
            message=message,
        )


class ConflictException(AppException):
    """Raised when operation creates a conflict."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code=ErrorCode.CONFLICT,
            message=message,
            details=details,
        )


class InvalidStateException(AppException):
    """Raised when entity is in invalid state for operation."""

    def __init__(self, entity: str, current_state: str, expected_states: list):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=ErrorCode.INVALID_STATE,
            message=f"{entity} is in '{current_state}' state. Expected: {', '.join(expected_states)}",
            details={
                "entity": entity,
                "current_state": current_state,
                "expected_states": expected_states,
            },
        )


class ExternalServiceException(AppException):
    """Raised when external service fails."""

    def __init__(self, service: str, message: str):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
            message=f"{service} error: {message}",
            details={"service": service},
        )


class DatabaseException(AppException):
    """Raised when database operation fails."""

    def __init__(self, message: str = "Database operation failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code=ErrorCode.DATABASE_ERROR,
            message=message,
        )


class DuplicateResourceException(ConflictException):
    """Raised when attempting to create duplicate resource."""

    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            message=f"{resource} with {field}='{value}' already exists",
            details={
                "resource": resource,
                "field": field,
                "value": value,
            },
        )


class InvalidTransitionException(InvalidStateException):
    """Raised when state transition is not allowed."""

    def __init__(self, entity: str, from_state: str, to_state: str, allowed_transitions: list):
        message = f"Cannot transition {entity} from '{from_state}' to '{to_state}'"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=ErrorCode.INVALID_STATE,
            message=message,
            details={
                "entity": entity,
                "from_state": from_state,
                "to_state": to_state,
                "allowed_transitions": allowed_transitions,
            },
        )


class DelegationException(InvalidStateException):
    """Raised when delegation operation is invalid."""

    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=ErrorCode.INVALID_STATE,
            message=message,
        )


class BusinessRuleException(AppException):
    """Raised when business rule is violated."""

    def __init__(self, rule: str, message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=ErrorCode.INVALID_STATE,
            message=message,
            details={"violated_rule": rule},
        )


# Status code to exception mapping
STATUS_CODE_TO_EXCEPTION = {
    status.HTTP_400_BAD_REQUEST: ValidationException,
    status.HTTP_401_UNAUTHORIZED: UnauthorizedException,
    status.HTTP_403_FORBIDDEN: ForbiddenException,
    status.HTTP_404_NOT_FOUND: NotFoundException,
    status.HTTP_409_CONFLICT: ConflictException,
    status.HTTP_422_UNPROCESSABLE_ENTITY: ValidationException,
    status.HTTP_500_INTERNAL_SERVER_ERROR: DatabaseException,
    status.HTTP_502_BAD_GATEWAY: ExternalServiceException,
}
