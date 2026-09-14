from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import ApprovalStatus, CustomerProfile, MechanicProfile, Role, User
from apps.requests.models import (
    MechanicRequestOffer,
    OfferStatus,
    RequestStatus,
    ServiceRequest,
)
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import FuelType, Vehicle


def make_customer(phone: str, name: str = "ნიკა"):
    user = User.objects.create_user(phone=phone, password="Devpass123!", role=Role.CUSTOMER)
    profile = CustomerProfile.objects.create(user=user, first_name=name)
    return user, profile


def make_mechanic(phone: str, *, services=None, name="გიორგი"):
    user = User.objects.create_user(phone=phone, password="Devpass123!", role=Role.MECHANIC)
    profile = MechanicProfile.objects.create(
        user=user,
        first_name=name,
        verified=True,
        online=True,
        approval_status=ApprovalStatus.APPROVED,
    )
    if services:
        profile.services.set(services)
    return user, profile


class MvpIntegrityTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.diagnostics = Service.objects.get(code="DIAGNOSTICS")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.check_engine = ServiceProblem.objects.get(
            service=self.diagnostics, code="CHECK_ENGINE"
        )
        self.customer_user, self.customer = make_customer("+995555000201")
        self.other_user, self.other_customer = make_customer("+995555000202", "Other")
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000203", services=[self.battery, self.diagnostics]
        )
        self.other_mechanic_user, self.other_mechanic = make_mechanic(
            "+995555000204",
            services=[self.battery, self.diagnostics],
            name="ნინო",
        )
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

    def auth(self, user):
        self.client.force_authenticate(user)

    def create_request(self, *, user=None, vehicle=None, service=None, problem=None):
        self.auth(user or self.customer_user)
        response = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str((vehicle or self.vehicle).id),
                "service": str((service or self.battery).id),
                "problem": str((problem or self.dead).id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
                "customer_address": "Batumi, Georgia",
            },
            format="json",
        )
        return response

    def test_active_request_endpoint_empty_and_populated(self):
        self.auth(self.customer_user)
        empty = self.client.get("/api/v1/requests/active/")
        self.assertEqual(empty.status_code, status.HTTP_204_NO_CONTENT)

        created = self.create_request()
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        active = self.client.get("/api/v1/requests/active/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["id"], created.data["id"])
        self.assertIn(active.data["status"], ("REQUESTED", "SEARCHING"))

        self.auth(self.other_user)
        hidden = self.client.get("/api/v1/requests/active/")
        self.assertEqual(hidden.status_code, status.HTTP_204_NO_CONTENT)
        missing = self.client.get(f"/api/v1/requests/{created.data['id']}/")
        self.assertEqual(missing.status_code, status.HTTP_404_NOT_FOUND)

    def test_second_active_request_returns_409(self):
        first = self.create_request()
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.create_request()
        self.assertEqual(second.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("already have an active", str(second.data).lower())
        self.assertEqual(
            ServiceRequest.objects.filter(customer=self.customer).count(), 1
        )

    def test_can_create_after_cancel(self):
        first = self.create_request()
        request_id = first.data["id"]
        cancelled = self.client.post(f"/api/v1/requests/{request_id}/cancel/")
        self.assertEqual(cancelled.status_code, status.HTTP_200_OK)
        second = self.create_request()
        self.assertEqual(second.status_code, status.HTTP_201_CREATED, second.data)

    def test_mechanic_cannot_accept_second_active_job(self):
        first = self.create_request()
        offer = MechanicRequestOffer.objects.get(
            request_id=first.data["id"], mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        accepted = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)

        second = self.create_request(
            user=self.other_user,
            vehicle=self.other_vehicle,
        )
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.auth(self.mechanic_user)
        inbox = self.client.get("/api/v1/mechanic/offers/")
        ids = [item["id"] for item in inbox.data["results"]]
        self.assertEqual(ids, [])

        leftover = MechanicRequestOffer.objects.create(
            request_id=second.data["id"],
            mechanic=self.mechanic,
            status=OfferStatus.PENDING,
        )
        conflict = self.client.post(f"/api/v1/mechanic/offers/{leftover.id}/accept/")
        self.assertEqual(conflict.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("already have an active job", str(conflict.data).lower())

    def test_service_toggle_stops_matching(self):
        self.auth(self.mechanic_user)
        patched = self.client.patch(
            "/api/v1/mechanic/me/",
            {"services": [str(self.diagnostics.id)]},
            format="json",
        )
        self.assertEqual(patched.status_code, status.HTTP_200_OK, patched.data)
        codes = {item["code"] for item in patched.data["services"]}
        self.assertEqual(codes, {"DIAGNOSTICS"})

        created = self.create_request()
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertFalse(
            MechanicRequestOffer.objects.filter(
                request_id=created.data["id"], mechanic=self.mechanic
            ).exists()
        )

    def test_service_toggle_requires_at_least_one(self):
        self.auth(self.mechanic_user)
        response = self.client.patch(
            "/api/v1/mechanic/me/", {"services": []}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mechanic_history_is_own_completed_only(self):
        created = self.create_request()
        offer = MechanicRequestOffer.objects.get(
            request_id=created.data["id"], mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        request_id = created.data["id"]
        for action in ("start-driving", "arrive", "start-service", "complete"):
            response = self.client.post(f"/api/v1/mechanic/jobs/{request_id}/{action}/")
            self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        history = self.client.get("/api/v1/mechanic/jobs/history/")
        self.assertEqual(history.status_code, status.HTTP_200_OK)
        ids = [item["request_id"] for item in history.data["results"]]
        self.assertIn(str(request_id), ids)
        row = next(item for item in history.data["results"] if item["request_id"] == str(request_id))
        self.assertEqual(row["status"], RequestStatus.COMPLETED)
        self.assertEqual(row["net_amount"], "24.00")

        self.auth(self.other_mechanic_user)
        other_history = self.client.get("/api/v1/mechanic/jobs/history/")
        other_ids = [item["request_id"] for item in other_history.data["results"]]
        self.assertNotIn(str(request_id), other_ids)

    def test_customer_list_contains_completed_and_hides_live_coords(self):
        created = self.create_request()
        offer = MechanicRequestOffer.objects.get(
            request_id=created.data["id"], mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        request_id = created.data["id"]
        for action in ("start-driving", "arrive", "start-service", "complete"):
            self.client.post(f"/api/v1/mechanic/jobs/{request_id}/{action}/")

        self.auth(self.customer_user)
        listed = self.client.get("/api/v1/requests/")
        ids = [item["id"] for item in listed.data["results"]]
        self.assertIn(str(request_id), ids)
        row = next(item for item in listed.data["results"] if item["id"] == str(request_id))
        self.assertEqual(row["status"], RequestStatus.COMPLETED)
        mechanic = row["assigned_mechanic"] or {}
        self.assertNotIn("current_latitude", mechanic)
        active = self.client.get("/api/v1/requests/active/")
        self.assertEqual(active.status_code, status.HTTP_204_NO_CONTENT)

    def test_profile_first_name_patch(self):
        self.auth(self.customer_user)
        response = self.client.patch(
            "/api/v1/auth/me/", {"first_name": "Davit"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Davit")
        self.assertEqual(response.data["phone"], self.customer_user.phone)
        self.assertEqual(response.data["role"], Role.CUSTOMER)

        blocked = self.client.patch(
            "/api/v1/auth/me/",
            {"role": Role.ADMIN, "phone": "+995555000999"},
            format="json",
        )
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.customer_user.refresh_from_db()
        self.assertEqual(self.customer_user.role, Role.CUSTOMER)
        self.assertEqual(self.customer_user.phone, "+995555000201")

        self.auth(self.mechanic_user)
        mechanic = self.client.patch(
            "/api/v1/mechanic/me/", {"first_name": "Luka"}, format="json"
        )
        self.assertEqual(mechanic.status_code, status.HTTP_200_OK)
        self.assertEqual(mechanic.data["first_name"], "Luka")
        self.assertEqual(mechanic.data["approval_status"], ApprovalStatus.APPROVED)
