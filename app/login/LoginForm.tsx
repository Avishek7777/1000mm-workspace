"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type FormState } from "@/lib/auth/actions";

const initial: FormState = { ok: false };

export default function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") ?? "";
  const resetSuccess = params.get("reset") === "success";

  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <div className="mx-auto max-w-md py-16 px-6">
      <h1 className="text-2xl font-medium mb-2">Sign in</h1>
      <p className="text-sm text-gray-600 mb-8">
        1000 Missionary Movement Bangladesh
      </p>

      {resetSuccess && (
        <div className="mb-6 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          Password updated. Please sign in with your new password.
        </div>
      )}

      {state.error && (
        <div className="mb-6 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="from" value={from} />

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
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 flex justify-between text-sm">
        <Link href="/register" className="text-blue-700 hover:underline">
          Create an account
        </Link>
        <Link href="/forgot-password" className="text-blue-700 hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
