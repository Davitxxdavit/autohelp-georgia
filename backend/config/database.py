"""PostgreSQL configuration from DATABASE_URL or discrete POSTGRES_* vars."""

from __future__ import annotations

from urllib.parse import parse_qs, unquote, urlparse
import os


def postgres_config_from_url(url: str, *, conn_max_age: int) -> dict:
    parsed = urlparse(url)
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise ValueError("DATABASE_URL must use postgres:// or postgresql://.")

    query = parse_qs(parsed.query)
    options: dict = {"connect_timeout": 5}
    sslmode = (query.get("sslmode") or [None])[0]
    if sslmode:
        options["sslmode"] = sslmode

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed.path.lstrip("/")),
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or 5432),
        "CONN_MAX_AGE": conn_max_age,
        "OPTIONS": options,
    }


def postgres_config_from_parts(*, conn_max_age: int) -> dict:
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "autohelp"),
        "USER": os.getenv("POSTGRES_USER", "autohelp"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "autohelp"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": conn_max_age,
        "OPTIONS": {"connect_timeout": 5},
    }


def database_config_from_env(*, conn_max_age: int | None = None) -> dict:
    """
    Prefer DATABASE_URL (Render). Otherwise use POSTGRES_* (local Docker / venv).
    """
    if conn_max_age is None:
        conn_max_age = int(os.getenv("DB_CONN_MAX_AGE", "0"))
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return postgres_config_from_url(url, conn_max_age=conn_max_age)
    return postgres_config_from_parts(conn_max_age=conn_max_age)
