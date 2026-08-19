from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomerProfile, MechanicProfile, Role, User
from apps.ratings.models import Rating
from apps.requests.models import RequestStatus, ServiceRequest
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import FuelType, Vehicle


class RatingApiTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.user = User.objects.create_user(
            phone="+995555000031", password="Devpass123!", role=Role.CUSTOMER
        )
        self.customer = CustomerProfile.objects.create(user=self.user, first_name="ნიკა")
        self.mechanic_user = User.objects.create_user(
            phone="+995555000032", password="Devpass123!", role=Role.MECHANIC
        )
        self.mechanic = MechanicProfile.objects.create(
            user=self.mechanic_user, first_name="გიორგი"
        )
        self.vehicle = Vehicle.objects.create(
            customer=self.customer,
            make="BMW",
            model="i8",
            year=2015,
            fuel=FuelType.HYBRID,
        )
        battery = Service.objects.get(code="BATTERY")
        problem = ServiceProblem.objects.get(service=battery, code="DEAD_BATTERY")
        self.completed = ServiceRequest.objects.create(
            customer=self.customer,
            vehicle=self.vehicle,
            service=battery,
            problem=problem,
            assigned_mechanic=self.mechanic,
            status=RequestStatus.COMPLETED,
            customer_latitude="41.616800",
            customer_longitude="41.636700",
        )
        self.in_progress = ServiceRequest.objects.create(
            customer=self.customer,
            vehicle=self.vehicle,
            service=battery,
            problem=problem,
            assigned_mechanic=self.mechanic,
            status=RequestStatus.IN_PROGRESS,
            customer_latitude="41.616800",
            customer_longitude="41.636700",
        )

    def test_cannot_rate_incomplete_request(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/v1/ratings/",
            {"request": str(self.in_progress.id), "stars": 5},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stars_must_be_1_to_5(self):
        self.client.force_authenticate(self.user)
        for stars in (0, 6):
            response = self.client.post(
                "/api/v1/ratings/",
                {"request": str(self.completed.id), "stars": stars},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_one_rating_per_request(self):
        self.client.force_authenticate(self.user)
        first = self.client.post(
            "/api/v1/ratings/",
            {"request": str(self.completed.id), "stars": 5, "feedback": "Good"},
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.client.post(
            "/api/v1/ratings/",
            {"request": str(self.completed.id), "stars": 4},
            format="json",
        )
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Rating.objects.filter(request=self.completed).count(), 1)

    def test_rating_binds_request_customer_and_mechanic(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/v1/ratings/",
            {"request": str(self.completed.id), "stars": 5},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        rating = Rating.objects.get(id=response.data["id"])
        self.assertEqual(rating.customer_id, self.customer.id)
        self.assertEqual(rating.mechanic_id, self.mechanic.id)
