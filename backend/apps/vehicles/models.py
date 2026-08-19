import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel
from apps.common.validators import normalize_vin, validate_vin


class FuelType(models.TextChoices):
    PETROL = "petrol", "Petrol"
    DIESEL = "diesel", "Diesel"
    HYBRID = "hybrid", "Hybrid"
    ELECTRIC = "electric", "Electric"


class Vehicle(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        "accounts.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="vehicles",
    )
    make = models.CharField(max_length=80)
    model = models.CharField(max_length=80)
    year = models.PositiveIntegerField(
        validators=[MinValueValidator(1980), MaxValueValidator(2100)]
    )
    engine = models.CharField(max_length=80, blank=True, default="")
    fuel = models.CharField(max_length=16, choices=FuelType.choices)
    license_plate = models.CharField(max_length=32, blank=True, default="")
    vin = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        validators=[validate_vin],
        help_text="Optional 17-character VIN. Stored uppercase. Unique when present.",
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["vin"],
                condition=models.Q(vin__isnull=False),
                name="unique_vin_when_present",
            )
        ]

    def clean(self):
        super().clean()
        self.vin = normalize_vin(self.vin)
        if self.vin:
            validate_vin(self.vin)

    def save(self, *args, **kwargs):
        self.vin = normalize_vin(self.vin)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.make} {self.model} ({self.year})"
