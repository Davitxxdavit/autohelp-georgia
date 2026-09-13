import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from apps.common.models import TimeStampedModel
from apps.common.validators import phone_validator, validate_latitude, validate_longitude


class Role(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    MECHANIC = "MECHANIC", "Mechanic"
    ADMIN = "ADMIN", "Admin"


class Language(models.TextChoices):
    KA = "ka", "Georgian"
    EN = "en", "English"
    RU = "ru", "Russian"
    TR = "tr", "Turkish"


class ApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    SUSPENDED = "SUSPENDED", "Suspended"


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Users must have a phone number.")
        extra_fields.setdefault("role", Role.CUSTOMER)
        extra_fields.setdefault("is_active", True)
        user = self.model(phone=phone.strip(), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("role", Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(
        max_length=16,
        unique=True,
        validators=[phone_validator],
        help_text="E.164 phone number. Future OTP login key.",
    )
    email = models.EmailField(blank=True, default="")
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.CUSTOMER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["email"],
                condition=~models.Q(email=""),
                name="unique_user_email_when_present",
            )
        ]

    def __str__(self) -> str:
        return f"{self.phone} ({self.role})"


class CustomerProfile(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="customer_profile",
        limit_choices_to={"role": Role.CUSTOMER},
    )
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80, blank=True, default="")
    preferred_language = models.CharField(
        max_length=8,
        choices=Language.choices,
        default=Language.KA,
    )

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or str(self.user.phone)


class MechanicProfile(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="mechanic_profile",
        limit_choices_to={"role": Role.MECHANIC},
    )
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80, blank=True, default="")
    verified = models.BooleanField(default=False)
    online = models.BooleanField(default=False)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    approval_status = models.CharField(
        max_length=16,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
    )
    services = models.ManyToManyField(
        "services.Service",
        related_name="mechanics",
        blank=True,
    )
    current_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[validate_latitude],
        help_text="Latest known mechanic position. Not a location history log.",
    )
    current_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[validate_longitude],
    )
    location_updated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or str(self.user.phone)


class MechanicLocation(models.Model):
    """
    Point-in-time mechanic coordinate log.

    Phase 1 stores history-capable rows. Do not write live tracking
    endpoints yet. Prefer this over a single current-location field so
    later realtime/history work does not require a model rewrite.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mechanic = models.ForeignKey(
        MechanicProfile,
        on_delete=models.CASCADE,
        related_name="locations",
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[validate_latitude],
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[validate_longitude],
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["mechanic", "-recorded_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.mechanic} @ {self.recorded_at:%Y-%m-%d %H:%M}"
