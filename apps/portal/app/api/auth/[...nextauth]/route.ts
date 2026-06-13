/**
 * Auth.js HTTP endpoints
 *
 * Mounts at /api/auth/* and handles the OAuth-style auth flows
 * (sign-in callbacks, session checks, sign-out, etc.).
 * Auth.js v5 generates these handlers; we just re-export them.
 */

import { handlers } from "@/lib/auth/config";

export const { GET, POST } = handlers;