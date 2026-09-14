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
from apps.common.throttles import PriceActionThrottle, RequestCreateThrottle
from apps.requests.exceptions import Conflict
from apps.requests.location import require_route_access
from apps.requests.models import (
    ACTIVE_CUSTOMER_REQUEST_STATUSES,
    CancelledBy,
    MechanicRequestOffer,
    OfferStatus,
    RequestStatus,
    ServiceRequest,
)
from apps.requests.routing import compute_road_route
from apps.requests.serializers import (
    ApprovePriceSerializer,
    ServiceRequestCreateSerializer,
    ServiceRequestSerializer,
    TripRouteSerializer,
)
from apps.requests.quotes import approve_request_price, reject_request_price

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
            "A customer may have only one active request. A second create "
            "returns 409.\n\n"
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
            409: CONFLICT,
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
                    "price_is_estimate": False,
                    "final_price_amount": "30.00",
                    "quote_status": "APPROVED",
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
            "rating",
        ).prefetch_related("status_history")
        if user.is_staff:
            return qs
        if user.role == Role.CUSTOMER and hasattr(user, "customer_profile"):
            return qs.filter(customer=user.customer_profile)
        if user.role == Role.MECHANIC and hasattr(user, "mechanic_profile"):
            return qs.filter(assigned_mechanic=user.mechanic_profile)
        return qs.none()

    def get_permissions(self):
        if self.action in ("create", "cancel", "approve_price", "reject_price", "active"):
            return [IsAuthenticated(), IsCustomer()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return ServiceRequestCreateSerializer
        return ServiceRequestSerializer

    def get_throttles(self):
        if self.action == "create":
            return [RequestCreateThrottle()]
        if self.action in ("approve_price", "reject_price"):
            return [PriceActionThrottle()]
        return []

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    @extend_schema(
        tags=["Requests"],
        summary="Get the customer's current active request",
        description=(
            "Returns the authenticated customer's in-progress request, if any. "
            "Completed, cancelled, and declined requests are not active. "
            "204 when none."
        ),
        responses={
            200: ServiceRequestSerializer,
            204: None,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    )
    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        service_request = (
            self.get_queryset()
            .filter(status__in=ACTIVE_CUSTOMER_REQUEST_STATUSES)
            .order_by("-created_at")
            .first()
        )
        if service_request is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = ServiceRequestSerializer(
            service_request, context=self.get_serializer_context()
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

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

    def _customer_quote_response(self, service_request):
        service_request = self.get_queryset().get(pk=service_request.pk)
        serializer = ServiceRequestSerializer(
            service_request, context=self.get_serializer_context()
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Requests"],
        summary="Approve the proposed service price",
        description=(
            "Customer owner only. Approves the currently stored proposed amount. "
            "Optional `amount` must match the stored quote or the request returns 409. "
            "The customer cannot set an arbitrary price."
        ),
        request=ApprovePriceSerializer,
        responses={
            200: ServiceRequestSerializer,
            400: VALIDATION_ERROR,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
            404: NOT_FOUND,
            409: CONFLICT,
        },
    )
    @action(detail=True, methods=["post"], url_path="price/approve")
    def approve_price(self, request, pk=None):
        serializer = ApprovePriceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = request.user.customer_profile
        service_request = approve_request_price(
            request_id=pk,
            customer_id=customer.id,
            expected_amount=serializer.validated_data.get("amount"),
        )
        return self._customer_quote_response(service_request)

    @extend_schema(
        tags=["Requests"],
        summary="Reject the proposed service price",
        description=(
            "Customer owner only. Marks the current quote as rejected. "
            "The assigned mechanic may submit a new amount."
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
    @action(detail=True, methods=["post"], url_path="price/reject")
    def reject_price(self, request, pk=None):
        customer = request.user.customer_profile
        service_request = reject_request_price(
            request_id=pk,
            customer_id=customer.id,
        )
        return self._customer_quote_response(service_request)

    @extend_schema(
        tags=["Requests"],
        summary="Road route from mechanic to customer",
        description=(
            "Owning customer or assigned mechanic. Origin and destination are "
            "taken from stored request and mechanic coordinates. Clients cannot "
            "supply arbitrary points. After arrival, routing is no longer available."
        ),
        request=None,
        responses={
            200: TripRouteSerializer,
            401: UNAUTHORIZED,
            404: NOT_FOUND,
            409: CONFLICT,
        },
    )
    @action(detail=True, methods=["get"], url_path="route")
    def route(self, request, pk=None):
        service_request = self.get_object()
        require_route_access(service_request)
        mechanic = service_request.assigned_mechanic
        origin = {
            "latitude": str(mechanic.current_latitude),
            "longitude": str(mechanic.current_longitude),
        }
        destination = {
            "latitude": str(service_request.customer_latitude),
            "longitude": str(service_request.customer_longitude),
        }
        result = compute_road_route(
            origin_latitude=mechanic.current_latitude,
            origin_longitude=mechanic.current_longitude,
            destination_latitude=service_request.customer_latitude,
            destination_longitude=service_request.customer_longitude,
        )
        if result is None:
            payload = {
                "available": False,
                "origin": origin,
                "destination": destination,
                "distance_meters": None,
                "duration_seconds": None,
                "coordinates": [],
            }
        else:
            payload = {
                "available": True,
                "origin": origin,
                "destination": destination,
                "distance_meters": result.distance_meters,
                "duration_seconds": result.duration_seconds,
                "coordinates": result.coordinates,
            }
        return Response(payload, status=status.HTTP_200_OK)
