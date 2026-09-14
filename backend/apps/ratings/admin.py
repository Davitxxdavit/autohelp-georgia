from django.contrib import admin

from .models import Rating


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("stars", "request", "customer", "mechanic", "created_at")
    list_filter = ("stars", "created_at")
    search_fields = (
        "feedback",
        "customer__first_name",
        "mechanic__first_name",
        "request__id",
        "customer__user__phone",
    )
    readonly_fields = ("created_at", "updated_at")
