"""Final-price quotes. Catalog estimates stay in pricing.py."""

from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.models import MechanicProfile
from apps.requests.exceptions import Conflict
from apps.requests.models import QuoteStatus, RequestStatus, ServiceRequest

MONEY_QUANTUM = Decimal("0.01")
MIN_PRICE = Decimal("0.01")
MAX_PRICE = Decimal("99999.99")

QUOTE_EDITABLE_STATUSES = (
    RequestStatus.ACCEPTED,
    RequestStatus.ON_THE_WAY,
    RequestStatus.ARRIVED,
)

CUSTOMER_QUOTE_STATUSES = QUOTE_EDITABLE_STATUSES

START_SERVICE_PRICE_REQUIRED = (
    "Customer must approve the service price before work can begin."
)
COMPLETION_PRICE_REQUIRED = "Final service price is required before completion."
STALE_QUOTE = "The price has changed. Review the new quote."


def quantize_price(value: Decimal) -> Decimal:
    return Decimal(value).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def price_init_kwargs(estimated: Decimal | None, *, currency: str = "GEL") -> dict:
    """Catalog estimate becomes an auto-approved final price. Null stays unset."""
    if estimated is None:
        return {
            "estimated_price_amount": None,
            "estimated_price_currency": currency,
            "price_is_estimate": True,
            "final_price_amount": None,
            "quote_status": QuoteStatus.NONE,
            "price_proposed_at": None,
            "price_confirmed_at": None,
            "price_confirmed_by_customer": False,
        }
    amount = quantize_price(estimated)
    now = timezone.now()
    return {
        "estimated_price_amount": amount,
        "estimated_price_currency": currency,
        "price_is_estimate": False,
        "final_price_amount": amount,
        "quote_status": QuoteStatus.APPROVED,
        "price_proposed_at": None,
        "price_confirmed_at": now,
        "price_confirmed_by_customer": True,
    }


def public_quote_fields(service_request: ServiceRequest) -> dict:
    amount = service_request.final_price_amount
    return {
        "final_price_amount": None if amount is None else str(amount),
        "quote_status": service_request.quote_status,
        "price_confirmed_by_customer": service_request.price_confirmed_by_customer,
        "price_confirmed_at": service_request.price_confirmed_at,
        "price_proposed_at": service_request.price_proposed_at,
    }


def _locked_request(request_id) -> ServiceRequest:
    try:
        return ServiceRequest.objects.select_for_update().get(pk=request_id)
    except ServiceRequest.DoesNotExist as exc:
        raise NotFound() from exc


def _require_editable(service_request: ServiceRequest) -> None:
    if service_request.status in (
        RequestStatus.CANCELLED,
        RequestStatus.COMPLETED,
        RequestStatus.DECLINED,
    ):
        raise Conflict(
            f"Cannot change price for a request in {service_request.status} status."
        )
    if service_request.status == RequestStatus.IN_PROGRESS:
        raise Conflict("Cannot change price after service has started.")
    if service_request.status not in QUOTE_EDITABLE_STATUSES:
        raise Conflict(
            f"Cannot propose a price while the request is {service_request.status}."
        )


def propose_job_price(
    *,
    request_id,
    mechanic: MechanicProfile,
    amount: Decimal,
) -> ServiceRequest:
    priced = quantize_price(amount)
    if priced < MIN_PRICE:
        raise ValidationError({"amount": "Amount must be greater than 0."})
    if priced > MAX_PRICE:
        raise ValidationError({"amount": "Amount is too large."})

    with transaction.atomic():
        service_request = _locked_request(request_id)
        if service_request.assigned_mechanic_id != mechanic.id:
            raise NotFound()
        _require_editable(service_request)

        if (
            service_request.quote_status == QuoteStatus.APPROVED
            and service_request.final_price_amount == priced
        ):
            return service_request

        now = timezone.now()
        service_request.final_price_amount = priced
        service_request.quote_status = QuoteStatus.PENDING
        service_request.price_proposed_at = now
        service_request.price_confirmed_at = None
        service_request.price_confirmed_by_customer = False
        service_request.price_is_estimate = True
        service_request.save(
            update_fields=[
                "final_price_amount",
                "quote_status",
                "price_proposed_at",
                "price_confirmed_at",
                "price_confirmed_by_customer",
                "price_is_estimate",
                "updated_at",
            ]
        )
        return service_request


def _require_pending_customer_quote(
    service_request: ServiceRequest, *, customer_id
) -> None:
    if service_request.customer_id != customer_id:
        raise NotFound()
    if service_request.status in (
        RequestStatus.CANCELLED,
        RequestStatus.COMPLETED,
        RequestStatus.DECLINED,
    ):
        raise Conflict(
            f"Cannot review price for a request in {service_request.status} status."
        )
    if service_request.status not in CUSTOMER_QUOTE_STATUSES:
        raise Conflict(
            f"Cannot review price while the request is {service_request.status}."
        )
    if service_request.quote_status != QuoteStatus.PENDING:
        raise Conflict("There is no price waiting for approval.")
    if service_request.final_price_amount is None:
        raise Conflict("There is no price waiting for approval.")


def approve_request_price(
    *,
    request_id,
    customer_id,
    expected_amount: Decimal | None = None,
) -> ServiceRequest:
    with transaction.atomic():
        service_request = _locked_request(request_id)
        _require_pending_customer_quote(service_request, customer_id=customer_id)
        current = quantize_price(service_request.final_price_amount)
        if expected_amount is not None and quantize_price(expected_amount) != current:
            raise Conflict(STALE_QUOTE)
        now = timezone.now()
        service_request.quote_status = QuoteStatus.APPROVED
        service_request.price_confirmed_by_customer = True
        service_request.price_confirmed_at = now
        service_request.price_is_estimate = False
        service_request.save(
            update_fields=[
                "quote_status",
                "price_confirmed_by_customer",
                "price_confirmed_at",
                "price_is_estimate",
                "updated_at",
            ]
        )
        return service_request


def reject_request_price(*, request_id, customer_id) -> ServiceRequest:
    with transaction.atomic():
        service_request = _locked_request(request_id)
        _require_pending_customer_quote(service_request, customer_id=customer_id)
        service_request.quote_status = QuoteStatus.REJECTED
        service_request.price_confirmed_by_customer = False
        service_request.price_confirmed_at = None
        service_request.price_is_estimate = True
        service_request.save(
            update_fields=[
                "quote_status",
                "price_confirmed_by_customer",
                "price_confirmed_at",
                "price_is_estimate",
                "updated_at",
            ]
        )
        return service_request
