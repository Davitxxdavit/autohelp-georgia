from rest_framework import serializers

from apps.common.validators import normalize_vin, validate_vin
from apps.vehicles.models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
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
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_vin(self, value):
        normalized = normalize_vin(value)
        validate_vin(normalized)
        return normalized
