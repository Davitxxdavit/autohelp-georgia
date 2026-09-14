from django.db import transaction
from rest_framework import serializers

from apps.common.validators import normalize_vin, validate_vin
from apps.vehicles.models import Vehicle
from apps.vehicles.primary import apply_primary_flag


class VehicleSerializer(serializers.ModelSerializer):
    vin = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=17,
        help_text=(
            "Optional. When provided: 17 characters, uppercase, "
            "letters/numbers excluding I, O, and Q. Unique when present."
        ),
    )

    class Meta:
        model = Vehicle
        fields = (
            "id",
            "make",
            "model",
            "year",
            "engine",
            "fuel",
            "license_plate",
            "vin",
            "nickname",
            "is_primary",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
        extra_kwargs = {
            "nickname": {
                "required": False,
                "allow_blank": True,
                "help_text": "Optional display name for this vehicle.",
            },
            "is_primary": {
                "required": False,
                "help_text": "At most one primary vehicle per customer.",
            },
        }

    def validate_vin(self, value):
        normalized = normalize_vin(value)
        validate_vin(normalized)
        return normalized

    def create(self, validated_data):
        customer = self.context["request"].user.customer_profile
        want_primary = validated_data.pop("is_primary", None)
        with transaction.atomic():
            vehicle = Vehicle(customer=customer, **validated_data)
            apply_primary_flag(vehicle=vehicle, want_primary=want_primary)
            vehicle.save()
            return vehicle

    def update(self, instance, validated_data):
        want_primary = validated_data.pop("is_primary", None)
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            if want_primary is not None:
                apply_primary_flag(vehicle=instance, want_primary=want_primary)
            instance.save()
            return instance
