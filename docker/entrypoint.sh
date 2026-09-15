#!/bin/sh
set -e

cd /app/apps/api

echo "[entrypoint] Aplicando migrations…"
npx prisma migrate deploy

echo "[entrypoint] Seed idempotente…"
npx tsx prisma/seed.ts

echo "[entrypoint] Iniciando API + web…"
exec node dist/main.js
