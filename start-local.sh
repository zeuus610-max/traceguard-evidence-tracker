#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

if ! python3 -c 'import fastapi, uvicorn' >/dev/null 2>&1; then
  echo "FastAPI is not installed yet. Run: python3 -m pip install -r requirements.txt"
  exit 1
fi

npm run api &
API_PID=$!
npm run dev -- --host 127.0.0.1 &
WEB_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

wait
