from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import ApprovalStatus
from apps.requests.models import (
    MechanicEarning,
    MechanicRequestOffer,
    QuoteStatus,
    RequestStatus,
    ServiceRequest,
)
from apps.requests.quotes import (
    COMPLETION_PRICE_REQUIRED,
    START_SERVICE_PRICE_REQUIRED,
)
from apps.requests.tests import make_customer, make_mechanic
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import FuelType, Vehicle


class FinalPriceQuoteTests(APITestCase):
    def setUp(self):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.battery = Service.objects.get(code="BATTERY")
        self.diagnostics = Service.objects.get(code="DIAGNOSTICS")
        self.auto_key = Service.objects.get(code="AUTO_KEY")
        self.dead = ServiceProblem.objects.get(service=self.battery, code="DEAD_BATTERY")
        self.check_engine = ServiceProblem.objects.get(
            service=self.diagnostics, code="CHECK_ENGINE"
        )
        self.locked_out = ServiceProblem.objects.get(
            service=self.auto_key, code="LOCKED_OUT"
        )
        self.customer_user, self.customer = make_customer("+995555000341")
        self.other_customer_user, self.other_customer = make_customer(
            "+995555000342", "Other"
        )
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000343",
            services=[self.battery, self.diagnostics, self.auto_key],
        )
        self.other_mechanic_user, self.other_mechanic = make_mechanic(
            "+995555000344",
            services=[self.battery, self.diagnostics, self.auto_key],
            name="ნინო",
        )
        self.pending_user, self.pending = make_mechanic(
            "+995555000345",
            services=[self.auto_key],
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

    def create_request(self, service, problem):
        self.auth(self.customer_user)
        response = self.client.post(
            "/api/v1/requests/",
            {
                "vehicle": str(self.vehicle.id),
                "service": str(service.id),
                "problem": str(problem.id),
                "customer_latitude": "41.616800",
                "customer_longitude": "41.636700",
                "customer_address": "Batumi, Georgia",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        return ServiceRequest.objects.get(id=response.data["id"]), response

    def accept(self, service_request):
        offer = MechanicRequestOffer.objects.get(
            request=service_request, mechanic=self.mechanic
        )
        self.auth(self.mechanic_user)
        response = self.client.post(f"/api/v1/mechanic/offers/{offer.id}/accept/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        service_request.refresh_from_db()
        return service_request

    def drive(self, service_request, *actions):
        self.auth(self.mechanic_user)
        last = None
        for action in actions:
            last = self.client.post(
                f"/api/v1/mechanic/jobs/{service_request.id}/{action}/"
            )
            self.assertEqual(last.status_code, status.HTTP_200_OK, last.data)
        service_request.refresh_from_db()
        return last

    def propose(self, service_request, amount, user=None):
        self.auth(user or self.mechanic_user)
        return self.client.post(
            f"/api/v1/mechanic/jobs/{service_request.id}/price/",
            {"amount": amount},
            format="json",
        )

    def approve(self, service_request, amount=None, user=None):
        self.auth(user or self.customer_user)
        body = {} if amount is None else {"amount": amount}
        return self.client.post(
            f"/api/v1/requests/{service_request.id}/price/approve/",
            body,
            format="json",
        )

    def reject(self, service_request, user=None):
        self.auth(user or self.customer_user)
        return self.client.post(
            f"/api/v1/requests/{service_request.id}/price/reject/"
        )

    def test_fixed_price_request_gets_final_price(self):
        created, response = self.create_request(self.diagnostics, self.check_engine)
        self.assertEqual(str(created.estimated_price_amount), "50.00")
        self.assertEqual(str(created.final_price_amount), "50.00")
        self.assertEqual(created.quote_status, QuoteStatus.APPROVED)
        self.assertTrue(created.price_confirmed_by_customer)
        self.assertEqual(response.data["final_price_amount"], "50.00")
        self.assertEqual(response.data["quote_status"], QuoteStatus.APPROVED)

    def test_fixed_price_lifecycle_still_works(self):
        created, _ = self.create_request(self.diagnostics, self.check_engine)
        self.accept(created)
        complete = self.drive(
            created, "start-driving", "arrive", "start-service", "complete"
        )
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.COMPLETED)
        earning = MechanicEarning.objects.get(service_request=created)
        self.assertEqual(str(earning.gross_amount), "50.00")
        self.assertEqual(str(earning.commission_amount), "10.00")
        self.assertEqual(str(earning.net_amount), "40.00")
        self.assertEqual(complete.data["earning"]["net_amount"], "40.00")

    def test_variable_price_starts_with_no_final_price(self):
        created, response = self.create_request(self.auto_key, self.locked_out)
        self.assertIsNone(created.estimated_price_amount)
        self.assertIsNone(created.final_price_amount)
        self.assertEqual(created.quote_status, QuoteStatus.NONE)
        self.assertIsNone(response.data["final_price_amount"])
        self.assertEqual(response.data["quote_status"], QuoteStatus.NONE)

    def test_assigned_mechanic_can_propose_price(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        response = self.propose(created, "120.00")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        self.assertEqual(str(created.final_price_amount), "120.00")
        self.assertEqual(created.quote_status, QuoteStatus.PENDING)
        self.assertFalse(created.price_confirmed_by_customer)
        self.assertEqual(response.data["request"]["final_price_amount"], "120.00")
        self.assertEqual(response.data["request"]["quote_status"], QuoteStatus.PENDING)

    def test_unrelated_mechanic_cannot_propose_price(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        response = self.propose(created, "120.00", user=self.other_mechanic_user)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_sees_proposed_price(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.propose(created, "120.00")
        self.auth(self.customer_user)
        detail = self.client.get(f"/api/v1/requests/{created.id}/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["final_price_amount"], "120.00")
        self.assertEqual(detail.data["quote_status"], QuoteStatus.PENDING)
        self.assertFalse(detail.data["price_confirmed_by_customer"])

    def test_owning_customer_can_approve(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.propose(created, "120.00")
        response = self.approve(created, "120.00")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        self.assertEqual(created.quote_status, QuoteStatus.APPROVED)
        self.assertTrue(created.price_confirmed_by_customer)
        self.assertIsNotNone(created.price_confirmed_at)
        self.assertEqual(response.data["quote_status"], QuoteStatus.APPROVED)

    def test_unrelated_customer_cannot_approve(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.propose(created, "120.00")
        response = self.approve(created, "120.00", user=self.other_customer_user)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_can_reject_and_mechanic_can_repropose(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.propose(created, "120.00")
        rejected = self.reject(created)
        self.assertEqual(rejected.status_code, status.HTTP_200_OK, rejected.data)
        created.refresh_from_db()
        self.assertEqual(created.quote_status, QuoteStatus.REJECTED)
        self.assertFalse(created.price_confirmed_by_customer)
        self.assertEqual(str(created.final_price_amount), "120.00")
        again = self.propose(created, "100.00")
        self.assertEqual(again.status_code, status.HTTP_200_OK, again.data)
        created.refresh_from_db()
        self.assertEqual(str(created.final_price_amount), "100.00")
        self.assertEqual(created.quote_status, QuoteStatus.PENDING)

    def test_new_price_resets_previous_approval(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.propose(created, "120.00")
        self.approve(created, "120.00")
        created.refresh_from_db()
        self.assertEqual(created.quote_status, QuoteStatus.APPROVED)
        changed = self.propose(created, "90.00")
        self.assertEqual(changed.status_code, status.HTTP_200_OK, changed.data)
        created.refresh_from_db()
        self.assertEqual(str(created.final_price_amount), "90.00")
        self.assertEqual(created.quote_status, QuoteStatus.PENDING)
        self.assertFalse(created.price_confirmed_by_customer)
        self.assertIsNone(created.price_confirmed_at)

    def test_stale_approval_does_not_lock_old_amount(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.propose(created, "120.00")
        self.propose(created, "90.00")
        stale = self.approve(created, "120.00")
        self.assertEqual(stale.status_code, status.HTTP_409_CONFLICT)
        created.refresh_from_db()
        self.assertEqual(created.quote_status, QuoteStatus.PENDING)
        self.assertEqual(str(created.final_price_amount), "90.00")

    def test_mechanic_cannot_propose_zero_or_negative(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        zero = self.propose(created, "0")
        self.assertEqual(zero.status_code, status.HTTP_400_BAD_REQUEST)
        negative = self.propose(created, "-10.00")
        self.assertEqual(negative.status_code, status.HTTP_400_BAD_REQUEST)
        created.refresh_from_db()
        self.assertIsNone(created.final_price_amount)

    def test_invalid_decimal_is_rejected(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        response = self.propose(created, "abc")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mechanic_cannot_change_price_after_in_progress(self):
        created, _ = self.create_request(self.diagnostics, self.check_engine)
        self.accept(created)
        self.drive(created, "start-driving", "arrive", "start-service")
        response = self.propose(created, "80.00")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        created.refresh_from_db()
        self.assertEqual(str(created.final_price_amount), "50.00")
        self.assertEqual(created.quote_status, QuoteStatus.APPROVED)

    def test_start_service_blocked_without_approved_price(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.drive(created, "start-driving", "arrive")
        response = self.client.post(
            f"/api/v1/mechanic/jobs/{created.id}/start-service/"
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn(
            START_SERVICE_PRICE_REQUIRED.lower(),
            str(response.data["detail"]).lower(),
        )

    def test_start_service_succeeds_after_customer_approval(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.drive(created, "start-driving", "arrive")
        self.propose(created, "100.00")
        self.approve(created, "100.00")
        started = self.drive(created, "start-service")
        self.assertEqual(started.data["request"]["status"], RequestStatus.IN_PROGRESS)

    def test_completion_blocked_without_final_price(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.drive(created, "start-driving", "arrive")
        created.status = RequestStatus.IN_PROGRESS
        created.save(update_fields=["status", "updated_at"])
        self.auth(self.mechanic_user)
        response = self.client.post(f"/api/v1/mechanic/jobs/{created.id}/complete/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn(
            COMPLETION_PRICE_REQUIRED.lower(),
            str(response.data["detail"]).lower(),
        )

    def test_earning_uses_approved_final_price(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.drive(created, "start-driving", "arrive")
        self.propose(created, "120.00")
        self.approve(created, "120.00")
        complete = self.drive(created, "start-service", "complete")
        earning = MechanicEarning.objects.get(service_request=created)
        self.assertEqual(earning.mechanic_id, self.mechanic.id)
        self.assertEqual(str(earning.gross_amount), "120.00")
        self.assertEqual(str(earning.commission_amount), "24.00")
        self.assertEqual(str(earning.net_amount), "96.00")
        self.assertEqual(earning.currency, "GEL")
        self.assertEqual(complete.data["earning"]["gross_amount"], "120.00")

    def test_duplicate_completion_creates_one_earning(self):
        created, _ = self.create_request(self.diagnostics, self.check_engine)
        self.accept(created)
        self.drive(created, "start-driving", "arrive", "start-service", "complete")
        retry = self.client.post(f"/api/v1/mechanic/jobs/{created.id}/complete/")
        self.assertEqual(retry.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            MechanicEarning.objects.filter(service_request=created).count(), 1
        )

    def test_cancelled_request_cannot_approve_or_reject_price(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.auth(self.customer_user)
        cancel = self.client.post(f"/api/v1/requests/{created.id}/cancel/")
        self.assertEqual(cancel.status_code, status.HTTP_200_OK, cancel.data)
        approve = self.approve(created, "50.00")
        self.assertEqual(approve.status_code, status.HTTP_409_CONFLICT)
        reject = self.reject(created)
        self.assertEqual(reject.status_code, status.HTTP_409_CONFLICT)

    def test_pending_mechanic_cannot_propose_price(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        response = self.propose(created, "80.00", user=self.pending_user)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_cannot_set_price_directly(self):
        created, _ = self.create_request(self.auto_key, self.locked_out)
        self.auth(self.customer_user)
        response = self.client.post(
            f"/api/v1/mechanic/jobs/{created.id}/price/",
            {"amount": "50.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        patch = self.client.patch(
            f"/api/v1/requests/{created.id}/",
            {"final_price_amount": "50.00"},
            format="json",
        )
        self.assertEqual(patch.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        created.refresh_from_db()
        self.assertIsNone(created.final_price_amount)
        self.assertEqual(created.quote_status, QuoteStatus.NONE)
