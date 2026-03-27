#!/usr/bin/env bash
set -e
BASE_URL=${1:-http://127.0.0.1:8080}
npx http-server -p 8080 & PID=$!
sleep 1
node tests/headless-runner.js --baseUrl "$BASE_URL"
RET=$?
kill $PID || true
exit $RET