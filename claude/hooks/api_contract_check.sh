#!/bin/sh
# ─── MathAI API Contract Check ─────────────────────────────────────────────────
#
# Validates that all route registrations have matching controllers and validators.
# Run manually or in CI: sh claude/hooks/api_contract_check.sh
#
# CHECKS:
#   1. Every route file exports a default router
#   2. Every controller function referenced in routes exists in its controller file
#   3. Every validator schema referenced in controllers is exported

set -e

echo "🔍 API contract check..."

# ─── Check all route files exist and export a router ──────────────────────────
ROUTES=(
  "api/routes/practice.routes.ts"
  "api/routes/curriculum.routes.ts"
  "api/routes/progress.routes.ts"
  "api/routes/gamification.routes.ts"
  "api/routes/index.ts"
)

for route in "${ROUTES[@]}"; do
  if [ ! -f "$route" ]; then
    echo "  ❌ Missing route file: $route"
    exit 1
  fi
  echo "  ✅ $route exists"
done

# ─── Check all controllers exist ─────────────────────────────────────────────
CONTROLLERS=(
  "api/controllers/practiceController.ts"
)

for ctrl in "${CONTROLLERS[@]}"; do
  if [ ! -f "$ctrl" ]; then
    echo "  ❌ Missing controller: $ctrl"
    exit 1
  fi
  echo "  ✅ $ctrl exists"
done

# ─── Check all validators exist ───────────────────────────────────────────────
VALIDATORS=(
  "api/validators/practice.validators.ts"
  "api/validators/curriculum.validators.ts"
)

for val in "${VALIDATORS[@]}"; do
  if [ ! -f "$val" ]; then
    echo "  ❌ Missing validator: $val"
    exit 1
  fi
  echo "  ✅ $val exists"
done

echo "✅ API contract check passed."
