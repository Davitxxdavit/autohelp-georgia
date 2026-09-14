from django.contrib import admin

from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = (
        "make",
        "model",
        "year",
        "nickname",
        "is_primary",
        "fuel",
        "vin",
        "customer",
        "created_at",
    )
    list_filter = ("fuel", "year", "is_primary")
    search_fields = (
        "make",
        "model",
        "nickname",
        "vin",
        "license_plate",
        "customer__first_name",
        "customer__user__phone",
    )
