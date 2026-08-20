"""Deterministic development matching. Not a distance/realtime engine."""

from apps.accounts.models import ApprovalStatus, MechanicProfile, Role
from apps.requests.models import (
    MechanicRequestOffer,
    OfferStatus,
    RequestStatus,
    ServiceRequest,
)

ACTIVE_JOB_STATUSES = (
    RequestStatus.ASSIGNED,
    RequestStatus.ACCEPTED,
    RequestStatus.ON_THE_WAY,
    RequestStatus.ARRIVED,
    RequestStatus.IN_PROGRESS,
)


def eligible_mechanics_for_service(service):
    busy_ids = ServiceRequest.objects.filter(
        assigned_mechanic_id__isnull=False,
        status__in=ACTIVE_JOB_STATUSES,
    ).values_list("assigned_mechanic_id", flat=True)
    return (
        MechanicProfile.objects.filter(
            user__role=Role.MECHANIC,
            user__is_active=True,
            verified=True,
            online=True,
            approval_status=ApprovalStatus.APPROVED,
            services=service,
        )
        .exclude(id__in=busy_ids)
        .distinct()
        .order_by("created_at")
    )


def issue_development_offers(service_request: ServiceRequest, *, changed_by=None):
    """
    Offer a REQUESTED job to every currently eligible mechanic.

    No ranking, distance, or background dispatcher. Future matching can
    replace this function without changing the offer/accept contract.
    """
    if service_request.status != RequestStatus.REQUESTED:
        return []
    if service_request.assigned_mechanic_id:
        return []

    mechanics = list(eligible_mechanics_for_service(service_request.service))
    if not mechanics:
        return []

    service_request.transition_status(
        RequestStatus.SEARCHING,
        changed_by=changed_by,
        note="Matching started",
    )

    offers = []
    for mechanic in mechanics:
        offer, created = MechanicRequestOffer.objects.get_or_create(
            request=service_request,
            mechanic=mechanic,
            defaults={"status": OfferStatus.PENDING},
        )
        if created:
            offers.append(offer)
    return offers


def issue_offers_for_unmatched_requests(*, changed_by=None) -> None:
    """
    Development catch-up: REQUESTED jobs created before matching, or
    when no mechanic was eligible at create time, can still be offered
    when an eligible mechanic opens the inbox.
    """
    open_requests = ServiceRequest.objects.filter(
        status=RequestStatus.REQUESTED,
        assigned_mechanic__isnull=True,
    ).select_related("service")
    for service_request in open_requests:
        issue_development_offers(service_request, changed_by=changed_by)
