#!/bin/bash
set -e

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEXT_MODS="$REPO/apps/portal/.next/node_modules"

PRISMA_STORE=$(find "$REPO/node_modules/.pnpm" -maxdepth 4 -type d -name ".prisma" 2>/dev/null | grep "@prisma+client" | head -1)

if [ -z "$PRISMA_STORE" ]; then
  echo "ERROR: .prisma not found in pnpm store. Run: pnpm --filter @1000mm/db exec prisma generate"
  exit 1
fi

if [ ! -d "$NEXT_MODS" ]; then
  echo "ERROR: $NEXT_MODS does not exist. Upload the .next build first."
  exit 1
fi

ln -sf "$PRISMA_STORE" "$NEXT_MODS/.prisma"
echo "✓ .prisma symlinked: $NEXT_MODS/.prisma -> $PRISMA_STORE"
