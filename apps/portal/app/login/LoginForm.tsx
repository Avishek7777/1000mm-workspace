"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type FormState } from "@/lib/auth/actions";
import { Cross } from "lucide-react";

const initial: FormState = { ok: false };

export default function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") ?? "";
  const resetSuccess = params.get("reset") === "success";

  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #071009 0%, #130a03 100%)",
      }}
    >
      {/* Background cross pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(22,163,74,0.25) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-8 md:p-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Cross className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-bold text-white text-lg tracking-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            1000<span className="font-light opacity-60">MM</span>
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-3xl font-bold text-white mb-1 leading-tight"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Welcome{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #4ade80 0%, #f97316 100%)",
            }}
          >
            Back
          </span>
        </h1>
        <p
          className="text-white/40 text-sm mb-8"
          style={{ fontFamily: "Georgia, serif" }}
        >
          1000 Missionary Movement Bangladesh
        </p>

        {/* Success banner */}
        {resetSuccess && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm text-green-300"
            style={{
              background: "rgba(74,222,128,0.10)",
              border: "1px solid rgba(74,222,128,0.25)",
              fontFamily: "Georgia, serif",
            }}
          >
            Password updated. Please sign in with your new password.
          </div>
        )}

        {/* Error banner */}
        {state.error && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm text-red-300"
            style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
              fontFamily: "Georgia, serif",
            }}
          >
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="from" value={from} />

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-white/40 tracking-widest uppercase mb-2"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontFamily: "Georgia, serif",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-white/40 tracking-widest uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors duration-200"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontFamily: "Georgia, serif",
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 hover:scale-[1.02] active:scale-100 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 mt-2"
            style={{
              background: "linear-gradient(90deg, #16a34a 0%, #f97316 100%)",
              fontFamily: "Georgia, serif",
            }}
          >
            {pending ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        {/* Footer links */}
        <div
          className="mt-7 pt-6 flex justify-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p
            className="text-white/30 text-xs"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-green-400 hover:text-green-300 font-semibold transition-colors duration-200"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
