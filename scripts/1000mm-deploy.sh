#!/usr/bin/env bash
#
# Deploy the portal and website to the Spaceship VPS.
#
# Install once, then run `1000mm-deploy` from anywhere:
#
#   sudo ln -sfn /srv/1000mm/scripts/1000mm-deploy.sh /usr/local/bin/1000mm-deploy
#
# A symlink rather than a copy, so updating the repo updates the deploy
# process. The previous version of this script lived only at /usr/local/bin
# and was lost with a VPS rebuild; that is why it is in the repo now.
#
# Overridable: REPO, UPLOADS_STORE, PORTAL_PORT, WEBSITE_PORT.

set -euo pipefail

REPO="${REPO:-/srv/1000mm}"
UPLOADS_STORE="${UPLOADS_STORE:-/var/www/1000mm-uploads}"
PORTAL_PORT="${PORTAL_PORT:-3001}"
WEBSITE_PORT="${WEBSITE_PORT:-3000}"
APPS=(portal website)
UNITS=(1000mm-portal 1000mm-website)

ASSUME_YES=0
SKIP_BUILD=0
NO_RESTART=0

while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes)      ASSUME_YES=1 ;;
    --skip-build)  SKIP_BUILD=1 ;;
    --no-restart)  NO_RESTART=1 ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      echo
      echo "Flags: -y/--yes (no prompts), --skip-build, --no-restart"
      exit 0 ;;
    *) echo "Unknown flag: $1 (try --help)" >&2; exit 2 ;;
  esac
  shift
