import path from "node:path";
import type { NextConfig } from "next";

// Portal-uploaded images (project photos etc.) are served by the portal app;
// next/image needs its host allowlisted to optimize them.
const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
const portalIsLocal = ["localhost", "127.0.0.1"].includes(
  new URL(portalUrl).hostname,
);

const portal = new URL(portalUrl);

const nextConfig: NextConfig = {
  // Self-contained production build for cPanel/Passenger hosting: everything
  // needed at runtime (incl. traced node_modules) lands in .next/standalone.
  output: "standalone",
  // Trace from the monorepo root so workspace deps (@1000mm/db) are included.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client"],
  images: {
    // Object form (not `new URL(...)`) so the query string stays unrestricted —
    // uploaded images carry a ?v= cache-busting param.
    remotePatterns: [
      {
        protocol: portal.protocol.replace(":", "") as "http" | "https",
        hostname: portal.hostname,
        port: portal.port,
        pathname: "/api/uploads/**",
      },
    ],
    // The optimizer refuses upstreams that resolve to private IPs (SSRF
    // guard); the dev portal runs on localhost, so allow it there only.
    dangerouslyAllowLocalIP: portalIsLocal,
  },
};

export default nextConfig;
