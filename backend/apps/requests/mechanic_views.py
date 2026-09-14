from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import MechanicProfile
from apps.common.permissions import IsApprovedMechanic, IsMechanic
from apps.common.schema import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED
from apps.common.throttles import PriceActionThrottle
from apps.requests.earnings import (
    DEFAULT_CURRENCY,
    quantize_money,
    serialize_earning_row,
    serialize_earning_snapshot,
)
from apps.requests.exceptions import Conflict
from apps.requests.matching import ACTIVE_JOB_STATUSES, issue_offers_for_unmatched_requests
from apps.requests.mechanic_serializers import (
    MechanicEarningsResponseSerializer,
    MechanicJobHistoryItemSerializer,
    MechanicMeSerializer,
    MechanicMeUpdateSerializer,
    MechanicOfferSerializer,
    serialize_mechanic_me,
    serialize_mechanic_offer,
)
from apps.requests.location import update_mechanic_location
from apps.requests.quotes import propose_job_price
from apps.requests.serializers import (
    MechanicLocationUpdateSerializer,
    ProposePriceSerializer,
)
from apps.requests.models import (
    MechanicEarning,
    MechanicRequestOffer,
    OfferStatus,
    RequestStatus,
    ServiceRequest,
)
from apps.requests.transitions import (
    apply_mechanic_operational_transition,
    set_mechanic_online,
)


def _mechanic_or_none(user):
    if not hasattr(user, "mechanic_profile"):
        return None
    return user.mechanic_profile


def _mechanic_with_relations(mechanic):
    return (
        MechanicProfile.objects.select_related("user")
        .prefetch_related("services")
        .get(pk=mechanic.pk)
    )


def _offer_queryset(mechanic):
    return MechanicRequestOffer.objects.filter(mechanic=mechanic).select_related(
        "request",
        "request__customer",
        "request__customer__user",
        "request__vehicle",
        "request__service",
        "request__problem",
        "mechanic",
        "mechanic__user",
    )


