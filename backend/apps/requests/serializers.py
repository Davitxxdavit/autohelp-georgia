from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import Role
from apps.requests.models import (
    RequestStatus,
    ServiceRequest,
    ServiceRequestStatusHistory,
)
from apps.requests.pricing import estimate_for_request
from apps.requests.quotes import MAX_PRICE, MIN_PRICE, price_init_kwargs
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import Vehicle
from apps.vehicles.serializers import VehicleSerializer


class AssignedMechanicPublicSerializer(serializers.Serializer):
    """Mechanic identity for the owning customer. Phone only when assigned."""

    id = serializers.UUIDField()
    first_name = serializers.CharField()
    verified = serializers.BooleanField()
    rating_average = serializers.DecimalField(max_digits=3, decimal_places=2)
    phone = serializers.CharField(
        required=False,
        help_text="Assigned mechanic phone. Included only for the owning customer.",
    )


class StatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequestStatusHistory
        fields = ("id", "from_status", "to_status", "changed_by", "note", "created_at")
        read_only_fields = fields


class ServiceRequestSerializer(serializers.ModelSerializer):
    vehicle = VehicleSerializer(read_only=True)
    service_code = serializers.CharField(source="service.code", read_only=True)
    problem_code = serializers.CharField(source="problem.code", read_only=True)
    assigned_mechanic = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField(
        help_text="Customer phone. Included only for the assigned mechanic.",
    )
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
            "customer_phone",
            "customer_latitude",
            "customer_longitude",
            "customer_address",
            "estimated_price_amount",
            "estimated_price_currency",
            "price_is_estimate",
            "final_price_amount",
            "quote_status",
            "price_confirmed_by_customer",
            "price_confirmed_at",
            "price_proposed_at",
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
        extra_kwargs = {
            "estimated_price_amount": {
                "help_text": (
                    "Catalog estimate in GEL. Null for Auto Key (never 0). "
                    "Not the authoritative final price."
                ),
            },
            "final_price_amount": {
                "help_text": (
                    "Agreed service price. Null until proposed. "
                    "Authoritative for display, completion, and earnings once approved."
                ),
            },
            "price_is_estimate": {
                "help_text": "False once the customer has an approved final price.",
            },
        }

    def _viewer_is_owner_customer(self, obj) -> bool:
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated or user.role != Role.CUSTOMER:
            return False
        profile = getattr(user, "customer_profile", None)
        return profile is not None and obj.customer_id == profile.id

    def _viewer_is_assigned_mechanic(self, obj) -> bool:
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated or user.role != Role.MECHANIC:
            return False
        profile = getattr(user, "mechanic_profile", None)
        return (
            profile is not None
            and obj.assigned_mechanic_id is not None
            and obj.assigned_mechanic_id == profile.id
        )

    def get_assigned_mechanic(self, obj):
        mechanic = obj.assigned_mechanic
        if mechanic is None:
            return None
        payload = {
            "id": str(mechanic.id),
            "first_name": mechanic.first_name,
            "verified": mechanic.verified,
            "rating_average": mechanic.rating_average,
        }
        if self._viewer_is_owner_customer(obj):
            mechanic_user = getattr(mechanic, "user", None)
            if mechanic_user is not None:
                payload["phone"] = mechanic_user.phone
        return payload

    def get_customer_phone(self, obj):
        if not self._viewer_is_assigned_mechanic(obj):
            return None
        customer_user = getattr(obj.customer, "user", None)
        if customer_user is None:
            return None
        return customer_user.phone


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
        extra_kwargs = {
            "customer_address": {
                "required": False,
                "help_text": "Optional human-readable location label.",
            },
            "customer_latitude": {
                "help_text": "Customer latitude (-90 to 90).",
            },
            "customer_longitude": {
                "help_text": "Customer longitude (-180 to 180).",
            },
        }

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
            requested_at=timezone.now(),
            **price_init_kwargs(estimate_for_request(service, problem)),
            **validated_data,
        )
        ServiceRequestStatusHistory.objects.create(
            request=instance,
            from_status="",
            to_status=RequestStatus.REQUESTED,
            changed_by=request.user,
            note="Request created",
        )
        from apps.requests.matching import issue_development_offers

        issue_development_offers(instance, changed_by=request.user)
        instance.refresh_from_db()
        return instance

    def to_representation(self, instance):
        return ServiceRequestSerializer(instance, context=self.context).data


class ProposePriceSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=MIN_PRICE,
        max_value=MAX_PRICE,
        help_text="Positive GEL amount. Mechanic cannot set commission or net.",
    )


class ApprovePriceSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=MIN_PRICE,
        max_value=MAX_PRICE,
        required=False,
        help_text=(
            "Optional concurrency check. If sent, must match the current proposed amount."
        ),
    )
