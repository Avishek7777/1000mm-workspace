/**
 * Next.js 16 Proxy — Route Protection & Role-Based Access Control
 *
 * Replaces the deprecated middleware.ts convention.
 * Uses the lightweight edgeAuthConfig (no Prisma, no bcrypt) to stay
 * within edge runtime constraints.
 *
 * Rules:
 *  1. Static assets / Next.js internals / Auth.js API → always pass through
 *  2. Public pages (/login, /register, etc.) → always accessible
 *  3. Authenticated user hitting /login, /register, or / → redirect to /dashboard
 *  4. Unauthenticated user hitting a protected route → redirect to /login?from=<pathname>
 *  5. Authenticated user hitting a protected route they don't have access to
 *     → redirect to /dashboard (their safe landing page)
 */

import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@1000mm/db";

const { auth } = NextAuth(edgeAuthConfig);

// ─────────────────────────────────────────────────────────────────────
// Public route definitions
// ─────────────────────────────────────────────────────────────────────

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

// These prefixes are never blocked regardless of auth state
const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/favicon"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

// Auth pages — authenticated users should be bounced away from these
const AUTH_PAGES = new Set(["/login", "/register", "/"]);

// ─────────────────────────────────────────────────────────────────────
// Role-based route prefix guards
//
// Each entry is [prefix, allowed roles[]].
// Checked in order — first match wins.
// Routes not matched by any prefix are accessible to all authenticated users.
// ─────────────────────────────────────────────────────────────────────

const SYSTEM_ADMIN: UserRole = "SYSTEM_ADMIN";
const MAIN_DIRECTOR: UserRole = "MAIN_DIRECTOR";
const LOCAL_DIRECTOR: UserRole = "LOCAL_DIRECTOR";
const TRAINER: UserRole = "TRAINER";
const TRAINEE: UserRole = "TRAINEE";

const ALL_ROLES: UserRole[] = [
  SYSTEM_ADMIN,
  MAIN_DIRECTOR,
  LOCAL_DIRECTOR,
  TRAINER,
  TRAINEE,
];
const ADMIN_ROLES: UserRole[] = [SYSTEM_ADMIN, MAIN_DIRECTOR];
const DIRECTOR_ROLES: UserRole[] = [
  SYSTEM_ADMIN,
  MAIN_DIRECTOR,
  LOCAL_DIRECTOR,
];

type RouteGuard = [prefix: string, roles: UserRole[]];

const ROUTE_GUARDS: RouteGuard[] = [
  // System-admin only
  ["/dashboard/system-admin", [SYSTEM_ADMIN]],
  ["/dashboard/audit", [SYSTEM_ADMIN]],
  ["/dashboard/settings", [SYSTEM_ADMIN]],
  ["/dashboard/system-admin/urgent-reports", [SYSTEM_ADMIN]],

  // Admin only (SYSTEM_ADMIN + MAIN_DIRECTOR)
  ["/dashboard/director/lmd-reports", ADMIN_ROLES],
  ["/dashboard/director/windows", ADMIN_ROLES],
  ["/dashboard/missions", ADMIN_ROLES],
  ["/dashboard/users", ADMIN_ROLES],
  ["/dashboard/id-cards", ADMIN_ROLES],

  // Directors (all three director roles)
  ["/dashboard/director", ADMIN_ROLES], // MAIN_DIRECTOR + SYSTEM_ADMIN only
  ["/dashboard/lmd", [SYSTEM_ADMIN, MAIN_DIRECTOR, LOCAL_DIRECTOR]], // LOCAL_DIRECTOR + admins

  // Trainees and directors can see field reports; trainers too
  ["/dashboard/field-reports", [...DIRECTOR_ROLES, TRAINER, TRAINEE]],

  // Trainee-only routes
  ["/dashboard/my-application", [TRAINEE]],
  ["/dashboard/my-program", [TRAINEE]],
  ["/dashboard/trainee", [TRAINEE]],
  ["/dashboard/urgent-reports", [TRAINEE]],

  // Trainees section — directors, admins, trainers
  ["/dashboard/trainees", [...DIRECTOR_ROLES, TRAINER]],

  // Complaints — everyone except TRAINER
  [
    "/dashboard/complaints",
    [SYSTEM_ADMIN, MAIN_DIRECTOR, LOCAL_DIRECTOR, TRAINEE],
  ],

  ["/dashboard/salary", ADMIN_ROLES],
  ["/dashboard/lmd/salary", [SYSTEM_ADMIN, MAIN_DIRECTOR, LOCAL_DIRECTOR]],
  ["/dashboard/salary-request", [TRAINEE]],

  // Everything else under /dashboard → all authenticated roles
  ["/dashboard", ALL_ROLES],
];

/**
 * Returns true if the given role is allowed to access the pathname.
 * Falls back to allowing access if no guard matches (shouldn't happen
 * for anything under /dashboard given the catch-all above).
 */
function isAllowed(pathname: string, role: UserRole): boolean {
  for (const [prefix, roles] of ROUTE_GUARDS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return (roles as string[]).includes(role);
    }
  }
  return true; // non-dashboard routes not guarded here
}

// ─────────────────────────────────────────────────────────────────────
// Proxy handler
// ─────────────────────────────────────────────────────────────────────

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const session = (req as { auth: { user?: { role?: UserRole } } | null }).auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  // 1. Authenticated user hitting an auth page → send to dashboard
  if (isLoggedIn && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Unauthenticated user hitting a protected route → login with return URL
  if (!isLoggedIn && !isPublic(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated user hitting a route their role can't access → dashboard
  if (isLoggedIn && role && !isAllowed(pathname, role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
