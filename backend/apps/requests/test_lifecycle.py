from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase

from apps.requests.models import MechanicEarning, MechanicRequestOffer, RequestStatus
from apps.requests.routing import RouteResult
from apps.requests.tests import make_customer, make_mechanic
from apps.ratings.models import Rating
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import FuelType, Vehicle


class DiagnosticsLifecycleIntegrationTests(APITestCase):
    """One high-level path: request → earn → rate. Complements narrower unit tests."""

    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.diagnostics = Service.objects.get(code="DIAGNOSTICS")
        self.check_engine = ServiceProblem.objects.get(
            service=self.diagnostics, code="CHECK_ENGINE"
        )
        self.customer_user, self.customer = make_customer("+995555000541")
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000542",
            services=[self.diagnostics],
        )
        self.vehicle = Vehicle.objects.create(
            customer=self.customer,
            make="BMW",
            model="i8",
            year=2015,
            fuel=FuelType.HYBRID,
        )

    def auth(self, user):
        self.client.force_authenticate(user)

    @patch("apps.requests.views.compute_road_route")
    def test_full_diagnostics_lifecycle(self, mock_route):
        mock_route.return_value = RouteResult(
            distance_meters=4200,
            duration_seconds=620,
            coordinates=[
                {"latitude": "41.645123", "longitude": "41.641234"},
                {"latitude": "41.616800", "longitude": "41.636700"},
            ],
        )

        self.auth(self.customer_user)
        created = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(self.diagnostics.id),
                "problem": str(self.check_engine.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
                "customer_address": "Batumi, Georgia",
            },
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        request_id = created.data["id"]
        self.assertIn(created.data["status"], (RequestStatus.REQUESTED, RequestStatus.SEARCHING))
        self.assertEqual(created.data["final_price_amount"], "50.00")
        self.assertEqual(created.data["quote_status"], "APPROVED")

        offer = MechanicRequestOffer.objects.get(
            request_id=request_id, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        accepted = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.assertEqual(accepted.status_code, status.HTTP_200_OK, accepted.data)
        self.assertEqual(accepted.data["request"]["status"], RequestStatus.ACCEPTED)

        ping = self.client.post(
            "/api/v1/mechanic/location/",
            {"latitude": "41.645123", "longitude": "41.641234"},
            format="json",
        )
        self.assertEqual(ping.status_code, status.HTTP_200_OK, ping.data)
        self.assertEqual(ping.data["latitude"], "41.645123")
        self.assertIsNotNone(ping.data["location_updated_at"])

        self.auth(self.customer_user)
        detail = self.client.get(f"/api/v1/requests/{request_id}/")
        mechanic = detail.data["assigned_mechanic"]
        self.assertEqual(mechanic["current_latitude"], "41.645123")

        self.auth(self.mechanic_user)
        driving = self.client.post(
            f"/api/v1/mechanic/jobs/{request_id}/start-driving/"
        )
        self.assertEqual(driving.status_code, status.HTTP_200_OK, driving.data)
        self.assertEqual(driving.data["request"]["status"], RequestStatus.ON_THE_WAY)

        moved = self.client.post(
            "/api/v1/mechanic/location/",
            {"latitude": "41.640000", "longitude": "41.638000"},
            format="json",
        )
        self.assertEqual(moved.status_code, status.HTTP_200_OK, moved.data)

        self.auth(self.customer_user)
        live = self.client.get(f"/api/v1/requests/{request_id}/")
        self.assertEqual(
            live.data["assigned_mechanic"]["current_latitude"], "41.640000"
        )
        route = self.client.get(f"/api/v1/requests/{request_id}/route/")
        self.assertEqual(route.status_code, status.HTTP_200_OK, route.data)
        self.assertTrue(route.data["available"])
        self.assertEqual(route.data["distance_meters"], 4200)
        self.assertEqual(route.data["duration_seconds"], 620)
        self.assertGreaterEqual(len(route.data["coordinates"]), 2)

        self.auth(self.mechanic_user)
        arrived = self.client.post(f"/api/v1/mechanic/jobs/{request_id}/arrive/")
        self.assertEqual(arrived.status_code, status.HTTP_200_OK, arrived.data)
        self.assertEqual(arrived.data["request"]["status"], RequestStatus.ARRIVED)

        self.auth(self.customer_user)
        gone = self.client.get(f"/api/v1/requests/{request_id}/route/")
        self.assertEqual(gone.status_code, status.HTTP_409_CONFLICT)

        self.auth(self.mechanic_user)
        started = self.client.post(
            f"/api/v1/mechanic/jobs/{request_id}/start-service/"
        )
        self.assertEqual(started.status_code, status.HTTP_200_OK, started.data)
        self.assertEqual(started.data["request"]["status"], RequestStatus.IN_PROGRESS)

        completed = self.client.post(
            f"/api/v1/mechanic/jobs/{request_id}/complete/"
        )
        self.assertEqual(completed.status_code, status.HTTP_200_OK, completed.data)
        self.assertEqual(completed.data["request"]["status"], RequestStatus.COMPLETED)
        earning = completed.data["earning"]
        self.assertEqual(earning["gross_amount"], "50.00")
        self.assertEqual(earning["commission_amount"], "10.00")
        self.assertEqual(earning["net_amount"], "40.00")
        self.assertEqual(earning["currency"], "GEL")

        listed = self.client.get("/api/v1/mechanic/earnings/")
        self.assertEqual(listed.status_code, status.HTTP_200_OK, listed.data)
        match = next(
            item
            for item in listed.data["results"]
            if item["request_id"] == request_id
        )
        self.assertEqual(match["net_amount"], "40.00")
        self.assertEqual(
            str(MechanicEarning.objects.get(service_request_id=request_id).net_amount),
            "40.00",
        )

        self.auth(self.customer_user)
        done = self.client.get(f"/api/v1/requests/{request_id}/")
        self.assertEqual(done.data["status"], RequestStatus.COMPLETED)
        self.assertEqual(done.data["final_price_amount"], "50.00")
        self.assertNotIn("current_latitude", done.data["assigned_mechanic"])

        rating = self.client.post(
            "/api/v1/ratings/",
            {
                "request": request_id,
                "stars": 5,
                "feedback": "Automated staging smoke test",
            },
            format="json",
        )
        self.assertEqual(rating.status_code, status.HTTP_201_CREATED, rating.data)
        self.assertEqual(Rating.objects.filter(request_id=request_id).count(), 1)
        mock_route.assert_called()
