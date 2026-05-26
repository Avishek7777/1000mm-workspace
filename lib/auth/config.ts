/**
 * Auth.js (NextAuth v5) configuration
 *
 * Strategy: JWT sessions (stateless).
 * Provider: Credentials (email + password).
 *
 * Session payload extension:
 *   We add `role`, `homeMissionId`, and `homeMissionCode` to the
 *   session.user object so server code doesn't have to round-trip
 *   to the DB on every request to know who's logged in.
 *
 *   These values are populated at sign-in from the DB and then carried
 *   in the JWT. On every request we refresh `isActive` from the DB to
 *   ensure a deactivated user can't keep using their session.
 *
 * Routes:
 *   /login              — login page
 *   /register           — sign-up page (trainees only)
 *   /forgot-password    — request reset
 *   /reset-password     — set new password from token
 *   /verify-email       — verify email from token (built but not enforced)
 *   /api/auth/[...]     — Auth.js endpoints
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma/base";
import { edgeAuthConfig } from "./edge.config";
import type { LocalMissionCode, UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────
// Module augmentation: add our custom fields to Session and JWT.
// This gives TypeScript autocomplete on session.user.role, etc.
// ─────────────────────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      homeMissionId: string;
      homeMissionCode: LocalMissionCode;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    homeMissionId: string;
    homeMissionCode: LocalMissionCode;
  }

  interface JWT {
    id: string;
    role: UserRole;
    homeMissionId: string;
    homeMissionCode: LocalMissionCode;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Login input validation
// ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────────────
// Auth.js setup
// ─────────────────────────────────────────────────────────────────────
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...edgeAuthConfig,
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // Validate input shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: { email, deletedAt: null },
          include: { homeMission: { select: { code: true } } },
        });
        if (!user) {
          // Generic message — don't leak whether email exists
          return null;
        }
        if (!user.isActive) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const passwordOk = await bcrypt.compare(password, user.passwordHash);

        if (!passwordOk) {
          // Increment failed counter; lock after threshold
          const maxAttempts = 10;
          const lockoutMinutes = 15;
          const newCount = user.failedLoginCount + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: newCount,
              lockedUntil:
                newCount >= maxAttempts
                  ? new Date(Date.now() + lockoutMinutes * 60 * 1000)
                  : null,
            },
          });
          return null;
        }

        // Successful login: reset counter, stamp lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          homeMissionId: user.homeMissionId,
          homeMissionCode: user.homeMission.code,
        };
      },
    }),
  ],

  callbacks: {
    // On sign-in, copy user fields into the JWT payload.
    jwt: async ({ token, user }) => {
      if (user) {
        // First-time sign-in: user object is present
        token.id = user.id;
        token.role = user.role;
        token.homeMissionId = user.homeMissionId;
        token.homeMissionCode = user.homeMissionCode;
      } else if (token.id) {
        // Subsequent request: verify user is still active.
        // This is the "JWT with revocation" pattern: one extra query per request,
        // but no full session table. If a user is deactivated mid-session, their
        // next request returns null and the session is invalidated.
        const fresh = await prisma.user.findFirst({
          where: { id: token.id, isActive: true, deletedAt: null },
          select: {
            role: true,
            homeMissionId: true,
            homeMission: { select: { code: true } },
          },
        });
        if (!fresh) return {} as never;
        // Refresh in case role or mission changed
        token.role = fresh.role;
        token.homeMissionId = fresh.homeMissionId;
        token.homeMissionCode = fresh.homeMission.code;
      }
      return token;
    },

    // Shape the session object exposed to client and server code.
    session: async ({ session, token }) => {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.homeMissionId = token.homeMissionId as string;
        session.user.homeMissionCode =
          token.homeMissionCode as LocalMissionCode;
      }
      return session;
    },
  },
});