done

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31mFAILED:\033[0m %s\n' "$*" >&2; exit 1; }

# ── 0. Preflight ─────────────────────────────────────────────────────────────
# Check every assumption before touching anything, so a half-applied deploy
# is not a possible outcome.

step "Preflight"

[ -d "$REPO/.git" ] || die "No git repo at $REPO (set REPO=... to override)."
cd "$REPO"
ok "repo: $REPO"

command -v node >/dev/null || die "node not on PATH."
command -v pnpm >/dev/null || die "pnpm not on PATH."
ok "node $(node -v), pnpm $(pnpm -v)"

[ -d "$UPLOADS_STORE" ] || die "Uploads store missing: $UPLOADS_STORE
This holds every uploaded file. Refusing to continue — if the path moved,
set UPLOADS_STORE=... ; if it is genuinely gone, restore it from backup
BEFORE deploying, or the symlink step will point at nothing."
ok "uploads store: $UPLOADS_STORE ($(find "$UPLOADS_STORE" -type f | wc -l) files)"

for app in "${APPS[@]}"; do
  [ -f "apps/$app/.env.production" ] \
    || die "Missing apps/$app/.env.production — it is gitignored, so it exists
only on this machine and a fresh clone will not have it."
done
ok "env files present"

for unit in "${UNITS[@]}"; do
  systemctl cat "$unit" >/dev/null 2>&1 || die "systemd unit not found: $unit"
done
ok "systemd units: ${UNITS[*]}"

dirty="$(git status --porcelain --untracked-files=no)"
if [ -n "$dirty" ]; then
  warn "Working tree has local modifications:"
  printf '%s\n' "$dirty" | sed 's/^/      /'
  if [ "$ASSUME_YES" -eq 0 ]; then
    read -rp "    Continue and let git pull merge over them? [y/N] " a
    [ "$a" = y ] || [ "$a" = Y ] || die "Aborted — commit or stash first."
  fi
fi

# ── 1. Rescue any uploads sitting in the working tree ────────────────────────
# apps/portal/public/uploads used to be tracked in git, so old checkouts carry
# real files there. It is also where the app writes when the symlink is
# missing. Either way those files belong in the store, and this must happen
# BEFORE git pull, which will delete them now that they are untracked.

step "Protecting uploads"

LOCAL_UPLOADS="apps/portal/public/uploads"
if [ -d "$LOCAL_UPLOADS" ] && [ ! -L "$LOCAL_UPLOADS" ]; then
  n="$(find "$LOCAL_UPLOADS" -type f | wc -l)"
  if [ "$n" -gt 0 ]; then
    warn "$n file(s) in $LOCAL_UPLOADS (a real directory, not the symlink)"
    # --ignore-existing: never overwrite what the store already has.
    rsync -a --ignore-existing "$LOCAL_UPLOADS/" "$UPLOADS_STORE/"
    ok "merged into $UPLOADS_STORE (nothing overwritten)"
  fi
fi

for app in "${APPS[@]}"; do
  BUNDLE_UPLOADS="apps/$app/.next-build/standalone/apps/$app/public/uploads"
  if [ -d "$BUNDLE_UPLOADS" ] && [ ! -L "$BUNDLE_UPLOADS" ]; then
    n="$(find "$BUNDLE_UPLOADS" -type f | wc -l)"
    if [ "$n" -gt 0 ]; then
      warn "$n file(s) written into the $app bundle instead of the store"
      rsync -a --ignore-existing "$BUNDLE_UPLOADS/" "$UPLOADS_STORE/"
      ok "merged into $UPLOADS_STORE"
    fi
  fi
done
ok "uploads safe"

# ── 2. Pull ──────────────────────────────────────────────────────────────────

step "Pulling"
before="$(git rev-parse --short HEAD)"
git pull --ff-only origin main
after="$(git rev-parse --short HEAD)"
if [ "$before" = "$after" ]; then
  ok "already at $after"
else
  ok "$before -> $after"
  git --no-pager log --oneline "$before..$after" | sed 's/^/      /'
fi

# ── 3. Confirm the env that is about to be baked in ──────────────────────────
# NEXT_PUBLIC_* are compiled into the client bundle at build time. Editing
# them after a build does nothing, so they are shown here, before it.

step "Build-time environment"
for app in "${APPS[@]}"; do
  echo "    apps/$app/.env.production"
  grep -hE '^(AUTH_URL|NEXT_PUBLIC_[A-Z_]+)=' "apps/$app/.env.production" 2>/dev/null \
    | sed 's/^/      /' || warn "no AUTH_URL / NEXT_PUBLIC_* found"
done
warn "AUTH_URL must match the browser's origin exactly, or logins fail."
if [ "$ASSUME_YES" -eq 0 ]; then
  read -rp "    These get baked into the client bundle. Correct? [y/N] " a
  [ "$a" = y ] || [ "$a" = Y ] || die "Aborted — fix the .env.production files, then re-run."
fi

# ── 4. Dependencies and schema ───────────────────────────────────────────────

step "Installing dependencies"
pnpm install --frozen-lockfile
ok "dependencies installed"

step "Applying schema"
# db push, not migrate: the schema has drift from hand-applied changes, so
# migrate would try to reconcile a history that does not match.
pnpm --filter @1000mm/db exec prisma db push
pnpm --filter @1000mm/db exec prisma generate
ok "schema pushed, client generated"

# ── 5. Build ─────────────────────────────────────────────────────────────────

if [ "$SKIP_BUILD" -eq 1 ]; then
  warn "skipping build (--skip-build)"
else
  step "Building"
  # Built one at a time: both at once has been OOM-killed on this box.
  for app in "${APPS[@]}"; do
    echo "    building $app…"
    pnpm --filter "$app" build >/dev/null || die "Build failed for $app.
Re-run without output suppression to see why:  pnpm --filter $app build"
    ok "$app built"
  done
fi

# ── 6. Assemble the standalone bundles ───────────────────────────────────────
# Next leaves static/ out of the standalone output, and copies public/
# inconsistently, so both are synced explicitly. uploads is excluded here and
# handled as a symlink below.

step "Assembling bundles"
for app in "${APPS[@]}"; do
  SA="apps/$app/.next-build/standalone/apps/$app"
  [ -d "$SA" ] || die "No standalone bundle at $SA — did the build run?"

  if [ -d "apps/$app/public" ]; then
    mkdir -p "$SA/public"
    rsync -a --exclude uploads "apps/$app/public/" "$SA/public/"
  fi

  [ -d "apps/$app/.next-build/static" ] \
    || die "No static output at apps/$app/.next-build/static"
  mkdir -p "$SA/.next-build/static"
  rsync -a "apps/$app/.next-build/static/" "$SA/.next-build/static/"
  ok "$app: public + static synced"
done

# ── 7. Re-link uploads ───────────────────────────────────────────────────────
# The build regenerates the bundle and destroys this symlink every time, which
# is what silently orphans every uploaded file after a deploy.
#
# rm -rf before ln -s, deliberately: `ln -sfn` places the link INSIDE an
# existing real directory rather than replacing it, which is how uploads ended
# up being served from the wrong path once already. Step 1 has already rescued
# anything that was in there.

step "Linking uploads"
UP="apps/portal/.next-build/standalone/apps/portal/public/uploads"
mkdir -p "$(dirname "$UP")"
rm -rf "$UP"
ln -s "$UPLOADS_STORE" "$UP"
[ -L "$UP" ] || die "Failed to create the uploads symlink at $UP"
linked="$(find -L "$UP/" -type f 2>/dev/null | wc -l)"
[ "$linked" -gt 0 ] || die "Symlink created but resolves to no files — check $UPLOADS_STORE"
ok "$UP -> $UPLOADS_STORE ($linked files visible)"

# ── 8. Restart ───────────────────────────────────────────────────────────────

if [ "$NO_RESTART" -eq 1 ]; then
  warn "skipping restart (--no-restart)"
else
  step "Restarting"
  sudo systemctl restart "${UNITS[@]}"
  for unit in "${UNITS[@]}"; do
    systemctl is-active --quiet "$unit" \
      || die "$unit did not come back up. Logs:  journalctl -u $unit -n 50"
    ok "$unit active"
  done
fi

# ── 9. Health check ──────────────────────────────────────────────────────────
# Bound to 127.0.0.1 behind Nginx, so check the origins directly. Retried
# because Next needs a moment to accept connections after a restart.

step "Health check"
check() {
  local name="$1" url="$2" code
  for _ in $(seq 1 15); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "$url" 2>/dev/null || echo 000)"
    case "$code" in
      2??|3??) ok "$name -> $code"; return 0 ;;
    esac
    sleep 2
  done
  die "$name unhealthy (last status: ${code:-none}) at $url
Logs:  journalctl -u 1000mm-portal -u 1000mm-website -n 50"
}
check "portal " "http://127.0.0.1:${PORTAL_PORT}/login"
check "website" "http://127.0.0.1:${WEBSITE_PORT}/"

# An uploaded file through the portal's own route — proves the symlink works
# end to end, not just that it exists on disk.
sample="$(find -L "$UP/" -type f -printf '%P\n' 2>/dev/null | head -1 || true)"
if [ -n "$sample" ]; then
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 \
    "http://127.0.0.1:${PORTAL_PORT}/api/uploads/${sample}" 2>/dev/null || echo 000)"
  # Non-public prefixes require a session, so 404 here is the auth guard
  # doing its job rather than a broken link.
  case "$code" in
    200) ok "uploads served ($sample)" ;;
    *)   warn "uploads probe returned $code for $sample (expected for
      session-gated prefixes; check an image in the browser to be sure)" ;;
  esac
fi

printf '\n\033[1;32mDeployed.\033[0m %s\n' "$(git rev-parse --short HEAD)"
echo "Rollback:  cd $REPO && git reset --hard $before && 1000mm-deploy -y"
