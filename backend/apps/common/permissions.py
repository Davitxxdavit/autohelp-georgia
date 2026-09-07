from rest_framework.permissions import BasePermission

from apps.accounts.models import ApprovalStatus, Role

AWAITING_APPROVAL_MESSAGE = "Your mechanic account is awaiting approval."


def mechanic_profile_is_operational(profile) -> bool:
    """True when matching and operational mechanic APIs should allow the profile."""
    return bool(
        profile
        and profile.verified
        and profile.approval_status == ApprovalStatus.APPROVED
    )


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


class IsApprovedMechanic(BasePermission):
    """
    Operational mechanic actions only.

    Stack after IsMechanic so customers still get the generic mechanic 403,
    while unapproved mechanics receive AWAITING_APPROVAL_MESSAGE.
    """

    message = AWAITING_APPROVAL_MESSAGE

    def has_permission(self, request, view) -> bool:
        profile = getattr(request.user, "mechanic_profile", None)
        return mechanic_profile_is_operational(profile)
