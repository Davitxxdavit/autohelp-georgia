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

### Verbose (sanitized HTTP)

```powershell
python scripts/staging_smoke_test.py --all --verbose
```

### Local Docker API

```powershell
$env:AUTOHELP_API_URL="http://127.0.0.1:8000/api/v1"
python scripts/staging_smoke_test.py --all
```

Localhost is allowed without `--allow-non-staging`. Use `seed_dev` phones/passwords only on a DEBUG machine.

### Safety

The script runs against `autohelp-api.onrender.com` or localhost by default. Any other host requires `--allow-non-staging` or `AUTOHELP_ALLOW_SMOKE_TESTS=true`.

If the mechanic already has an active job, the smoke test stops and tells you to finish it first.

Set `AUTOHELP_REQUIRE_ROUTING=false` only when you intentionally have no routing key.

## Django tests

From `backend/` with Docker:

```powershell
docker compose exec web python manage.py test
```

Includes a high-level Diagnostics lifecycle test (`apps.requests.test_lifecycle`) with the routing provider mocked. Existing unit tests are unchanged.

## Frontend automated tests

Jest / React Native Testing Library are **not** installed. Do not add a large RN test stack just to re-check API flows; the smoke script already covers those.

Smallest useful next step, if UI regressions become frequent:

1. Add Jest + `jest-expo` only in the app that needs it.
2. Test **pure functions** first (`features/maps/format.ts`, `features/maps/geo.ts`, `features/earnings/format.ts`, phone helpers).
3. Skip screenshot / device farms until those helpers have coverage.

Until then, `npx tsc --noEmit` in `apps/customer` and `apps/mechanic` is the frontend gate.

## What still needs a phone

See `docs/MANUAL_DEVICE_TESTS.md`.
