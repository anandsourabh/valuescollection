from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, field_validator, ValidationError
from fastapi import HTTPException, status


class DateValidator:
    @staticmethod
    def validate_future_date(d: date) -> date:
        """Ensure date is in the future."""
        if d <= date.today():
            raise ValueError("Date must be in the future")
        return d

    @staticmethod
    def validate_sla_days(days: int) -> int:
        """SLA days must be between 1 and 365."""
        if days < 1 or days > 365:
            raise ValueError("SLA days must be between 1 and 365")
        return days

    @staticmethod
    def validate_date_range(start_date: date, end_date: date) -> tuple:
        """Ensure end_date is after start_date."""
        if end_date <= start_date:
            raise ValueError("End date must be after start date")
        return start_date, end_date


class EmailValidator:
    @staticmethod
    def validate_email(email: str) -> str:
        """Basic email validation."""
        if not email or '@' not in email:
            raise ValueError("Invalid email format")
        if len(email) > 255:
            raise ValueError("Email too long (max 255 characters)")
        return email.lower()


class FinancialValidator:
    @staticmethod
    def validate_tiv(tiv: float) -> float:
        """TIV must be positive."""
        if tiv <= 0:
            raise ValueError("TIV must be greater than 0")
        return tiv

    @staticmethod
    def validate_cope(cope: float) -> float:
        """COPE must be non-negative and not exceed 100."""
        if cope < 0 or cope > 100:
            raise ValueError("COPE value must be between 0 and 100")
        return cope

    @staticmethod
    def validate_tiv_delta(prior_tiv: float, current_tiv: float) -> float:
        """Calculate TIV delta percentage."""
        if prior_tiv == 0:
            return 0
        delta_pct = ((current_tiv - prior_tiv) / prior_tiv) * 100
        if delta_pct > 500 or delta_pct < -100:
            raise ValueError("TIV delta percentage is unrealistic (>500% or <-100%)")
        return round(delta_pct, 2)

    @staticmethod
    def validate_tiv_change_materiality(prior_tiv: float, current_tiv: float) -> bool:
        """Determine if TIV change is material (>10%)."""
        if prior_tiv == 0:
            return current_tiv > 0
        delta_pct = abs(((current_tiv - prior_tiv) / prior_tiv) * 100)
        return delta_pct > 10


class TextValidator:
    @staticmethod
    def validate_name(name: str, min_length: int = 1, max_length: int = 255) -> str:
        """Validate text field length."""
        if not name or not name.strip():
            raise ValueError("Name cannot be empty")
        name = name.strip()
        if len(name) < min_length:
            raise ValueError(f"Name must be at least {min_length} characters")
        if len(name) > max_length:
            raise ValueError(f"Name cannot exceed {max_length} characters")
        return name

    @staticmethod
    def validate_description(desc: str | None, max_length: int = 2000) -> str | None:
        """Validate description field."""
        if desc is None:
            return None
        if len(desc) > max_length:
            raise ValueError(f"Description cannot exceed {max_length} characters")
        return desc.strip() or None

    @staticmethod
    def validate_reason_code(code: str) -> str:
        """Validate reason code format."""
        valid_codes = [
            'data_confirmed',
            'data_corrected',
            'escalation_required',
            'policy_changed',
            'missing_information',
            'other'
        ]
        if code not in valid_codes:
            raise ValueError(f"Invalid reason code. Must be one of: {', '.join(valid_codes)}")
        return code


class CampaignValidator:
    @staticmethod
    def validate_link_model(model: str) -> str:
        """Validate link model type."""
        valid_models = ['bundled', 'per_location']
        if model not in valid_models:
            raise ValueError(f"Invalid link model. Must be one of: {', '.join(valid_models)}")
        return model

    @staticmethod
    def validate_breach_policy(policy: str) -> str:
        """Validate breach policy type."""
        valid_policies = ['escalate_and_continue', 'escalate_only', 'none']
        if policy not in valid_policies:
            raise ValueError(f"Invalid breach policy. Must be one of: {', '.join(valid_policies)}")
        return policy


class SubmissionValidator:
    @staticmethod
    def validate_submission_data(data: dict) -> dict:
        """Validate submission form data."""
        errors = []

        if 'cope_value' in data:
            try:
                FinancialValidator.validate_cope(float(data['cope_value']))
            except ValueError as e:
                errors.append(str(e))

        if 'tiv' in data:
            try:
                FinancialValidator.validate_tiv(float(data['tiv']))
            except ValueError as e:
                errors.append(str(e))

        if errors:
            raise ValueError(f"Validation errors: {'; '.join(errors)}")

        return data


class ValidationError(HTTPException):
    """Custom validation error for HTTP responses."""

    def __init__(self, message: str, field: str | None = None):
        detail = {"message": message}
        if field:
            detail["field"] = field

        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )


def validate_pagination(skip: int, limit: int) -> tuple[int, int]:
    """Validate pagination parameters."""
    if skip < 0:
        raise ValidationError("skip must be >= 0", "skip")
    if limit < 1 or limit > 1000:
        raise ValidationError("limit must be between 1 and 1000", "limit")
    return skip, limit


def handle_validation_error(exc: ValidationError) -> dict:
    """Convert pydantic validation errors to API response."""
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"][1:])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
        })
    return {"errors": errors}
