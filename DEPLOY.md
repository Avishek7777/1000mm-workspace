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
selector). The database is Supabase Postgres (external), so nothing DB-related
runs on this host.

---

## 1. Build & package (on your machine)

```powershell
pnpm build                                # builds portal + website (standalone)
node scripts/package-deploy.mjs --zip     # → deploy/portal.zip, deploy/website.zip
```

Prefer zipping manually (WinRAR)? Run the script **without** `--zip` — it still
prepares everything — then zip the **contents** of
`apps/portal/.next/standalone` and `apps/website/.next/standalone` (open the
folder, select all, add to archive), so `apps/` and `node_modules/` sit at the
root of the archive. The server's extractor only accepts `.zip`.

> **Do not remove `nodeLinker: hoisted` from `pnpm-workspace.yaml`.** With
> pnpm's default linker, `node_modules` is built from Windows junctions that
> zip archives cannot carry — the deployed app then crashes with
> `Cannot find module '@swc/helpers/...'`. The hoisted layout uses real
> folders, and the packaging script additionally dereferences the few
> junctions Turbopack itself emits (e.g. `.next/node_modules/@prisma/client-<hash>`).

The packaging script also:

- copies `public/` and `.next/static/` into each bundle (Next leaves them out);
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
DATABASE_URL=…          (Supabase pooler URL, pgbouncer)
DIRECT_URL=…            (Supabase direct URL)
AUTH_SECRET=…
AUTH_URL=https://portal.1000mm.org.bd
AUTH_TRUST_HOST=true    (required behind Passenger's proxy)
RESEND_API_KEY=…
RESEND_FROM_EMAIL=noreply@1000mm.org.bd
NEXT_PUBLIC_APP_URL=https://1000mm.org.bd
NEXT_PUBLIC_PORTAL_URL=https://portal.1000mm.org.bd
```

**website**:

```
NODE_ENV=production
NEXT_PUBLIC_PORTAL_URL=https://portal.1000mm.org.bd
NEXT_PUBLIC_SITE_URL=https://1000mm.org.bd
```

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

- **503 / "Passenger could not spawn"** — open the app's log (path shown in the
  Node.js App screen, or `~/nodeapps/<app>/stderr.log`). Most common causes:
  wrong startup file path, or Node version below 20.9.
- **`UntrustedHost` from NextAuth** — `AUTH_TRUST_HOST=true` is missing.
- **Broken images from `next/image`** — Linux sharp binaries missing; rerun
  `node scripts/package-deploy.mjs` (it injects them) and redeploy.
- **`PrismaClientInitializationError: query engine … rhel-openssl-3.0.x`** —
  engine not in bundle; rerun `pnpm --filter @1000mm/db exec prisma generate`
  then repackage (schema.prisma already lists the target).
