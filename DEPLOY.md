# Deploying to cPanel (Hosting Bangladesh)

Both apps are built **locally** into self-contained bundles (Next.js
`output: "standalone"`), so the server never runs `pnpm install` or `next build`.
Passenger (cPanel's **Setup Node.js App**) supervises the process — PM2 is not
needed and not used.

| App     | Domain                       | Bundle               |
| ------- | ---------------------------- | -------------------- |
| website | https://1000mm.org.bd        | `deploy/website.zip` |
| portal  | https://portal.1000mm.org.bd | `deploy/portal.zip`  |

Requirements on the server: Node **20.9+** (pick 20 or 22 in the cPanel Node.js
selector). The database is PostgreSQL running on the host itself (`localhost`
from the apps' point of view) — see the Database section below.

---

## 1. Build & package (on your machine)

```powershell
pnpm build                                # builds portal + website (standalone)
node scripts/package-deploy.mjs --zip     # → deploy/portal.zip, deploy/website.zip
```

Prefer zipping manually (WinRAR)? Run the script **without** `--zip` — it still
prepares everything — then zip the **contents** of
`apps/portal/.next-build/standalone` and `apps/website/.next-build/standalone`
(open the folder, select all, add to archive), so `apps/` and `node_modules/`
sit at the root of the archive. The server's extractor only accepts `.zip`.

> **Production builds use `.next-build/`, not `.next/`.** `next build` and
> `next dev` both default to the same output directory; sharing it means a
> deploy build silently corrupts the dev server's on-disk route manifests —
> routes start 404ing or 500ing, and restarting the dev server does **not**
> fix it (the corruption is on disk, not just in the running process). The
> fix, already wired up in `next.config.ts` for both apps: production builds
> (`phase === PHASE_PRODUCTION_BUILD`) get `distDir: ".next-build"`, dev
> keeps plain `.next/`. If you ever see routes randomly 404ing in dev after
> running a deploy build, delete `apps/<app>/.next` (safe — it's just a
> cache) and restart the dev server.

> **Do not remove `nodeLinker: hoisted` from `pnpm-workspace.yaml`.** With
> pnpm's default linker, `node_modules` is built from Windows junctions that
> zip archives cannot carry — the deployed app then crashes with
> `Cannot find module '@swc/helpers/...'`. The hoisted layout uses real
> folders, and the packaging script additionally dereferences the few
> junctions Turbopack itself emits (e.g. `.next-build/node_modules/@prisma/client-<hash>`).

The packaging script also:

- copies `public/` and `.next-build/static/` into each bundle (Next leaves them out);
- injects **Linux x64 sharp** binaries (we build on Windows, the server is Linux —
  without these, `next/image` optimization crashes);
- verifies the Prisma engine for **rhel-openssl-3.0.x** (CloudLinux) is in the
  portal bundle;
- copies `.env.production` into the bundle as a fallback.

> `NEXT_PUBLIC_*` variables are **baked into the client JS at build time** from
> `apps/*/.env.production`. If a domain ever changes, rebuild — changing env on
> the server is not enough.

## 2. Upload & extract

In cPanel **File Manager** (or via FTP):

1. Create two folders in your home directory, **outside** `public_html`:
   `~/nodeapps/website` and `~/nodeapps/portal`.
2. Upload each `.zip` into its folder and use File Manager's **Extract**.
   (One archive is far faster than uploading thousands of small
   `node_modules` files unpacked.)

## 3. Create the Node.js apps

cPanel → **Setup Node.js App** → *Create Application* (once per app):

| Setting            | website                     | portal                      |
| ------------------ | --------------------------- | --------------------------- |
| Node.js version    | 20.x or 22.x                | 20.x or 22.x                |
| Application mode   | Production                  | Production                  |
| Application root   | `nodeapps/website`          | `nodeapps/portal`           |
| Application URL    | `1000mm.org.bd`             | `portal.1000mm.org.bd`      |
| Startup file       | `apps/website/server.js`    | `apps/portal/server.js`     |

Do **not** run "NPM Install" — the bundle already contains everything.

### Environment variables (add in the same screen)

**portal** (values from `apps/portal/.env.production`):

```
NODE_ENV=production
DATABASE_URL=…          (host PostgreSQL, localhost)
DIRECT_URL=…            (same as DATABASE_URL)
AUTH_SECRET=…
AUTH_URL=https://portal.1000mm.org.bd
AUTH_TRUST_HOST=true    (required behind Passenger's proxy)
RESEND_API_KEY=…
RESEND_FROM_EMAIL=noreply@1000mm.org.bd
NEXT_PUBLIC_APP_URL=https://1000mm.org.bd
NEXT_PUBLIC_PORTAL_URL=https://portal.1000mm.org.bd
INTERNAL_UPLOAD_SECRET=…   (must match the website's value exactly)
```

**website**:

```
NODE_ENV=production
NEXT_PUBLIC_PORTAL_URL=https://portal.1000mm.org.bd
NEXT_PUBLIC_SITE_URL=https://1000mm.org.bd
DATABASE_URL=…             (same value as the portal's)
DIRECT_URL=…                (same value as the portal's)
INTERNAL_UPLOAD_SECRET=…   (must match the portal's value exactly)
```

> The website needs `DATABASE_URL`/`DIRECT_URL` too — its own routes
> (`/api/contact`, `/api/trainer-application`) write to the same database
> directly. `INTERNAL_UPLOAD_SECRET` authenticates the website's
> server-to-server calls to the portal's `/api/internal/upload` (there is no
> logged-in portal session in that flow) — the two apps deploy as separate
> bundles with no shared filesystem, so the website cannot write into the
> portal's `public/uploads/` directly.

Click **Restart** after saving. Passenger auto-starts the app on first request
and restarts it if it crashes.

## 4. First-visit checklist

- `https://1000mm.org.bd` renders; project images (served from the portal via
  `/api/uploads/...`) load.
- `https://portal.1000mm.org.bd/login` works with a seeded account
  (login exercises DB + bcrypt).
- Upload a profile photo in the portal — confirms the local-disk upload path
  (`apps/portal/public/uploads/` on the server) is writable.
- Generate an ID card / certificate — QR must point at
  `https://portal.1000mm.org.bd/verify/…`.

## 5. Redeploying a new version

1. Build + package locally (step 1), upload the new `.zip` into the same app
   folder, and **Extract** (overwrites in place).
2. **Never delete `apps/portal/public/uploads/` on the server** — that's where
   user uploads live. Extracting over it is safe (it only adds/overwrites
   files); deleting the folder first is not. If you prefer a clean folder,
   move `uploads/` aside, extract fresh, move it back.
3. cPanel → Setup Node.js App → **Restart** the app.

## 6. Database migrations

Run from your machine against Supabase (the server never touches the schema):

```powershell
pnpm --filter @1000mm/db exec prisma db push      # current workflow (schema drift)
```

## Troubleshooting

- **Both domains serve the same app** — the portal subdomain must have its
  **own document root** (`portal_html`), not share `public_html`. The Node
  selector routes via `.htaccess` in the docroot; a shared docroot means one
  app captures both domains. Fix the docroot in cPanel → Domains, restart the
  portal app, and remove the stale `nodeapps/portal` block from
  `public_html/.htaccess`.
- **Hosting process limit (500) exhausted** — almost always a crash-looping
  app (each request spawns a dying process). Fix the crash cause; don't just
  restart. Healthy idle is ~110 processes.

- **503 / "Passenger could not spawn"** — open the app's log (path shown in the
  Node.js App screen, or `~/nodeapps/<app>/stderr.log`). Most common causes:
  wrong startup file path, or Node version below 20.9.
- **`UntrustedHost` from NextAuth** — `AUTH_TRUST_HOST=true` is missing.
- **Broken images from `next/image`** — Linux sharp binaries missing; rerun
  `node scripts/package-deploy.mjs` (it injects them) and redeploy.
- **`PrismaClientInitializationError: query engine … rhel-openssl-3.0.x`** —
  engine not in bundle; rerun `pnpm --filter @1000mm/db exec prisma generate`
  then repackage (schema.prisma already lists the target).
