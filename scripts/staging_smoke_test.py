#!/usr/bin/env python3
"""HTTP smoke tests against AutoHelp staging (or local) API.

Does not print passwords, JWTs, or routing keys.
Exit code 1 if any check fails.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urlparse

DEFAULT_API_URL = "https://autohelp-api.onrender.com/api/v1"
STAGING_HOSTS = {"autohelp-api.onrender.com"}
LOCAL_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "10.0.2.2"}
TEST_LATITUDE = "41.616800"
TEST_LONGITUDE = "41.636700"
WAKE_TIMEOUT_SECONDS = 75
REQUEST_TIMEOUT_SECONDS = 20
OFFER_WAIT_SECONDS = 30
SECRET_KEYS = {
    "access",
    "refresh",
    "password",
    "token",
    "authorization",
    "routing_api_key",
    "api_key",
}

REQUIRED_ENV = (
    "AUTOHELP_TEST_CUSTOMER_PHONE",
    "AUTOHELP_TEST_CUSTOMER_PASSWORD",
    "AUTOHELP_TEST_MECHANIC_PHONE",
    "AUTOHELP_TEST_MECHANIC_PASSWORD",
)


class CheckFailure(Exception):
    def __init__(self, message: str, *, status: int | None = None, body: Any = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.body = body


class CheckSkip(Exception):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


class HttpResult:
    def __init__(self, status: int, body: Any, elapsed: float):
        self.status = status
        self.body = body
        self.elapsed = elapsed


def env(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


def env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def money(value: Any) -> Decimal:
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise CheckFailure(f"Not a money amount: {value!r}") from exc


def coord(value: str) -> str:
    return f"{float(value):.6f}"


def results_of(payload: Any) -> list[Any]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("results"), list):
        return payload["results"]
    return []


def sanitize(value: Any) -> Any:
    if isinstance(value, dict):
        out = {}
        for key, item in value.items():
            lowered = str(key).lower()
            if lowered in SECRET_KEYS or "password" in lowered or "token" in lowered:
                out[key] = "<redacted>"
            else:
                out[key] = sanitize(item)
        return out
    if isinstance(value, list):
        return [sanitize(item) for item in value]
    return value


def split_urls(api_url: str) -> tuple[str, str]:
    url = api_url.rstrip("/")
    if url.endswith("/api/v1"):
        origin = url[: -len("/api/v1")] or url
        api = url
    else:
        origin = url
        api = f"{url}/api/v1"
    return origin.rstrip("/"), api


def host_of(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


class ApiClient:
    def __init__(self, origin: str, api: str, verbose: bool):
        self.origin = origin
        self.api = api
        self.verbose = verbose
        self.timeout = REQUEST_TIMEOUT_SECONDS
        self._tokens: dict[str, str] = {}

    def set_token(self, role: str, access: str) -> None:
        self._tokens[role] = access

    def _headers(self, role: str | None) -> dict[str, str]:
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        if role:
            headers["Authorization"] = f"Bearer {self._tokens[role]}"
        return headers

    def request(
        self,
        method: str,
        path: str,
        *,
        role: str | None = None,
        body: Any = None,
        expected: int | tuple[int, ...] | None = None,
        absolute: bool = False,
        timeout: float | None = None,
    ) -> HttpResult:
        url = path if absolute else f"{self.api}{path}"
        payload = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            method=method,
            headers=self._headers(role),
        )
        started = time.monotonic()
        try:
            with urllib.request.urlopen(req, timeout=timeout or self.timeout) as response:
                raw = response.read().decode("utf-8") if response.length != 0 else ""
                status = response.status
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            status = exc.code
        except urllib.error.URLError as exc:
            raise CheckFailure(f"{method} {path} network error: {exc.reason}") from exc
        elapsed = time.monotonic() - started
        parsed: Any = None
        if raw.strip():
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = raw
        result = HttpResult(status, parsed, elapsed)
        if self.verbose:
            print(f"  {method} {path} -> {status} ({elapsed:.1f}s)")
            if parsed is not None:
                print(f"  {json.dumps(sanitize(parsed), indent=2, default=str)[:2000]}")
        allowed = expected
        if allowed is None:
            return result
        if isinstance(allowed, int):
            allowed = (allowed,)
        if status not in allowed:
            snippet = json.dumps(sanitize(parsed), default=str)[:800]
            raise CheckFailure(
                f"HTTP {status}\nResponse: {snippet}",
                status=status,
                body=parsed,
            )
        return result


class SmokeSuite:
    def __init__(self, client: ApiClient, args: argparse.Namespace):
        self.client = client
        self.args = args
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.lat = coord(env("AUTOHELP_TEST_LATITUDE", TEST_LATITUDE))
        self.lng = coord(env("AUTOHELP_TEST_LONGITUDE", TEST_LONGITUDE))
        self.mechanic_lat = coord(str(float(self.lat) + 0.008323))
        self.mechanic_lng = coord(str(float(self.lng) + 0.004534))
        self.moved_lat = coord(str(float(self.lat) + 0.004000))
        self.moved_lng = coord(str(float(self.lng) + 0.002000))
        self.require_routing = env_bool("AUTOHELP_REQUIRE_ROUTING", True)
        self.customer_vehicle_id: str | None = None
        self.catalog: dict[str, Any] = {}
        self.created_request_ids: list[str] = []
        self.mechanic_was_online = False

    def check(self, name: str, fn) -> None:
        try:
            fn()
        except CheckSkip as exc:
            self.skip(name, exc.reason)
            return
        except CheckFailure as exc:
            self.failed += 1
            print(f"[FAIL] {name}")
            print(exc.message)
            raise
        except Exception as exc:
            self.failed += 1
            print(f"[FAIL] {name}")
            print(str(exc))
            raise CheckFailure(str(exc)) from exc
        else:
            self.passed += 1
            print(f"[PASS] {name}")

    def skip(self, name: str, reason: str) -> None:
        self.skipped += 1
        print(f"[SKIP] {name}")
        print(f"  {reason}")

    def health(self) -> None:
        print("Waking staging service...")
        result = self.client.request(
            "GET",
            f"{self.client.origin}/health/",
            absolute=True,
            expected=200,
            timeout=WAKE_TIMEOUT_SECONDS,
        )
        if result.elapsed >= 3:
            print(f"  Cold start took {result.elapsed:.1f}s")
        if result.body != {"status": "ok"}:
            raise CheckFailure(f"Unexpected health payload: {result.body!r}")

    def login(self, role: str, phone: str, password: str) -> None:
        result = self.client.request(
            "POST",
            "/auth/token/",
            body={"phone": phone, "password": password},
            expected=200,
        )
        access = result.body.get("access") if isinstance(result.body, dict) else None
        refresh = result.body.get("refresh") if isinstance(result.body, dict) else None
        if not access or not refresh:
            raise CheckFailure("Token response missing access or refresh")
        self.client.set_token(role, access)

    def customer_me(self) -> None:
        result = self.client.request("GET", "/auth/me/", role="customer", expected=200)
        if result.body.get("role") != "CUSTOMER":
            raise CheckFailure(f"Expected CUSTOMER role, got {result.body.get('role')}")

    def mechanic_me(self) -> dict[str, Any]:
        result = self.client.request("GET", "/mechanic/me/", role="mechanic", expected=200)
        body = result.body
        if not isinstance(body, dict):
            raise CheckFailure("mechanic/me did not return an object")
        auth_me = self.client.request("GET", "/auth/me/", role="mechanic", expected=200)
        if auth_me.body.get("role") != "MECHANIC":
            raise CheckFailure(f"Expected MECHANIC role, got {auth_me.body.get('role')}")
        if body.get("approval_status") != "APPROVED" or not body.get("verified"):
            raise CheckFailure(
                "Mechanic is not approved. Approve the staging mechanic in Django Admin "
                f"(approval_status={body.get('approval_status')}, verified={body.get('verified')})."
            )
        self.mechanic_was_online = bool(body.get("online"))
        return body

    def mechanic_online(self, online: bool) -> None:
        result = self.client.request(
            "PATCH",
            "/mechanic/me/",
            role="mechanic",
            body={"online": online},
            expected=200,
        )
        if result.body.get("online") is not online:
            raise CheckFailure(f"online was {result.body.get('online')}, expected {online}")

    def load_catalog(self) -> None:
        result = self.client.request("GET", "/services/", expected=200)
        services = results_of(result.body)
        by_code = {item.get("code"): item for item in services if isinstance(item, dict)}
        for code in ("DIAGNOSTICS", "AUTO_KEY"):
            if code not in by_code:
                raise CheckFailure(f"Catalog missing service {code}")
        self.catalog = by_code

    def service_problem(self, service_code: str, problem_code: str) -> tuple[str, str]:
        service = self.catalog[service_code]
        problems = service.get("problems") or []
        match = next((item for item in problems if item.get("code") == problem_code), None)
        if not match:
            raise CheckFailure(f"{service_code} missing problem {problem_code}")
        return str(service["id"]), str(match["id"])

    def ensure_vehicle(self) -> str:
        listed = self.client.request("GET", "/vehicles/", role="customer", expected=200)
        vehicles = results_of(listed.body)
        if vehicles:
            vehicle_id = str(vehicles[0]["id"])
            self.customer_vehicle_id = vehicle_id
            return vehicle_id
        created = self.client.request(
            "POST",
            "/vehicles/",
            role="customer",
            expected=201,
            body={
                "make": "BMW",
                "model": "i8",
                "year": 2015,
                "fuel": "hybrid",
                "engine": "smoke-test",
            },
        )
        vehicle_id = str(created.body["id"])
        self.customer_vehicle_id = vehicle_id
        return vehicle_id

    def create_request(self, service_code: str, problem_code: str) -> dict[str, Any]:
        vehicle_id = self.ensure_vehicle()
        service_id, problem_id = self.service_problem(service_code, problem_code)
        result = self.client.request(
            "POST",
            "/requests/",
            role="customer",
            expected=201,
            body={
                "vehicle": vehicle_id,
                "service": service_id,
                "problem": problem_id,
                "customer_latitude": self.lat,
                "customer_longitude": self.lng,
                "customer_address": "AutoHelp smoke-test location (staging/API only)",
            },
        )
        body = result.body
        request_id = body.get("id")
        if not request_id:
            raise CheckFailure("Request create did not return an id")
        self.created_request_ids.append(str(request_id))
        if body.get("status") not in {"REQUESTED", "SEARCHING"}:
            raise CheckFailure(f"Unexpected create status {body.get('status')}")
        return body

    def wait_for_offer(self, request_id: str) -> dict[str, Any]:
        deadline = time.monotonic() + OFFER_WAIT_SECONDS
        last: Any = None
        while time.monotonic() < deadline:
            result = self.client.request(
                "GET", "/mechanic/offers/", role="mechanic", expected=200
            )
            last = result.body
            for offer in results_of(result.body):
                request = offer.get("request") or {}
                if str(request.get("id")) == str(request_id):
                    return offer
            time.sleep(1.5)
        raise CheckFailure(
            f"No offer for request {request_id} within {OFFER_WAIT_SECONDS}s. "
            f"Last inbox: {json.dumps(sanitize(last), default=str)[:600]}"
        )

    def accept_offer(self, offer_id: str, request_id: str) -> None:
        result = self.client.request(
            "POST",
            f"/mechanic/offers/{offer_id}/accept/",
            role="mechanic",
            expected=200,
        )
        request = (result.body or {}).get("request") or {}
        if request.get("status") != "ACCEPTED":
            raise CheckFailure(f"Accept status was {request.get('status')}")
        detail = self.client.request(
            "GET", f"/requests/{request_id}/", role="customer", expected=200
        )
        assigned = detail.body.get("assigned_mechanic") or {}
        if not assigned.get("id"):
            raise CheckFailure("Customer detail missing assigned mechanic after accept")
        if detail.body.get("status") != "ACCEPTED":
            raise CheckFailure(f"Customer status was {detail.body.get('status')}")

    def post_location(self, latitude: str, longitude: str) -> dict[str, Any]:
        result = self.client.request(
            "POST",
            "/mechanic/location/",
            role="mechanic",
            expected=200,
            body={"latitude": latitude, "longitude": longitude},
        )
        body = result.body
        if str(body.get("latitude")) != latitude or str(body.get("longitude")) != longitude:
            raise CheckFailure(f"Location round-trip mismatch: {body}")
        if not body.get("location_updated_at"):
            raise CheckFailure("location_updated_at missing")
        return body

    def customer_sees_mechanic_location(
        self, request_id: str, latitude: str, longitude: str
    ) -> None:
        detail = self.client.request(
            "GET", f"/requests/{request_id}/", role="customer", expected=200
        )
        mechanic = detail.body.get("assigned_mechanic") or {}
        if str(mechanic.get("current_latitude")) != latitude:
            raise CheckFailure(
                f"Customer mechanic lat {mechanic.get('current_latitude')} != {latitude}"
            )
        if str(mechanic.get("current_longitude")) != longitude:
            raise CheckFailure(
                f"Customer mechanic lng {mechanic.get('current_longitude')} != {longitude}"
            )
        if not mechanic.get("location_updated_at"):
            raise CheckFailure("Customer did not receive location_updated_at")

    def job_action(self, request_id: str, action: str, expected_status: str) -> dict[str, Any]:
        result = self.client.request(
            "POST",
            f"/mechanic/jobs/{request_id}/{action}/",
            role="mechanic",
            expected=200,
        )
        request = (result.body or {}).get("request") or result.body
        status = request.get("status") if isinstance(request, dict) else None
        if status != expected_status:
            raise CheckFailure(f"{action} status was {status}, expected {expected_status}")
        return result.body if isinstance(result.body, dict) else {}

    def check_route(self, request_id: str) -> None:
        result = self.client.request(
            "GET",
            f"/requests/{request_id}/route/",
            role="customer",
            expected=(200, 409),
        )
        if result.status == 409:
            if self.require_routing:
                raise CheckFailure(
                    f"HTTP 409\nResponse: {json.dumps(sanitize(result.body), default=str)}"
                )
            raise CheckSkip("Route endpoint returned 409")
        body = result.body
        if body.get("available") is True:
            if not (body.get("distance_meters") and body["distance_meters"] > 0):
                raise CheckFailure(f"distance_meters invalid: {body.get('distance_meters')}")
            if not (body.get("duration_seconds") and body["duration_seconds"] > 0):
                raise CheckFailure(f"duration_seconds invalid: {body.get('duration_seconds')}")
            if not body.get("coordinates"):
                raise CheckFailure("coordinates list empty")
            return
        if self.require_routing:
            raise CheckFailure(
                "Routing unavailable on staging. Set ROUTING_API_KEY on Render "
                "or AUTOHELP_REQUIRE_ROUTING=false to skip."
            )
        raise CheckSkip("Provider unavailable (AUTOHELP_REQUIRE_ROUTING=false)")

    def assert_route_gone(self, request_id: str) -> None:
        result = self.client.request(
            "GET",
            f"/requests/{request_id}/route/",
            role="customer",
            expected=409,
        )
        if result.status != 409:
            raise CheckFailure(f"Expected route 409 after arrival, got {result.status}")

    def assert_no_live_location(self, request_id: str) -> None:
        detail = self.client.request(
            "GET", f"/requests/{request_id}/", role="customer", expected=200
        )
        mechanic = detail.body.get("assigned_mechanic") or {}
        for key in ("current_latitude", "current_longitude", "location_updated_at"):
            if key in mechanic:
                raise CheckFailure(f"Live mechanic {key} still exposed after completion")

    def find_earning(self, request_id: str) -> dict[str, Any]:
        path = "/mechanic/earnings/"
        absolute = False
        while path:
            result = self.client.request(
                "GET",
                path,
                role="mechanic",
                expected=200,
                absolute=absolute,
            )
            rows = results_of(result.body)
            match = next(
                (row for row in rows if str(row.get("request_id")) == str(request_id)),
                None,
            )
            if match is not None:
                return match
            nxt = result.body.get("next") if isinstance(result.body, dict) else None
            if not nxt:
                break
            path = str(nxt)
            absolute = path.startswith("http")
        raise CheckFailure(f"No earning row for request {request_id}")

    def rate_request(self, request_id: str) -> None:
        self.client.request(
            "POST",
            "/ratings/",
            role="customer",
            expected=201,
            body={
                "request": request_id,
                "stars": 5,
                "feedback": "Automated staging smoke test",
            },
        )

    def cancel_request(self, request_id: str) -> dict[str, Any]:
        result = self.client.request(
            "POST",
            f"/requests/{request_id}/cancel/",
            role="customer",
            expected=200,
        )
        if result.body.get("status") != "CANCELLED":
            raise CheckFailure(f"Cancel status was {result.body.get('status')}")
        return result.body

    def abort_if_active_job(self) -> None:
        result = self.client.request(
            "GET",
            "/mechanic/jobs/active/",
            role="mechanic",
            expected=(200, 204),
        )
        if result.status == 204:
            return
        request = (result.body or {}).get("request") or result.body
        request_id = request.get("id") if isinstance(request, dict) else None
        status = request.get("status") if isinstance(request, dict) else None
        raise CheckFailure(
            "Mechanic already has an active job "
            f"(id={request_id}, status={status}). Finish it, then re-run the smoke test."
        )

    def cleanup_open_requests(self) -> None:
        for request_id in list(self.created_request_ids):
            try:
                detail = self.client.request(
                    "GET", f"/requests/{request_id}/", role="customer", expected=(200, 404)
                )
                if detail.status != 200:
                    continue
                status = detail.body.get("status")
                if status in {"REQUESTED", "SEARCHING", "ASSIGNED"}:
                    self.client.request(
                        "POST",
                        f"/requests/{request_id}/cancel/",
                        role="customer",
                        expected=(200, 409),
                    )
            except CheckFailure:
                continue

    def set_mechanic_offline(self) -> None:
        try:
            self.mechanic_online(False)
        except CheckFailure as exc:
            print(f"Cleanup warning: could not set mechanic offline ({exc.message})")

    def run_diagnostics(self) -> None:
        print("\n--- Diagnostics lifecycle ---\n")
        created: dict[str, Any] = {}
        request_id = ""

        def _catalog():
            self.load_catalog()

        def _vehicle():
            self.ensure_vehicle()

        def _create():
            nonlocal created, request_id
            created = self.create_request("DIAGNOSTICS", "CHECK_ENGINE")
            request_id = str(created["id"])
            if money(created.get("estimated_price_amount")) != Decimal("50.00"):
                raise CheckFailure(
                    f"Diagnostics estimate was {created.get('estimated_price_amount')}"
                )
            if money(created.get("final_price_amount")) != Decimal("50.00"):
                raise CheckFailure(
                    f"Diagnostics final price was {created.get('final_price_amount')}"
                )
            if created.get("quote_status") != "APPROVED":
                raise CheckFailure(f"quote_status was {created.get('quote_status')}")

        offer: dict[str, Any] = {}

        def _offer():
            nonlocal offer
            offer = self.wait_for_offer(request_id)

        def _accept():
            self.accept_offer(str(offer["id"]), request_id)

        def _location_accepted():
            self.post_location(self.mechanic_lat, self.mechanic_lng)
            self.customer_sees_mechanic_location(
                request_id, self.mechanic_lat, self.mechanic_lng
            )

        def _drive():
            self.job_action(request_id, "start-driving", "ON_THE_WAY")

        def _location_moving():
            self.post_location(self.moved_lat, self.moved_lng)
            self.customer_sees_mechanic_location(request_id, self.moved_lat, self.moved_lng)

        def _route():
            self.check_route(request_id)

        def _arrive():
            self.job_action(request_id, "arrive", "ARRIVED")
            self.assert_route_gone(request_id)

        def _start():
            self.job_action(request_id, "start-service", "IN_PROGRESS")

        complete_body: dict[str, Any] = {}

        def _complete():
            nonlocal complete_body
            complete_body = self.job_action(request_id, "complete", "COMPLETED")
            earning = complete_body.get("earning") or {}
            if money(earning.get("gross_amount")) != Decimal("50.00"):
                raise CheckFailure(f"gross {earning.get('gross_amount')}")
            if money(earning.get("commission_amount")) != Decimal("10.00"):
                raise CheckFailure(f"commission {earning.get('commission_amount')}")
            if money(earning.get("net_amount")) != Decimal("40.00"):
                raise CheckFailure(f"net {earning.get('net_amount')}")
            if earning.get("currency") != "GEL":
                raise CheckFailure(f"currency {earning.get('currency')}")

        def _earnings():
            row = self.find_earning(request_id)
            if money(row.get("gross_amount")) != Decimal("50.00"):
                raise CheckFailure(f"earnings gross {row.get('gross_amount')}")
            if money(row.get("commission_amount")) != Decimal("10.00"):
                raise CheckFailure(f"earnings commission {row.get('commission_amount')}")
            if money(row.get("net_amount")) != Decimal("40.00"):
                raise CheckFailure(f"earnings net {row.get('net_amount')}")

        def _customer_done():
            detail = self.client.request(
                "GET", f"/requests/{request_id}/", role="customer", expected=200
            )
            if detail.body.get("status") != "COMPLETED":
                raise CheckFailure(f"status {detail.body.get('status')}")
            if money(detail.body.get("final_price_amount")) != Decimal("50.00"):
                raise CheckFailure(f"final {detail.body.get('final_price_amount')}")
            self.assert_no_live_location(request_id)

        def _rating():
            self.rate_request(request_id)

        self.check("Service catalog", _catalog)
        self.check("Customer vehicle ready", _vehicle)
        self.check("Customer request created", _create)
        self.check("Mechanic offer", _offer)
        self.check("Mechanic accept", _accept)
        self.check("Mechanic location (ACCEPTED)", _location_accepted)
        self.check("Start driving", _drive)
        self.check("Mechanic location updated", _location_moving)
        self.check("Route", _route)
        self.check("Arrive", _arrive)
        self.check("Start service", _start)
        self.check("Complete", _complete)
        self.check("Earnings", _earnings)
        self.check("Customer completed request", _customer_done)
        self.check("Customer rating", _rating)

    def run_quote(self) -> None:
        print("\n--- Auto Key quote lifecycle ---\n")
        created = {}
        request_id = ""
        offer = {}

        def _create():
            nonlocal created, request_id
            if not self.catalog:
                self.load_catalog()
            created = self.create_request("AUTO_KEY", "LOCKED_OUT")
            request_id = str(created["id"])
            if created.get("quote_status") != "NONE":
                raise CheckFailure(f"quote_status {created.get('quote_status')}")

        def _offer():
            nonlocal offer
            offer = self.wait_for_offer(request_id)

        def _drive_to_arrive():
            self.accept_offer(str(offer["id"]), request_id)
            self.post_location(self.mechanic_lat, self.mechanic_lng)
            self.job_action(request_id, "start-driving", "ON_THE_WAY")
            self.job_action(request_id, "arrive", "ARRIVED")

        def _blocked():
            result = self.client.request(
                "POST",
                f"/mechanic/jobs/{request_id}/start-service/",
                role="mechanic",
                expected=409,
            )
            if result.status != 409:
                raise CheckFailure(f"Expected 409 before quote, got {result.status}")

        def _propose():
            result = self.client.request(
                "POST",
                f"/mechanic/jobs/{request_id}/price/",
                role="mechanic",
                expected=200,
                body={"amount": "100.00"},
            )
            request = (result.body or {}).get("request") or {}
            if request.get("quote_status") != "PENDING":
                raise CheckFailure(f"propose quote_status {request.get('quote_status')}")
            detail = self.client.request(
                "GET", f"/requests/{request_id}/", role="customer", expected=200
            )
            if detail.body.get("quote_status") != "PENDING":
                raise CheckFailure("Customer did not see PENDING quote")
            if money(detail.body.get("final_price_amount")) != Decimal("100.00"):
                raise CheckFailure("Customer proposed amount mismatch")

        def _approve():
            result = self.client.request(
                "POST",
                f"/requests/{request_id}/price/approve/",
                role="customer",
                expected=200,
                body={"amount": "100.00"},
            )
            if result.body.get("quote_status") != "APPROVED":
                raise CheckFailure(f"approve quote_status {result.body.get('quote_status')}")

        complete_body: dict[str, Any] = {}

        def _finish():
            nonlocal complete_body
            self.job_action(request_id, "start-service", "IN_PROGRESS")
            complete_body = self.job_action(request_id, "complete", "COMPLETED")
            earning = complete_body.get("earning") or {}
            if money(earning.get("gross_amount")) != Decimal("100.00"):
                raise CheckFailure(f"gross {earning.get('gross_amount')}")
            if money(earning.get("commission_amount")) != Decimal("20.00"):
                raise CheckFailure(f"commission {earning.get('commission_amount')}")
            if money(earning.get("net_amount")) != Decimal("80.00"):
                raise CheckFailure(f"net {earning.get('net_amount')}")

        def _earnings():
            row = self.find_earning(request_id)
            if money(row.get("net_amount")) != Decimal("80.00"):
                raise CheckFailure(f"earnings net {row.get('net_amount')}")

        self.check("Auto Key request created", _create)
        self.check("Auto Key offer", _offer)
        self.check("Auto Key drive to arrived", _drive_to_arrive)
        self.check("Start service blocked without price", _blocked)
        self.check("Mechanic proposes 100 GEL", _propose)
        self.check("Customer approves quote", _approve)
        self.check("Auto Key complete", _finish)
        self.check("Auto Key earnings", _earnings)

    def run_cancel(self) -> None:
        print("\n--- Cancellation lifecycle ---\n")
        created = {}
        request_id = ""
        offer = {}

        def _create():
            nonlocal created, request_id
            if not self.catalog:
                self.load_catalog()
            created = self.create_request("DIAGNOSTICS", "CHECK_ENGINE")
            request_id = str(created["id"])
            if created.get("status") not in {"REQUESTED", "SEARCHING"}:
                raise CheckFailure(f"status {created.get('status')}")

        def _offer():
            nonlocal offer
            offer = self.wait_for_offer(request_id)
            detail = self.client.request(
                "GET", f"/requests/{request_id}/", role="customer", expected=200
            )
            if detail.body.get("status") != "SEARCHING":
                raise CheckFailure(f"Expected SEARCHING, got {detail.body.get('status')}")

        def _cancel():
            self.cancel_request(request_id)

        def _cannot_accept():
            result = self.client.request(
                "POST",
                f"/mechanic/offers/{offer['id']}/accept/",
                role="mechanic",
                expected=(404, 409),
            )
            inbox = self.client.request(
                "GET", "/mechanic/offers/", role="mechanic", expected=200
            )
            still = [
                item
                for item in results_of(inbox.body)
                if str((item.get("request") or {}).get("id")) == request_id
            ]
            if still:
                raise CheckFailure("Cancelled request still appears in mechanic inbox")
            if result.status not in (404, 409):
                raise CheckFailure(f"Accept after cancel returned {result.status}")

        self.check("Cancel request created", _create)
        self.check("Cancel offer visible", _offer)
        self.check("Customer cancel", _cancel)
        self.check("Offer cannot be accepted", _cannot_accept)


def missing_env() -> list[str]:
    return [name for name in REQUIRED_ENV if not env(name)]


def assert_safe_target(origin: str, allow_non_staging: bool) -> None:
    host = host_of(origin)
    if host in STAGING_HOSTS or host in LOCAL_HOSTS:
        return
    if allow_non_staging or env_bool("AUTOHELP_ALLOW_SMOKE_TESTS", False):
        return
    raise SystemExit(
        f"Refusing to run smoke tests against {host or origin}.\n"
        "Known staging host is autohelp-api.onrender.com. Localhost is allowed.\n"
        "For any other host pass --allow-non-staging or set AUTOHELP_ALLOW_SMOKE_TESTS=true."
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AutoHelp staging API smoke test")
    parser.add_argument("--quote", action="store_true", help="Run Auto Key quote lifecycle")
    parser.add_argument("--cancel", action="store_true", help="Run cancellation lifecycle")
    parser.add_argument("--all", action="store_true", help="Run diagnostics, quote, and cancel")
    parser.add_argument("--verbose", action="store_true", help="Print sanitized HTTP traffic")
    parser.add_argument(
        "--allow-non-staging",
        action="store_true",
        help="Allow a non-staging, non-local API URL",
    )
    parser.add_argument(
        "--base-url",
        default=env("AUTOHELP_API_URL", DEFAULT_API_URL),
        help="API base (default AUTOHELP_API_URL or staging /api/v1)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    missing = missing_env()
    if missing:
        print("Missing required environment variables:")
        for name in missing:
            print(f"  {name}")
        print("See docs/TESTING.md. Passwords are never read from the repo.")
        return 2

    origin, api = split_urls(args.base_url)
    try:
        assert_safe_target(origin, args.allow_non_staging)
    except SystemExit as exc:
        print(exc)
        return 2

    run_diagnostics = args.all or not (args.quote or args.cancel)
    run_quote = args.all or args.quote
    run_cancel = args.all or args.cancel

    print("AutoHelp Staging Smoke Test")
    print(f"API: {api}")
    print()

    client = ApiClient(origin, api, verbose=args.verbose)
    suite = SmokeSuite(client, args)
    started = time.monotonic()
    exit_code = 0
    try:
        suite.check("Health", suite.health)
        suite.check(
            "Customer login",
            lambda: suite.login(
                "customer",
                env("AUTOHELP_TEST_CUSTOMER_PHONE"),
                env("AUTOHELP_TEST_CUSTOMER_PASSWORD"),
            ),
        )
        suite.check("Customer profile", suite.customer_me)
        suite.check(
            "Mechanic login",
            lambda: suite.login(
                "mechanic",
                env("AUTOHELP_TEST_MECHANIC_PHONE"),
                env("AUTOHELP_TEST_MECHANIC_PASSWORD"),
            ),
        )
        suite.check("Mechanic profile approved", suite.mechanic_me)
        suite.check("No leftover active job", suite.abort_if_active_job)
        suite.check("Mechanic online", lambda: suite.mechanic_online(True))
        if run_diagnostics:
            suite.run_diagnostics()
        if run_quote:
            suite.run_quote()
        if run_cancel:
            suite.run_cancel()
    except CheckFailure:
        exit_code = 1
    finally:
        suite.cleanup_open_requests()
        suite.set_mechanic_offline()

    duration = time.monotonic() - started
    print()
    print("==============================")
    print(f"{suite.passed} passed")
    print(f"{suite.failed} failed")
    if suite.skipped:
        print(f"{suite.skipped} skipped")
    print(f"Duration: {duration:.1f}s")
    print("==============================")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
