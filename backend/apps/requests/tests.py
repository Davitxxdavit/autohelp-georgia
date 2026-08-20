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


def make_mechanic(phone: str, *, services=None, online=True, name="გიორგი"):
    user = User.objects.create_user(phone=phone, password="Devpass123!", role=Role.MECHANIC)
    profile = MechanicProfile.objects.create(
        user=user,
        first_name=name,
        verified=True,
        online=online,
        approval_status=ApprovalStatus.APPROVED,
    )
    if services:
        profile.services.set(services)
    return user, profile


class MechanicOfferApiTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.auto_key = Service.objects.get(code="AUTO_KEY")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.customer_user, self.customer = make_customer("+995555000041")
        self.other_customer_user, self.other_customer = make_customer(
            "+995555000042", "Other"
        )
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000043", services=[self.battery, self.auto_key]
        )
        self.other_mechanic_user, self.other_mechanic = make_mechanic(
            "+995555000044",
            services=[self.battery, self.auto_key],
            name="ნინო",
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

    def create_battery_request(self):
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

    def test_eligible_request_creates_mechanic_offer(self):
        created = self.create_battery_request()
        self.assertEqual(created.status, RequestStatus.SEARCHING)
        self.assertIsNone(created.assigned_mechanic_id)
        self.assertEqual(
            MechanicRequestOffer.objects.filter(
                request=created, status=OfferStatus.PENDING
            ).count(),
            2,
        )
        self.auth(self.mechanic_user)
        response = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        offer = response.data["results"][0]
        self.assertEqual(offer["request"]["service_code"], "BATTERY")
        self.assertEqual(offer["request"]["customer_display_name"], "ნიკა")
        self.assertNotIn("phone", offer["request"])
        self.assertEqual(offer["request"]["vehicle"]["make"], "BMW")

    def test_customer_cannot_access_mechanic_offers(self):
        self.create_battery_request()
        self.auth(self.customer_user)
        response = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mechanic_only_sees_own_offers(self):
        created = self.create_battery_request()
        self.auth(self.mechanic_user)
        mine = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(mine.data["count"], 1)
        own_id = mine.data["results"][0]["id"]
        other_offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.other_mechanic
        )
        self.assertNotEqual(str(other_offer.id), own_id)
        hidden = self.client.post(f"/api/v1/mechanic/offers/{other_offer.id}/accept/")
        self.assertEqual(hidden.status_code, status.HTTP_404_NOT_FOUND)

    def test_mechanic_can_accept_own_pending_offer(self):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        response = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        offer.refresh_from_db()
        self.assertEqual(offer.status, OfferStatus.ACCEPTED)
        self.assertEqual(created.assigned_mechanic_id, self.mechanic.id)
        self.assertEqual(created.status, RequestStatus.ACCEPTED)
        history = list(created.status_history.order_by("created_at").values_list("to_status", flat=True))
        self.assertEqual(
            history,
            [
                RequestStatus.REQUESTED,
                RequestStatus.SEARCHING,
                RequestStatus.ASSIGNED,
                RequestStatus.ACCEPTED,
            ],
        )
        other = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.other_mechanic
        )
        self.assertEqual(other.status, OfferStatus.EXPIRED)

    def test_mechanic_can_decline_own_offer(self):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        response = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/decline/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        offer.refresh_from_db()
        self.assertEqual(offer.status, OfferStatus.DECLINED)
        self.assertIsNone(created.assigned_mechanic_id)
        self.assertEqual(created.status, RequestStatus.SEARCHING)
        self.assertNotEqual(created.status, RequestStatus.DECLINED)
        self.assertNotEqual(created.status, RequestStatus.CANCELLED)

    def test_second_mechanic_cannot_accept_claimed_request(self):
        created = self.create_battery_request()
        first = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        second = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.other_mechanic
        )
        self.auth(self.mechanic_user)
        accepted = self.client.post(f"/api/v1/mechanic/offers/{first.id}/accept/")
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)
        self.auth(self.other_mechanic_user)
        conflict = self.client.post(f"/api/v1/mechanic/offers/{second.id}/accept/")
        self.assertEqual(conflict.status_code, status.HTTP_409_CONFLICT)

    def test_unsupported_service_does_not_receive_offer(self):
        self.mechanic.services.set([self.auto_key])
        self.other_mechanic.services.set([self.auto_key])
        created = self.create_battery_request()
        self.assertEqual(created.status, RequestStatus.REQUESTED)
        self.assertFalse(MechanicRequestOffer.objects.filter(request=created).exists())
        self.auth(self.mechanic_user)
        response = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(response.data["count"], 0)

    def test_mechanic_with_active_job_does_not_receive_another_offer(self):
        first = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(request=first, mechanic=self.mechanic)
        self.auth(self.mechanic_user)
        self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        second = self.create_battery_request()
        self.assertFalse(
            MechanicRequestOffer.objects.filter(
                request=second, mechanic=self.mechanic
            ).exists()
        )
        self.assertTrue(
            MechanicRequestOffer.objects.filter(
                request=second, mechanic=self.other_mechanic, status=OfferStatus.PENDING
            ).exists()
        )

    def test_active_job_endpoint_returns_accepted_job(self):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        empty = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(empty.status_code, status.HTTP_204_NO_CONTENT)
        self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["id"], str(offer.id))
        self.assertEqual(active.data["request"]["status"], RequestStatus.ACCEPTED)

    def test_inbox_lazily_offers_existing_requested_jobs(self):
        leftover = ServiceRequest.objects.create(
            customer=self.customer,
            vehicle=self.vehicle,
            service=self.battery,
            problem=self.dead,
            status=RequestStatus.REQUESTED,
            customer_latitude="41.616800",
            customer_longitude="41.636700",
            customer_address="Batumi, Georgia",
        )
        self.assertFalse(
            MechanicRequestOffer.objects.filter(request=leftover).exists()
        )
        self.auth(self.mechanic_user)
        response = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        leftover.refresh_from_db()
        self.assertEqual(leftover.status, RequestStatus.SEARCHING)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_unauthenticated_access_returns_401(self):
        response = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
