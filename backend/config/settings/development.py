"""Local / Docker development settings."""

import sys

from .base import *  # noqa: F403
from .base import ALLOWED_HOSTS as BASE_ALLOWED_HOSTS
from .base import REST_FRAMEWORK as BASE_REST_FRAMEWORK
from .base import env_bool

DEBUG = env_bool("DEBUG", True)

CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL", False)

# Android Emulator reaches the Windows/Docker host via 10.0.2.2.
# Those requests send Host: 10.0.2.2 — not localhost. Production settings
# do not add this alias.
_dev_hosts = ("localhost", "127.0.0.1", "10.0.2.2")
ALLOWED_HOSTS = list(dict.fromkeys([*BASE_ALLOWED_HOSTS, *_dev_hosts]))

# Django tests share one client IP. DummyCache keeps suite runs from hitting
# MVP throttles. apps.common.test_throttling opts into LocMemCache.
if "test" in sys.argv:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.dummy.DummyCache",
        }
    }
    REST_FRAMEWORK = {
        **BASE_REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {
            "auth": "10000/min",
            "registration": "10000/min",
            "request_create": "10000/min",
            "price_action": "10000/min",
            "rating": "10000/min",
        },
    }

DEBUG = env_bool("DEBUG", True)

CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL", False)

# Android Emulator reaches the Windows/Docker host via 10.0.2.2.
# Those requests send Host: 10.0.2.2 — not localhost. Production settings
# do not add this alias.
_dev_hosts = ("localhost", "127.0.0.1", "10.0.2.2")
ALLOWED_HOSTS = list(dict.fromkeys([*BASE_ALLOWED_HOSTS, *_dev_hosts]))
