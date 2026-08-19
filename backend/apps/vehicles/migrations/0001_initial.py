import uuid

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models

import apps.common.validators


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Vehicle",
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
                ("make", models.CharField(max_length=80)),
                ("model", models.CharField(max_length=80)),
                (
                    "year",
                    models.PositiveIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1980),
                            django.core.validators.MaxValueValidator(2100),
                        ]
                    ),
                ),
                ("engine", models.CharField(blank=True, default="", max_length=80)),
                (
                    "fuel",
                    models.CharField(
                        choices=[
                            ("petrol", "Petrol"),
                            ("diesel", "Diesel"),
                            ("hybrid", "Hybrid"),
                            ("electric", "Electric"),
                        ],
                        max_length=16,
                    ),
                ),
                (
                    "license_plate",
                    models.CharField(blank=True, default="", max_length=32),
                ),
                (
                    "vin",
                    models.CharField(
                        blank=True,
                        help_text="Optional 17-character VIN. Stored uppercase. Unique when present.",
                        max_length=17,
                        null=True,
                        validators=[apps.common.validators.validate_vin],
                    ),
                ),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="vehicles",
                        to="accounts.customerprofile",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.UniqueConstraint(
                condition=models.Q(("vin__isnull", False)),
                fields=("vin",),
                name="unique_vin_when_present",
            ),
        ),
    ]
