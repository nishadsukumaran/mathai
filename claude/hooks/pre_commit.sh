#!/bin/sh
# ─── MathAI Pre-Commit Hook ────────────────────────────────────────────────────
#
# Runs before every commit. Blocks commits that fail these checks.
# Install: cp claude/hooks/pre_commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# CHECKS:
#   1. TypeScript compilation (no type errors)
#   2. Unit tests (core engines only — fast check)
#   3. No console.log in production code paths

set -e

echo "🔍 MathAI pre-commit checks..."

# ─── TypeScript ────────────────────────────────────────────────────────────────
echo "  → TypeScript check..."
npx tsc --noEmit --project tsconfig.json
echo "  ✅ TypeScript OK"

# ─── Unit tests (fast subset only) ───────────────────────────────────────────
echo "  → Unit tests..."
npx jest --testPathPattern="tests/unit/(gamification|curriculum)" --passWithNoTests --silent
echo "  ✅ Unit tests passed"

# ─── No console.log in production paths ───────────────────────────────────────
echo "  → Checking for console.log in production code..."
CONSOLE_HITS=$(grep -r "console\.log" --include="*.ts" \
  --exclude-dir=tests \
  --exclude-dir=node_modules \
  --exclude="*.test.ts" \
  ai/ api/ curriculum/ services/ 2>/dev/null | grep -v "// TODO" | grep -v "STUB" | wc -l | tr -d ' ')

if [ "$CONSOLE_HITS" -gt "0" ]; then
  echo "  ⚠️  Found $CONSOLE_HITS console.log(s) in production code."
  echo "     Replace with proper logging or mark as STUB/TODO."
  echo "     (Run: grep -rn 'console.log' ai/ api/ curriculum/ services/)"
  # Warning only — not blocking. Change 'echo' to 'exit 1' to make it blocking.
fi

echo "✅ Pre-commit checks passed. Proceeding with commit."
