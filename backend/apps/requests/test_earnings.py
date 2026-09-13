from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import ApprovalStatus
from apps.requests.earnings import (
    COMMISSION_RATE_PERCENT,
    create_earning_for_completed_request,
)
from apps.requests.models import (
    MechanicEarning,
    MechanicRequestOffer,
    RequestStatus,
    ServiceRequest,
)
from apps.requests.tests import make_customer, make_mechanic
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import FuelType, Vehicle


class MechanicEarningsTests(APITestCase):
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
        self.customer_user, self.customer = make_customer("+995555000241")
        self.mechanic_user, self.mechanic = make_mechanic(
            "+995555000242",
            services=[self.battery, self.diagnostics, self.auto_key],
        )
        self.other_mechanic_user, self.other_mechanic = make_mechanic(
            "+995555000243",
            services=[self.battery, self.diagnostics, self.auto_key],
            name="ნინო",
        )
        self.pending_user, self.pending = make_mechanic(
            "+995555000244",
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

    def drive_to(self, service_request, to_status):
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
        self.auth(self.mechanic_user)
        last = None
        for step in order:
            last = self.client.post(
                f"/api/v1/mechanic/jobs/{service_request.id}/{path_by_status[step]}/"
            )
            self.assertEqual(last.status_code, status.HTTP_200_OK, last.data)
            if step == to_status:
                break
        service_request.refresh_from_db()
        return last

    def complete_job(self, service=None, problem=None):
        created = self.create_request(
            service or self.battery, problem or self.dead
        )
        self.accept(created)
        response = self.drive_to(created, RequestStatus.COMPLETED)
        created.refresh_from_db()
        return created, response

    def test_completing_job_creates_earning(self):
        created, response = self.complete_job()
        earning = MechanicEarning.objects.get(service_request=created)
        self.assertEqual(earning.mechanic_id, self.mechanic.id)
        self.assertEqual(str(earning.gross_amount), "30.00")
        self.assertEqual(earning.commission_rate, COMMISSION_RATE_PERCENT)
        self.assertEqual(str(earning.commission_amount), "6.00")
        self.assertEqual(str(earning.net_amount), "24.00")
        self.assertEqual(earning.currency, "GEL")
        self.assertEqual(response.data["earning"]["gross_amount"], "30.00")
        self.assertEqual(response.data["earning"]["commission_amount"], "6.00")
        self.assertEqual(response.data["earning"]["net_amount"], "24.00")
        self.assertEqual(response.data["earning"]["currency"], "GEL")

    def test_diagnostics_commission_is_twenty_percent(self):
        created, _response = self.complete_job(
            service=self.diagnostics, problem=self.check_engine
        )
        earning = MechanicEarning.objects.get(service_request=created)
        self.assertEqual(str(earning.gross_amount), "50.00")
        self.assertEqual(str(earning.commission_amount), "10.00")
        self.assertEqual(str(earning.net_amount), "40.00")
        self.assertEqual(earning.currency, "GEL")

    def test_one_earning_per_request_and_retry_does_not_duplicate(self):
        created, _response = self.complete_job()
        self.assertEqual(MechanicEarning.objects.filter(service_request=created).count(), 1)
        retry = self.client.post(f"/api/v1/mechanic/jobs/{created.id}/complete/")
        self.assertEqual(retry.status_code, status.HTTP_409_CONFLICT)
        create_earning_for_completed_request(created)
        create_earning_for_completed_request(created)
        self.assertEqual(MechanicEarning.objects.filter(service_request=created).count(), 1)

    def test_cancelled_request_creates_no_earning(self):
        created = self.create_request(self.battery, self.dead)
        self.auth(self.customer_user)
        response = self.client.post(f"/api/v1/requests/{created.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.CANCELLED)
        self.assertFalse(MechanicEarning.objects.filter(service_request=created).exists())

    def test_incomplete_request_creates_no_earning(self):
        created = self.create_request(self.battery, self.dead)
        self.accept(created)
        self.drive_to(created, RequestStatus.IN_PROGRESS)
        self.assertEqual(created.status, RequestStatus.IN_PROGRESS)
        self.assertFalse(MechanicEarning.objects.filter(service_request=created).exists())

    def test_auto_key_requires_approved_final_price_for_earning(self):
        created = self.create_request(self.auto_key, self.locked_out)
        self.accept(created)
        self.drive_to(created, RequestStatus.ARRIVED)
        blocked = self.client.post(
            f"/api/v1/mechanic/jobs/{created.id}/start-service/"
        )
        self.assertEqual(blocked.status_code, status.HTTP_409_CONFLICT)
        propose = self.client.post(
            f"/api/v1/mechanic/jobs/{created.id}/price/",
            {"amount": "120.00"},
            format="json",
        )
        self.assertEqual(propose.status_code, status.HTTP_200_OK, propose.data)
        self.auth(self.customer_user)
        approve = self.client.post(
            f"/api/v1/requests/{created.id}/price/approve/",
            {"amount": "120.00"},
            format="json",
        )
        self.assertEqual(approve.status_code, status.HTTP_200_OK, approve.data)
        self.auth(self.mechanic_user)
        started = self.client.post(
            f"/api/v1/mechanic/jobs/{created.id}/start-service/"
        )
        self.assertEqual(started.status_code, status.HTTP_200_OK, started.data)
        response = self.client.post(f"/api/v1/mechanic/jobs/{created.id}/complete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        created.refresh_from_db()
        self.assertEqual(created.status, RequestStatus.COMPLETED)
        earning = MechanicEarning.objects.get(service_request=created)
        self.assertEqual(str(earning.gross_amount), "120.00")
        self.assertEqual(str(earning.commission_amount), "24.00")
        self.assertEqual(str(earning.net_amount), "96.00")
        self.assertEqual(response.data["earning"]["net_amount"], "96.00")

    def test_mechanic_earnings_endpoint_returns_own_records_and_summary(self):
        first, _ = self.complete_job()
        second, _ = self.complete_job(
            service=self.diagnostics, problem=self.check_engine
        )
        yesterday = MechanicEarning.objects.get(service_request=first)
        MechanicEarning.objects.filter(pk=yesterday.pk).update(
            created_at=timezone.now() - timedelta(days=1)
        )

        self.auth(self.mechanic_user)
        response = self.client.get("/api/v1/mechanic/earnings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        ids = {item["request_id"] for item in response.data["results"]}
        self.assertEqual(ids, {str(first.id), str(second.id)})
        self.assertEqual(response.data["summary"]["currency"], "GEL")
        self.assertEqual(response.data["summary"]["completed_jobs"], 2)
        self.assertEqual(response.data["summary"]["total"], "64.00")
        self.assertEqual(response.data["summary"]["today"], "40.00")
        names = {item["service_name"] for item in response.data["results"]}
        self.assertEqual(names, {"Battery Assistance", "Diagnostics"})

    def test_mechanic_cannot_see_another_mechanics_earnings(self):
        created, _ = self.complete_job()
        self.auth(self.other_mechanic_user)
        response = self.client.get("/api/v1/mechanic/earnings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["summary"]["completed_jobs"], 0)
        self.assertEqual(response.data["summary"]["total"], "0.00")
        self.assertEqual(response.data["results"], [])
        self.assertTrue(MechanicEarning.objects.filter(service_request=created).exists())

    def test_customer_cannot_access_earnings(self):
        self.complete_job()
        self.auth(self.customer_user)
        response = self.client.get("/api/v1/mechanic/earnings/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_pending_mechanic_cannot_access_earnings(self):
        self.complete_job()
        self.auth(self.pending_user)
        response = self.client.get("/api/v1/mechanic/earnings/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("awaiting approval", str(response.data["detail"]).lower())

    def test_earning_belongs_to_assigned_mechanic_only(self):
        created, _ = self.complete_job()
        earning = MechanicEarning.objects.get(service_request=created)
        self.assertEqual(earning.mechanic_id, created.assigned_mechanic_id)
        self.assertEqual(earning.mechanic_id, self.mechanic.id)
        self.assertNotEqual(earning.mechanic_id, self.other_mechanic.id)
