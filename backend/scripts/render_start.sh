#!/usr/bin/env bash
# Render Free-tier start: migrate once, then exec Gunicorn.
# Free web services do not support preDeployCommand or Shell.
# Do not put migrate inside the Gunicorn process. Do not run seed_dev.
# Replace this with preDeployCommand when moving to a paid service.
set -euo pipefail

python manage.py migrate --noinput

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT}" \
  --workers 2 \
  --timeout 60 \
  --access-logfile - \
  --error-logfile -
