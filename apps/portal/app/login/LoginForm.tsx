"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type FormState } from "@/lib/auth/actions";
import { Cross } from "lucide-react";
import Image from "next/image";

const initial: FormState = { ok: false };

export default function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") ?? "";
  const resetSuccess = params.get("reset") === "success";
  const emailVerified = params.get("verified") === "1";
  const tokenError = params.get("error");

  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{
        background: "linear-gradient(-160deg, #007f98d3 0%, #da6614d8 100%)",
      }}
    >
      {/* Background cross pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23ffffff' stroke-width='1.8'/%3E%3C/svg%3E")`,
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
            "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, hsla(0, 0%, 100%, 0.03) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-12 mx-auto h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            {/* <Cross className="w-4 h-4 text-white" /> */}
            <Image
              src="/logos/1000mm-logo.png"
              alt="1000MM Logo"
              width={32}
              height={32}
            />
          </div>
          {/* <span
            className="font-bold text-white text-lg tracking-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            1000<span className="font-light opacity-60">MM</span>
          </span> */}
        </div>

        {/* Heading */}
        <h1
          className="text-3xl text-center font-bold text-white mb-1 leading-tight"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Welcome{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
            }}
          >
            Back
          </span>
        </h1>
        <p
          className="text-white/40 text-semibold text-center text-sm mb-8"
          style={{ fontFamily: "Georgia, serif" }}
        >
          1000 Missionary Movement Bangladesh
        </p>

        {/* Success banners */}
        {emailVerified && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm text-green-300"
            style={{
              background: "rgba(74,222,128,0.10)",
              border: "1px solid rgba(74,222,128,0.25)",
              fontFamily: "Georgia, serif",
            }}
          >
            Email verified! You can now sign in.
          </div>
        )}
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
        {tokenError && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm text-red-300"
            style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
              fontFamily: "Georgia, serif",
            }}
          >
            {tokenError === "expired-token"
              ? "This verification link has expired. Please register again."
              : "This verification link is invalid."}
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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontFamily: "Georgia, serif",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 hover:scale-[1.02] active:scale-100 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 mt-2"
            style={{
              background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
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
            className="text-white/30 text-semibold text-xs"
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
