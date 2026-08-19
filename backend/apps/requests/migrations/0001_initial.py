import uuid
from decimal import Decimal

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.common.validators


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0001_initial"),
        ("services", "0001_initial"),
        ("vehicles", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("REQUESTED", "Requested"),
                            ("SEARCHING", "Searching"),
                            ("ASSIGNED", "Assigned"),
                            ("ACCEPTED", "Accepted"),
                            ("ON_THE_WAY", "On the way"),
                            ("ARRIVED", "Arrived"),
                            ("IN_PROGRESS", "In progress"),
                            ("COMPLETED", "Completed"),
                            ("DECLINED", "Declined"),
                            ("CANCELLED", "Cancelled"),
                        ],
                        default="REQUESTED",
                        max_length=16,
                    ),
                ),
                (
                    "customer_latitude",
                    models.DecimalField(
                        decimal_places=6,
                        max_digits=9,
                        validators=[apps.common.validators.validate_latitude],
                    ),
                ),
                (
                    "customer_longitude",
                    models.DecimalField(
                        decimal_places=6,
                        max_digits=9,
                        validators=[apps.common.validators.validate_longitude],
                    ),
                ),
                (
                    "customer_address",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                (
                    "estimated_price_amount",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Nullable. Auto Key has no catalog estimate; never store 0 for unknown.",
                        max_digits=10,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.00"))
                        ],
                    ),
                ),
                (
                    "estimated_price_currency",
                    models.CharField(default="GEL", max_length=3),
                ),
                ("price_is_estimate", models.BooleanField(default=True)),
                ("requested_at", models.DateTimeField(blank=True, null=True)),
                ("accepted_at", models.DateTimeField(blank=True, null=True)),
                ("arrived_at", models.DateTimeField(blank=True, null=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("cancelled_at", models.DateTimeField(blank=True, null=True)),
                (
                    "cancelled_by",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("CUSTOMER", "Customer"),
                            ("MECHANIC", "Mechanic"),
                            ("ADMIN", "Admin"),
                            ("SYSTEM", "System"),
                        ],
                        default="",
                        max_length=16,
                    ),
                ),
                ("cancellation_reason", models.TextField(blank=True, default="")),
                (
                    "assigned_mechanic",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="assigned_requests",
                        to="accounts.mechanicprofile",
                    ),
                ),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="service_requests",
                        to="accounts.customerprofile",
                    ),
                ),
                (
                    "problem",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="service_requests",
                        to="services.serviceproblem",
                    ),
                ),
                (
                    "service",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="service_requests",
                        to="services.service",
                    ),
                ),
                (
                    "vehicle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="service_requests",
                        to="vehicles.vehicle",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ServiceRequestStatusHistory",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("from_status", models.CharField(blank=True, default="", max_length=16)),
                (
                    "to_status",
                    models.CharField(
                        choices=[
                            ("REQUESTED", "Requested"),
                            ("SEARCHING", "Searching"),
                            ("ASSIGNED", "Assigned"),
                            ("ACCEPTED", "Accepted"),
                            ("ON_THE_WAY", "On the way"),
                            ("ARRIVED", "Arrived"),
                            ("IN_PROGRESS", "In progress"),
                            ("COMPLETED", "Completed"),
                            ("DECLINED", "Declined"),
                            ("CANCELLED", "Cancelled"),
                        ],
                        max_length=16,
                    ),
                ),
                ("note", models.CharField(blank=True, default="", max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="request_status_changes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "request",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="status_history",
                        to="service_requests.servicerequest",
                    ),
                ),
            ],
            options={
                "ordering": ["created_at"],
                "verbose_name_plural": "Service request status history",
            },
        ),
        migrations.AddIndex(
            model_name="servicerequest",
            index=models.Index(fields=["status"], name="service_req_status_4276f0_idx"),
        ),
        migrations.AddIndex(
            model_name="servicerequest",
            index=models.Index(
                fields=["customer", "-created_at"],
                name="service_req_custome_2815ab_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="servicerequest",
            index=models.Index(
                fields=["assigned_mechanic", "status"],
                name="service_req_assigne_60ca30_idx",
            ),
        ),
    ]
