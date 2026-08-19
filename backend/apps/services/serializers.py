from rest_framework import serializers

from apps.services.models import Service, ServiceProblem


class ServiceProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProblem
        fields = ("id", "code", "label", "active", "sort_order")


class ServiceSerializer(serializers.ModelSerializer):
    problems = ServiceProblemSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = (
            "id",
            "code",
            "name",
            "description",
            "active",
            "problems",
            "created_at",
            "updated_at",
        )
