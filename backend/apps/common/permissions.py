from rest_framework.permissions import BasePermission

from apps.accounts.models import Role


class IsCustomer(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == Role.CUSTOMER
            and user.is_active
        )


class IsMechanic(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == Role.MECHANIC
            and user.is_active
        )
