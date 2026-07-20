import path from "node:path";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export default function config(phase: string): NextConfig {
  // `next build` (used to produce deploy bundles) and `next dev` both default
  // to writing into `.next/` — sharing that folder lets a deploy build
  // silently corrupt the dev server's route manifests (a plain restart won't
  // fix it, since the on-disk cache itself is inconsistent, not just the
  // running process's memory). Give production builds their own directory.
  const isProdBuild = phase === PHASE_PRODUCTION_BUILD;

  const nextConfig: NextConfig = {
    ...(isProdBuild ? { distDir: ".next-build" } : {}),
    // Self-contained production build for cPanel/Passenger hosting: everything
    // needed at runtime (incl. traced node_modules) lands in <distDir>/standalone.
    output: "standalone",
    // Trace from the monorepo root so workspace deps (@1000mm/db) are included.
    outputFileTracingRoot: path.join(__dirname, "../../"),
    serverExternalPackages: ["@prisma/client"],
    experimental: {
      serverActions: {
        bodySizeLimit: "10mb",
      },
    },
  };

  return nextConfig;
}
