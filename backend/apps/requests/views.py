from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import Role
from apps.common.permissions import IsCustomer
from apps.common.schema import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, VALIDATION_ERROR
from apps.requests.exceptions import Conflict
from apps.requests.models import (
    CancelledBy,
    MechanicRequestOffer,
    OfferStatus,
    RequestStatus,
    ServiceRequest,
)
from apps.requests.serializers import (
    ServiceRequestCreateSerializer,
    ServiceRequestSerializer,
)

CUSTOMER_CANCELABLE_STATUSES = (
    RequestStatus.REQUESTED,
    RequestStatus.SEARCHING,
    RequestStatus.ASSIGNED,
)


@extend_schema_view(
    list=extend_schema(
        tags=["Requests"],
        summary="List service requests",
        description=(
            "Customers see their own requests. Mechanics see assigned requests only. "
            "Incoming offers use /api/v1/mechanic/offers/."
        ),
        responses={200: ServiceRequestSerializer, 401: UNAUTHORIZED},
    ),
    retrieve=extend_schema(
        tags=["Requests"],
        summary="Retrieve a service request",
        responses={
            200: ServiceRequestSerializer,
            401: UNAUTHORIZED,
            404: NOT_FOUND,
        },
    ),
    create=extend_schema(
        tags=["Requests"],
        summary="Create a service request",
        description=(
            "Customer-only. Writable fields: vehicle, service, problem, "
            "customer_latitude, customer_longitude, customer_address.\n\n"
            "Backend sets `status=REQUESTED`. Clients cannot assign a mechanic, "
            "set status, or send estimates/timestamps.\n\n"
            "Catalog estimates (not guaranteed): Battery 30.00 GEL, "
            "Battery replacement 60.00 GEL, Diagnostics 50.00 GEL, "
            "Auto Key `estimated_price_amount` is null."
        ),
        request=ServiceRequestCreateSerializer,
        responses={
            201: ServiceRequestSerializer,
            400: VALIDATION_ERROR,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
        examples=[
            OpenApiExample(
                "Create Battery request",
                value={
                    "vehicle": "00000000-0000-0000-0000-000000000001",
                    "service": "00000000-0000-0000-0000-000000000002",
                    "problem": "00000000-0000-0000-0000-000000000003",
                    "customer_latitude": "41.616800",
                    "customer_longitude": "41.636700",
                    "customer_address": "Batumi, Georgia",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Created request (estimate example)",
                value={
                    "status": "REQUESTED",
                    "estimated_price_amount": "30.00",
                    "estimated_price_currency": "GEL",
                    "price_is_estimate": True,
                },
                response_only=True,
            ),
        ],
    ),
)
class ServiceRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    queryset = ServiceRequest.objects.all()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ServiceRequest.objects.none()
        user = self.request.user
        qs = ServiceRequest.objects.select_related(
            "customer",
            "customer__user",
            "vehicle",
            "service",
            "problem",
            "assigned_mechanic",
            "assigned_mechanic__user",
        ).prefetch_related("status_history")
        if user.is_staff:
            return qs
        if user.role == Role.CUSTOMER and hasattr(user, "customer_profile"):
            return qs.filter(customer=user.customer_profile)
        if user.role == Role.MECHANIC and hasattr(user, "mechanic_profile"):
            return qs.filter(assigned_mechanic=user.mechanic_profile)
        return qs.none()

    def get_permissions(self):
        if self.action in ("create", "cancel"):
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

    @extend_schema(
        tags=["Requests"],
        summary="Cancel a service request",
        description=(
            "Customer owner only. Allowed while the request is REQUESTED, "
            "SEARCHING, or ASSIGNED. Cancellation after the mechanic has "
            "accepted or started driving is rejected with 409.\n\n"
            "Pending mechanic offers are expired so they can no longer be accepted."
        ),
        request=None,
        responses={
            200: ServiceRequestSerializer,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
            404: NOT_FOUND,
            409: CONFLICT,
        },
    )
    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        customer = request.user.customer_profile
        with transaction.atomic():
            try:
                service_request = ServiceRequest.objects.select_for_update().get(
                    pk=pk,
                    customer=customer,
                )
            except ServiceRequest.DoesNotExist as exc:
                raise NotFound() from exc

            if service_request.status not in CUSTOMER_CANCELABLE_STATUSES:
                raise Conflict(
                    f"Cannot cancel a request in {service_request.status} status."
                )

            service_request.cancelled_by = CancelledBy.CUSTOMER
            service_request.transition_status(
                RequestStatus.CANCELLED,
                changed_by=request.user,
                note="Cancelled by customer",
            )
            now = timezone.now()
            MechanicRequestOffer.objects.filter(
                request=service_request,
                status=OfferStatus.PENDING,
            ).update(status=OfferStatus.EXPIRED, responded_at=now)

        service_request = self.get_queryset().get(pk=service_request.pk)
        serializer = ServiceRequestSerializer(
            service_request, context=self.get_serializer_context()
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
