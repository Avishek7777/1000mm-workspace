import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained production build for cPanel/Passenger hosting: everything
  // needed at runtime (incl. traced node_modules) lands in .next/standalone.
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

export default nextConfig;
