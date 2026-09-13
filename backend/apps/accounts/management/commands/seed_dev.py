from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import ApprovalStatus, CustomerProfile, MechanicProfile, Role, User
from apps.requests.models import RequestStatus, ServiceRequest, ServiceRequestStatusHistory
from apps.requests.pricing import estimate_for_request
from apps.requests.quotes import price_init_kwargs
from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem
from apps.vehicles.models import FuelType, Vehicle

DEV_CUSTOMER_PHONE = "+995555000001"
DEV_MECHANIC_PHONE = "+995555000002"
DEV_PASSWORD = "Devpass123!"


class Command(BaseCommand):
    help = "Development-only sample customer, mechanic, BMW i8, and optional request."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-request",
            action="store_true",
            help="Also create a REQUESTED Battery job for the sample customer.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_dev is only available when DEBUG=true.")

        seed_catalog(service_model=Service, problem_model=ServiceProblem)

        customer_user, created = User.objects.get_or_create(
            phone=DEV_CUSTOMER_PHONE,
            defaults={"role": Role.CUSTOMER, "email": "nika@example.com"},
        )
        if created or not customer_user.has_usable_password():
            customer_user.set_password(DEV_PASSWORD)
            customer_user.role = Role.CUSTOMER
            customer_user.save()
        customer, _ = CustomerProfile.objects.get_or_create(
            user=customer_user,
            defaults={"first_name": "ნიკა", "last_name": "", "preferred_language": "ka"},
        )

        mechanic_user, created = User.objects.get_or_create(
            phone=DEV_MECHANIC_PHONE,
            defaults={"role": Role.MECHANIC, "email": "giorgi@example.com"},
        )
        if created or not mechanic_user.has_usable_password():
            mechanic_user.set_password(DEV_PASSWORD)
            mechanic_user.role = Role.MECHANIC
            mechanic_user.save()
        mechanic, _ = MechanicProfile.objects.get_or_create(
            user=mechanic_user,
            defaults={
                "first_name": "გიორგი",
                "last_name": "",
                "verified": True,
                "online": True,
                "rating_average": "4.90",
                "rating_count": 12,
                "approval_status": ApprovalStatus.APPROVED,
            },
        )
        mechanic.services.set(Service.objects.filter(active=True))

        vehicle, _ = Vehicle.objects.get_or_create(
            customer=customer,
            make="BMW",
            model="i8",
            year=2015,
            defaults={
                "fuel": FuelType.HYBRID,
                "engine": "1.5 hybrid",
                "vin": "WBY2Z2C59FV123456",
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Dev users ready.\n"
                f"  Customer phone: {DEV_CUSTOMER_PHONE}\n"
                f"  Mechanic phone: {DEV_MECHANIC_PHONE}\n"
                f"  Password (DEV ONLY): {DEV_PASSWORD}\n"
                f"  Vehicle: {vehicle}"
            )
        )

        if options["with_request"]:
            battery = Service.objects.get(code="BATTERY")
            problem = ServiceProblem.objects.get(service=battery, code="DEAD_BATTERY")
            request = ServiceRequest.objects.create(
                customer=customer,
                vehicle=vehicle,
                service=battery,
                problem=problem,
                status=RequestStatus.REQUESTED,
                customer_latitude="41.616800",
                customer_longitude="41.636700",
                customer_address="Batumi, Georgia",
                **price_init_kwargs(estimate_for_request(battery, problem)),
            )
            ServiceRequestStatusHistory.objects.create(
                request=request,
                from_status="",
                to_status=RequestStatus.REQUESTED,
                changed_by=customer_user,
                note="seed_dev",
            )
            self.stdout.write(self.style.SUCCESS(f"Sample request: {request.id}"))
