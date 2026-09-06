import os
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from apps.accounts.models import ApprovalStatus, CustomerProfile, MechanicProfile, Role, User
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem

ADMIN_PHONE = "+995555111001"
CUSTOMER_PHONE = "+995555111002"
MECHANIC_PHONE = "+995555111003"

REQUIRED_ENV = {
    "CREATE_STAGING_USERS": "true",
    "STAGING_ADMIN_PHONE": ADMIN_PHONE,
    "STAGING_ADMIN_PASSWORD": "AdminPass123!",
    "STAGING_CUSTOMER_PHONE": CUSTOMER_PHONE,
    "STAGING_CUSTOMER_PASSWORD": "CustomerPass123!",
    "STAGING_CUSTOMER_FIRST_NAME": "StagingCustomer",
    "STAGING_MECHANIC_PHONE": MECHANIC_PHONE,
    "STAGING_MECHANIC_PASSWORD": "MechanicPass123!",
    "STAGING_MECHANIC_FIRST_NAME": "StagingMechanic",
}

STAGING_KEYS = (
    "CREATE_STAGING_USERS",
    "STAGING_ADMIN_PHONE",
    "STAGING_ADMIN_EMAIL",
    "STAGING_ADMIN_PASSWORD",
    "STAGING_CUSTOMER_PHONE",
    "STAGING_CUSTOMER_EMAIL",
    "STAGING_CUSTOMER_PASSWORD",
    "STAGING_CUSTOMER_FIRST_NAME",
    "STAGING_MECHANIC_PHONE",
    "STAGING_MECHANIC_EMAIL",
    "STAGING_MECHANIC_PASSWORD",
    "STAGING_MECHANIC_FIRST_NAME",
)


def _staging_env(**overrides):
    values = {key: "" for key in STAGING_KEYS}
    values.update(overrides)
    return patch.dict(os.environ, values, clear=False)


class EnsureStagingUsersTests(TestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)

    def _run(self, **env):
        out = StringIO()
        with _staging_env(**env):
            call_command("ensure_staging_users", stdout=out)
        return out.getvalue()

    def test_disabled_does_not_require_credentials(self):
        output = self._run()
        self.assertIn("Staging user creation disabled.", output)
        self.assertEqual(User.objects.count(), 0)

    def test_disabled_flag_creates_nothing(self):
        env = {**REQUIRED_ENV, "CREATE_STAGING_USERS": "false"}
        output = self._run(**env)
        self.assertIn("Staging user creation disabled.", output)
        self.assertEqual(User.objects.count(), 0)

    def test_absent_flag_creates_nothing(self):
        env = {**REQUIRED_ENV, "CREATE_STAGING_USERS": ""}
        output = self._run(**env)
        self.assertIn("Staging user creation disabled.", output)
        self.assertEqual(User.objects.count(), 0)

    def test_missing_required_env_fails_before_creating_anyone(self):
        with self.assertRaises(CommandError) as raised:
            self._run(CREATE_STAGING_USERS="true")
        message = str(raised.exception)
        self.assertIn("STAGING_ADMIN_PHONE", message)
        self.assertIn("STAGING_CUSTOMER_PASSWORD", message)
        self.assertIn("STAGING_MECHANIC_FIRST_NAME", message)
        self.assertNotIn("AdminPass123!", message)
        self.assertNotIn(ADMIN_PHONE, message)
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(CustomerProfile.objects.count(), 0)
        self.assertEqual(MechanicProfile.objects.count(), 0)

    def test_partial_env_does_not_create_partial_accounts(self):
        with self.assertRaises(CommandError):
            self._run(
                CREATE_STAGING_USERS="true",
                STAGING_ADMIN_PHONE=ADMIN_PHONE,
                STAGING_ADMIN_PASSWORD="AdminPass123!",
            )
        self.assertEqual(User.objects.count(), 0)

    def test_creates_admin_customer_and_mechanic_with_correct_roles(self):
        output = self._run(**REQUIRED_ENV)
        self.assertIn("Created staging admin.", output)
        self.assertIn("Created staging customer.", output)
        self.assertIn("Created staging mechanic.", output)
        self.assertNotIn("AdminPass123!", output)
        self.assertNotIn("CustomerPass123!", output)
        self.assertNotIn("MechanicPass123!", output)

        admin = User.objects.get(phone=ADMIN_PHONE)
        self.assertEqual(admin.role, Role.ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.check_password("AdminPass123!"))

        customer = User.objects.get(phone=CUSTOMER_PHONE)
        self.assertEqual(customer.role, Role.CUSTOMER)
        self.assertFalse(customer.is_staff)
        self.assertTrue(customer.check_password("CustomerPass123!"))
        self.assertEqual(customer.customer_profile.first_name, "StagingCustomer")

        mechanic = User.objects.get(phone=MECHANIC_PHONE)
        self.assertEqual(mechanic.role, Role.MECHANIC)
        self.assertTrue(mechanic.check_password("MechanicPass123!"))
        profile = mechanic.mechanic_profile
        self.assertEqual(profile.first_name, "StagingMechanic")
        self.assertTrue(profile.verified)
        self.assertFalse(profile.online)
        self.assertEqual(profile.approval_status, ApprovalStatus.APPROVED)
        self.assertTrue(profile.services.filter(active=True).exists())

        self.assertEqual(User.objects.count(), 3)
        self.assertEqual(CustomerProfile.objects.count(), 1)
        self.assertEqual(MechanicProfile.objects.count(), 1)

    def test_optional_emails_are_stored_when_provided(self):
        self._run(
            **REQUIRED_ENV,
            STAGING_ADMIN_EMAIL="admin@staging.example",
            STAGING_CUSTOMER_EMAIL="customer@staging.example",
            STAGING_MECHANIC_EMAIL="mechanic@staging.example",
        )
        self.assertEqual(User.objects.get(phone=ADMIN_PHONE).email, "admin@staging.example")
        self.assertEqual(
            User.objects.get(phone=CUSTOMER_PHONE).email, "customer@staging.example"
        )
        self.assertEqual(
            User.objects.get(phone=MECHANIC_PHONE).email, "mechanic@staging.example"
        )

    def test_second_run_does_not_duplicate_or_reset_passwords(self):
        self._run(**REQUIRED_ENV)
        admin = User.objects.get(phone=ADMIN_PHONE)
        customer = User.objects.get(phone=CUSTOMER_PHONE)
        mechanic = User.objects.get(phone=MECHANIC_PHONE)
        admin.set_password("ChangedAdmin123!")
        customer.set_password("ChangedCustomer123!")
        mechanic.set_password("ChangedMechanic123!")
        admin.save()
        customer.save()
        mechanic.save()

        output = self._run(**REQUIRED_ENV)
        self.assertIn("already present", output)
        self.assertEqual(User.objects.count(), 3)
        self.assertEqual(CustomerProfile.objects.count(), 1)
        self.assertEqual(MechanicProfile.objects.count(), 1)

        admin.refresh_from_db()
        customer.refresh_from_db()
        mechanic.refresh_from_db()
        self.assertTrue(admin.check_password("ChangedAdmin123!"))
        self.assertTrue(customer.check_password("ChangedCustomer123!"))
        self.assertTrue(mechanic.check_password("ChangedMechanic123!"))
        self.assertFalse(admin.check_password("AdminPass123!"))
