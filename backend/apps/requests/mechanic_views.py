from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsMechanic
from apps.common.schema import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED
from apps.requests.exceptions import Conflict
from apps.requests.matching import ACTIVE_JOB_STATUSES, issue_offers_for_unmatched_requests
from apps.requests.mechanic_serializers import (
    MechanicOfferSerializer,
    serialize_mechanic_offer,
)
from apps.requests.models import (
    MechanicRequestOffer,
    OfferStatus,
    RequestStatus,
    ServiceRequest,
)


def _mechanic_or_none(user):
    if not hasattr(user, "mechanic_profile"):
        return None
    return user.mechanic_profile


def _offer_queryset(mechanic):
    return MechanicRequestOffer.objects.filter(mechanic=mechanic).select_related(
        "request",
        "request__customer",
        "request__vehicle",
        "request__service",
        "request__problem",
        "mechanic",
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
    permission_classes = [IsAuthenticated, IsMechanic]
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
            "409 if the request is already claimed."
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
        return Response(serialize_mechanic_offer(offer), status=status.HTTP_200_OK)

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
    permission_classes = [IsAuthenticated, IsMechanic]

    @extend_schema(
        tags=["Mechanic"],
        summary="Get the mechanic's active accepted job",
        description=(
            "Returns the accepted offer whose ServiceRequest is still operational "
            "(ACCEPTED through IN_PROGRESS). 204 if none."
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
        return Response(serialize_mechanic_offer(offer))
