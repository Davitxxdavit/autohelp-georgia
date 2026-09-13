from rest_framework import serializers

from apps.requests.models import MechanicRequestOffer
from apps.requests.quotes import public_quote_fields


class MechanicOfferVehicleSerializer(serializers.Serializer):
    make = serializers.CharField()
    model = serializers.CharField()
    year = serializers.IntegerField()
    fuel = serializers.CharField()


class MechanicOfferRequestSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    status = serializers.CharField()
    service_code = serializers.CharField()
    service_name = serializers.CharField()
    problem_code = serializers.CharField()
    problem_label = serializers.CharField()
    customer_display_name = serializers.CharField(
        help_text="First name only. Phone is included only on accepted/active jobs."
    )
    customer_phone = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="Customer phone. Present only on the assigned mechanic's accepted job.",
    )
    customer_address = serializers.CharField()
    customer_latitude = serializers.CharField()
    customer_longitude = serializers.CharField()
    estimated_price_amount = serializers.CharField(
        allow_null=True,
        help_text=(
            "Customer catalog estimate, not mechanic earnings. "
            "Null for Auto Key. Never treat null as 0."
        ),
    )
    estimated_price_currency = serializers.CharField()
    price_is_estimate = serializers.BooleanField()
    final_price_amount = serializers.CharField(
        allow_null=True,
        help_text="Authoritative agreed price once approved. Null until set.",
    )
    quote_status = serializers.CharField()
    price_confirmed_by_customer = serializers.BooleanField()
    price_confirmed_at = serializers.DateTimeField(allow_null=True)
    price_proposed_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    accepted_at = serializers.DateTimeField(allow_null=True)
    arrived_at = serializers.DateTimeField(allow_null=True)
    started_at = serializers.DateTimeField(allow_null=True)
    completed_at = serializers.DateTimeField(allow_null=True)
    vehicle = MechanicOfferVehicleSerializer()


class MechanicMeServiceSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    code = serializers.CharField()
    name = serializers.CharField()


class MechanicMeSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField()
    online = serializers.BooleanField(
        help_text=(
            "Controls new offer eligibility only. Going offline does not "
            "cancel an active accepted job."
        )
    )
    verified = serializers.BooleanField()
    approval_status = serializers.CharField()
    rating_average = serializers.DecimalField(max_digits=3, decimal_places=2)
    services = MechanicMeServiceSerializer(many=True)


class MechanicMeUpdateSerializer(serializers.Serializer):
    online = serializers.BooleanField()


class MechanicOfferSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    responded_at = serializers.DateTimeField(allow_null=True)
    request = MechanicOfferRequestSerializer()
    earning = serializers.DictField(
        required=False,
        allow_null=True,
        help_text="Present on successful Complete only. Derived from approved final price.",
    )


class MechanicEarningSnapshotSerializer(serializers.Serializer):
    gross_amount = serializers.CharField()
    commission_amount = serializers.CharField()
    net_amount = serializers.CharField()
    currency = serializers.CharField()


class MechanicEarningRowSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    request_id = serializers.UUIDField()
    service_name = serializers.CharField()
    gross_amount = serializers.CharField()
    commission_amount = serializers.CharField()
    net_amount = serializers.CharField()
    currency = serializers.CharField()
    created_at = serializers.DateTimeField()


class MechanicEarningsSummarySerializer(serializers.Serializer):
    today = serializers.CharField()
    total = serializers.CharField()
    completed_jobs = serializers.IntegerField()
    currency = serializers.CharField()


class MechanicEarningsResponseSerializer(serializers.Serializer):
    summary = MechanicEarningsSummarySerializer()
    count = serializers.IntegerField()
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = MechanicEarningRowSerializer(many=True)


def serialize_mechanic_offer(
    offer: MechanicRequestOffer, *, include_customer_phone: bool = False
) -> dict:
    request = offer.request
    vehicle = request.vehicle
    customer = request.customer
    amount = request.estimated_price_amount
    payload = {
        "id": str(offer.id),
        "status": offer.status,
        "created_at": offer.created_at,
        "responded_at": offer.responded_at,
        "request": {
            "id": str(request.id),
            "status": request.status,
            "service_code": request.service.code,
            "service_name": request.service.name,
            "problem_code": request.problem.code,
            "problem_label": request.problem.label,
            "customer_display_name": customer.first_name,
            "customer_address": request.customer_address,
            "customer_latitude": str(request.customer_latitude),
            "customer_longitude": str(request.customer_longitude),
            "estimated_price_amount": None if amount is None else str(amount),
            "estimated_price_currency": request.estimated_price_currency,
            "price_is_estimate": request.price_is_estimate,
            **public_quote_fields(request),
            "created_at": request.created_at,
            "accepted_at": request.accepted_at,
            "arrived_at": request.arrived_at,
            "started_at": request.started_at,
            "completed_at": request.completed_at,
            "vehicle": {
                "make": vehicle.make,
                "model": vehicle.model,
                "year": vehicle.year,
                "fuel": vehicle.fuel,
            },
        },
    }
    if include_customer_phone:
        customer_user = getattr(customer, "user", None)
        payload["request"]["customer_phone"] = (
            customer_user.phone if customer_user is not None else None
        )
    return payload


def serialize_mechanic_me(profile) -> dict:
    services = [
        {"id": str(service.id), "code": service.code, "name": service.name}
        for service in profile.services.all()
    ]
    user = getattr(profile, "user", None)
    return {
        "id": str(profile.id),
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "phone": user.phone if user is not None else "",
        "online": profile.online,
        "verified": profile.verified,
        "approval_status": profile.approval_status,
        "rating_average": profile.rating_average,
        "services": services,
    }
