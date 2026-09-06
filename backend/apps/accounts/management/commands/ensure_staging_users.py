"""Create staging accounts from environment variables. Idempotent. No secrets in output."""

from __future__ import annotations

import os

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import (
    ApprovalStatus,
    CustomerProfile,
    MechanicProfile,
    Role,
    User,
)
from apps.common.validators import PHONE_RE
from apps.services.models import Service

CREATE_FLAG = "CREATE_STAGING_USERS"

REQUIRED_VARS = (
    "STAGING_ADMIN_PHONE",
    "STAGING_ADMIN_PASSWORD",
    "STAGING_CUSTOMER_PHONE",
    "STAGING_CUSTOMER_PASSWORD",
    "STAGING_CUSTOMER_FIRST_NAME",
    "STAGING_MECHANIC_PHONE",
    "STAGING_MECHANIC_PASSWORD",
    "STAGING_MECHANIC_FIRST_NAME",
)


def _flag_enabled() -> bool:
    raw = os.getenv(CREATE_FLAG)
    if raw is None:
        return False
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env(name: str) -> str:
    return (os.getenv(name) or "").strip()


class Command(BaseCommand):
    help = (
        "Idempotently create staging admin, customer, and mechanic from env vars. "
        "Requires CREATE_STAGING_USERS=true. Does not print credentials. "
        "Does not run seed_dev."
    )

    def handle(self, *args, **options):
        if not _flag_enabled():
            self.stdout.write("Staging user creation disabled.")
            return

        missing = [name for name in REQUIRED_VARS if not _env(name)]
        if missing:
            raise CommandError(
                "Missing required staging environment variables: "
                + ", ".join(missing)
            )

        admin_phone = _env("STAGING_ADMIN_PHONE")
        customer_phone = _env("STAGING_CUSTOMER_PHONE")
        mechanic_phone = _env("STAGING_MECHANIC_PHONE")
        for name, value in (
            ("STAGING_ADMIN_PHONE", admin_phone),
            ("STAGING_CUSTOMER_PHONE", customer_phone),
            ("STAGING_MECHANIC_PHONE", mechanic_phone),
        ):
            if not PHONE_RE.fullmatch(value):
                raise CommandError(f"{name} is not a valid E.164 phone number.")

        phones = [admin_phone, customer_phone, mechanic_phone]
        if len(set(phones)) != 3:
            raise CommandError(
                "STAGING_ADMIN_PHONE, STAGING_CUSTOMER_PHONE, and "
                "STAGING_MECHANIC_PHONE must be distinct."
            )

        with transaction.atomic():
            self._ensure_admin(
                phone=admin_phone,
                password=_env("STAGING_ADMIN_PASSWORD"),
                email=_env("STAGING_ADMIN_EMAIL"),
            )
            self._ensure_customer(
                phone=customer_phone,
                password=_env("STAGING_CUSTOMER_PASSWORD"),
                email=_env("STAGING_CUSTOMER_EMAIL"),
                first_name=_env("STAGING_CUSTOMER_FIRST_NAME"),
            )
            self._ensure_mechanic(
                phone=mechanic_phone,
                password=_env("STAGING_MECHANIC_PASSWORD"),
                email=_env("STAGING_MECHANIC_EMAIL"),
                first_name=_env("STAGING_MECHANIC_FIRST_NAME"),
            )

    def _ensure_admin(self, *, phone: str, password: str, email: str) -> None:
        existing = User.objects.filter(phone=phone).first()
        if existing is None:
            User.objects.create_superuser(
                phone=phone,
                password=password,
                email=email,
                role=Role.ADMIN,
            )
            self.stdout.write("Created staging admin.")
            return

        changed = False
        if existing.role != Role.ADMIN:
            existing.role = Role.ADMIN
            changed = True
        if not existing.is_staff:
            existing.is_staff = True
            changed = True
        if not existing.is_superuser:
            existing.is_superuser = True
            changed = True
        if changed:
            existing.save(update_fields=["role", "is_staff", "is_superuser", "updated_at"])
            self.stdout.write("Updated staging admin flags.")
        else:
            self.stdout.write("Staging admin already present.")

    def _ensure_customer(
        self, *, phone: str, password: str, email: str, first_name: str
    ) -> None:
        existing = User.objects.filter(phone=phone).first()
        if existing is None:
            user = User.objects.create_user(
                phone=phone,
                password=password,
                email=email,
                role=Role.CUSTOMER,
            )
            CustomerProfile.objects.create(user=user, first_name=first_name)
            self.stdout.write("Created staging customer.")
            return

        if not CustomerProfile.objects.filter(user=existing).exists():
            CustomerProfile.objects.create(user=existing, first_name=first_name)
            self.stdout.write("Created staging customer profile.")
            return
        self.stdout.write("Staging customer already present.")

    def _ensure_mechanic(
        self, *, phone: str, password: str, email: str, first_name: str
    ) -> None:
        existing = User.objects.filter(phone=phone).first()
        if existing is None:
            user = User.objects.create_user(
                phone=phone,
                password=password,
                email=email,
                role=Role.MECHANIC,
            )
            profile = MechanicProfile.objects.create(
                user=user,
                first_name=first_name,
                verified=True,
                online=False,
                approval_status=ApprovalStatus.APPROVED,
            )
            profile.services.set(Service.objects.filter(active=True))
            self.stdout.write("Created staging mechanic.")
            return

        if not MechanicProfile.objects.filter(user=existing).exists():
            profile = MechanicProfile.objects.create(
                user=existing,
                first_name=first_name,
                verified=True,
                online=False,
                approval_status=ApprovalStatus.APPROVED,
            )
            profile.services.set(Service.objects.filter(active=True))
            self.stdout.write("Created staging mechanic profile.")
            return
        self.stdout.write("Staging mechanic already present.")
