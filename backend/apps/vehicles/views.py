from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import Role
from apps.common.permissions import IsCustomer
from apps.common.schema import FORBIDDEN, NOT_FOUND, UNAUTHORIZED, VALIDATION_ERROR
from apps.vehicles.models import Vehicle
from apps.vehicles.primary import promote_primary_after_delete
from apps.vehicles.serializers import VehicleSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Vehicles"],
        summary="List own vehicles",
        responses={200: VehicleSerializer, 401: UNAUTHORIZED, 403: FORBIDDEN},
    ),
    retrieve=extend_schema(
        tags=["Vehicles"],
        summary="Retrieve a vehicle",
        responses={200: VehicleSerializer, 401: UNAUTHORIZED, 404: NOT_FOUND},
    ),
    create=extend_schema(
        tags=["Vehicles"],
        summary="Create a vehicle",
        description=(
            "VIN is optional. When provided it must be 17 characters, "
            "letters/numbers excluding I, O, Q. Stored uppercase. Unique when present.\n\n"
            "`nickname` is optional. The first vehicle becomes primary. "
            "Setting `is_primary=true` unsets the previous primary."
        ),
        responses={
            201: VehicleSerializer,
            400: VALIDATION_ERROR,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    ),
    partial_update=extend_schema(
        tags=["Vehicles"],
        summary="Update a vehicle",
        responses={
            200: VehicleSerializer,
            400: VALIDATION_ERROR,
            401: UNAUTHORIZED,
            404: NOT_FOUND,
        },
    ),
    update=extend_schema(
        tags=["Vehicles"],
        summary="Replace a vehicle",
        responses={
            200: VehicleSerializer,
            400: VALIDATION_ERROR,
            401: UNAUTHORIZED,
            404: NOT_FOUND,
        },
    ),
    destroy=extend_schema(
        tags=["Vehicles"],
        summary="Delete a vehicle",
        responses={204: None, 401: UNAUTHORIZED, 404: NOT_FOUND},
    ),
)
class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, IsCustomer]
    queryset = Vehicle.objects.all()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Vehicle.objects.none()
        user = self.request.user
        if user.is_staff:
            return Vehicle.objects.select_related("customer").all()
        if user.role != Role.CUSTOMER or not hasattr(user, "customer_profile"):
            return Vehicle.objects.none()
        return Vehicle.objects.filter(customer=user.customer_profile)

    def get_permissions(self):
        if self.request.user.is_staff:
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        customer = instance.customer
        was_primary = instance.is_primary
        instance.delete()
        promote_primary_after_delete(
            customer=customer, deleted_was_primary=was_primary
        )
