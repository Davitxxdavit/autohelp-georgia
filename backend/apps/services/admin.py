from django.contrib import admin

from .models import Service, ServiceProblem


class ServiceProblemInline(admin.TabularInline):
    model = ServiceProblem
    extra = 0


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "active", "updated_at")
    list_filter = ("active",)
    search_fields = ("code", "name")
    inlines = [ServiceProblemInline]


@admin.register(ServiceProblem)
class ServiceProblemAdmin(admin.ModelAdmin):
    list_display = ("code", "label", "service", "active", "sort_order")
    list_filter = ("service", "active")
    search_fields = ("code", "label")
