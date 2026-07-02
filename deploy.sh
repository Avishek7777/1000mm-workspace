#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Locate the Prisma client generated inside the pnpm store
PRISMA_MATCHES=$(find "$REPO/node_modules/.pnpm" -maxdepth 1 -type d -name "@prisma+client*" 2>/dev/null)
MATCH_COUNT=$(echo "$PRISMA_MATCHES" | grep -c . || true)

if [ "$MATCH_COUNT" -eq 0 ]; then
  echo "ERROR: .prisma not found in pnpm store. Run: pnpm --filter @1000mm/db exec prisma generate"
  exit 1
elif [ "$MATCH_COUNT" -gt 1 ]; then
  echo "ERROR: multiple @prisma+client versions found in pnpm store — refusing to guess:"
  echo "$PRISMA_MATCHES"
  exit 1
fi

PRISMA_STORE="$PRISMA_MATCHES/node_modules/.prisma"
if [ ! -d "$PRISMA_STORE" ]; then
  echo "ERROR: expected .prisma dir missing at $PRISMA_STORE"
  exit 1
fi

LINKED=0
for APP_DIR in "$REPO"/apps/*/; do
  APP_NAME="$(basename "$APP_DIR")"
  NEXT_MODS="${APP_DIR}.next/node_modules"
  if [ -d "$NEXT_MODS" ]; then
    ln -sf "$PRISMA_STORE" "$NEXT_MODS/.prisma"
    echo "✓ .prisma symlinked for $APP_NAME: $NEXT_MODS/.prisma -> $PRISMA_STORE"
    LINKED=$((LINKED + 1))
  else
    echo "⏭  skipping $APP_NAME (no .next/node_modules found — upload the build first)"
  fi
done

if [ "$LINKED" -eq 0 ]; then
  echo "ERROR: no apps had a .next/node_modules to link into. Did the upload complete?"
  exit 1
fi

echo "Done. $LINKED app(s) linked."