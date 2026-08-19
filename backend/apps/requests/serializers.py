from django.utils import timezone
from rest_framework import serializers

from apps.requests.models import (
    RequestStatus,
    ServiceRequest,
    ServiceRequestStatusHistory,
)
from apps.requests.pricing import estimate_for_request
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import Vehicle
from apps.vehicles.serializers import VehicleSerializer


class StatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequestStatusHistory
        fields = ("id", "from_status", "to_status", "changed_by", "note", "created_at")
        read_only_fields = fields


class ServiceRequestSerializer(serializers.ModelSerializer):
    vehicle = VehicleSerializer(read_only=True)
    service_code = serializers.CharField(source="service.code", read_only=True)
    problem_code = serializers.CharField(source="problem.code", read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = ServiceRequest
        fields = (
            "id",
            "status",
            "vehicle",
            "service",
            "service_code",
            "problem",
            "problem_code",
            "assigned_mechanic",
            "customer_latitude",
            "customer_longitude",
            "customer_address",
            "estimated_price_amount",
            "estimated_price_currency",
            "price_is_estimate",
            "requested_at",
            "accepted_at",
            "arrived_at",
            "started_at",
            "completed_at",
            "cancelled_at",
            "cancelled_by",
            "cancellation_reason",
            "status_history",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ServiceRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = (
            "vehicle",
            "service",
            "problem",
            "customer_latitude",
            "customer_longitude",
            "customer_address",
        )

    def validate(self, attrs):
        request = self.context["request"]
        customer = request.user.customer_profile
        vehicle: Vehicle = attrs["vehicle"]
        service: Service = attrs["service"]
        problem: ServiceProblem = attrs["problem"]

        if vehicle.customer_id != customer.id:
            raise serializers.ValidationError(
                {"vehicle": "Vehicle does not belong to the authenticated customer."}
            )
        if not service.active:
            raise serializers.ValidationError({"service": "Service is not active."})
        if problem.service_id != service.id:
            raise serializers.ValidationError(
                {"problem": "Problem does not belong to the selected service."}
            )
        if not problem.active:
            raise serializers.ValidationError({"problem": "Problem is not active."})
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        customer = request.user.customer_profile
        service = validated_data["service"]
        problem = validated_data["problem"]
        instance = ServiceRequest.objects.create(
            customer=customer,
            status=RequestStatus.REQUESTED,
            assigned_mechanic=None,
            estimated_price_amount=estimate_for_request(service, problem),
            estimated_price_currency="GEL",
            price_is_estimate=True,
            requested_at=timezone.now(),
            **validated_data,
        )
        ServiceRequestStatusHistory.objects.create(
            request=instance,
            from_status="",
            to_status=RequestStatus.REQUESTED,
            changed_by=request.user,
            note="Request created",
        )
        return instance
