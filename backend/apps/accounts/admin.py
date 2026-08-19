from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import CustomerProfile, MechanicLocation, MechanicProfile, User


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
        "last_name",
        "verified",
        "online",
        "approval_status",
        "rating_average",
        "rating_count",
    )
    list_filter = ("verified", "online", "approval_status")
    search_fields = ("first_name", "last_name", "user__phone")
    filter_horizontal = ("services",)


@admin.register(MechanicLocation)
class MechanicLocationAdmin(admin.ModelAdmin):
    list_display = ("mechanic", "latitude", "longitude", "recorded_at")
    list_filter = ("recorded_at",)
    search_fields = ("mechanic__first_name", "mechanic__user__phone")
