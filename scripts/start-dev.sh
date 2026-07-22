#!/bin/bash
# ============================================================
#  Start the full farm dev stack:
#    1. Postgres (Docker)     localhost:5432
#    2. API (NestJS)          localhost:3000  (docs at /docs)
#    3. Website + app         localhost:5500  (app at /app/)
#
#  Usage:   bash ~/Downloads/kota-farm-website/scripts/start-dev.sh
#  Stop:    Ctrl+C stops API + web server; DB keeps running
#           (stop it with: cd ~/Downloads/farm-manager-api && docker compose down)
# ============================================================
set -e

API_DIR="$HOME/Downloads/farm-manager-api"
SITE_DIR="$HOME/Downloads/kota-farm-website"

# 1. Database
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker Desktop is not running — open it first, then re-run."
  exit 1
fi
echo "▶ Starting Postgres…"
(cd "$API_DIR" && docker compose up -d)

# 2. Website server (background)
echo "▶ Starting website on http://localhost:5500 …"
(cd "$SITE_DIR" && python3 -m http.server 5500 >/dev/null 2>&1) &
WEB_PID=$!

# 3. Open the app once the API is up (background watcher)
( for i in $(seq 1 60); do
    curl -s -o /dev/null http://localhost:3000/v1/health && break
    sleep 1
  done
  open "http://localhost:5500/app/" ) &

# Stop the web server when this script exits (Ctrl+C)
trap 'kill $WEB_PID 2>/dev/null' EXIT

# 4. API (foreground — its logs stay visible; Ctrl+C stops everything)
echo "▶ Starting API on http://localhost:3000 …"
cd "$API_DIR"
npm run start:dev
