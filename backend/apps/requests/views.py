from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import Role
from apps.common.permissions import IsCustomer
from apps.requests.models import ServiceRequest
from apps.requests.serializers import (
    ServiceRequestCreateSerializer,
    ServiceRequestSerializer,
)


class ServiceRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ServiceRequest.objects.select_related(
            "customer",
            "vehicle",
            "service",
            "problem",
            "assigned_mechanic",
        ).prefetch_related("status_history")
        if user.is_staff:
            return qs
        if user.role == Role.CUSTOMER and hasattr(user, "customer_profile"):
            return qs.filter(customer=user.customer_profile)
        if user.role == Role.MECHANIC and hasattr(user, "mechanic_profile"):
            return qs.filter(assigned_mechanic=user.mechanic_profile)
        return qs.none()

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsCustomer()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return ServiceRequestCreateSerializer
        return ServiceRequestSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
