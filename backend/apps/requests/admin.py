from django.contrib import admin

from .models import ServiceRequest, ServiceRequestStatusHistory


class StatusHistoryInline(admin.TabularInline):
    model = ServiceRequestStatusHistory
    extra = 0
    readonly_fields = (
        "from_status",
        "to_status",
        "changed_by",
        "note",
        "created_at",
    )


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "service",
        "status",
        "customer",
        "assigned_mechanic",
        "estimated_price_amount",
        "created_at",
    )
    list_filter = ("status", "service", "price_is_estimate")
    search_fields = (
        "customer__first_name",
        "customer__user__phone",
        "vehicle__make",
        "vehicle__model",
    )
    readonly_fields = ("requested_at", "created_at", "updated_at")
    inlines = [StatusHistoryInline]


@admin.register(ServiceRequestStatusHistory)
class ServiceRequestStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("request", "from_status", "to_status", "changed_by", "created_at")
    list_filter = ("to_status",)
