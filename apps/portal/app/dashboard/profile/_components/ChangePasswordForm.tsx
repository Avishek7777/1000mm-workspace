"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/actions/profile";

const INITIAL = { ok: false, error: undefined as string | undefined };

export function ChangePasswordForm() {
  const [state, action, isPending] = useActionState(changePasswordAction, INITIAL);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Change Password
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Change Password</span>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form action={action} className="px-5 py-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Current password
          </label>
          <input
            name="current"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            New password <span className="text-gray-400">(min 8 chars)</span>
          </label>
          <input
            name="next"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Confirm new password
          </label>
          <input
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        {state.error && (
          <p className="text-xs text-red-600">{state.error}</p>
        )}

        {state.ok && (
          <p className="text-xs text-teal-700 font-medium">Password changed successfully.</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
