import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel


class Rating(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.OneToOneField(
        "service_requests.ServiceRequest",
        on_delete=models.CASCADE,
        related_name="rating",
    )
    customer = models.ForeignKey(
        "accounts.CustomerProfile",
        on_delete=models.PROTECT,
        related_name="ratings_given",
    )
    mechanic = models.ForeignKey(
        "accounts.MechanicProfile",
        on_delete=models.PROTECT,
        related_name="ratings_received",
    )
    stars = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    feedback = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.stars}★ on {self.request_id}"
