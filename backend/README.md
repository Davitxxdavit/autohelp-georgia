# AutoHelp backend

Phase 1 foundation: Django + Django REST Framework + PostgreSQL + JWT.

This API is shared later by the Customer app, Mechanic app, Admin web, and public website.

Password + JWT login is a **development foundation only**. Product authentication will move to phone OTP. Do not treat password login as final.

## Requirements

- Docker Desktop (required for PostgreSQL + the recommended workflow)
- Python 3.12+ only if you run a local venv (Docker image uses 3.12)

The implementation environment did not have Docker running. After Docker Desktop is installed and started, use the commands below to migrate and test.

Do not commit `.env`. Copy from `.env.example`.

## API base URL

Windows host / browser:

```
http://127.0.0.1:8000/api/v1/
```

Android Emulator (the emulator loopback is not the Windows host):

```
http://10.0.2.2:8000/api/v1/
```

Physical device: use the PC LAN IPv4, e.g. `http://192.168.x.x:8000/api/v1/`.

iOS Simulator typically uses `http://127.0.0.1:8000/api/v1/`.

Development `ALLOWED_HOSTS` includes `10.0.2.2` so the emulator Host header is accepted. Do not copy that alias into production settings.

Admin:

```
http://127.0.0.1:8000/admin/
```

Health (public liveness, no auth):

```
http://127.0.0.1:8000/health/
```

## API docs (Swagger / ReDoc)

```
Swagger UI:  http://127.0.0.1:8000/api/docs/
ReDoc:       http://127.0.0.1:8000/api/redoc/
OpenAPI:     http://127.0.0.1:8000/api/schema/
```

JWT in Swagger:

1. `POST /api/v1/auth/token/` with development customer `+995555000001` / `Devpass123!` (`seed_dev`, DEBUG only).
2. Copy the `access` token.
3. Click **Authorize**.
4. Enter `Bearer <access>` or the token alone, depending on the Swagger prompt (scheme is HTTP Bearer).
5. Call authenticated endpoints such as `GET /api/v1/vehicles/`.

Docs are public in development (`ENABLE_API_DOCS` defaults on when `DEBUG` is true). On Render, set `ENABLE_API_DOCS=true` for staging and `false` for a public production API. Do not treat password JWT as production auth.

## Docker workflow (PowerShell)

From `backend/`:

```powershell
cd c:\Users\User\Desktop\autohelp\backend
Copy-Item .env.example .env
docker compose up --build
```

In a second PowerShell window:

```powershell
cd c:\Users\User\Desktop\autohelp\backend
docker compose exec web python manage.py migrate
docker compose exec web python manage.py seed_catalog
docker compose exec web python manage.py seed_dev --with-request
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py test
```

`createsuperuser` prompts for phone (E.164, example `+995555000099`) and password. Role is set to ADMIN.

Compose maps:

- API: `http://127.0.0.1:8000`
- Postgres: `localhost:5432`

The web service forces `POSTGRES_HOST=db`. Keep `.env` `POSTGRES_HOST=localhost` for local venv use.

Stop:

```powershell
docker compose down
```

Postgres data is in the `postgres_data` volume.

## Local Python venv workflow (PowerShell)

Use this if Docker only runs Postgres.

```powershell
cd c:\Users\User\Desktop\autohelp\backend
Copy-Item .env.example .env
docker compose up db -d
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements\development.txt
python manage.py migrate
python manage.py seed_catalog
python manage.py seed_dev --with-request
python manage.py createsuperuser
python manage.py runserver
python manage.py test
```

If `.env` `POSTGRES_HOST` is `db`, change it to `localhost` for the venv.

## Development sample users (`seed_dev`)

Only runs when `DEBUG=true`.

| Role     | Phone           | Password      |
|----------|-----------------|---------------|
| Customer | +995555000001   | Devpass123!   |
| Mechanic | +995555000002   | Devpass123!   |

Sample vehicle: BMW i8 2015 Hybrid.

`--with-request` creates a Battery / dead-battery `REQUESTED` job in Batumi.

## JWT (development foundation)

```
POST /api/v1/auth/token/
POST /api/v1/auth/token/refresh/
```

Token obtain body:

```json
{
  "phone": "+995555000001",
  "password": "Devpass123!"
}
```

Use `Authorization: Bearer <access>`.

This is **not** the production OTP login.