@extend_schema_view(
    list=extend_schema(
        tags=["Mechanic"],
        summary="List own pending offers",
        description=(
            "Mechanic inbox. Returns PENDING offers for the authenticated mechanic. "
            "Customer catalog estimate is not mechanic earnings."
        ),
        responses={
            200: MechanicOfferSerializer,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    ),
)
class MechanicOfferViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsMechanic, IsApprovedMechanic]
    serializer_class = MechanicOfferSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return MechanicRequestOffer.objects.none()
        mechanic = _mechanic_or_none(self.request.user)
        if mechanic is None:
            return MechanicRequestOffer.objects.none()
        return _offer_queryset(mechanic).filter(
            status=OfferStatus.PENDING,
            request__status=RequestStatus.SEARCHING,
        )

    def list(self, request, *args, **kwargs):
        issue_offers_for_unmatched_requests(changed_by=request.user)
        mechanic = _mechanic_or_none(request.user)
        if mechanic is not None and ServiceRequest.objects.filter(
            assigned_mechanic=mechanic,
            status__in=ACTIVE_JOB_STATUSES,
        ).exists():
            page = self.paginate_queryset(self.get_queryset().none())
            if page is not None:
                return self.get_paginated_response([])
            return Response([])
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        items = page if page is not None else queryset
        data = [serialize_mechanic_offer(item) for item in items]
        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)

    @extend_schema(
        tags=["Mechanic"],
        summary="Accept a pending offer",
        description=(
            "Claims the ServiceRequest for this mechanic. "
            "Transitions SEARCHING → ASSIGNED → ACCEPTED. "
            "Other pending offers on the same request expire. "
            "409 if the request is already claimed or the mechanic already "
            "has an active job."
        ),
        request=None,
        responses={
            200: MechanicOfferSerializer,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
            404: NOT_FOUND,
            409: CONFLICT,
        },
    )
    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        with transaction.atomic():
            mechanic = MechanicProfile.objects.select_for_update().get(pk=mechanic.pk)
            if ServiceRequest.objects.filter(
                assigned_mechanic=mechanic,
                status__in=ACTIVE_JOB_STATUSES,
            ).exists():
                raise Conflict("You already have an active job.")
            try:
                offer = (
                    MechanicRequestOffer.objects.select_for_update()
                    .select_related(
                        "request",
                        "request__customer",
                        "request__vehicle",
                        "request__service",
                        "request__problem",
                    )
                    .get(pk=pk, mechanic=mechanic)
                )
            except MechanicRequestOffer.DoesNotExist as exc:
                raise NotFound() from exc

            if offer.status != OfferStatus.PENDING:
                raise Conflict("This offer is no longer pending.")

            service_request = ServiceRequest.objects.select_for_update().get(
                pk=offer.request_id
            )
            if (
                service_request.assigned_mechanic_id is not None
                or service_request.status
                not in (RequestStatus.SEARCHING, RequestStatus.ASSIGNED)
            ):
                raise Conflict("This request is no longer available.")

            now = timezone.now()
            offer.status = OfferStatus.ACCEPTED
            offer.responded_at = now
            offer.save(update_fields=["status", "responded_at", "updated_at"])

            service_request.assigned_mechanic = mechanic
            try:
                service_request.transition_status(
                    RequestStatus.ASSIGNED,
                    changed_by=request.user,
                    note="Offer claimed",
                )
                service_request.transition_status(
                    RequestStatus.ACCEPTED,
                    changed_by=request.user,
                    note="Mechanic accepted",
                )
            except IntegrityError as exc:
                raise Conflict("You already have an active job.") from exc

            MechanicRequestOffer.objects.filter(
                request=service_request,
                status=OfferStatus.PENDING,
            ).exclude(pk=offer.pk).update(
                status=OfferStatus.EXPIRED,
                responded_at=now,
            )

            offer.request = service_request
        offer.refresh_from_db()
        offer = _offer_queryset(mechanic).get(pk=offer.pk)
        return Response(
            serialize_mechanic_offer(offer, include_customer_phone=True),
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Mechanic"],
        summary="Decline a pending offer",
        description=(
            "Declines only this mechanic's offer. Does not assign a mechanic "
            "and does not cancel the customer ServiceRequest."
        ),
        request=None,
        responses={
            200: MechanicOfferSerializer,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
            404: NOT_FOUND,
            409: CONFLICT,
        },
    )
    @action(detail=True, methods=["post"], url_path="decline")
    def decline(self, request, pk=None):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        with transaction.atomic():
            try:
                offer = MechanicRequestOffer.objects.select_for_update().get(
                    pk=pk, mechanic=mechanic
                )
            except MechanicRequestOffer.DoesNotExist as exc:
                raise NotFound() from exc

            if offer.status != OfferStatus.PENDING:
                raise Conflict("This offer is no longer pending.")

            offer.status = OfferStatus.DECLINED
            offer.responded_at = timezone.now()
            offer.save(update_fields=["status", "responded_at", "updated_at"])

        offer = _offer_queryset(mechanic).get(pk=offer.pk)
        return Response(serialize_mechanic_offer(offer), status=status.HTTP_200_OK)


class MechanicActiveJobView(APIView):
    permission_classes = [IsAuthenticated, IsMechanic, IsApprovedMechanic]

    @extend_schema(
        tags=["Mechanic"],
        summary="Get the mechanic's active accepted job",
        description=(
            "Returns the accepted offer whose ServiceRequest is still operational "
            "(ASSIGNED, ACCEPTED, ON_THE_WAY, ARRIVED, or IN_PROGRESS). "
            "COMPLETED jobs are not active. 204 if none."
        ),
        responses={
            200: MechanicOfferSerializer,
            204: None,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    )
    def get(self, request):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        offer = (
            _offer_queryset(mechanic)
            .filter(
                status=OfferStatus.ACCEPTED,
                request__status__in=ACTIVE_JOB_STATUSES,
            )
            .first()
        )
        if offer is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serialize_mechanic_offer(offer, include_customer_phone=True))


