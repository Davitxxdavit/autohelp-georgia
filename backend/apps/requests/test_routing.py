from io import BytesIO
from unittest.mock import MagicMock, patch
import urllib.error

from django.test import SimpleTestCase, override_settings

from apps.requests.routing import (
    compute_road_route,
    fetch_openroute,
    parse_openroute_geojson,
)


ORS_SAMPLE = {
    "features": [
        {
            "properties": {"summary": {"distance": 4200.4, "duration": 620.2}},
            "geometry": {
                "coordinates": [
                    [41.641234, 41.645123],
                    [41.636700, 41.616800],
                ]
            },
        }
    ]
}


def _http_error(code: int, body: bytes = b'{"error":"denied"}') -> urllib.error.HTTPError:
    return urllib.error.HTTPError(
        url="https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        code=code,
        msg="error",
        hdrs=None,
        fp=BytesIO(body),
    )


class OpenRouteParsingTests(SimpleTestCase):
    def test_parses_geojson_lon_lat_into_lat_lng(self):
        result = parse_openroute_geojson(ORS_SAMPLE)
        self.assertIsNotNone(result)
        self.assertEqual(result.distance_meters, 4200)
        self.assertEqual(result.duration_seconds, 620)
        self.assertEqual(result.coordinates[0]["latitude"], "41.645123")
        self.assertEqual(result.coordinates[0]["longitude"], "41.641234")

    def test_malformed_body_returns_none(self):
        self.assertIsNone(parse_openroute_geojson({}))
        self.assertIsNone(parse_openroute_geojson({"features": [{"properties": {}}]}))


class OpenRouteHttpTests(SimpleTestCase):
    def test_success(self):
        response = MagicMock()
        response.read.return_value = b'{"features":[{"properties":{"summary":{"distance":100,"duration":20}},"geometry":{"coordinates":[[1.0,2.0],[3.0,4.0]]}}]}'
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        with patch("apps.requests.routing.urllib.request.urlopen", return_value=response):
            result = fetch_openroute(
                origin_lat=2.0,
                origin_lng=1.0,
                dest_lat=4.0,
                dest_lng=3.0,
                api_key="test-key",
            )
        self.assertIsNotNone(result)
        self.assertEqual(result.distance_meters, 100)
        self.assertEqual(result.duration_seconds, 20)
        self.assertEqual(len(result.coordinates), 2)

    def test_http_401_returns_none(self):
        with patch(
            "apps.requests.routing.urllib.request.urlopen",
            side_effect=_http_error(401),
        ):
            self.assertIsNone(
                fetch_openroute(
                    origin_lat=1, origin_lng=2, dest_lat=3, dest_lng=4, api_key="bad"
                )
            )

    def test_http_403_returns_none(self):
        with patch(
            "apps.requests.routing.urllib.request.urlopen",
            side_effect=_http_error(403),
        ):
            self.assertIsNone(
                fetch_openroute(
                    origin_lat=1, origin_lng=2, dest_lat=3, dest_lng=4, api_key="bad"
                )
            )

    def test_http_429_returns_none(self):
        with patch(
            "apps.requests.routing.urllib.request.urlopen",
            side_effect=_http_error(429, b'{"error":"rate limit"}'),
        ):
            self.assertIsNone(
                fetch_openroute(
                    origin_lat=1, origin_lng=2, dest_lat=3, dest_lng=4, api_key="key"
                )
            )

    def test_timeout_returns_none(self):
        with patch(
            "apps.requests.routing.urllib.request.urlopen",
            side_effect=TimeoutError(),
        ):
            self.assertIsNone(
                fetch_openroute(
                    origin_lat=1, origin_lng=2, dest_lat=3, dest_lng=4, api_key="key"
                )
            )

    def test_malformed_json_body_returns_none(self):
        response = MagicMock()
        response.read.return_value = b"not-json"
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        with patch("apps.requests.routing.urllib.request.urlopen", return_value=response):
            self.assertIsNone(
                fetch_openroute(
                    origin_lat=1, origin_lng=2, dest_lat=3, dest_lng=4, api_key="key"
                )
            )

    @override_settings(ROUTING_PROVIDER="openrouteservice", ROUTING_API_KEY="")
    def test_missing_key_disables_routing(self):
        from decimal import Decimal

        self.assertIsNone(
            compute_road_route(
                origin_latitude=Decimal("41.6"),
                origin_longitude=Decimal("41.6"),
                destination_latitude=Decimal("41.7"),
                destination_longitude=Decimal("41.7"),
            )
        )
