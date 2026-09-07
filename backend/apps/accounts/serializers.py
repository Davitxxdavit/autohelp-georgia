from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from rest_framework import serializers

from apps.accounts.models import (
    ApprovalStatus,
    CustomerProfile,
    MechanicProfile,
    Role,
    User,
)
from apps.common.validators import PHONE_RE, phone_validator
from apps.services.models import Service


class CustomerRegisterSerializer(serializers.Serializer):
    phone = serializers.CharField(
        max_length=16,
        validators=[phone_validator],
        help_text="E.164 phone number, e.g. +995555123456.",
    )
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    first_name = serializers.CharField(max_length=80)

    def validate_phone(self, value: str) -> str:
        phone = value.strip()
        if not PHONE_RE.fullmatch(phone):
            raise serializers.ValidationError(
                "Enter a phone number in E.164 format, e.g. +995555123456."
            )
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                "A user with this phone already exists."
            )
        return phone

    def validate_first_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("This field may not be blank.")
        return name

    def validate_password(self, value: str) -> str:
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value

    def validate(self, attrs):
        user = User(phone=attrs["phone"], role=Role.CUSTOMER)
        try:
            validate_password(attrs["password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def create(self, validated_data) -> User:
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    phone=validated_data["phone"],
                    password=validated_data["password"],
                    role=Role.CUSTOMER,
                )
                CustomerProfile.objects.create(
                    user=user,
                    first_name=validated_data["first_name"],
                )
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {"phone": ["A user with this phone already exists."]}
            ) from exc
        return user


class MechanicRegisterSerializer(serializers.Serializer):
    phone = serializers.CharField(
        max_length=16,
        validators=[phone_validator],
        help_text="E.164 phone number, e.g. +995555123456.",
    )
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    first_name = serializers.CharField(max_length=80)
    services = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="Active catalog service IDs the applicant can perform.",
    )

    def validate_phone(self, value: str) -> str:
        phone = value.strip()
        if not PHONE_RE.fullmatch(phone):
            raise serializers.ValidationError(
                "Enter a phone number in E.164 format, e.g. +995555123456."
            )
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                "A user with this phone already exists."
            )
        return phone

    def validate_first_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("This field may not be blank.")
        return name

    def validate_password(self, value: str) -> str:
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value

    def validate_services(self, value):
        unique_ids = list(dict.fromkeys(value))
        if not unique_ids:
            raise serializers.ValidationError("Select at least one service.")
        found = list(Service.objects.filter(id__in=unique_ids))
        found_by_id = {item.id: item for item in found}
        missing = [item_id for item_id in unique_ids if item_id not in found_by_id]
        if missing:
            raise serializers.ValidationError("One or more services are invalid.")
        inactive = [item for item in found if not item.active]
        if inactive:
            raise serializers.ValidationError("One or more services are inactive.")
        return found

    def validate(self, attrs):
        user = User(phone=attrs["phone"], role=Role.MECHANIC)
        try:
            validate_password(attrs["password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def create(self, validated_data) -> User:
        services = validated_data.pop("services")
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    phone=validated_data["phone"],
                    password=validated_data["password"],
                    role=Role.MECHANIC,
                )
                profile = MechanicProfile.objects.create(
                    user=user,
                    first_name=validated_data["first_name"],
                    verified=False,
                    online=False,
                    approval_status=ApprovalStatus.PENDING,
                )
                profile.services.set(services)
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {"phone": ["A user with this phone already exists."]}
            ) from exc
        return user
