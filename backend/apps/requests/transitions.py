"""Mechanic operational status transitions. The backend owns the allowed graph."""

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound

from apps.accounts.models import MechanicProfile
from apps.requests.exceptions import Conflict
from apps.requests.models import (
    MechanicRequestOffer,
    OfferStatus,
    RequestStatus,
    ServiceRequest,
)

# Forward-only mechanic job loop. Skipping a stage is a conflict.
MECHANIC_OPERATIONAL_TRANSITIONS = {
    RequestStatus.ACCEPTED: RequestStatus.ON_THE_WAY,
    RequestStatus.ON_THE_WAY: RequestStatus.ARRIVED,
    RequestStatus.ARRIVED: RequestStatus.IN_PROGRESS,
    RequestStatus.IN_PROGRESS: RequestStatus.COMPLETED,
}

TRANSITION_NOTES = {
    RequestStatus.ON_THE_WAY: "Mechanic started driving",
    RequestStatus.ARRIVED: "Mechanic arrived",
    RequestStatus.IN_PROGRESS: "Service started",
    RequestStatus.COMPLETED: "Service completed",
}


def expected_from_status(to_status: str) -> str:
    for source, target in MECHANIC_OPERATIONAL_TRANSITIONS.items():
        if target == to_status:
            return source
    raise ValueError(f"Unsupported mechanic operational status: {to_status}")


def apply_mechanic_operational_transition(
    *,
    request_id,
    mechanic: MechanicProfile,
    changed_by,
    to_status: str,
) -> MechanicRequestOffer:
    """
    Apply one mechanic-owned operational transition.

    Locks the ServiceRequest, rejects skip/duplicate attempts with 409,
    and writes exactly one status-history row on success.
    """
    expected_from = expected_from_status(to_status)
    note = TRANSITION_NOTES[to_status]

    with transaction.atomic():
        try:
            service_request = ServiceRequest.objects.select_for_update().get(
                pk=request_id
            )
        except ServiceRequest.DoesNotExist as exc:
            raise NotFound() from exc

        if service_request.assigned_mechanic_id != mechanic.id:
            raise NotFound()

        if service_request.status != expected_from:
            raise Conflict(
                f"Cannot transition from {service_request.status} to {to_status}."
            )

        service_request.transition_status(
            to_status,
            changed_by=changed_by,
            note=note,
        )
        service_request.refresh_from_db()

        if to_status == RequestStatus.COMPLETED:
            from apps.requests.earnings import create_earning_for_completed_request

            create_earning_for_completed_request(service_request)

        try:
            return MechanicRequestOffer.objects.select_related(
                "request",
                "request__customer",
                "request__vehicle",
                "request__service",
                "request__problem",
            ).get(
                request_id=service_request.id,
                mechanic=mechanic,
                status=OfferStatus.ACCEPTED,
            )
        except MechanicRequestOffer.DoesNotExist as exc:
            raise NotFound() from exc


def set_mechanic_online(mechanic: MechanicProfile, *, online: bool) -> MechanicProfile:
    """
    Persist MechanicProfile.online.

    Online/offline controls NEW offer eligibility only.

    Going offline:
    - sets online=False so matching will not create new offers
    - expires this mechanic's PENDING offers so they are not actionable
      and cannot sit as an invisible unique-constraint leftover
    - does not cancel, unassign, or change an active accepted job

    Going online:
    - sets online=True
    - revives this mechanic's EXPIRED offers on still-open SEARCHING
      requests (unassigned) so the same request can be offered again
    """
    with transaction.atomic():
        profile = MechanicProfile.objects.select_for_update().get(pk=mechanic.pk)
        was_online = profile.online
        if profile.online != online:
            profile.online = online
            profile.save(update_fields=["online", "updated_at"])

        if not online:
            now = timezone.now()
            MechanicRequestOffer.objects.filter(
                mechanic=profile,
                status=OfferStatus.PENDING,
            ).update(status=OfferStatus.EXPIRED, responded_at=now)
        elif online and not was_online:
            MechanicRequestOffer.objects.filter(
                mechanic=profile,
                status=OfferStatus.EXPIRED,
                request__status=RequestStatus.SEARCHING,
                request__assigned_mechanic__isnull=True,
            ).update(status=OfferStatus.PENDING, responded_at=None)

        return profile
