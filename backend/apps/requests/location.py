"""Live mechanic location. Latest point only — not a history log."""

from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound

from apps.accounts.models import MechanicProfile
from apps.requests.exceptions import Conflict
from apps.requests.models import RequestStatus, ServiceRequest

LOCATION_REPORT_STATUSES = (
    RequestStatus.ACCEPTED,
    RequestStatus.ON_THE_WAY,
)

LIVE_LOCATION_STATUSES = (
    RequestStatus.ACCEPTED,
    RequestStatus.ON_THE_WAY,
    RequestStatus.ARRIVED,
)

ROUTE_STATUSES = (
    RequestStatus.ACCEPTED,
    RequestStatus.ON_THE_WAY,
)

NO_ACTIVE_TRIP = "Live location can only be shared during an active trip."
MECHANIC_LOCATION_UNAVAILABLE = "Mechanic location is not available yet."
ROUTE_NO_LONGER_AVAILABLE = "Route is no longer available."


def public_mechanic_location(mechanic: MechanicProfile) -> dict:
    lat = mechanic.current_latitude
    lng = mechanic.current_longitude
    return {
        "current_latitude": None if lat is None else str(lat),
        "current_longitude": None if lng is None else str(lng),
        "location_updated_at": mechanic.location_updated_at,
    }


def update_mechanic_location(
    *,
    mechanic: MechanicProfile,
    latitude: Decimal,
    longitude: Decimal,
) -> MechanicProfile:
    with transaction.atomic():
        profile = MechanicProfile.objects.select_for_update().get(pk=mechanic.pk)
        has_trip = ServiceRequest.objects.filter(
            assigned_mechanic_id=profile.id,
            status__in=LOCATION_REPORT_STATUSES,
        ).exists()
        if not has_trip:
            raise Conflict(NO_ACTIVE_TRIP)
        now = timezone.now()
        profile.current_latitude = latitude
        profile.current_longitude = longitude
        profile.location_updated_at = now
        profile.save(
            update_fields=[
                "current_latitude",
                "current_longitude",
                "location_updated_at",
                "updated_at",
            ]
        )
        return profile


def viewer_may_see_mechanic_location(*, service_request: ServiceRequest, is_owner: bool) -> bool:
    return (
        is_owner
        and service_request.assigned_mechanic_id is not None
        and service_request.status in LIVE_LOCATION_STATUSES
    )


def require_route_access(service_request: ServiceRequest) -> None:
    if service_request.status not in ROUTE_STATUSES:
        raise Conflict(ROUTE_NO_LONGER_AVAILABLE)
    mechanic = service_request.assigned_mechanic
    if mechanic is None:
        raise NotFound()
    if mechanic.current_latitude is None or mechanic.current_longitude is None:
        raise Conflict(MECHANIC_LOCATION_UNAVAILABLE)
