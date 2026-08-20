import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from apps.common.models import TimeStampedModel
from apps.common.validators import validate_latitude, validate_longitude


class RequestStatus(models.TextChoices):
    REQUESTED = "REQUESTED", "Requested"
    SEARCHING = "SEARCHING", "Searching"
    ASSIGNED = "ASSIGNED", "Assigned"
    ACCEPTED = "ACCEPTED", "Accepted"
    ON_THE_WAY = "ON_THE_WAY", "On the way"
    ARRIVED = "ARRIVED", "Arrived"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    COMPLETED = "COMPLETED", "Completed"
    DECLINED = "DECLINED", "Declined"
    CANCELLED = "CANCELLED", "Cancelled"


class CancelledBy(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    MECHANIC = "MECHANIC", "Mechanic"
    ADMIN = "ADMIN", "Admin"
    SYSTEM = "SYSTEM", "System"


class ServiceRequest(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        "accounts.CustomerProfile",
        on_delete=models.PROTECT,
        related_name="service_requests",
    )
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.PROTECT,
        related_name="service_requests",
    )
    service = models.ForeignKey(
        "services.Service",
        on_delete=models.PROTECT,
        related_name="service_requests",
    )
    problem = models.ForeignKey(
        "services.ServiceProblem",
        on_delete=models.PROTECT,
        related_name="service_requests",
    )
    assigned_mechanic = models.ForeignKey(
        "accounts.MechanicProfile",
        on_delete=models.PROTECT,
        related_name="assigned_requests",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=16,
        choices=RequestStatus.choices,
        default=RequestStatus.REQUESTED,
    )
    customer_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[validate_latitude],
    )
    customer_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[validate_longitude],
    )
    customer_address = models.CharField(max_length=255, blank=True, default="")
    estimated_price_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Nullable. Auto Key has no catalog estimate; never store 0 for unknown.",
    )
    estimated_price_currency = models.CharField(max_length=3, default="GEL")
    price_is_estimate = models.BooleanField(default=True)
    requested_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    arrived_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.CharField(
        max_length=16,
        choices=CancelledBy.choices,
        blank=True,
        default="",
    )
    cancellation_reason = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["customer", "-created_at"]),
            models.Index(fields=["assigned_mechanic", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.service.code} {self.status} ({self.id})"

    def transition_status(self, to_status: str, changed_by=None, note: str = "") -> None:
        if to_status == self.status:
            return
        from_status = self.status
        now = timezone.now()
        self.status = to_status
        if to_status == RequestStatus.ACCEPTED:
            self.accepted_at = now
        elif to_status == RequestStatus.ARRIVED:
            self.arrived_at = now
        elif to_status == RequestStatus.IN_PROGRESS:
            self.started_at = now
        elif to_status == RequestStatus.COMPLETED:
            self.completed_at = now
        elif to_status == RequestStatus.CANCELLED:
            self.cancelled_at = now
        with transaction.atomic():
            self.save()
            ServiceRequestStatusHistory.objects.create(
                request=self,
                from_status=from_status,
                to_status=to_status,
                changed_by=changed_by,
                note=note,
            )


class ServiceRequestStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    from_status = models.CharField(max_length=16, blank=True, default="")
    to_status = models.CharField(max_length=16, choices=RequestStatus.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="request_status_changes",
    )
    note = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name_plural = "Service request status history"

    def __str__(self) -> str:
        return f"{self.from_status or '—'} → {self.to_status}"


class OfferStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACCEPTED = "ACCEPTED", "Accepted"
    DECLINED = "DECLINED", "Declined"
    EXPIRED = "EXPIRED", "Expired"


class MechanicRequestOffer(TimeStampedModel):
    """
    Per-mechanic offer for a customer ServiceRequest.

    assigned_mechanic on ServiceRequest means the mechanic who owns the
    accepted job. Offers are separate so a decline does not assign or
    cancel the customer request.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name="offers",
    )
    mechanic = models.ForeignKey(
        "accounts.MechanicProfile",
        on_delete=models.CASCADE,
        related_name="request_offers",
    )
    status = models.CharField(
        max_length=16,
        choices=OfferStatus.choices,
        default=OfferStatus.PENDING,
    )
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["request", "mechanic"],
                name="unique_offer_per_mechanic_request",
            )
        ]
        indexes = [
            models.Index(fields=["mechanic", "status"]),
            models.Index(fields=["request", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.mechanic} {self.status} ({self.request_id})"
