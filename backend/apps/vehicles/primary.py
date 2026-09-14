"""Exactly one primary vehicle at most, per customer."""

from django.db import transaction

from apps.vehicles.models import Vehicle


def apply_primary_flag(*, vehicle: Vehicle, want_primary: bool | None) -> None:
    """
    First vehicle is always primary.
    Setting one primary unsets the previous primary in the same transaction.
    """
    customer = vehicle.customer
    with transaction.atomic():
        siblings = Vehicle.objects.select_for_update().filter(customer=customer)
        if vehicle.pk:
            siblings = siblings.exclude(pk=vehicle.pk)
        if not siblings.exists():
            vehicle.is_primary = True
            return
        if want_primary:
            siblings.filter(is_primary=True).update(is_primary=False)
            vehicle.is_primary = True
        elif want_primary is False:
            vehicle.is_primary = False
        elif not vehicle.pk:
            vehicle.is_primary = False


def promote_primary_after_delete(*, customer, deleted_was_primary: bool) -> None:
    if not deleted_was_primary:
        return
    with transaction.atomic():
        remaining = Vehicle.objects.select_for_update().filter(customer=customer)
        if remaining.filter(is_primary=True).exists():
            return
        successor = remaining.order_by("-created_at").first()
        if successor is None:
            return
        successor.is_primary = True
        successor.save(update_fields=["is_primary", "updated_at"])
