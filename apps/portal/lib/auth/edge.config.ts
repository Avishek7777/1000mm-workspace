import type { NextAuthConfig } from "next-auth";

export const edgeAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // No providers in edge config; they live in the full config
};