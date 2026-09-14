from django.db import migrations, models
from django.utils import timezone


ACTIVE_CUSTOMER = (
    "REQUESTED",
    "SEARCHING",
    "ASSIGNED",
    "ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "IN_PROGRESS",
)

ACTIVE_JOB = (
    "ASSIGNED",
    "ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "IN_PROGRESS",
)


def collapse_duplicate_active_rows(apps, schema_editor):
    ServiceRequest = apps.get_model("service_requests", "ServiceRequest")
    now = timezone.now()

    by_customer: dict = {}
    for row in ServiceRequest.objects.filter(status__in=ACTIVE_CUSTOMER).order_by(
        "created_at"
    ):
        by_customer.setdefault(row.customer_id, []).append(row)
    for rows in by_customer.values():
        for extra in rows[:-1]:
            extra.status = "CANCELLED"
            extra.cancelled_by = "SYSTEM"
            extra.cancelled_at = now
            extra.save(update_fields=["status", "cancelled_by", "cancelled_at"])

    by_mechanic: dict = {}
    for row in ServiceRequest.objects.filter(
        status__in=ACTIVE_JOB, assigned_mechanic_id__isnull=False
    ).order_by("created_at"):
        by_mechanic.setdefault(row.assigned_mechanic_id, []).append(row)
    for rows in by_mechanic.values():
        for extra in rows[:-1]:
            extra.status = "CANCELLED"
            extra.cancelled_by = "SYSTEM"
            extra.cancelled_at = now
            extra.save(update_fields=["status", "cancelled_by", "cancelled_at"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("service_requests", "0004_servicerequest_final_price_amount_and_more"),
    ]

    operations = [
        migrations.RunPython(collapse_duplicate_active_rows, noop),
        migrations.AddConstraint(
            model_name="servicerequest",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    status__in=[
                        "REQUESTED",
                        "SEARCHING",
                        "ASSIGNED",
                        "ACCEPTED",
                        "ON_THE_WAY",
                        "ARRIVED",
                        "IN_PROGRESS",
                    ]
                ),
                fields=("customer",),
                name="one_active_request_per_customer",
            ),
        ),
        migrations.AddConstraint(
            model_name="servicerequest",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    assigned_mechanic__isnull=False,
                    status__in=[
                        "ASSIGNED",
                        "ACCEPTED",
                        "ON_THE_WAY",
                        "ARRIVED",
                        "IN_PROGRESS",
                    ],
                ),
                fields=("assigned_mechanic",),
                name="one_active_job_per_mechanic",
            ),
        ),
    ]
