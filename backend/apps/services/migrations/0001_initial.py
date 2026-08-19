from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Service",
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
                ("code", models.CharField(max_length=32, unique=True)),
                ("name", models.CharField(max_length=120)),
                ("description", models.TextField(blank=True, default="")),
                ("active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["code"]},
        ),
        migrations.CreateModel(
            name="ServiceProblem",
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
                ("code", models.CharField(max_length=64)),
                ("label", models.CharField(max_length=160)),
                ("active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "service",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="problems",
                        to="services.service",
                    ),
                ),
            ],
            options={"ordering": ["service", "sort_order", "code"]},
        ),
        migrations.AddConstraint(
            model_name="serviceproblem",
            constraint=models.UniqueConstraint(
                fields=("service", "code"),
                name="unique_problem_code_per_service",
            ),
        ),
    ]
