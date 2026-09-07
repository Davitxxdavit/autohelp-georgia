from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import (
    ApprovalStatus,
    CustomerProfile,
    MechanicLocation,
    MechanicProfile,
    User,
)


class UserCreationFormPhone(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("phone", "role", "email")


class UserChangeFormPhone(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"


class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    extra = 0


class MechanicProfileInline(admin.StackedInline):
    model = MechanicProfile
    extra = 0
    filter_horizontal = ("services",)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserCreationFormPhone
    form = UserChangeFormPhone
    ordering = ("phone",)
    list_display = (
        "phone",
        "role",
        "email",
        "is_active",
        "phone_verified",
        "is_staff",
        "created_at",
    )
    list_filter = ("role", "is_active", "is_staff", "phone_verified")
    search_fields = ("phone", "email")
    inlines = [CustomerProfileInline, MechanicProfileInline]
    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Profile", {"fields": ("email", "email_verified", "phone_verified", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    readonly_fields = ("created_at", "updated_at", "last_login")
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone", "role", "email", "password1", "password2"),
            },
        ),
    )


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "preferred_language", "user", "created_at")
    search_fields = ("first_name", "last_name", "user__phone")


@admin.register(MechanicProfile)
class MechanicProfileAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "phone",
        "approval_status",
        "verified",
        "online",
        "service_list",
        "created_at",
    )
    list_filter = ("approval_status", "verified", "online")
    search_fields = ("first_name", "last_name", "user__phone")
    filter_horizontal = ("services",)
    readonly_fields = ("created_at", "updated_at", "rating_average", "rating_count")
    actions = ("approve_selected_mechanics", "mark_selected_mechanics_unapproved")
    list_select_related = ("user",)

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("services")

    @admin.display(description="Phone", ordering="user__phone")
    def phone(self, obj):
        return obj.user.phone

    @admin.display(description="Services")
    def service_list(self, obj):
        names = [service.name for service in obj.services.all()]
        return ", ".join(names) if names else "—"

    @admin.action(description="Approve selected mechanics")
    def approve_selected_mechanics(self, request, queryset):
        updated = queryset.update(
            approval_status=ApprovalStatus.APPROVED,
            verified=True,
        )
        self.message_user(request, f"Approved {updated} mechanic(s).")

    @admin.action(description="Mark selected mechanics unapproved")
    def mark_selected_mechanics_unapproved(self, request, queryset):
        updated = queryset.update(
            approval_status=ApprovalStatus.PENDING,
            verified=False,
            online=False,
        )
        self.message_user(
            request,
            f"Marked {updated} mechanic(s) unapproved and offline.",
        )


@admin.register(MechanicLocation)
class MechanicLocationAdmin(admin.ModelAdmin):
    list_display = ("mechanic", "latitude", "longitude", "recorded_at")
    list_filter = ("recorded_at",)
    search_fields = ("mechanic__first_name", "mechanic__user__phone")
