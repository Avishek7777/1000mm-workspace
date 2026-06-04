/**
 * Next.js Middleware — Route Protection
 *
 * Runs at the edge on every request before the page renders.
 * Uses the lightweight edgeAuthConfig (no Prisma, no bcrypt) so it
 * stays within the edge runtime constraints.
 *
 * Rules:
 *  - Public routes (/login, /register, /forgot-password, /reset-password,
 *    /api/auth/*, /verify-email) → always accessible
 *  - Everything else → must be authenticated; if not, redirect to /login
 *    with a `from` param so the user lands back where they were after sign-in
 *  - Authenticated users hitting /login or /register → redirect to /dashboard
 */

import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(edgeAuthConfig);

// Routes that don't require authentication
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

// Prefixes that are always public (auth API, static assets)
const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/favicon"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const session = (req as { auth: { user?: unknown } | null }).auth;
  const isLoggedIn = !!session?.user;

  // Authenticated user hitting a public auth page → send to dashboard
  if (
    isLoggedIn &&
    (pathname === "/login" || pathname === "/register" || pathname === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated user hitting a protected route → redirect to login
  if (!isLoggedIn && !isPublic(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
