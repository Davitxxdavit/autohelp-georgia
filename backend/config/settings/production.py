"""Production / Render settings. DEBUG is always off."""

from .base import *  # noqa: F403
from .base import MIDDLEWARE as BASE_MIDDLEWARE
from .base import env_bool, env_list
from config.database import database_config_from_env
import os

DEBUG = False
ENABLE_API_DOCS = env_bool("ENABLE_API_DOCS", False)

SECRET_KEY = os.environ["SECRET_KEY"]
if SECRET_KEY == "unsafe-dev-secret-change-me":
    raise ValueError("SECRET_KEY must not use the development placeholder.")

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS")
render_hostname = os.getenv("RENDER_EXTERNAL_HOSTNAME", "").strip()
if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)
if not ALLOWED_HOSTS:
    raise ValueError(
        "ALLOWED_HOSTS must be set in production, or RENDER_EXTERNAL_HOSTNAME must be present."
    )

CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")
if render_hostname:
    render_origin = f"https://{render_hostname}"
    if render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_origin)

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")

# Render Postgres with persistent connections. Use DATABASE_URL as provided.
DATABASES = {
    "default": database_config_from_env(
        conn_max_age=int(os.getenv("DB_CONN_MAX_AGE", "60"))
    )
}

# WhiteNoise serves Admin / Swagger static files with DEBUG=False. No object storage.
MIDDLEWARE = list(BASE_MIDDLEWARE)
_security = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware")
MIDDLEWARE.insert(_security + 1, "whitenoise.middleware.WhiteNoiseMiddleware")

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# Render terminates TLS and forwards X-Forwarded-Proto. Do not set these in development.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
# Health checks hit the container over HTTP. Leave SSL redirect off unless you
# confirm the probe uses https / X-Forwarded-Proto.
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", False)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "console": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "console",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.getenv("LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        # Avoid SQL / credential noise.
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
