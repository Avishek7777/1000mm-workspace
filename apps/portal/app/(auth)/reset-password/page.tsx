"use client";

import { Suspense, useState } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction, type FormState } from "@/lib/auth/actions";

const initial: FormState = { ok: false };

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initial,
  );
  const fe = state.fieldErrors ?? {};
  const [showPwd, setShowPwd] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto max-w-md py-16 px-6">
        <h1 className="text-2xl font-medium mb-2">Reset password</h1>
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          This link is missing or malformed. Please{" "}
          <Link href="/forgot-password" className="underline">
            request a new reset link
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 px-6">
      <h1 className="text-2xl font-medium mb-2">Set a new password</h1>

      {state.error && (
        <div className="my-6 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4 mt-6">
        <input type="hidden" name="token" value={token} />

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fe.password && (
            <p className="mt-1 text-xs text-red-700">{fe.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fe.confirmPassword && (
            <p className="mt-1 text-xs text-red-700">{fe.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
