"""Mechanic earnings accounting. Internal MVP — not payouts."""

from decimal import Decimal, ROUND_HALF_UP

from django.db import IntegrityError

from apps.requests.models import MechanicEarning, RequestStatus, ServiceRequest

COMMISSION_RATE_PERCENT = Decimal("20.00")
MONEY_QUANTUM = Decimal("0.01")
DEFAULT_CURRENCY = "GEL"


def quantize_money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def split_commission(gross: Decimal) -> tuple[Decimal, Decimal, Decimal]:
    gross_amount = quantize_money(gross)
    commission_amount = quantize_money(
        gross_amount * COMMISSION_RATE_PERCENT / Decimal("100")
    )
    net_amount = quantize_money(gross_amount - commission_amount)
    return gross_amount, commission_amount, net_amount


def create_earning_for_completed_request(service_request: ServiceRequest):
    """
    Idempotent snapshot for a completed job.

    Returns None when there is no authoritative price (e.g. Auto Key).
    Does not invent 0 for unknown catalog prices.
    """
    if service_request.status != RequestStatus.COMPLETED:
        return None
    mechanic = service_request.assigned_mechanic
    if mechanic is None:
        return None
    gross = service_request.estimated_price_amount
    if gross is None:
        return None

    gross_amount, commission_amount, net_amount = split_commission(gross)
    currency = service_request.estimated_price_currency or DEFAULT_CURRENCY
    defaults = {
        "mechanic": mechanic,
        "gross_amount": gross_amount,
        "commission_rate": COMMISSION_RATE_PERCENT,
        "commission_amount": commission_amount,
        "net_amount": net_amount,
        "currency": currency,
    }
    try:
        earning, _created = MechanicEarning.objects.get_or_create(
            service_request=service_request,
            defaults=defaults,
        )
    except IntegrityError:
        earning = MechanicEarning.objects.get(service_request=service_request)
    return earning


def serialize_earning_snapshot(earning: MechanicEarning) -> dict:
    return {
        "gross_amount": str(earning.gross_amount),
        "commission_amount": str(earning.commission_amount),
        "net_amount": str(earning.net_amount),
        "currency": earning.currency,
    }


def serialize_earning_row(earning: MechanicEarning) -> dict:
    return {
        "id": str(earning.id),
        "request_id": str(earning.service_request_id),
        "service_name": earning.service_request.service.name,
        "gross_amount": str(earning.gross_amount),
        "commission_amount": str(earning.commission_amount),
        "net_amount": str(earning.net_amount),
        "currency": earning.currency,
        "created_at": earning.created_at,
    }
