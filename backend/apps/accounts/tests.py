import warnings

import yaml
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.jwt import PhoneTokenObtainPairSerializer
from apps.accounts.models import CustomerProfile, Role, User
from apps.vehicles.models import FuelType, Vehicle


class SchemaEndpointTests(APITestCase):
    def test_openapi_schema_ok(self):
        response = self.client.get("/api/schema/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_schema_does_not_warn_on_request_status_enum(self):
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            response = self.client.get("/api/schema/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        enum_warnings = [
            item
            for item in caught
            if "choice set" in str(item.message).lower()
            or "ToStatusEnum" in str(item.message)
        ]
        self.assertEqual(enum_warnings, [])

    def test_swagger_ui_ok(self):
        response = self.client.get("/api/docs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_redoc_ok(self):
        response = self.client.get("/api/redoc/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_obtain_schema_uses_phone_not_username(self):
        response = self.client.get("/api/schema/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        schema = yaml.safe_load(response.content)
        operation = schema["paths"]["/api/v1/auth/token/"]["post"]
        request_schema = operation["requestBody"]["content"]["application/json"][
            "schema"
        ]
        if "$ref" in request_schema:
            ref = request_schema["$ref"].rsplit("/", 1)[-1]
            request_schema = schema["components"]["schemas"][ref]
        properties = request_schema.get("properties", {})
        self.assertIn("phone", properties)
        self.assertIn("password", properties)
        self.assertNotIn("username", properties)

    def test_register_schema_exists(self):
        response = self.client.get("/api/schema/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        schema = yaml.safe_load(response.content)
        self.assertIn("/api/v1/auth/register/", schema["paths"])
        operation = schema["paths"]["/api/v1/auth/register/"]["post"]
        request_schema = operation["requestBody"]["content"]["application/json"][
            "schema"
        ]
        if "$ref" in request_schema:
            ref = request_schema["$ref"].rsplit("/", 1)[-1]
            request_schema = schema["components"]["schemas"][ref]
        properties = request_schema.get("properties", {})
        self.assertIn("phone", properties)
        self.assertIn("password", properties)
        self.assertIn("first_name", properties)

    def test_mechanic_register_schema_exists(self):
        response = self.client.get("/api/schema/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        schema = yaml.safe_load(response.content)
        self.assertIn("/api/v1/auth/mechanic/register/", schema["paths"])
        self.assertIn("/api/v1/auth/me/", schema["paths"])


class PhoneTokenObtainTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            phone="+995555000001",
            password="Devpass123!",
            role=Role.CUSTOMER,
        )
        self.customer = CustomerProfile.objects.create(
            user=self.user,
            first_name="ნიკა",
        )
        Vehicle.objects.create(
            customer=self.customer,
            make="BMW",
            model="i8",
            year=2015,
            fuel=FuelType.HYBRID,
        )

    def test_username_field_is_phone(self):
        self.assertEqual(User.USERNAME_FIELD, "phone")
        self.assertEqual(PhoneTokenObtainPairSerializer.username_field, "phone")
        serializer = PhoneTokenObtainPairSerializer()
        self.assertIn("phone", serializer.fields)
        self.assertNotIn("username", serializer.fields)

    def test_valid_credentials_return_token_pair(self):
        response = self.client.post(
            "/api/v1/auth/token/",
            {"phone": "+995555000001", "password": "Devpass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("access"))
        self.assertTrue(response.data.get("refresh"))

    def test_wrong_password_returns_401(self):
        response = self.client.post(
            "/api/v1/auth/token/",
            {"phone": "+995555000001", "password": "Wrongpass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_phone_returns_400(self):
        response = self.client.post(
            "/api/v1/auth/token/",
            {"password": "Devpass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_access_token_authorizes_vehicles(self):
        token = self.client.post(
            "/api/v1/auth/token/",
            {"phone": "+995555000001", "password": "Devpass123!"},
            format="json",
        )
        self.assertEqual(token.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.data['access']}")
        response = self.client.get("/api/v1/vehicles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)
