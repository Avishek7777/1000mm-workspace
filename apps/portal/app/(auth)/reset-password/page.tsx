"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction, type FormState } from "@/lib/auth/actions";

const initial: FormState = { ok: false };

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initial,
  );
  const fe = state.fieldErrors ?? {};

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
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          {fe.password && (
            <p className="mt-1 text-xs text-red-700">{fe.password}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
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