"""Scoped DRF throttles for MVP abuse protection.

Uses Django's default cache backend. LocMemCache (the Django default)
only protects a single process. This is not distributed production
rate limiting and does not require Redis.

SimpleRateThrottle does not implement get_cache_key; we key by user id
when authenticated, otherwise by client IP.

Rates and cache are read per request so Django tests can override them.
"""

from django.core.cache import caches
from rest_framework.settings import api_settings
from rest_framework.throttling import SimpleRateThrottle


class IdentRateThrottle(SimpleRateThrottle):
    def __init__(self):
        self.THROTTLE_RATES = api_settings.DEFAULT_THROTTLE_RATES
        super().__init__()
        self.cache = caches["default"]

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class AuthRateThrottle(IdentRateThrottle):
    scope = "auth"


class RegistrationRateThrottle(IdentRateThrottle):
    scope = "registration"


class RequestCreateThrottle(IdentRateThrottle):
    scope = "request_create"


class PriceActionThrottle(IdentRateThrottle):
    scope = "price_action"


class RatingThrottle(IdentRateThrottle):
    scope = "rating"
