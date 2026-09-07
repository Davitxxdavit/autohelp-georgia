import uuid

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import (
    ApprovalStatus,
    CustomerProfile,
    MechanicProfile,
    Role,
    User,
)
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem


class MechanicRegisterTests(APITestCase):
    url = "/api/v1/auth/mechanic/register/"

    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.diagnostics = Service.objects.get(code="DIAGNOSTICS")
        self.auto_key = Service.objects.get(code="AUTO_KEY")
        self.payload = {
            "phone": "+995555555001",
            "password": "StrongPassword123!",
            "first_name": "Giorgi",
            "services": [str(self.battery.id), str(self.diagnostics.id)],
        }

    def test_successful_mechanic_application(self):
        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(response.data.get("access"))
        self.assertTrue(response.data.get("refresh"))
        self.assertNotIn("password", response.data)
        self.assertEqual(response.data["user"]["phone"], self.payload["phone"])
        self.assertEqual(response.data["user"]["role"], Role.MECHANIC)
        self.assertEqual(response.data["user"]["first_name"], "Giorgi")
        self.assertEqual(response.data["user"]["approval_status"], ApprovalStatus.PENDING)
        self.assertFalse(response.data["user"]["verified"])

    def test_role_is_mechanic(self):
        self.client.post(self.url, self.payload, format="json")
        user = User.objects.get(phone=self.payload["phone"])
        self.assertEqual(user.role, Role.MECHANIC)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_mechanic_profile_created_unapproved_offline(self):
        self.client.post(self.url, self.payload, format="json")
        user = User.objects.get(phone=self.payload["phone"])
        profile = MechanicProfile.objects.get(user=user)
        self.assertEqual(profile.first_name, "Giorgi")
        self.assertFalse(profile.verified)
        self.assertFalse(profile.online)
        self.assertEqual(profile.approval_status, ApprovalStatus.PENDING)
        codes = set(profile.services.values_list("code", flat=True))
        self.assertEqual(codes, {"BATTERY", "DIAGNOSTICS"})

    def test_password_is_hashed(self):
        self.client.post(self.url, self.payload, format="json")
        user = User.objects.get(phone=self.payload["phone"])
        self.assertNotEqual(user.password, self.payload["password"])
        self.assertTrue(user.check_password(self.payload["password"]))

    def test_duplicate_phone_rejected(self):
        first = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", second.data)
        self.assertEqual(User.objects.filter(phone=self.payload["phone"]).count(), 1)

    def test_invalid_phone_rejected(self):
        response = self.client.post(
            self.url,
            {**self.payload, "phone": "555123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)
        self.assertFalse(User.objects.filter(phone="555123456").exists())

    def test_weak_password_rejected(self):
        response = self.client.post(
            self.url,
            {**self.payload, "password": "123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(phone=self.payload["phone"]).exists())

    def test_no_customer_profile_created(self):
        self.client.post(self.url, self.payload, format="json")
        user = User.objects.get(phone=self.payload["phone"])
        self.assertFalse(CustomerProfile.objects.filter(user=user).exists())

    def test_invalid_service_rejected(self):
        response = self.client.post(
            self.url,
            {**self.payload, "services": [str(uuid.uuid4())]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("services", response.data)
        self.assertFalse(User.objects.filter(phone=self.payload["phone"]).exists())

    def test_inactive_service_rejected(self):
        self.auto_key.active = False
        self.auto_key.save(update_fields=["active", "updated_at"])
        response = self.client.post(
            self.url,
            {**self.payload, "services": [str(self.auto_key.id)]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("services", response.data)
        self.assertFalse(User.objects.filter(phone=self.payload["phone"]).exists())

    def test_empty_services_rejected(self):
        response = self.client.post(
            self.url,
            {**self.payload, "services": []},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("services", response.data)
        self.assertFalse(User.objects.filter(phone=self.payload["phone"]).exists())

    def test_client_cannot_set_approval_or_staff(self):
        response = self.client.post(
            self.url,
            {
                **self.payload,
                "role": Role.ADMIN,
                "approval_status": ApprovalStatus.APPROVED,
                "verified": True,
                "online": True,
                "is_staff": True,
                "is_superuser": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        user = User.objects.get(phone=self.payload["phone"])
        profile = user.mechanic_profile
        self.assertEqual(user.role, Role.MECHANIC)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(profile.verified)
        self.assertFalse(profile.online)
        self.assertEqual(profile.approval_status, ApprovalStatus.PENDING)

    def test_unapproved_jwt_cannot_go_online(self):
        created = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {created.data['access']}"
        )
        response = self.client.patch(
            "/api/v1/mechanic/me/", {"online": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        me = self.client.get("/api/v1/mechanic/me/")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertFalse(me.data["online"])
        self.assertEqual(me.data["approval_status"], ApprovalStatus.PENDING)
