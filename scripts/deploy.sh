#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STATE_DIR="$ROOT/.deploy"
STATE_FILE="$STATE_DIR/active"
# HTTPS público: Caddy do financial-manager → host.docker.internal:3010
DOMAIN="${APP_DOMAIN:-webmail.financyexpert.com}"
HOST_PORT=3010

mkdir -p "$STATE_DIR"

smoke_internal() {
  slot="$1"
  if [ "$slot" = "green" ]; then
    docker compose --profile green exec -T app-green node -e \
      "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"
  else
    docker compose exec -T app-blue node -e \
      "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"
  fi
}

smoke_host() {
  i=0
  while [ "$i" -lt 30 ]; do
    if command -v curl >/dev/null 2>&1; then
      if curl -fsS -o /dev/null --max-time 10 \
        "http://127.0.0.1:${HOST_PORT}/login"; then
        return 0
      fi
    elif command -v wget >/dev/null 2>&1; then
      if wget -q -O /dev/null -T 10 "http://127.0.0.1:${HOST_PORT}/login"; then
        return 0
      fi
    fi
    i=$((i + 1))
    sleep 2
  done
  return 1
}

slot_cmd() {
  slot="$1"
  shift
  if [ "$slot" = "green" ]; then
    docker compose --profile green "$@" app-green
  else
    docker compose "$@" app-blue
  fi
}

restore_slot() {
  slot="$1"
  echo "[deploy] Restaurando app-$slot em 127.0.0.1:${HOST_PORT}…"
  if ! slot_cmd "$slot" up -d --no-deps --wait; then
    echo "[deploy] Falha ao restaurar app-$slot."
    return 1
  fi
  if ! smoke_host; then
    echo "[deploy] Aviso: http://127.0.0.1:${HOST_PORT}/login não respondeu após restore."
    return 1
  fi
  return 0
}

fail_next() {
  slot="$1"
  echo "[deploy] Slot app-$slot falhou."
  slot_cmd "$slot" logs --tail 80 || true
  slot_cmd "$slot" stop || true
  slot_cmd "$slot" rm -f || true
  if [ -n "${active:-}" ]; then
    restore_slot "$active" || echo "[deploy] Não foi possível restaurar app-$active."
  fi
  exit 1
}

active=""
if [ -f "$STATE_FILE" ]; then
  active="$(tr -d '[:space:]' < "$STATE_FILE")"
fi

case "$active" in
  blue) next=green ;;
  green) next=blue ;;
  *)
    next=blue
    active=""
    ;;
esac

echo "[deploy] Ativo=${active:-nenhum} próximo=$next"
echo "[deploy] Tráfego público: https://${DOMAIN} (Caddy financial-manager → :${HOST_PORT})"

docker compose up -d --wait db

echo "[deploy] Build da imagem…"
docker compose build app-blue

# Ambos os slots publicam 3010 no host — libera a porta antes de subir o próximo.
if [ -n "$active" ]; then
  echo "[deploy] Parando app-$active para liberar 127.0.0.1:${HOST_PORT}…"
  slot_cmd "$active" stop || true
fi

legacy="$(docker ps --filter "name=mail-manager-app-1" --format '{{.ID}}' || true)"
if [ -n "$legacy" ]; then
  echo "[deploy] Parando container legado mail-manager-app-1."
  docker stop "$legacy" || true
fi

if ! slot_cmd "$next" up -d --no-deps --wait; then
  fail_next "$next"
fi

echo "[deploy] Smoke interno em app-$next…"
if ! smoke_internal "$next"; then
  fail_next "$next"
fi

echo "[deploy] Smoke host em http://127.0.0.1:${HOST_PORT}/login…"
if ! smoke_host; then
  fail_next "$next"
fi

printf '%s\n' "$next" > "$STATE_FILE"
echo "[deploy] Slot ativo=app-$next em 127.0.0.1:${HOST_PORT}."

if [ -n "$active" ] && [ "$active" != "$next" ]; then
  echo "[deploy] Removendo slot antigo app-$active…"
  slot_cmd "$active" rm -f || true
fi

docker image prune -f
echo "[deploy] Concluído. Ativo=$next"
