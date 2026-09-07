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

    def test_customer_request_detail_includes_public_assigned_mechanic(self):
        created = self.create_battery_request()
        self.auth(self.customer_user)
        searching = self.client.get(f"/api/v1/requests/{created.id}/")
        self.assertEqual(searching.status_code, status.HTTP_200_OK)
        self.assertIsNone(searching.data["assigned_mechanic"])
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.auth(self.customer_user)
        detail = self.client.get(f"/api/v1/requests/{created.id}/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        mechanic = detail.data["assigned_mechanic"]
        self.assertEqual(mechanic["id"], str(self.mechanic.id))
        self.assertEqual(mechanic["first_name"], "გიორგი")
        self.assertTrue(mechanic["verified"])
        self.assertIn("rating_average", mechanic)
        self.assertEqual(mechanic["phone"], self.mechanic_user.phone)
        self.assertNotIn("email", mechanic)
        self.assertNotIn("last_name", mechanic)
        self.assertIsNone(detail.data["customer_phone"])
        self.assertEqual(detail.data["status"], RequestStatus.ACCEPTED)

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
        response = self.client.get("/api/v1/mechanic/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MechanicOperationalApiTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.customer_user, self.customer = make_customer("+995555000051")
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000052", services=[self.battery]
        )
        self.other_mechanic_user, self.other_mechanic = make_mechanic(
            "+995555000053",
            services=[self.battery],
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

    def accept_job(self):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        response = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        return created, offer

    def post_transition(self, request_id, action):
        return self.client.post(f"/api/v1/mechanic/jobs/{request_id}/{action}/")

    def history_count(self, service_request):
        return service_request.status_history.count()

    def assert_transition(self, service_request, action, to_status, timestamp_field=None):
        before = self.history_count(service_request)
        response = self.post_transition(service_request.id, action)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["request"]["status"], to_status)
        self.assertEqual(response.data["request"]["id"], str(service_request.id))
        service_request.refresh_from_db()
        self.assertEqual(service_request.status, to_status)
        self.assertEqual(self.history_count(service_request), before + 1)
        last = service_request.status_history.order_by("created_at").last()
        self.assertEqual(last.to_status, to_status)
        self.assertEqual(last.changed_by_id, self.mechanic_user.id)
        if timestamp_field:
            self.assertIsNotNone(getattr(service_request, timestamp_field))
        return response

    def test_accepted_to_on_the_way_succeeds(self):
        created, _offer = self.accept_job()
        self.assert_transition(created, "start-driving", RequestStatus.ON_THE_WAY)
        self.assertIsNone(getattr(created, "on_the_way_at", None))

    def test_on_the_way_to_arrived_succeeds(self):
        created, _offer = self.accept_job()
        self.assert_transition(created, "start-driving", RequestStatus.ON_THE_WAY)
        self.assert_transition(
            created, "arrive", RequestStatus.ARRIVED, timestamp_field="arrived_at"
        )

    def test_arrived_to_in_progress_succeeds(self):
        created, _offer = self.accept_job()
        self.assert_transition(created, "start-driving", RequestStatus.ON_THE_WAY)
        self.assert_transition(created, "arrive", RequestStatus.ARRIVED)
        self.assert_transition(
            created,
            "start-service",
            RequestStatus.IN_PROGRESS,
            timestamp_field="started_at",
        )

    def test_in_progress_to_completed_succeeds(self):
        created, _offer = self.accept_job()
        self.assert_transition(created, "start-driving", RequestStatus.ON_THE_WAY)
        self.assert_transition(created, "arrive", RequestStatus.ARRIVED)
        self.assert_transition(created, "start-service", RequestStatus.IN_PROGRESS)
        self.assert_transition(
            created, "complete", RequestStatus.COMPLETED, timestamp_field="completed_at"
        )

    def test_each_transition_creates_exactly_one_history_row(self):
        created, _offer = self.accept_job()
        baseline = self.history_count(created)
        for action, to_status in (
            ("start-driving", RequestStatus.ON_THE_WAY),
            ("arrive", RequestStatus.ARRIVED),
            ("start-service", RequestStatus.IN_PROGRESS),
            ("complete", RequestStatus.COMPLETED),
        ):
            self.assert_transition(created, action, to_status)
        self.assertEqual(self.history_count(created), baseline + 4)

    def test_stage_skipping_returns_conflict(self):
        created, _offer = self.accept_job()
        before = self.history_count(created)
        for action in ("arrive", "start-service", "complete"):
            response = self.post_transition(created.id, action)
            self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.ACCEPTED)
        self.assertEqual(self.history_count(created), before)

        self.assert_transition(created, "start-driving", RequestStatus.ON_THE_WAY)
        before = self.history_count(created)
        response = self.post_transition(created.id, "complete")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.ON_THE_WAY)
        self.assertEqual(self.history_count(created), before)

    def test_completed_job_cannot_transition_again(self):
        created, _offer = self.accept_job()
        for action in ("start-driving", "arrive", "start-service", "complete"):
            self.assert_transition(
                created,
                action,
                {
                    "start-driving": RequestStatus.ON_THE_WAY,
                    "arrive": RequestStatus.ARRIVED,
                    "start-service": RequestStatus.IN_PROGRESS,
                    "complete": RequestStatus.COMPLETED,
                }[action],
            )
        before = self.history_count(created)
        response = self.post_transition(created.id, "complete")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.COMPLETED)
        self.assertEqual(self.history_count(created), before)

    def test_another_mechanic_cannot_update_the_job(self):
        created, _offer = self.accept_job()
        self.auth(self.other_mechanic_user)
        response = self.post_transition(created.id, "start-driving")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.ACCEPTED)

    def test_customer_cannot_use_mechanic_transition_api(self):
        created, _offer = self.accept_job()
        self.auth(self.customer_user)
        response = self.post_transition(created.id, "start-driving")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_transition_returns_401(self):
        created, _offer = self.accept_job()
        self.client.force_authenticate(user=None)
        response = self.post_transition(created.id, "start-driving")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_active_endpoint_returns_on_the_way_job(self):
        created, offer = self.accept_job()
        self.post_transition(created.id, "start-driving")
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["id"], str(offer.id))
        self.assertEqual(active.data["request"]["status"], RequestStatus.ON_THE_WAY)

    def test_active_endpoint_returns_arrived_job(self):
        created, offer = self.accept_job()
        self.post_transition(created.id, "start-driving")
        self.post_transition(created.id, "arrive")
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["id"], str(offer.id))
        self.assertEqual(active.data["request"]["status"], RequestStatus.ARRIVED)

    def test_active_endpoint_returns_in_progress_job(self):
        created, offer = self.accept_job()
        self.post_transition(created.id, "start-driving")
        self.post_transition(created.id, "arrive")
        self.post_transition(created.id, "start-service")
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["id"], str(offer.id))
        self.assertEqual(active.data["request"]["status"], RequestStatus.IN_PROGRESS)

    def test_completed_job_is_not_returned_as_active(self):
        created, _offer = self.accept_job()
        for action in ("start-driving", "arrive", "start-service", "complete"):
            self.post_transition(created.id, action)
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_204_NO_CONTENT)

    def test_mechanic_online_state_can_be_read(self):
        self.auth(self.mechanic_user)
        response = self.client.get("/api/v1/mechanic/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["online"])
        self.assertEqual(response.data["id"], str(self.mechanic.id))
        self.assertEqual(response.data["first_name"], "გიორგი")
        self.assertEqual(response.data["phone"], self.mechanic_user.phone)
        self.assertIn("services", response.data)

    def test_mechanic_can_set_online_false(self):
        self.auth(self.mechanic_user)
        response = self.client.patch(
            "/api/v1/mechanic/me/", {"online": False}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["online"])
        self.mechanic.refresh_from_db()
        self.assertFalse(self.mechanic.online)

    def test_offline_mechanic_receives_no_new_offers(self):
        self.auth(self.mechanic_user)
        self.client.patch("/api/v1/mechanic/me/", {"online": False}, format="json")
        created = self.create_battery_request()
        self.assertFalse(
            MechanicRequestOffer.objects.filter(
                request=created, mechanic=self.mechanic
            ).exists()
        )
        self.auth(self.mechanic_user)
        inbox = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(inbox.data["count"], 0)

    def test_online_mechanic_can_receive_eligible_offers(self):
        self.auth(self.mechanic_user)
        self.client.patch("/api/v1/mechanic/me/", {"online": False}, format="json")
        self.client.patch("/api/v1/mechanic/me/", {"online": True}, format="json")
        created = self.create_battery_request()
        self.assertTrue(
            MechanicRequestOffer.objects.filter(
                request=created, mechanic=self.mechanic, status=OfferStatus.PENDING
            ).exists()
        )

    def test_going_offline_does_not_clear_active_accepted_job(self):
        created, offer = self.accept_job()
        self.client.patch("/api/v1/mechanic/me/", {"online": False}, format="json")
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.ACCEPTED)
        self.assertEqual(created.assigned_mechanic_id, self.mechanic.id)
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["id"], str(offer.id))

    def test_completion_makes_mechanic_eligible_again_if_online(self):
        created, _offer = self.accept_job()
        for action in ("start-driving", "arrive", "start-service", "complete"):
            self.post_transition(created.id, action)
        second = self.create_battery_request()
        self.assertTrue(
            MechanicRequestOffer.objects.filter(
                request=second, mechanic=self.mechanic, status=OfferStatus.PENDING
            ).exists()
        )

    def test_going_offline_expires_pending_offers(self):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.assertEqual(offer.status, OfferStatus.PENDING)
        self.auth(self.mechanic_user)
        self.client.patch("/api/v1/mechanic/me/", {"online": False}, format="json")
        offer.refresh_from_db()
        created.refresh_from_db()
        self.assertEqual(offer.status, OfferStatus.EXPIRED)
        self.assertEqual(created.status, RequestStatus.SEARCHING)
        self.assertIsNone(created.assigned_mechanic_id)
        inbox = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(inbox.data["count"], 0)

    def test_coming_online_revives_expired_searching_offers(self):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        self.client.patch("/api/v1/mechanic/me/", {"online": False}, format="json")
        offer.refresh_from_db()
        self.assertEqual(offer.status, OfferStatus.EXPIRED)
        self.client.patch("/api/v1/mechanic/me/", {"online": True}, format="json")
        offer.refresh_from_db()
        self.assertEqual(offer.status, OfferStatus.PENDING)
        inbox = self.client.get("/api/v1/mechanic/offers/")
        self.assertGreaterEqual(inbox.data["count"], 1)

    def test_duplicate_transition_returns_conflict(self):
        created, _offer = self.accept_job()
        first = self.post_transition(created.id, "start-driving")
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        before = self.history_count(created)
        second = self.post_transition(created.id, "start-driving")
        self.assertEqual(second.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(self.history_count(created), before)


class MechanicApprovalEnforcementTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.customer_user, self.customer = make_customer("+995555000141")
        self.approved_user, self.approved = make_mechanic(
            "+995555000142", services=[self.battery]
        )
        self.pending_user, self.pending = make_mechanic(
            "+995555000143",
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
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        return ServiceRequest.objects.get(id=response.data["id"])

    def test_unapproved_mechanic_can_read_me(self):
        self.auth(self.pending_user)
        response = self.client.get("/api/v1/mechanic/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["approval_status"], ApprovalStatus.PENDING)
        self.assertFalse(response.data["verified"])
        self.assertFalse(response.data["online"])
        self.assertEqual(response.data["phone"], self.pending_user.phone)

    def test_unapproved_mechanic_cannot_go_online(self):
        self.auth(self.pending_user)
        response = self.client.patch(
            "/api/v1/mechanic/me/", {"online": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("awaiting approval", str(response.data["detail"]).lower())
        self.pending.refresh_from_db()
        self.assertFalse(self.pending.online)

    def test_unapproved_mechanic_cannot_list_offers(self):
        self.create_battery_request()
        self.auth(self.pending_user)
        response = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            MechanicRequestOffer.objects.filter(mechanic=self.pending).exists()
        )

    def test_unapproved_mechanic_cannot_accept_offer(self):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.approved
        )
        foreign = MechanicRequestOffer.objects.create(
            request=created,
            mechanic=self.pending,
            status=OfferStatus.PENDING,
        )
        self.auth(self.pending_user)
        response = self.client.post(f"/api/v1/mechanic/offers/{foreign.id}/accept/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        created.refresh_from_db()
        self.assertIsNone(created.assigned_mechanic_id)
        offer.refresh_from_db()
        self.assertEqual(offer.status, OfferStatus.PENDING)

    def test_unapproved_mechanic_cannot_access_active_job(self):
        self.auth(self.pending_user)
        response = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_approved_mechanic_can_go_online(self):
        self.auth(self.approved_user)
        response = self.client.patch(
            "/api/v1/mechanic/me/", {"online": False}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["online"])
        response = self.client.patch(
            "/api/v1/mechanic/me/", {"online": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["online"])


class CustomerCancelRequestTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.customer_user, self.customer = make_customer("+995555000151")
        self.other_customer_user, self.other_customer = make_customer(
            "+995555000152", "Other"
        )
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000153", services=[self.battery]
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
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        return ServiceRequest.objects.get(id=response.data["id"])

    def cancel(self, request_id, user=None):
        self.auth(user or self.customer_user)
        return self.client.post(f"/api/v1/requests/{request_id}/cancel/")

    def test_customer_can_cancel_requested(self):
        self.mechanic.online = False
        self.mechanic.save(update_fields=["online", "updated_at"])
        created = self.create_battery_request()
        self.assertEqual(created.status, RequestStatus.REQUESTED)
        response = self.cancel(created.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.CANCELLED)
        self.assertEqual(created.cancelled_by, "CUSTOMER")

    def test_customer_can_cancel_searching(self):
        created = self.create_battery_request()
        self.assertEqual(created.status, RequestStatus.SEARCHING)
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic, status=OfferStatus.PENDING
        )
        response = self.cancel(created.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        offer.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.CANCELLED)
        self.assertEqual(offer.status, OfferStatus.EXPIRED)
        self.auth(self.mechanic_user)
        inbox = self.client.get("/api/v1/mechanic/offers/")
        self.assertEqual(inbox.data["count"], 0)
        accept = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.assertEqual(accept.status_code, status.HTTP_409_CONFLICT)

    def test_customer_can_cancel_assigned(self):
        created = self.create_battery_request()
        created.assigned_mechanic = self.mechanic
        created.transition_status(RequestStatus.ASSIGNED, changed_by=self.customer_user)
        response = self.cancel(created.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.CANCELLED)

    def test_other_customer_cannot_cancel(self):
        created = self.create_battery_request()
        response = self.cancel(created.id, user=self.other_customer_user)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.SEARCHING)

    def test_mechanic_cannot_cancel_customer_request(self):
        created = self.create_battery_request()
        self.auth(self.mechanic_user)
        response = self.client.post(f"/api/v1/requests/{created.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.SEARCHING)

    def _drive_to(self, to_status):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        path_by_status = {
            RequestStatus.ON_THE_WAY: "start-driving",
            RequestStatus.ARRIVED: "arrive",
            RequestStatus.IN_PROGRESS: "start-service",
            RequestStatus.COMPLETED: "complete",
        }
        order = [
            RequestStatus.ON_THE_WAY,
            RequestStatus.ARRIVED,
            RequestStatus.IN_PROGRESS,
            RequestStatus.COMPLETED,
        ]
        for step in order:
            self.client.post(
                f"/api/v1/mechanic/jobs/{created.id}/{path_by_status[step]}/"
            )
            if step == to_status:
                break
        created.refresh_from_db()
        self.assertEqual(created.status, to_status)
        return created

    def test_cannot_cancel_accepted(self):
        created = self.create_battery_request()
        offer = MechanicRequestOffer.objects.get(
            request=created, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        response = self.cancel(created.id)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.ACCEPTED)

    def test_cannot_cancel_on_the_way(self):
        created = self._drive_to(RequestStatus.ON_THE_WAY)
        response = self.cancel(created.id)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_cannot_cancel_arrived(self):
        created = self._drive_to(RequestStatus.ARRIVED)
        response = self.cancel(created.id)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_cannot_cancel_in_progress(self):
        created = self._drive_to(RequestStatus.IN_PROGRESS)
        response = self.cancel(created.id)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_cannot_cancel_completed(self):
        created = self._drive_to(RequestStatus.COMPLETED)
        response = self.cancel(created.id)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_cannot_rate_cancelled_request(self):
        created = self.create_battery_request()
        self.cancel(created.id)
        self.auth(self.customer_user)
        response = self.client.post(
            "/api/v1/ratings/",
            {"request": str(created.id), "stars": 5},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ContactAuthorizationTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.customer_user, self.customer = make_customer("+995555000161")
        self.other_customer_user, self.other_customer = make_customer(
            "+995555000162", "Other"
        )
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000163", services=[self.battery]
        )
        self.other_mechanic_user, self.other_mechanic = make_mechanic(
            "+995555000164", services=[self.battery], name="Nino"
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

    def create_and_accept(self):
        self.auth(self.customer_user)
        created = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(self.battery.id),
                "problem": str(self.dead.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
            },
            format="json",
        )
        request_id = created.data["id"]
        offer = MechanicRequestOffer.objects.get(
            request_id=request_id, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        accepted = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.assertEqual(accepted.status_code, status.HTTP_200_OK, accepted.data)
        return request_id, accepted.data

    def test_pending_offer_does_not_include_customer_phone(self):
        self.auth(self.customer_user)
        self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(self.battery.id),
                "problem": str(self.dead.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
            },
            format="json",
        )
        self.auth(self.mechanic_user)
        inbox = self.client.get("/api/v1/mechanic/offers/")
        offer = inbox.data["results"][0]
        self.assertNotIn("customer_phone", offer["request"])
        self.assertNotIn("phone", offer["request"])

    def test_assigned_customer_can_see_mechanic_phone(self):
        request_id, _accepted = self.create_and_accept()
        self.auth(self.customer_user)
        detail = self.client.get(f"/api/v1/requests/{request_id}/")
        self.assertEqual(
            detail.data["assigned_mechanic"]["phone"], self.mechanic_user.phone
        )

    def test_assigned_mechanic_can_see_customer_phone(self):
        _request_id, accepted = self.create_and_accept()
        self.assertEqual(
            accepted["request"]["customer_phone"], self.customer_user.phone
        )
        self.auth(self.mechanic_user)
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(
            active.data["request"]["customer_phone"], self.customer_user.phone
        )

    def test_unrelated_customer_cannot_access_contact(self):
        request_id, _accepted = self.create_and_accept()
        self.auth(self.other_customer_user)
        detail = self.client.get(f"/api/v1/requests/{request_id}/")
        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_unrelated_mechanic_cannot_access_contact(self):
        request_id, _accepted = self.create_and_accept()
        self.auth(self.other_mechanic_user)
        detail = self.client.get(f"/api/v1/requests/{request_id}/")
        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)
        active = self.client.get("/api/v1/mechanic/jobs/active/")
        self.assertEqual(active.status_code, status.HTTP_204_NO_CONTENT)
