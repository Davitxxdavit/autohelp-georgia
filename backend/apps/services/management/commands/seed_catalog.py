from django.core.management.base import BaseCommand

from apps.services.catalog import seed_catalog
from apps.services.models import Service, ServiceProblem


class Command(BaseCommand):
    help = "Upsert BATTERY, DIAGNOSTICS, and AUTO_KEY catalog data."

    def handle(self, *args, **options):
        seed_catalog(service_model=Service, problem_model=ServiceProblem)
        self.stdout.write(self.style.SUCCESS("Service catalog seeded."))
