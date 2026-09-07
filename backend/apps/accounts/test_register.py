from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomerProfile, MechanicProfile, Role, User


class CustomerRegisterTests(APITestCase):
    url = "/api/v1/auth/register/"
    payload = {
        "phone": "+995555123456",
        "password": "StrongPassword123!",
        "first_name": "Davit",
    }

    def test_successful_customer_registration(self):
        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get("access"))
        self.assertTrue(response.data.get("refresh"))
        self.assertNotIn("password", response.data)
        self.assertEqual(response.data["user"]["phone"], self.payload["phone"])
        self.assertEqual(response.data["user"]["role"], Role.CUSTOMER)
        self.assertEqual(response.data["user"]["first_name"], "Davit")

    def test_user_role_is_customer(self):
        self.client.post(self.url, self.payload, format="json")
        user = User.objects.get(phone=self.payload["phone"])
        self.assertEqual(user.role, Role.CUSTOMER)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_customer_profile_created(self):
        self.client.post(self.url, self.payload, format="json")
        user = User.objects.get(phone=self.payload["phone"])
        profile = CustomerProfile.objects.get(user=user)
        self.assertEqual(profile.first_name, "Davit")

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

    def test_missing_first_name_rejected(self):
        response = self.client.post(
            self.url,
            {
                "phone": self.payload["phone"],
                "password": self.payload["password"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)

    def test_blank_first_name_rejected(self):
        response = self.client.post(
            self.url,
            {**self.payload, "first_name": "   "},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)

    def test_empty_password_rejected(self):
        response = self.client.post(
            self.url,
            {**self.payload, "password": ""},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_weak_password_rejected(self):
        response = self.client.post(
            self.url,
            {**self.payload, "password": "123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(phone=self.payload["phone"]).exists())

    def test_no_mechanic_profile_created(self):
        self.client.post(self.url, self.payload, format="json")
        user = User.objects.get(phone=self.payload["phone"])
        self.assertFalse(MechanicProfile.objects.filter(user=user).exists())

    def test_jwt_from_register_authorizes_vehicles(self):
        created = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {created.data['access']}"
        )
        response = self.client.get("/api/v1/vehicles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_malformed_payload_rejected(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_can_login_with_token_after_register(self):
        created = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        token = self.client.post(
            "/api/v1/auth/token/",
            {
                "phone": self.payload["phone"],
                "password": self.payload["password"],
            },
            format="json",
        )
        self.assertEqual(token.status_code, status.HTTP_200_OK)
        self.assertTrue(token.data.get("access"))

    def test_auth_me_returns_customer_profile(self):
        created = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {created.data['access']}"
        )
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["phone"], self.payload["phone"])
        self.assertEqual(response.data["role"], Role.CUSTOMER)
        self.assertEqual(response.data["first_name"], "Davit")
        self.assertNotIn("password", response.data)
