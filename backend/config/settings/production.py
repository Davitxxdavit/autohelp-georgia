"""Production settings. DEBUG is always off."""

from .base import *  # noqa: F403
from .base import env_list
import os

DEBUG = False

SECRET_KEY = os.environ["SECRET_KEY"]
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise ValueError("ALLOWED_HOSTS must be set in production.")

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
