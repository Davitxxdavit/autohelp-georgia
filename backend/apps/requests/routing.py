"""Replaceable road-routing adapter. Never invents distance or ETA."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
import json
import logging
import socket
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
ROUTING_TIMEOUT_SECONDS = 15
USER_AGENT = "AutoHelp/1.0"


@dataclass(frozen=True)
class RouteResult:
    distance_meters: int
    duration_seconds: int
    coordinates: list[dict[str, str]]


def _decimal_pair(latitude: Decimal, longitude: Decimal) -> tuple[float, float]:
    return float(latitude), float(longitude)


def _safe_provider_message(raw: str, *, limit: int = 240) -> str:
    text = " ".join((raw or "").split())
    return text[:limit]


def _log_provider_failure(
    *,
    provider: str,
    status_code: int | None,
    message: str,
) -> None:
    logger.warning(
        "Routing provider %s failed: status=%s message=%s",
        provider,
        status_code if status_code is not None else "n/a",
        _safe_provider_message(message),
    )


def fetch_openroute(
    *,
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    api_key: str,
) -> RouteResult | None:
    payload = json.dumps(
        {
            "coordinates": [
                [origin_lng, origin_lat],
                [dest_lng, dest_lat],
            ]
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        ORS_DIRECTIONS_URL,
        data=payload,
        method="POST",
        headers={
            "Authorization": api_key,
            "Content-Type": "application/json; charset=utf-8",
            "Accept": (
                "application/json, application/geo+json, "
                "application/gpx+xml, img/png; charset=utf-8"
            ),
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=ROUTING_TIMEOUT_SECONDS) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace") if exc.fp else ""
        _log_provider_failure(
            provider="openrouteservice",
            status_code=exc.code,
            message=raw or exc.reason,
        )
        return None
    except TimeoutError:
        _log_provider_failure(
            provider="openrouteservice",
            status_code=None,
            message="timeout",
        )
        return None
    except (urllib.error.URLError, socket.timeout, json.JSONDecodeError, OSError) as exc:
        reason = getattr(exc, "reason", exc)
        _log_provider_failure(
            provider="openrouteservice",
            status_code=None,
            message=f"{exc.__class__.__name__}: {reason}",
        )
        return None
    parsed = parse_openroute_geojson(body)
    if parsed is None:
        _log_provider_failure(
            provider="openrouteservice",
            status_code=200,
            message="malformed provider response",
        )
    return parsed


def parse_openroute_geojson(body: dict) -> RouteResult | None:
    if not isinstance(body, dict):
        return None
    features = body.get("features") or []
    if not features:
        return None
    feature = features[0]
    if not isinstance(feature, dict):
        return None
    properties = feature.get("properties") or {}
    summary = properties.get("summary") or {}
    try:
        distance = int(round(float(summary["distance"])))
        duration = int(round(float(summary["duration"])))
    except (KeyError, TypeError, ValueError):
        return None
    geometry = feature.get("geometry") or {}
    raw_coords = geometry.get("coordinates") or []
    coordinates: list[dict[str, str]] = []
    for pair in raw_coords:
        if not isinstance(pair, (list, tuple)) or len(pair) < 2:
            continue
        lon, lat = pair[0], pair[1]
        try:
            coordinates.append(
                {
                    "latitude": f"{float(lat):.6f}",
                    "longitude": f"{float(lon):.6f}",
                }
            )
        except (TypeError, ValueError):
            continue
    if distance < 0 or duration < 0:
        return None
    if not coordinates:
        return None
    return RouteResult(
        distance_meters=distance,
        duration_seconds=duration,
        coordinates=coordinates,
    )


def compute_road_route(
    *,
    origin_latitude: Decimal,
    origin_longitude: Decimal,
    destination_latitude: Decimal,
    destination_longitude: Decimal,
) -> RouteResult | None:
    provider = (getattr(settings, "ROUTING_PROVIDER", "") or "").strip().lower()
    api_key = (getattr(settings, "ROUTING_API_KEY", "") or "").strip()
    if not api_key or provider in {"", "none"}:
        return None
    origin_lat, origin_lng = _decimal_pair(origin_latitude, origin_longitude)
    dest_lat, dest_lng = _decimal_pair(destination_latitude, destination_longitude)
    if provider == "openrouteservice":
        return fetch_openroute(
            origin_lat=origin_lat,
            origin_lng=origin_lng,
            dest_lat=dest_lat,
            dest_lng=dest_lng,
            api_key=api_key,
        )
    logger.warning("Unknown ROUTING_PROVIDER %s", provider)
    return None