## Phase 1 endpoints

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health/` | public liveness `{"status": "ok"}` |
| POST | `/api/v1/auth/token/` | phone + password (dev) |
| POST | `/api/v1/auth/token/refresh/` | refresh JWT |
| GET | `/api/v1/services/` | public catalog + problems |
| GET | `/api/v1/services/{id}/` | public |
| GET/POST | `/api/v1/vehicles/` | authenticated customer, own vehicles |
| GET/PATCH/DELETE | `/api/v1/vehicles/{id}/` | owner only |
| GET/POST | `/api/v1/requests/` | customer: own requests; mechanic: assigned only |
| GET | `/api/v1/requests/{id}/` | owner / assigned / staff |
| GET/PATCH | `/api/v1/mechanic/me/` | mechanic availability (`online`) |
| GET | `/api/v1/mechanic/offers/` | mechanic pending inbox |
| POST | `/api/v1/mechanic/offers/{id}/accept/` | claim SEARCHING request |
| POST | `/api/v1/mechanic/offers/{id}/decline/` | decline own offer only |
| GET | `/api/v1/mechanic/jobs/active/` | current operational job, or 204 |
| POST | `/api/v1/mechanic/jobs/{request_id}/start-driving/` | ACCEPTED → ON_THE_WAY |
| POST | `/api/v1/mechanic/jobs/{request_id}/arrive/` | ON_THE_WAY → ARRIVED |
| POST | `/api/v1/mechanic/jobs/{request_id}/start-service/` | ARRIVED → IN_PROGRESS |
| POST | `/api/v1/mechanic/jobs/{request_id}/complete/` | IN_PROGRESS → COMPLETED |
| POST | `/api/v1/ratings/` | customer, completed request, one rating |

Mechanic `online` controls **new** offer eligibility only. Going offline expires that mechanic's PENDING offers and does not cancel an active accepted job. Operational status changes are explicit POSTs; there is no unrestricted `PATCH status`.

Request create is limited to:

`vehicle`, `service`, `problem`, `customer_latitude`, `customer_longitude`, `customer_address`

Backend sets `REQUESTED`, catalog estimate, and ignores client `status` / `assigned_mechanic`.

Estimates (not a pricing engine):

- Battery jump-start style problems: 30 GEL
- Battery replacement: 60 GEL
- Diagnostics: 50 GEL
- Auto Key: `estimated_price_amount = null` (never 0)

## Domain notes

- One `Service` + `ServiceRequest` model. Service type is `Service.code`: `BATTERY`, `DIAGNOSTICS`, `AUTO_KEY`.
- Statuses: `REQUESTED`, `SEARCHING`, `ASSIGNED`, `ACCEPTED`, `ON_THE_WAY`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`, `DECLINED`, `CANCELLED`.
- VIN is optional, uppercase, ISO-like 17 characters, unique when present. Blank VINs are stored as `NULL`.
- `MechanicLocation` is a history-capable coordinate log. No live tracking API in Phase 1.

## Future notifications (not implemented)

```
NotificationService
├── Push    — operational job events
├── SMS     — OTP / fallback
└── Email   — mechanic approval, security, receipts, support
```

Do not add Twilio / Resend / FCM in this phase.

Production tracking later: Google Maps + device location + these backend coordinates.

## Production settings

Set `DJANGO_SETTINGS_MODULE=config.settings.production`.

`DEBUG` is forced off. `SECRET_KEY` is required and must not be the development placeholder.

`ALLOWED_HOSTS` comes from a comma-separated env var. Render also injects `RENDER_EXTERNAL_HOSTNAME`; production settings merge that hostname automatically.

`DATABASE_URL` is required on Render (`postgres://` or `postgresql://`). Local Docker does **not** use `DATABASE_URL`; compose keeps `POSTGRES_HOST=db` and the discrete `POSTGRES_*` variables.

Hosted process: Gunicorn (`gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`). Do not use `runserver` on Render. `$PORT` is supplied by Render — do not hardcode `8000`.

Static files: WhiteNoise + `collectstatic` during the Render build. No S3 in this milestone.

CORS stays env-driven. `CORS_ALLOW_ALL_ORIGINS` is never enabled in production. Native Customer/Mechanic apps do not need browser CORS; leave `CORS_ALLOWED_ORIGINS` empty until a web Admin exists.

CSRF is not disabled. Set `CSRF_TRUSTED_ORIGINS` (https origins) for Django Admin on the hosted domain, or rely on the automatic `https://$RENDER_EXTERNAL_HOSTNAME` entry.

OpenAPI is gated by `ENABLE_API_DOCS`. Staging can set `true`; later production should set `false`.

Never commit real secrets. Never run `seed_dev` against the hosted database (`seed_dev` is DEBUG-only and would copy local test users).

## RENDER DEPLOYMENT

This is a monorepo. Only `backend/` is deployed. Do **not** create Render web services for the Customer or Mechanic Expo apps.

Hosted data starts empty plus **migrations** (the service catalog is a data migration). Do not copy the local Docker volume to Render. Do not run `seed_dev --with-request` on staging unless you later choose to do that on purpose.

### 1. Push the project to GitHub

