from django.contrib import admin

from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("make", "model", "year", "fuel", "vin", "customer", "created_at")
    list_filter = ("fuel", "year")
    search_fields = ("make", "model", "vin", "license_plate", "customer__first_name")
