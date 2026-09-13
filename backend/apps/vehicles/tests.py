from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomerProfile, MechanicProfile, Role, User
from apps.common.validators import normalize_vin, validate_vin
from apps.requests.models import RequestStatus, ServiceRequest
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import FuelType, Vehicle


def make_customer(phone: str, name: str = "ნიკა") -> tuple[User, CustomerProfile]:
    user = User.objects.create_user(phone=phone, password="Devpass123!", role=Role.CUSTOMER)
    profile = CustomerProfile.objects.create(user=user, first_name=name)
    return user, profile


def make_mechanic(phone: str) -> tuple[User, MechanicProfile]:
    user = User.objects.create_user(phone=phone, password="Devpass123!", role=Role.MECHANIC)
    profile = MechanicProfile.objects.create(
        user=user,
        first_name="გიორგი",
        verified=True,
        online=True,
        approval_status="APPROVED",
    )
    return user, profile


class VinTests(TestCase):
    def test_normalize_uppercases(self):
        self.assertEqual(normalize_vin(" wby2z2c59fv123456 "), "WBY2Z2C59FV123456")

    def test_blank_becomes_none(self):
        self.assertIsNone(normalize_vin("  "))

    def test_invalid_length(self):
        with self.assertRaises(ValidationError):
            validate_vin("SHORT")

    def test_rejects_ioq(self):
        with self.assertRaises(ValidationError):
            validate_vin("IIIIIIIIIIIIIIIII")


class VehicleOwnershipTests(APITestCase):
    def setUp(self):
        self.user_a, self.customer_a = make_customer("+995555000011", "A")
        self.user_b, self.customer_b = make_customer("+995555000012", "B")
        self.vehicle_a = Vehicle.objects.create(
            customer=self.customer_a,
            make="BMW",
            model="i8",
            year=2015,
            fuel=FuelType.HYBRID,
        )

    def test_customer_cannot_access_another_vehicle(self):
        self.client.force_authenticate(self.user_b)
        response = self.client.get(f"/api/v1/vehicles/{self.vehicle_a.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_get_vehicle(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.get(f"/api/v1/vehicles/{self.vehicle_a.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["make"], "BMW")

    def test_two_vehicles_without_vin_are_allowed(self):
        Vehicle.objects.create(
            customer=self.customer_a,
            make="Toyota",
            model="Prius",
            year=2018,
            fuel=FuelType.HYBRID,
            vin=None,
        )
        Vehicle.objects.create(
            customer=self.customer_b,
            make="Nissan",
            model="Leaf",
            year=2020,
            fuel=FuelType.ELECTRIC,
            vin=None,
        )
        self.assertEqual(Vehicle.objects.filter(vin__isnull=True).count(), 3)


class RequestApiTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.user, self.customer = make_customer("+995555000021")
        self.other_user, self.other_customer = make_customer("+995555000022", "Other")
        self.mechanic_user, self.mechanic = make_mechanic("+995555000023")
        self.vehicle = Vehicle.objects.create(
            customer=self.customer,
            make="BMW",
            model="i8",
            year=2015,
            fuel=FuelType.HYBRID,
        )
        self.other_vehicle = Vehicle.objects.create(
            customer=self.other_customer,
            make="Audi",
            model="A4",
            year=2016,
            fuel=FuelType.PETROL,
        )
        self.battery = Service.objects.get(code="BATTERY")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.replacement = ServiceProblem.objects.get(
            service=self.battery, code="BATTERY_REPLACEMENT"
        )
        self.auto_key = Service.objects.get(code="AUTO_KEY")
        self.locked = ServiceProblem.objects.get(service=self.auto_key, code="LOCKED_OUT")
        self.check_engine = ServiceProblem.objects.get(code="CHECK_ENGINE")

    def auth(self, user):
        self.client.force_authenticate(user)

    def test_create_request_sets_requested_and_estimate(self):
        self.auth(self.user)
        response = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(self.battery.id),
                "problem": str(self.dead.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
                "customer_address": "Batumi, Georgia",
                "status": RequestStatus.COMPLETED,
                "assigned_mechanic": str(self.mechanic.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        created = ServiceRequest.objects.get(id=response.data["id"])
        self.assertEqual(created.status, RequestStatus.REQUESTED)
        self.assertIsNone(created.assigned_mechanic_id)
        self.assertEqual(str(created.estimated_price_amount), "30.00")
        self.assertEqual(str(created.final_price_amount), "30.00")
        self.assertEqual(created.quote_status, "APPROVED")
        self.assertTrue(created.price_confirmed_by_customer)
        self.assertFalse(created.price_is_estimate)

    def test_battery_replacement_estimate_is_60(self):
        self.auth(self.user)
        response = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(self.battery.id),
                "problem": str(self.replacement.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        created = ServiceRequest.objects.get(id=response.data["id"])
        self.assertEqual(str(created.estimated_price_amount), "60.00")

    def test_auto_key_estimate_is_null(self):
        self.auth(self.user)
        response = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(self.auto_key.id),
                "problem": str(self.locked.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        created = ServiceRequest.objects.get(id=response.data["id"])
        self.assertIsNone(created.estimated_price_amount)
        self.assertIsNone(created.final_price_amount)
        self.assertEqual(created.quote_status, "NONE")
        self.assertFalse(created.price_confirmed_by_customer)

    def test_problem_must_belong_to_service(self):
        self.auth(self.user)
        response = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(self.battery.id),
                "problem": str(self.check_engine.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_use_another_customers_vehicle(self):
        self.auth(self.user)
        response = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.other_vehicle.id),
                "service": str(self.battery.id),
                "problem": str(self.dead.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mechanic_does_not_see_unassigned_requests(self):
        request = ServiceRequest.objects.create(
            customer=self.customer,
            vehicle=self.vehicle,
            service=self.battery,
            problem=self.dead,
            status=RequestStatus.REQUESTED,
            customer_latitude="41.616800",
            customer_longitude="41.636700",
        )
        self.auth(self.mechanic_user)
        response = self.client.get("/api/v1/requests/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertNotIn(str(request.id), ids)

    def test_customer_cannot_see_another_request(self):
        request = ServiceRequest.objects.create(
            customer=self.customer,
            vehicle=self.vehicle,
            service=self.battery,
            problem=self.dead,
            status=RequestStatus.REQUESTED,
            customer_latitude="41.616800",
            customer_longitude="41.636700",
        )
        self.auth(self.other_user)
        response = self.client.get(f"/api/v1/requests/{request.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
