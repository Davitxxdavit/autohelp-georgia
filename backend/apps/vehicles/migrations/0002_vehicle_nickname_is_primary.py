from django.db import migrations, models


def assign_primary_vehicles(apps, schema_editor):
    Vehicle = apps.get_model("vehicles", "Vehicle")
    seen = set()
    for vehicle in Vehicle.objects.order_by("customer_id", "-created_at"):
        if vehicle.customer_id in seen:
            continue
        seen.add(vehicle.customer_id)
        if not vehicle.is_primary:
            vehicle.is_primary = True
            vehicle.save(update_fields=["is_primary"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("vehicles", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="vehicle",
            name="nickname",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="vehicle",
            name="is_primary",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(assign_primary_vehicles, noop),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.UniqueConstraint(
                condition=models.Q(is_primary=True),
                fields=("customer",),
                name="one_primary_vehicle_per_customer",
            ),
        ),
    ]
