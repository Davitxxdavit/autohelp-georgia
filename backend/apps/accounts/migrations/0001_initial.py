import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.common.validators


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("services", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
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
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "last_login",
                    models.DateTimeField(blank=True, null=True, verbose_name="last login"),
                ),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text="Designates that this user has all permissions without explicitly assigning them.",
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "phone",
                    models.CharField(
                        help_text="E.164 phone number. Future OTP login key.",
                        max_length=16,
                        unique=True,
                        validators=[apps.common.validators.phone_validator],
                    ),
                ),
                ("email", models.EmailField(blank=True, default="", max_length=254)),
                ("email_verified", models.BooleanField(default=False)),
                ("phone_verified", models.BooleanField(default=False)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("CUSTOMER", "Customer"),
                            ("MECHANIC", "Mechanic"),
                            ("ADMIN", "Admin"),
                        ],
                        default="CUSTOMER",
                        max_length=16,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={},
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.UniqueConstraint(
                condition=models.Q(("email", ""), _negated=True),
                fields=("email",),
                name="unique_user_email_when_present",
            ),
        ),
        migrations.CreateModel(
            name="CustomerProfile",
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
                ("first_name", models.CharField(max_length=80)),
                ("last_name", models.CharField(blank=True, default="", max_length=80)),
                (
                    "preferred_language",
                    models.CharField(
                        choices=[
                            ("ka", "Georgian"),
                            ("en", "English"),
                            ("ru", "Russian"),
                            ("tr", "Turkish"),
                        ],
                        default="ka",
                        max_length=8,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        limit_choices_to={"role": "CUSTOMER"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="customer_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MechanicProfile",
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
                ("first_name", models.CharField(max_length=80)),
                ("last_name", models.CharField(blank=True, default="", max_length=80)),
                ("verified", models.BooleanField(default=False)),
                ("online", models.BooleanField(default=False)),
                (
                    "rating_average",
                    models.DecimalField(decimal_places=2, default=0, max_digits=3),
                ),
                ("rating_count", models.PositiveIntegerField(default=0)),
                (
                    "approval_status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("APPROVED", "Approved"),
                            ("REJECTED", "Rejected"),
                            ("SUSPENDED", "Suspended"),
                        ],
                        default="PENDING",
                        max_length=16,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        limit_choices_to={"role": "MECHANIC"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mechanic_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "services",
                    models.ManyToManyField(
                        blank=True,
                        related_name="mechanics",
                        to="services.service",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MechanicLocation",
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
                (
                    "latitude",
                    models.DecimalField(
                        decimal_places=6,
                        max_digits=9,
                        validators=[apps.common.validators.validate_latitude],
                    ),
                ),
                (
                    "longitude",
                    models.DecimalField(
                        decimal_places=6,
                        max_digits=9,
                        validators=[apps.common.validators.validate_longitude],
                    ),
                ),
                ("recorded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "mechanic",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="locations",
                        to="accounts.mechanicprofile",
                    ),
                ),
            ],
            options={
                "ordering": ["-recorded_at"],
            },
        ),
        migrations.AddIndex(
            model_name="mechaniclocation",
            index=models.Index(
                fields=["mechanic", "-recorded_at"],
                name="accounts_me_mechani_7dd3cf_idx",
            ),
        ),
    ]
