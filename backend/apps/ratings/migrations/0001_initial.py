import uuid

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("service_requests", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Rating",
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
                    "stars",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(5),
                        ]
                    ),
                ),
                ("feedback", models.TextField(blank=True, default="")),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="ratings_given",
                        to="accounts.customerprofile",
                    ),
                ),
                (
                    "mechanic",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="ratings_received",
                        to="accounts.mechanicprofile",
                    ),
                ),
                (
                    "request",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rating",
                        to="service_requests.servicerequest",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
