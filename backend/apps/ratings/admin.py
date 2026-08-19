from django.contrib import admin

from .models import Rating


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("stars", "customer", "mechanic", "request", "created_at")
    list_filter = ("stars",)
    search_fields = ("feedback", "customer__first_name", "mechanic__first_name")
