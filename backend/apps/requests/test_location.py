from unittest.mock import patch

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import ApprovalStatus
from apps.requests.location import (
    LIVE_LOCATION_STATUSES,
    MECHANIC_LOCATION_UNAVAILABLE,
    NO_ACTIVE_TRIP,
)
from apps.requests.models import MechanicRequestOffer, RequestStatus, ServiceRequest
from apps.requests.routing import RouteResult
from apps.requests.tests import make_customer, make_mechanic
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import FuelType, Vehicle


class MechanicLiveLocationTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.customer_user, self.customer = make_customer("+995555000441")
        self.other_customer_user, self.other_customer = make_customer(
            "+995555000442", "Other"
        )
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000443", services=[self.battery]
        )
        self.other_mechanic_user, self.other_mechanic = make_mechanic(
            "+995555000444",
            services=[self.battery],
            name="ნინო",
        )
        self.pending_user, self.pending = make_mechanic(
            "+995555000445",
            services=[self.battery],
            online=False,
            name="Pending",
        )
        self.pending.verified = False
        self.pending.approval_status = ApprovalStatus.PENDING
        self.pending.save(update_fields=["verified", "approval_status", "updated_at"])
        self.vehicle = Vehicle.objects.create(
            customer=self.customer,
            make="BMW",
            model="i8",
            year=2015,
            fuel=FuelType.HYBRID,
        )

    def auth(self, user):
        self.client.force_authenticate(user)

    def create_request(self):
        self.auth(self.customer_user)
        response = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(self.battery.id),
                "problem": str(self.dead.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
                "customer_address": "Batumi, Georgia",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        return ServiceRequest.objects.get(id=response.data["id"])

    def accept(self, service_request):
        offer = MechanicRequestOffer.objects.get(
            request=service_request, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        response = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        service_request.refresh_from_db()
        return service_request

    def post_location(self, latitude="41.645123", longitude="41.641234", user=None):
        self.auth(user or self.mechanic_user)
        return self.client.post(
            "/api/v1/mechanic/location/",
            {"latitude": latitude, "longitude": longitude},
            format="json",
        )

    def test_approved_mechanic_can_update_own_location(self):
        created = self.create_request()
        self.accept(created)
        before = timezone.now()
        response = self.post_location()
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.mechanic.refresh_from_db()
        self.assertEqual(str(self.mechanic.current_latitude), "41.645123")
        self.assertEqual(str(self.mechanic.current_longitude), "41.641234")
        self.assertIsNotNone(self.mechanic.location_updated_at)
        self.assertGreaterEqual(self.mechanic.location_updated_at, before)
        self.assertEqual(response.data["latitude"], "41.645123")

    def test_customer_cannot_update_mechanic_location(self):
        created = self.create_request()
        self.accept(created)
        response = self.post_location(user=self.customer_user)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.mechanic.refresh_from_db()
        self.assertIsNone(self.mechanic.current_latitude)

    def test_pending_mechanic_cannot_update_location(self):
        created = self.create_request()
        self.accept(created)
        response = self.post_location(user=self.pending_user)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_latitude_rejected(self):
        created = self.create_request()
        self.accept(created)
        response = self.post_location(latitude="91.000000")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_longitude_rejected(self):
        created = self.create_request()
        self.accept(created)
        response = self.post_location(longitude="181.000000")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_extra_decimal_places_are_quantized(self):
        created = self.create_request()
        self.accept(created)
        response = self.post_location(latitude="41.6451234", longitude="41.6412345")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.mechanic.refresh_from_db()
        self.assertIsNone(self.mechanic.current_latitude)

    def test_location_timestamp_is_server_owned(self):
        created = self.create_request()
        self.accept(created)
        self.auth(self.mechanic_user)
        response = self.client.post(
            "/api/v1/mechanic/location/",
            {
                "latitude": "41.645123",
                "longitude": "41.641234",
                "location_updated_at": "2020-01-01T00:00:00Z",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.mechanic.refresh_from_db()
        self.assertNotEqual(self.mechanic.location_updated_at.year, 2020)

    def test_location_rejected_without_active_trip(self):
        response = self.post_location()
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn(NO_ACTIVE_TRIP.lower(), str(response.data["detail"]).lower())

    def test_owning_customer_sees_assigned_mechanic_location(self):
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.customer_user)
        detail = self.client.get(f"/api/v1/requests/{created.id}/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        mechanic = detail.data["assigned_mechanic"]
        self.assertEqual(mechanic["current_latitude"], "41.645123")
        self.assertEqual(mechanic["current_longitude"], "41.641234")
        self.assertIsNotNone(mechanic["location_updated_at"])

    def test_unrelated_customer_cannot_see_mechanic_location(self):
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.other_customer_user)
        detail = self.client.get(f"/api/v1/requests/{created.id}/")
        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_unrelated_mechanic_cannot_access_active_job_or_route(self):
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.other_mechanic_user)
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_204_NO_CONTENT)
        route = self.client.get(f"/api/v1/requests/{created.id}/route/")
        self.assertEqual(route.status_code, status.HTTP_404_NOT_FOUND)

    def test_cancelled_request_does_not_expose_live_location(self):
        created = self.create_request()
        self.accept(created)
        self.post_location()
        created.status = RequestStatus.CANCELLED
        created.save(update_fields=["status"])
        self.auth(self.customer_user)
        detail = self.client.get(f"/api/v1/requests/{created.id}/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        mechanic = detail.data["assigned_mechanic"]
        self.assertIsNotNone(mechanic)
        self.assertNotIn("current_latitude", mechanic)
        self.assertNotIn("current_longitude", mechanic)
        ping = self.post_location()
        self.assertEqual(ping.status_code, status.HTTP_409_CONFLICT)

    def test_in_progress_request_does_not_expose_live_location(self):
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.mechanic_user)
        for action in ("start-driving", "arrive", "start-service"):
            response = self.client.post(
                f"/api/v1/mechanic/jobs/{created.id}/{action}/"
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.auth(self.customer_user)
        detail = self.client.get(f"/api/v1/requests/{created.id}/")
        self.assertEqual(detail.data["status"], RequestStatus.IN_PROGRESS)
        mechanic = detail.data["assigned_mechanic"]
        self.assertNotIn("current_latitude", mechanic)
        self.assertNotIn("current_longitude", mechanic)

    def test_completed_request_does_not_expose_live_location(self):
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.mechanic_user)
        for action in ("start-driving", "arrive", "start-service", "complete"):
            response = self.client.post(
                f"/api/v1/mechanic/jobs/{created.id}/{action}/"
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.auth(self.customer_user)
        detail = self.client.get(f"/api/v1/requests/{created.id}/")
        self.assertEqual(detail.data["status"], RequestStatus.COMPLETED)
        mechanic = detail.data["assigned_mechanic"]
        self.assertNotIn("current_latitude", mechanic)
        self.assertNotIn("current_longitude", mechanic)
        self.assertNotIn(detail.data["status"], LIVE_LOCATION_STATUSES)

    def test_assigned_mechanic_gets_customer_coordinates(self):
        created = self.create_request()
        self.accept(created)
        self.auth(self.mechanic_user)
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["request"]["customer_latitude"], "41.616800")
        self.assertEqual(active.data["request"]["customer_longitude"], "41.636700")
        self.assertEqual(active.data["request"]["customer_address"], "Batumi, Georgia")

    @patch("apps.requests.views.compute_road_route")
    def test_route_owner_customer_allowed(self, mock_route):
        mock_route.return_value = RouteResult(
            distance_meters=4200,
            duration_seconds=620,
            coordinates=[
                {"latitude": "41.645123", "longitude": "41.641234"},
                {"latitude": "41.616800", "longitude": "41.636700"},
            ],
        )
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.customer_user)
        response = self.client.get(f"/api/v1/requests/{created.id}/route/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["available"])
        self.assertEqual(response.data["distance_meters"], 4200)
        self.assertEqual(response.data["duration_seconds"], 620)
        self.assertEqual(len(response.data["coordinates"]), 2)
        mock_route.assert_called_once()

    @patch("apps.requests.views.compute_road_route")
    def test_route_assigned_mechanic_allowed(self, mock_route):
        mock_route.return_value = RouteResult(
            distance_meters=1000,
            duration_seconds=120,
            coordinates=[],
        )
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.mechanic_user)
        response = self.client.get(f"/api/v1/requests/{created.id}/route/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["available"])

    def test_unrelated_user_route_access_rejected(self):
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.other_customer_user)
        response = self.client.get(f"/api/v1/requests/{created.id}/route/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch("apps.requests.views.compute_road_route")
    def test_route_provider_failure_returns_safe_payload(self, mock_route):
        mock_route.return_value = None
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.customer_user)
        response = self.client.get(f"/api/v1/requests/{created.id}/route/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(response.data["available"])
        self.assertIsNone(response.data["distance_meters"])
        self.assertIsNone(response.data["duration_seconds"])
        self.assertEqual(response.data["coordinates"], [])
        self.assertEqual(response.data["origin"]["latitude"], "41.645123")
        self.assertEqual(response.data["destination"]["latitude"], "41.616800")

    @patch("apps.requests.views.compute_road_route")
    def test_route_ignores_client_supplied_coordinates(self, mock_route):
        mock_route.return_value = None
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.customer_user)
        response = self.client.get(
            f"/api/v1/requests/{created.id}/route/",
            {"origin": "1.0,2.0", "destination": "3.0,4.0"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        kwargs = mock_route.call_args.kwargs
        self.assertEqual(str(kwargs["origin_latitude"]), "41.645123")
        self.assertEqual(str(kwargs["destination_latitude"]), "41.616800")

    def test_route_requires_mechanic_location(self):
        created = self.create_request()
        self.accept(created)
        self.auth(self.customer_user)
        response = self.client.get(f"/api/v1/requests/{created.id}/route/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn(
            MECHANIC_LOCATION_UNAVAILABLE.lower(),
            str(response.data["detail"]).lower(),
        )

    def test_route_unavailable_after_arrival(self):
        created = self.create_request()
        self.accept(created)
        self.post_location()
        self.auth(self.mechanic_user)
        driving = self.client.post(
            f"/api/v1/mechanic/jobs/{created.id}/start-driving/"
        )
        self.assertEqual(driving.status_code, status.HTTP_200_OK, driving.data)
        arrive = self.client.post(f"/api/v1/mechanic/jobs/{created.id}/arrive/")
        self.assertEqual(arrive.status_code, status.HTTP_200_OK, arrive.data)
        self.auth(self.customer_user)
        response = self.client.get(f"/api/v1/requests/{created.id}/route/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        detail = self.client.get(f"/api/v1/requests/{created.id}/")
        mechanic = detail.data["assigned_mechanic"]
        self.assertEqual(mechanic["current_latitude"], "41.645123")
