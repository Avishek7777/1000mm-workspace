"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
  type FormState,
} from "@/lib/auth/actions";

const initial: FormState = { ok: false };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initial,
  );

  return (
    <div className="mx-auto max-w-md py-16 px-6">
      <h1 className="text-2xl font-medium mb-2">Forgot password</h1>
      <p className="text-sm text-gray-600 mb-8">
        Enter your email. If an account exists, we&apos;ll send a reset link.
      </p>

      {state.ok && (
        <div className="mb-6 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          If an account with that email exists, a reset link is on its way.
          Check your inbox (and in dev mode, check the server terminal).
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-700">
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center">
        <Link href="/login" className="text-blue-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}