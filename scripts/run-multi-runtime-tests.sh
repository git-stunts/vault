#!/bin/sh

# Ensure we run from the vault directory so compose file is resolved
cd "$(dirname "$0")/.." || exit 1

printf "🚀 Starting multi-runtime Docker tests for vault...\n"

# Detect docker compose version
COMPOSE_MODE="v2"
if docker compose version > /dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif docker-compose version > /dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
  COMPOSE_MODE="v1"
else
  printf "❌ docker compose not found\n"
  exit 1
fi

printf "Using %s (mode=%s)\n" "$DOCKER_COMPOSE" "$COMPOSE_MODE"

SERVICES="node-test bun-test deno-test"

$DOCKER_COMPOSE up --build --remove-orphans

UP_EXIT=$?
if [ "$UP_EXIT" -ne 0 ]; then
  printf "❌ docker compose up failed (exit %s)\n" "$UP_EXIT"
  $DOCKER_COMPOSE down
  exit 1
fi

EXIT_CODE=0
for service in $SERVICES; do
  if [ "$COMPOSE_MODE" = "v2" ]; then
    STATUS=$($DOCKER_COMPOSE ps -a --format "{{.ExitCode}}" "$service")
  else
    CONTAINER=$($DOCKER_COMPOSE ps -q "$service")
    if [ -n "$CONTAINER" ]; then
      STATUS=$(docker inspect --format '{{.State.ExitCode}}' "$CONTAINER")
    else
      STATUS=""
    fi
  fi

  if [ -z "$STATUS" ] || [ "$STATUS" != "0" ]; then
    printf "❌ %s failed (exit %s)\n" "$service" "${STATUS:-unknown}"
    EXIT_CODE=1
  else
    printf "✅ %s passed\n" "$service"
  fi
done

$DOCKER_COMPOSE down

exit $EXIT_CODE
