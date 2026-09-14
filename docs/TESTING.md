# AutoHelp testing

Automated checks cover the API lifecycle. Use a physical phone only for the items in `docs/MANUAL_DEVICE_TESTS.md`.

## Staging API smoke test

From the repo root, against the deployed Render API (default):

```text
https://autohelp-api.onrender.com/api/v1
```

### Required environment variables

| Variable | Purpose |
|----------|---------|
| `AUTOHELP_TEST_CUSTOMER_PHONE` | Staging customer phone (E.164) |
| `AUTOHELP_TEST_CUSTOMER_PASSWORD` | Staging customer password |
| `AUTOHELP_TEST_MECHANIC_PHONE` | Staging mechanic phone |
| `AUTOHELP_TEST_MECHANIC_PASSWORD` | Staging mechanic password |

Optional:

| Variable | Default | Purpose |
|----------|---------|---------|
| `AUTOHELP_API_URL` | `https://autohelp-api.onrender.com/api/v1` | API base |
| `AUTOHELP_TEST_LATITUDE` | `41.616800` | Request latitude (6 dp, API-only) |
| `AUTOHELP_TEST_LONGITUDE` | `41.636700` | Request longitude (6 dp, API-only) |
| `AUTOHELP_REQUIRE_ROUTING` | `true` | Fail if `/requests/{id}/route/` is unavailable |
| `AUTOHELP_ALLOW_SMOKE_TESTS` | unset | Allow a non-staging host (with `--allow-non-staging`) |

Never commit these values. The script never prints passwords or JWTs.

Routing must PASS on staging. Do not set `AUTOHELP_REQUIRE_ROUTING=false` to hide a provider failure.

### Windows PowerShell (session only)

```powershell
$env:AUTOHELP_TEST_CUSTOMER_PHONE="..."
$env:AUTOHELP_TEST_CUSTOMER_PASSWORD="..."
$env:AUTOHELP_TEST_MECHANIC_PHONE="..."
$env:AUTOHELP_TEST_MECHANIC_PASSWORD="..."
```

### Standard (Diagnostics 50 GEL)

```powershell
python scripts/staging_smoke_test.py
```

or:

```powershell
.\scripts\run_staging_smoke.ps1
```

### Quote (Auto Key 100 GEL → 80 GEL net)

```powershell
python scripts/staging_smoke_test.py --quote
```

### Cancel

```powershell
python scripts/staging_smoke_test.py --cancel
```

### Everything

```powershell
python scripts/staging_smoke_test.py --all
```

```powershell
.\scripts\run_staging_smoke.ps1 -All
```

`--all` also checks: no leftover active customer request, duplicate create 409, vehicle nickname/primary, completed request in customer and mechanic history, routing PASS, then restores mechanic services and sets the mechanic offline.

### Verbose (sanitized HTTP)

```powershell
python scripts/staging_smoke_test.py --all --verbose
```

## Django tests

From `backend/` with Docker:

```powershell
docker compose exec web python manage.py test
```

`manage.py test` uses DummyCache plus very high throttle rates so the suite is not 429’d. `apps.common.test_throttling` opts into LocMemCache and `auth: 2/min` to prove throttling. Location updates are not throttled.

Migrations `service_requests.0005` and `vehicles.0002` must run on Render before the next staging smoke. `0005` cancels extra concurrent active requests/jobs (`cancelled_by=SYSTEM`) before adding uniqueness.

## Frontend typecheck

```powershell
cd apps/customer; npx tsc --noEmit
cd apps/mechanic; npx tsc --noEmit
```

Jest / React Native Testing Library is not part of this MVP. Pure formatter coverage is backend + TypeScript.

## Rate limiting note

DRF scoped throttles use Django’s default cache (LocMemCache unless `CACHES` is set). This is single-instance MVP protection, not distributed Redis rate limiting.
