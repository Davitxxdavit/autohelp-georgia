"""Local / Docker development settings."""

from .base import *  # noqa: F403
from .base import ALLOWED_HOSTS as BASE_ALLOWED_HOSTS
from .base import env_bool

DEBUG = env_bool("DEBUG", True)

CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL", False)

# Android Emulator reaches the Windows/Docker host via 10.0.2.2.
# Those requests send Host: 10.0.2.2 — not localhost. Production settings
# do not add this alias.
_dev_hosts = ("localhost", "127.0.0.1", "10.0.2.2")
ALLOWED_HOSTS = list(dict.fromkeys([*BASE_ALLOWED_HOSTS, *_dev_hosts]))