The Render Blueprint (`render.yaml` at the repo root) expects this GitHub repository.

### 2. PostgreSQL

Blueprint creates `autohelp-db` (`autohelp` / `autohelp`). You can also create PostgreSQL manually in the Render dashboard and copy the **internal** connection string into `DATABASE_URL`.

Pick a plan your account allows. Render no longer offers free Postgres.

### 3. Web service or Blueprint

**Blueprint (preferred):** Dashboard → New → Blueprint → this repo. Services:

- `autohelp-api` (Python, `rootDir: backend`)
- `autohelp-db` (PostgreSQL)

**Manual web service:**

- Environment: Python
- Region: same as the database
- Root directory: `backend`
- Build command: `pip install -r requirements/production.txt && python manage.py collectstatic --noinput`
- Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 60 --access-logfile - --error-logfile -`
- Health check path: `/health/`

Do not point Render at `backend/Dockerfile`. That image is for **local Docker development** (`runserver`). Hosted staging uses the native Python runtime + Gunicorn.

### 4. Root directory / backend path

Root Directory must be `backend` so `config.wsgi`, `requirements/`, and `manage.py` resolve.

### 5. Environment variables

| Variable | Hosted value |
|----------|----------------|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` |
| `SECRET_KEY` | long random (Blueprint can generate) |
| `DATABASE_URL` | from the Render Postgres instance |
| `ALLOWED_HOSTS` | `your-service.onrender.com` (optional if `RENDER_EXTERNAL_HOSTNAME` is set; required for a custom domain) |
| `CSRF_TRUSTED_ORIGINS` | `https://your-service.onrender.com` (optional if `RENDER_EXTERNAL_HOSTNAME` is set) |
| `CORS_ALLOWED_ORIGINS` | empty unless a browser origin must call the API |
| `ENABLE_API_DOCS` | `true` on staging, `false` later in production |
| `JWT_ACCESS_MINUTES` | `60` |
| `JWT_REFRESH_DAYS` | `7` |

`RENDER_EXTERNAL_HOSTNAME` is set by Render. Do not put real passwords, JWT tokens, or the production `SECRET_KEY` in git.

### 6. Deploy

Trigger the first deploy from Blueprint or **Manual Deploy**. The build runs `collectstatic`. Gunicorn binds to `$PORT`.

### 7. Run migrations

Blueprint sets `preDeployCommand: python manage.py migrate --noinput` so migrate runs **once per deploy**, not inside each Gunicorn worker.

If your plan does not support pre-deploy commands, run once from Render Shell (do not add `migrate` to the start command):

```text
python manage.py migrate --noinput
```

That applies schema **and** the catalog data migration (`BATTERY`, `DIAGNOSTICS`, `AUTO_KEY`). It does not create test users.

### 8. Create a superuser

From Render Shell (no hardcoded admin password):

```text
python manage.py createsuperuser
```

Use an E.164 phone (example `+995555000099`) and a password you choose. The account role is ADMIN.

### 9. Check `/health/`

```text
GET https://<render-host>/health/
```

Expect HTTP 200 and `{"status": "ok"}`.

### 10. Check Swagger if enabled

If `ENABLE_API_DOCS=true`:

```text
https://<render-host>/api/docs/
https://<render-host>/api/redoc/
https://<render-host>/api/schema/
```

If `ENABLE_API_DOCS=false`, those paths are not routed.

### 11–12. Point the mobile apps at the hosted API

Do not hardcode the Render URL in source. In each app `.env`:

```text
EXPO_PUBLIC_API_URL=https://<render-host>/api/v1
```

- Customer: `apps/customer/.env`
- Mechanic: `apps/mechanic/.env`

Local Android Emulator remains `http://10.0.2.2:8000/api/v1`. Physical phone on LAN remains `http://<PC-LAN-IP>:8000/api/v1`.

Hosted staging has **no** `seed_dev` users unless you create them yourself. Password JWT is still a development foundation.

### 13. Restart Expo apps

Stop Metro and run `pnpm start` again in `apps/customer` and `apps/mechanic` so `EXPO_PUBLIC_API_URL` is picked up.

### Return to local Docker development

```powershell
cd c:\Users\User\Desktop\autohelp\backend
docker compose up -d
```

Leave `DATABASE_URL` unset (compose clears it). Use `DJANGO_SETTINGS_MODULE=config.settings.development` (compose sets this). API: `http://127.0.0.1:8000`. Swagger: `http://127.0.0.1:8000/api/docs/`. Admin: `http://127.0.0.1:8000/admin/`.

Stop with `docker compose down`. **Never** run `docker compose down -v` — that deletes the local Postgres volume.

After pulling dependency changes (for example WhiteNoise), rebuild without wiping volumes:

```powershell
docker compose up -d --build
```
