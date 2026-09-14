from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role, User

THROTTLE_CACHE = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "autohelp-throttle-tests",
    }
}


@override_settings(CACHES=THROTTLE_CACHE)
class AuthThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            phone="+995555000301",
            password="Devpass123!",
            role=Role.CUSTOMER,
        )

    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
            "DEFAULT_PERMISSION_CLASSES": (
                "rest_framework.permissions.IsAuthenticated",
            ),
            "DEFAULT_FILTER_BACKENDS": (
                "django_filters.rest_framework.DjangoFilterBackend",
                "rest_framework.filters.OrderingFilter",
            ),
            "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
            "PAGE_SIZE": 20,
            "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
            "DEFAULT_THROTTLE_RATES": {
                "auth": "2/min",
                "registration": "10/min",
                "request_create": "20/min",
                "price_action": "30/min",
                "rating": "20/min",
            },
        }
    )
    def test_login_throttle_after_two_attempts(self):
        cache.clear()
        body = {"phone": "+995555000301", "password": "wrong"}
        first = self.client.post("/api/v1/auth/token/", body, format="json")
        second = self.client.post("/api/v1/auth/token/", body, format="json")
        third = self.client.post("/api/v1/auth/token/", body, format="json")
        self.assertEqual(first.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(second.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(third.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
