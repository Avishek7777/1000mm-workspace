/**
 * Package the portal and website apps for cPanel (CloudLinux + Passenger) hosting.
 *
 * Prerequisite: `pnpm --filter <app> build` (next.config has `output: "standalone"`).
 *
 * What it does, per app:
 *   1. Copies `public/` and `.next/static/` into the standalone output
 *      (Next intentionally leaves them out — see docs on `output`).
 *   2. Copies `.env.production` next to the app's server.js as a fallback;
 *      the authoritative runtime env is what you set in cPanel's Node.js app UI.
 *   3. Ensures Linux x64 sharp binaries are present (we build on Windows, the
 *      server is Linux; sharp ships per-platform packages under @img/*).
 *   4. Portal only: ensures the Prisma query engine for rhel-openssl-3.0.x
 *      (CloudLinux) is inside the bundle.
 *   5. With --zip, also produces deploy/<app>.zip (the cPanel file manager can
 *      only extract .zip). Otherwise zip the prepared folder yourself (e.g.
 *      WinRAR): zip the CONTENTS of apps/<app>/.next/standalone so `apps/` and
 *      `node_modules/` sit at the root of the archive.
 *
 * Usage:  node scripts/package-deploy.mjs [portal|website] [--zip]   (default: both apps, no zip)
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const deployDir = path.join(repoRoot, "deploy");
const PRISMA_ENGINE = "libquery_engine-rhel-openssl-3.0.x.so.node";

const args = process.argv.slice(2);
const makeZip = args.includes("--zip");
const requested = args.find((a) => !a.startsWith("--"));
const apps = requested ? [requested] : ["portal", "website"];

function findFiles(dir, predicate, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findFiles(full, predicate, results);
    else if (predicate(entry.name, full)) results.push(full);
  }
  return results;
}

function findDirs(dir, predicate, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (predicate(entry.name, full)) results.push(full);
    else findDirs(full, predicate, results);
  }
  return results;
}

/** Install linux-x64 sharp into a temp dir and merge its platform packages into the bundle. */
function ensureLinuxSharp(standaloneRoot) {
  const alreadyThere =
    findDirs(standaloneRoot, (name, full) =>
      name.startsWith("sharp-linux-x64") && full.includes("@img"),
    ).length > 0;
  if (alreadyThere) {
    console.log("  sharp: linux-x64 binaries already present");
    return;
  }

  console.log("  sharp: fetching linux-x64 binaries…");
  const tmp = path.join(os.tmpdir(), "sharp-linux-fetch");
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  const res = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    [
      "install",
      "sharp@0.34.5",
      "--prefix", tmp,
      "--os=linux", "--cpu=x64", "--libc=glibc",
      "--no-save", "--no-audit", "--no-fund", "--loglevel=error",
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  if (res.status !== 0) throw new Error("npm install of linux sharp failed");

  const rootNm = path.join(standaloneRoot, "node_modules");
  // sharp's JS is platform-independent; only copy it if the trace missed it.
  if (!existsSync(path.join(rootNm, "sharp"))) {
    cpSync(path.join(tmp, "node_modules", "sharp"), path.join(rootNm, "sharp"), {
      recursive: true,
    });
  }
  cpSync(path.join(tmp, "node_modules", "@img"), path.join(rootNm, "@img"), {
    recursive: true,
    force: true,
  });
  console.log("  sharp: linux-x64 binaries added at node_modules/@img");
}

/**
 * Drop platform binaries the Linux server can't use. The generated Prisma
 * client dir carries engines for every binaryTarget (plus Windows .tmp
 * leftovers from EPERM regenerations) and sharp ships win32 packages — several
 * hundred MB of dead weight per bundle.
 */
function prunePlatformCruft(standaloneRoot) {
  let freed = 0;

  const junkEngines = findFiles(standaloneRoot, (name) => {
    if (name.includes(".dll.node")) return true; // windows engines + .tmp leftovers
    if (name.startsWith("libquery_engine-") && name !== PRISMA_ENGINE) return true;
    return false;
  });
  for (const f of junkEngines) {
    freed += statSync(f).size;
    rmSync(f, { force: true });
  }

  const winSharpDirs = findDirs(standaloneRoot, (name, full) =>
    name.includes("sharp") && name.includes("win32") && full.includes("img"),
  );
  for (const d of winSharpDirs) {
    rmSync(d, { recursive: true, force: true });
  }

  console.log(
    `  pruned: ${junkEngines.length} non-Linux prisma engines (${(freed / 1024 / 1024).toFixed(0)} MB), ${winSharpDirs.length} win32 sharp dirs`,
  );
}

/** Make sure the CloudLinux Prisma query engine is inside every generated client dir. */
function ensurePrismaEngine(standaloneRoot) {
  const present = findFiles(standaloneRoot, (name) => name === PRISMA_ENGINE);
  if (present.length > 0) {
    console.log(`  prisma: ${PRISMA_ENGINE} already in bundle`);
    return;
  }

  const clientDirs = findDirs(standaloneRoot, (name, full) =>
    name === "client" && full.replace(/\\/g, "/").endsWith(".prisma/client"),
  );
  if (clientDirs.length === 0) {
    console.log("  prisma: no .prisma/client dir found — app may not use Prisma, skipping");
    return;
  }

  const sources = findFiles(path.join(repoRoot, "node_modules", ".pnpm"), (name) => name === PRISMA_ENGINE);
  if (sources.length === 0) {
    throw new Error(
      `${PRISMA_ENGINE} not found in the workspace. Run: pnpm --filter @1000mm/db exec prisma generate`,
    );
  }

  for (const dir of clientDirs) {
    cpSync(sources[0], path.join(dir, PRISMA_ENGINE));
    console.log(`  prisma: copied engine into ${path.relative(standaloneRoot, dir)}`);
  }
}

function packageApp(app) {
  console.log(`\n── Packaging ${app} ──`);
  const appDir = path.join(repoRoot, "apps", app);
  const standalone = path.join(appDir, ".next", "standalone");
  const appInBundle = path.join(standalone, "apps", app);

  if (!existsSync(path.join(appInBundle, "server.js"))) {
    throw new Error(
      `${app}: no standalone build found at ${standalone}. Run: pnpm --filter ${app} build`,
    );
  }

  cpSync(path.join(appDir, "public"), path.join(appInBundle, "public"), {
    recursive: true,
    force: true,
  });
  console.log("  copied public/");

  cpSync(path.join(appDir, ".next", "static"), path.join(appInBundle, ".next", "static"), {
    recursive: true,
    force: true,
  });
  console.log("  copied .next/static/");

  const envFile = path.join(appDir, ".env.production");
  if (existsSync(envFile)) {
    cpSync(envFile, path.join(appInBundle, ".env.production"));
    console.log("  copied .env.production (fallback; set real env in cPanel UI)");
  }

  ensureLinuxSharp(standalone);
  ensurePrismaEngine(standalone);
  prunePlatformCruft(standalone);

  if (makeZip) {
    mkdirSync(deployDir, { recursive: true });
    const archive = path.join(deployDir, `${app}.zip`);
    rmSync(archive, { force: true });
    // Windows ships bsdtar, which picks the zip format from the -a + .zip extension.
    const tar = spawnSync("tar", ["-a", "-cf", archive, "-C", standalone, "."], { stdio: "inherit" });
    if (tar.status !== 0) throw new Error(`zip failed for ${app}`);

    const mb = (statSync(archive).size / 1024 / 1024).toFixed(1);
    console.log(`  → ${path.relative(repoRoot, archive)} (${mb} MB)`);
  } else {
    console.log(`  → ready to zip: ${path.relative(repoRoot, standalone)}`);
    console.log("    (zip the folder's CONTENTS so apps/ and node_modules/ are at the archive root)");
  }
}

for (const app of apps) packageApp(app);

console.log(`
Done. Upload each archive to the server, extract into its app folder, and point
the cPanel Node.js app at startup file apps/<app>/server.js. See DEPLOY.md.
`);
