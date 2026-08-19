import re

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

PHONE_RE = re.compile(r"^\+[1-9]\d{7,14}$")
VIN_RE = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")

phone_validator = RegexValidator(
    regex=PHONE_RE,
    message="Enter a phone number in E.164 format, e.g. +995555123456.",
)


def normalize_vin(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().upper()
    return cleaned or None


def validate_vin(value: str | None) -> None:
    if not value:
        return
    if not VIN_RE.fullmatch(value):
        raise ValidationError(
            "Enter a valid 17-character VIN (letters and numbers, excluding I, O, Q)."
        )


def validate_latitude(value) -> None:
    if value is None:
        return
    if value < -90 or value > 90:
        raise ValidationError("Latitude must be between -90 and 90.")


def validate_longitude(value) -> None:
    if value is None:
        return
    if value < -180 or value > 180:
        raise ValidationError("Longitude must be between -180 and 180.")