class MechanicMeView(APIView):
    def get_permissions(self):
        if self.request.method.upper() == "PATCH":
            return [IsAuthenticated(), IsMechanic(), IsApprovedMechanic()]
        return [IsAuthenticated(), IsMechanic()]

    @extend_schema(
        tags=["Mechanic"],
        summary="Get the authenticated mechanic profile",
        description=(
            "Source of truth for availability. `online` controls new offer "
            "eligibility only and does not abandon an active accepted job."
        ),
        responses={
            200: MechanicMeSerializer,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    )
    def get(self, request):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        return Response(serialize_mechanic_me(_mechanic_with_relations(mechanic)))

    @extend_schema(
        tags=["Mechanic"],
        summary="Update mechanic availability",
        description=(
            "Writable fields: `online`, `first_name`, `services`.\n\n"
            "Offline: mechanic is excluded from new matching. Existing PENDING "
            "offers for this mechanic are expired so they are no longer "
            "actionable and cannot block later matching. An active accepted "
            "job is left unchanged.\n\n"
            "Online: mechanic becomes eligible for new offers again if other "
            "eligibility checks pass. SEARCHING offers expired by going offline "
            "are revived as PENDING.\n\n"
            "`services` replaces the mechanic's offered catalog services. "
            "Only active catalog IDs are accepted. At least one is required. "
            "Pending offers for services that are no longer selected expire. "
            "Matching uses the updated set immediately. No admin re-approval."
        ),
        request=MechanicMeUpdateSerializer,
        responses={
            200: MechanicMeSerializer,
            400: OpenApiResponse(description="Validation error."),
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    )
    def patch(self, request):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        serializer = MechanicMeUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        profile = mechanic
        if "online" in data:
            profile = set_mechanic_online(profile, online=data["online"])
        update_fields = []
        if "first_name" in data:
            profile.first_name = data["first_name"]
            update_fields.append("first_name")
        if update_fields:
            update_fields.append("updated_at")
            profile.save(update_fields=update_fields)
        if "services" in data:
            with transaction.atomic():
                profile = MechanicProfile.objects.select_for_update().get(pk=profile.pk)
                profile.services.set(data["services"])
                kept_ids = [service.id for service in data["services"]]
                now = timezone.now()
                MechanicRequestOffer.objects.filter(
                    mechanic=profile,
                    status=OfferStatus.PENDING,
                ).exclude(request__service_id__in=kept_ids).update(
                    status=OfferStatus.EXPIRED,
                    responded_at=now,
                )
        return Response(serialize_mechanic_me(_mechanic_with_relations(profile)))


def _job_transition_schema(*, summary: str, description: str):
    return extend_schema_view(
        post=extend_schema(
            tags=["Mechanic"],
            summary=summary,
            description=description,
            request=None,
            responses={
                200: MechanicOfferSerializer,
                401: UNAUTHORIZED,
                403: FORBIDDEN,
                404: NOT_FOUND,
                409: CONFLICT,
            },
        )
    )


class MechanicJobTransitionView(APIView):
    permission_classes = [IsAuthenticated, IsMechanic, IsApprovedMechanic]
    to_status = None

    def post(self, request, request_id):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        offer = apply_mechanic_operational_transition(
            request_id=request_id,
            mechanic=mechanic,
            changed_by=request.user,
            to_status=self.to_status,
        )
        offer = _offer_queryset(mechanic).get(pk=offer.pk)
        payload = serialize_mechanic_offer(offer, include_customer_phone=True)
        if self.to_status == RequestStatus.COMPLETED:
            earning = MechanicEarning.objects.filter(
                service_request_id=offer.request_id
            ).first()
            payload["earning"] = (
                serialize_earning_snapshot(earning) if earning else None
            )
        return Response(payload, status=status.HTTP_200_OK)


@_job_transition_schema(
    summary="Start driving to the customer",
    description=(
        "Assigned mechanic only. ACCEPTED → ON_THE_WAY. "
        "Skipping stages or repeating this action returns 409. "
        "There is no unrestricted status PATCH."
    ),
)
class MechanicStartDrivingView(MechanicJobTransitionView):
    to_status = RequestStatus.ON_THE_WAY


@_job_transition_schema(
    summary="Mark arrival at the customer location",
    description=(
        "Assigned mechanic only. ON_THE_WAY → ARRIVED. "
        "Skipping stages or repeating this action returns 409."
    ),
)
class MechanicArriveView(MechanicJobTransitionView):
    to_status = RequestStatus.ARRIVED


@_job_transition_schema(
    summary="Start roadside service",
    description=(
        "Assigned mechanic only. ARRIVED → IN_PROGRESS. "
        "Requires an approved final price. "
        "Skipping stages or repeating this action returns 409."
    ),
)
class MechanicStartServiceView(MechanicJobTransitionView):
    to_status = RequestStatus.IN_PROGRESS


@_job_transition_schema(
    summary="Complete the roadside job",
    description=(
        "Assigned mechanic only. IN_PROGRESS → COMPLETED. "
        "The job is no longer returned by GET /mechanic/jobs/active/. "
        "If the mechanic is online, they become eligible for new offers. "
        "Creates an idempotent earning snapshot from the approved final price."
    ),
)
class MechanicCompleteJobView(MechanicJobTransitionView):
    to_status = RequestStatus.COMPLETED


class MechanicProposePriceView(APIView):
    permission_classes = [IsAuthenticated, IsMechanic, IsApprovedMechanic]
    throttle_classes = [PriceActionThrottle]

    @extend_schema(
        tags=["Mechanic"],
        summary="Propose a final service price",
        description=(
            "Assigned approved mechanic only. Allowed while ACCEPTED, ON_THE_WAY, "
            "or ARRIVED. A new amount resets customer approval. "
            "Start Service requires an approved final price."
        ),
        request=ProposePriceSerializer,
        responses={
            200: MechanicOfferSerializer,
            400: OpenApiResponse(description="Validation error."),
            401: UNAUTHORIZED,
            403: FORBIDDEN,
            404: NOT_FOUND,
            409: CONFLICT,
        },
    )
    def post(self, request, request_id):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        serializer = ProposePriceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        propose_job_price(
            request_id=request_id,
            mechanic=mechanic,
            amount=serializer.validated_data["amount"],
        )
        offer = (
            _offer_queryset(mechanic)
            .filter(
                request_id=request_id,
                status=OfferStatus.ACCEPTED,
            )
            .first()
        )
        if offer is None:
            raise NotFound()
        return Response(
            serialize_mechanic_offer(offer, include_customer_phone=True),
            status=status.HTTP_200_OK,
        )


class MechanicLocationView(APIView):
    permission_classes = [IsAuthenticated, IsMechanic, IsApprovedMechanic]

    @extend_schema(
        tags=["Mechanic"],
        summary="Report live mechanic GPS position",
        description=(
            "Assigned approved mechanic only. Allowed while the job is ACCEPTED "
            "or ON_THE_WAY. Timestamp is set by the server."
        ),
        request=MechanicLocationUpdateSerializer,
        responses={
            200: OpenApiResponse(description="Updated mechanic coordinates."),
            400: OpenApiResponse(description="Validation error."),
            401: UNAUTHORIZED,
            403: FORBIDDEN,
            409: CONFLICT,
        },
    )
    def post(self, request):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        serializer = MechanicLocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = update_mechanic_location(
            mechanic=mechanic,
            latitude=serializer.validated_data["latitude"],
            longitude=serializer.validated_data["longitude"],
        )
        return Response(
            {
                "latitude": str(profile.current_latitude),
                "longitude": str(profile.current_longitude),
                "location_updated_at": profile.location_updated_at,
            },
            status=status.HTTP_200_OK,
        )


class MechanicEarningsPagination(PageNumberPagination):
    page_size = 20


class MechanicEarningsView(APIView):
    permission_classes = [IsAuthenticated, IsMechanic, IsApprovedMechanic]
    pagination_class = MechanicEarningsPagination

    @extend_schema(
        tags=["Mechanic"],
        summary="List own earnings from completed jobs",
        description=(
            "Returns accounting snapshots for the authenticated approved mechanic only. "
            "Summary totals use net amounts in GEL. Not a payout or wallet balance."
        ),
        responses={
            200: MechanicEarningsResponseSerializer,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    )
    def get(self, request):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        queryset = (
            MechanicEarning.objects.filter(mechanic=mechanic)
            .select_related("service_request", "service_request__service")
            .order_by("-created_at")
        )
        today = timezone.localdate()
        today_total = queryset.filter(created_at__date=today).aggregate(
            total=Sum("net_amount")
        )["total"]
        all_total = queryset.aggregate(total=Sum("net_amount"))["total"]
        summary = {
            "today": str(quantize_money(today_total or 0)),
            "total": str(quantize_money(all_total or 0)),
            "completed_jobs": queryset.count(),
            "currency": DEFAULT_CURRENCY,
        }
        paginator = MechanicEarningsPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        items = page if page is not None else list(queryset)
        results = [serialize_earning_row(item) for item in items]
        if page is None:
            return Response({"summary": summary, "results": results})
        response = paginator.get_paginated_response(results)
        response.data = {"summary": summary, **response.data}
        return response


class MechanicJobHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsMechanic, IsApprovedMechanic]
    pagination_class = MechanicEarningsPagination

    @extend_schema(
        tags=["Mechanic"],
        summary="List completed jobs for the authenticated mechanic",
        description=(
            "Approved mechanic only. Returns this mechanic's COMPLETED jobs "
            "with earning snapshot when present. Does not include other "
            "mechanics' jobs."
        ),
        responses={
            200: MechanicJobHistoryItemSerializer,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    )
    def get(self, request):
        mechanic = _mechanic_or_none(request.user)
        if mechanic is None:
            raise NotFound()
        queryset = (
            ServiceRequest.objects.filter(
                assigned_mechanic=mechanic,
                status=RequestStatus.COMPLETED,
            )
            .select_related("service", "customer", "earning")
            .order_by("-completed_at", "-created_at")
        )
        paginator = MechanicEarningsPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        items = page if page is not None else list(queryset)
        results = [_serialize_job_history_item(item) for item in items]
        if page is None:
            return Response(results)
        return paginator.get_paginated_response(results)


def _serialize_job_history_item(service_request: ServiceRequest) -> dict:
    try:
        earning = service_request.earning
    except ObjectDoesNotExist:
        earning = None
    customer = service_request.customer
    payload = {
        "id": str(service_request.id),
        "request_id": str(service_request.id),
        "service_code": service_request.service.code,
        "service_name": service_request.service.name,
        "customer_display_name": customer.first_name if customer else "",
        "status": service_request.status,
        "completed_at": service_request.completed_at,
        "customer_address": service_request.customer_address,
        "final_price_amount": (
            None
            if service_request.final_price_amount is None
            else str(service_request.final_price_amount)
        ),
        "estimated_price_currency": service_request.estimated_price_currency,
        "gross_amount": None,
        "commission_amount": None,
        "net_amount": None,
        "currency": None,
        "created_at": service_request.created_at,
    }
    if earning is not None:
        payload.update(
            {
                "gross_amount": str(earning.gross_amount),
                "commission_amount": str(earning.commission_amount),
                "net_amount": str(earning.net_amount),
                "currency": earning.currency,
            }
        )
    return payload
