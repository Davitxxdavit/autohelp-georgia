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

```
http://127.0.0.1:8000/api/v1/
```

Admin:

```
http://127.0.0.1:8000/admin/
```

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
| POST | `/api/v1/auth/token/` | phone + password (dev) |
| POST | `/api/v1/auth/token/refresh/` | refresh JWT |
| GET | `/api/v1/services/` | public catalog + problems |
| GET | `/api/v1/services/{id}/` | public |
| GET/POST | `/api/v1/vehicles/` | authenticated customer, own vehicles |
| GET/PATCH/DELETE | `/api/v1/vehicles/{id}/` | owner only |
| GET/POST | `/api/v1/requests/` | customer: own requests; mechanic: assigned only |
| GET | `/api/v1/requests/{id}/` | owner / assigned / staff |
| POST | `/api/v1/ratings/` | customer, completed request, one rating |

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

`DEBUG` is forced off. `SECRET_KEY` and `ALLOWED_HOSTS` are required. CORS wildcard is not enabled.

Run with gunicorn when you add a production Compose/host (not in this phase).
