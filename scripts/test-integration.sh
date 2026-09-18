#!/usr/bin/env bash
# Runs integration tests against an isolated "crm_test" schema so development
# data is never touched.
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${TEST_DATABASE_URL:-${DATABASE_URL:-postgresql://crm:crm@localhost:5432/crm}}"
export DATABASE_URL="${BASE_URL%%\?*}?schema=crm_test"

npx prisma db push --skip-generate --accept-data-loss >/dev/null
npx vitest run --config vitest.integration.config.ts "$@"
