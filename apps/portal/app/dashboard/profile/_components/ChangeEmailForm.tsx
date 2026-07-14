"use client";

import { useActionState, useState } from "react";
import { requestEmailChangeAction } from "@/actions/profile";

const INITIAL = { ok: false, error: undefined as string | undefined };

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, isPending] = useActionState(requestEmailChangeAction, INITIAL);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Change Email
      </button>
    );
  }

  if (state.ok) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-4">
        <p className="text-sm font-medium text-teal-800">
          Verification link sent
        </p>
        <p className="mt-1 text-xs text-teal-700">
          Check the inbox of your new address and open the link to complete the
          change. Until then you keep signing in with{" "}
          <span className="font-semibold">{currentEmail}</span>. The link
          expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Change Email</span>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form action={action} className="px-5 py-4 space-y-3">
        <p className="text-xs text-gray-500">
          Current email: <span className="font-medium text-gray-700">{currentEmail}</span>.
          A verification link will be sent to the new address — the change only
          takes effect after you open it.
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            New email address
          </label>
          <input
            name="newEmail"
            type="email"
            required
            autoComplete="email"
            placeholder="new@example.com"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Current password <span className="text-gray-400">(for security)</span>
          </label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        {state.error && <p className="text-xs text-red-600">{state.error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Sending…" : "Send Verification Link"}
          </button>
        </div>
      </form>
    </div>
  );
}
