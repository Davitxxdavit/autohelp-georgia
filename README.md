# AutoHelp

On-demand roadside assistance for Georgia. A driver requests help from their phone, a nearby mechanic accepts the job, and both follow each other live on a map until the job is done.

The repo holds three parts:

| Part | Path | Stack |
|------|------|-------|
| Customer app | [`apps/customer`](apps/customer) | Expo (React Native), Expo Router, TypeScript |
| Mechanic app | [`apps/mechanic`](apps/mechanic) | Expo (React Native), Expo Router, TypeScript |
| API | [`backend`](backend) | Django 5.2, Django REST Framework, PostgreSQL, JWT |

## Screenshots

_Screenshots coming soon._

<!--
Save phone screenshots in docs/screenshots/ with these names, then delete
the "coming soon" line above and this comment's opening/closing markers.

| Customer — Home | Customer — Live tracking | Mechanic — Incoming job |
|:---:|:---:|:---:|
| <img src="docs/screenshots/customer-home.png" width="250"> | <img src="docs/screenshots/customer-tracking.png" width="250"> | <img src="docs/screenshots/mechanic-incoming.png" width="250"> |
-->


## Features

**Customer app**
- Phone number sign-up and login
- Four languages: Georgian (default), English, Russian, Turkish
- Save vehicles to your garage
- Request a service: **Battery**, **Diagnostics**, **Keys**
- Share your location and follow the mechanic live on a map with route and ETA
- Approve the mechanic's final price quote
- Order history and mechanic ratings

**Mechanic app**
- Registration with admin approval
- Receive and accept nearby job offers
- Live location sharing while driving to the customer
- Send a final price quote, complete jobs
- Earnings and job history

**API**
- JWT authentication, role-based access (customer / mechanic / admin)
- Request lifecycle with status history and one active request per user
- Mechanic matching, pricing estimates, and quote approval
- Road routing and ETA through [OpenRouteService](https://openrouteservice.org/) (optional)
- OpenAPI docs with Swagger UI and ReDoc
- Django Admin for approving mechanics and managing data

## Getting started

### Requirements

- Node.js and [pnpm](https://pnpm.io/)
- Docker Desktop (for PostgreSQL and the API)
- Python 3.12 (only if running the API outside Docker)
- Android Studio emulator, Xcode simulator, or a real phone with a development build

### 1. Run the API

```bash
cd backend
cp .env.example .env
docker compose up --build
```

In a second terminal, set up the database and sample data:

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py seed_catalog
docker compose exec web python manage.py seed_dev --with-request
```

The API runs at `http://127.0.0.1:8000/api/v1/`, with Swagger UI at `http://127.0.0.1:8000/api/docs/`.

`seed_dev` creates local sample accounts (DEBUG only). See [`backend/README.md`](backend/README.md) for these, the venv workflow, and all endpoints.

### 2. Run the mobile apps

```bash
cd apps/customer
cp .env.example .env
pnpm install
pnpm start
```

Do the same in `apps/mechanic`. In each `.env`, set `EXPO_PUBLIC_API_URL`:

| Where the app runs | `EXPO_PUBLIC_API_URL` |
|--------------------|-----------------------|
| Android Emulator | `http://10.0.2.2:8000/api/v1` |
| iOS Simulator | `http://127.0.0.1:8000/api/v1` |
| Real phone on the same Wi‑Fi | `http://<your-PC-LAN-IP>:8000/api/v1` |

## Tests

```bash
cd backend
docker compose exec web python manage.py test
```

Staging smoke tests and manual device checks are described in [`docs/TESTING.md`](docs/TESTING.md) and [`docs/MANUAL_DEVICE_TESTS.md`](docs/MANUAL_DEVICE_TESTS.md).

## Deployment

The API deploys to [Render](https://render.com/) using the Blueprint in [`render.yaml`](render.yaml) (web service + PostgreSQL). Secrets such as `SECRET_KEY`, the database URL, staging accounts and `ROUTING_API_KEY` are set in the Render dashboard, never in the repo. Step-by-step instructions are in [`backend/README.md`](backend/README.md#render-deployment).

## Project structure

```
autohelp/
├── apps/
│   ├── customer/      # Customer Expo app
│   └── mechanic/      # Mechanic Expo app
├── backend/           # Django REST API
│   ├── apps/          # accounts, requests, services, vehicles, ratings, common
│   └── config/        # settings (development / production)
├── docs/              # testing guides
├── scripts/           # staging smoke tests
└── render.yaml        # Render deployment blueprint
```

## Status

MVP in active development. Password login is a development foundation; phone OTP login is planned.
