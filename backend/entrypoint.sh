#!/bin/bash
set -e

echo "Waiting for Postgres..."
until PGPASSWORD="${POSTGRES_PASSWORD}" pg_isready -h postgres -p 5432 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > /dev/null 2>&1; do
    echo "Postgres is unavailable - sleeping"
    sleep 1
done
echo "Postgres is up"

echo "Running migrations..."
alembic upgrade head

echo "Running seed..."
python -m app.seed

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
