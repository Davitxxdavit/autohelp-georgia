from django.contrib import admin

from .models import (
    MechanicEarning,
    MechanicRequestOffer,
    ServiceRequest,
    ServiceRequestStatusHistory,
)


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


@admin.register(MechanicRequestOffer)
class MechanicRequestOfferAdmin(admin.ModelAdmin):
    list_display = ("id", "request", "mechanic", "status", "created_at", "responded_at")
    list_filter = ("status",)
    search_fields = (
        "mechanic__first_name",
        "mechanic__user__phone",
        "request__id",
    )
    readonly_fields = ("created_at", "updated_at", "responded_at")


@admin.register(ServiceRequestStatusHistory)
class ServiceRequestStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("request", "from_status", "to_status", "changed_by", "created_at")
    list_filter = ("to_status",)


@admin.register(MechanicEarning)
class MechanicEarningAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "mechanic",
        "service_request",
        "gross_amount",
        "commission_amount",
        "net_amount",
        "currency",
        "created_at",
    )
    list_filter = ("currency",)
    search_fields = (
        "mechanic__first_name",
        "mechanic__user__phone",
        "service_request__id",
    )
    readonly_fields = (
        "id",
        "mechanic",
        "service_request",
        "gross_amount",
        "commission_rate",
        "commission_amount",
        "net_amount",
        "currency",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
