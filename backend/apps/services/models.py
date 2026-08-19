import uuid

from django.db import models

from apps.common.models import TimeStampedModel


class Service(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class ServiceProblem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="problems",
    )
    code = models.CharField(max_length=64)
    label = models.CharField(max_length=160)
    active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["service", "sort_order", "code"]
        constraints = [
            models.UniqueConstraint(
                fields=["service", "code"],
                name="unique_problem_code_per_service",
            )
        ]

    def __str__(self) -> str:
        return f"{self.service.code}:{self.code}"
