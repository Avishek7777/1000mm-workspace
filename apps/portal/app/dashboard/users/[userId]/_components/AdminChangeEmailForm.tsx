"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminChangeUserEmailAction } from "@/actions/users";
import type { ActionResult } from "@/actions/users";

export function AdminChangeEmailForm({
  userId,
  currentEmail,
}: {
  userId: string;
  currentEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const bound = adminChangeUserEmailAction.bind(null, userId);
  const [state, action, isPending] = useActionState<ActionResult, FormData>(
    bound,
    { ok: false },
  );

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Change Email
      </button>
    );
  }

  return (
    <div className="w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-900">Change Email</p>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
      <p className="mb-2 text-[11px] text-gray-500">
        Current: <span className="font-medium">{currentEmail}</span>. The new
        address takes effect immediately — use this when the user has lost
        access to their old inbox.
      </p>
      <form action={action} className="space-y-2">
        <input
          name="newEmail"
          type="email"
          required
          placeholder="new@example.com"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
        {(state.error || state.fieldErrors?.newEmail) && (
          <p className="text-xs text-red-600">
            {state.error ?? state.fieldErrors?.newEmail}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Saving…" : "Update Email"}
          </button>
        </div>
      </form>
    </div>
  );
}
